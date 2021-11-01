const plugins = require('../../pluginManager'),
    common = require('../../../api/utils/common'),
    log = common.log('push:api'),
    { Message, State, TriggerKind, fields, platforms } = require('./send'),
    { validateCreate, validateRead, validateUpdate, validateDelete } = require('../../../api/utils/rights.js'),
    { onTokenSession, onSessionUser, onAppPluginsUpdate } = require('./api-push'),
    { autoOnCohort, autoOnCohortDeletion, autoOnEvent } = require('./api-auto'),
    { drillAddPushEvents, drillPostprocessUids, drillPreprocessQuery } = require('./api-drill'),
    { estimate, create, update, toggle, remove, all } = require('./api-message'),
    { dashboard } = require('./api-dashboard'),
    FEATURE_NAME = 'push',
    PUSH_CACHE_GROUP = 'P',
    PUSH = {},
    apis = {
        o: {
            dashboard: [validateRead, dashboard],
            message: {
                estimate: [validateRead, estimate],
                all: [validateRead, all]
            }
        },
        i: {
            message: {
                create: [validateCreate, create],
                update: [validateUpdate, update],
                toggle: [validateUpdate, toggle],
                remove: [validateDelete, remove]
            }
        }
    };

plugins.setConfigs(FEATURE_NAME, {
    proxyhost: '',
    proxyport: '',
    proxyuser: '',
    proxypass: '',
});

plugins.internalEvents.push('[CLY]_push_sent');
plugins.internalEvents.push('[CLY]_push_action');
plugins.internalDrillEvents.push('[CLY]_push_action');


plugins.register('/worker', function() {
    common.dbUniqueMap.users.push(common.dbMap['messaging-enabled'] = 'm');
    fields(platforms, true).forEach(f => common.dbUserMap[f] = f);
    PUSH.cache = common.cache.cls(PUSH_CACHE_GROUP);
});

plugins.register('/master', function() {
    common.dbUniqueMap.users.push(common.dbMap['messaging-enabled'] = 'm');
    fields(platforms, true).forEach(f => common.dbUserMap[f] = f);
    PUSH.cache = common.cache.cls(PUSH_CACHE_GROUP);
});

plugins.register('/cache/init', function() {
    common.cache.init(PUSH_CACHE_GROUP, {
        init: async() => {
            let msgs = await Message.findMany({
                state: {$bitsAllClear: State.Deleted | State.Done, $bitsAnySet: State.Streamable | State.Streaming | State.Paused},
                'triggers.kind': {$in: [TriggerKind.API, TriggerKind.Cohort, TriggerKind.Event]}
            });
            log.d('cache: initialized with %d msgs: %j', msgs.length, msgs.map(m => m._id));
            return msgs.map(m => [m.id, m]);
        },
        read: k => Message.findOne(k),
        write: async(k, data) => {
            log.d('cache: writing', k, data);
            if (!(data instanceof Message)) {
                data._id = data._id || k;
                data = new Message(data);
            }
            return data;
        },
        remove: async(/*k, data*/) => true,
        update: async(/*k, data*/) => {
            throw new Error('We don\'t update cached messages');
        }
    });
});


plugins.register('/i', async ob => {
    var params = ob.params;
    if (params.qstring.events && Array.isArray(params.qstring.events)) {
        let events = params.qstring.events,
            keys = events.map(e => e.key);
        keys = keys.filter((k, i) => keys.indexOf(k) === i);

        autoOnEvent(params.app_id, params.app_user.uid, keys, events);

        let push = events.filter(e => e.key && e.key.indexOf('[CLY]_push_') === 0 && e.segmentation && e.segmentation.i && e.segmentation.i.length === 24);
        if (push.length) {
            try {
                let ids = push.map(e => common.db.ObjectID(e.segmentation.i)),
                    msgs = await Message.findMany({_id: {$in: ids}});
                for (let i = 0; i < msgs.length; i++) {
                    let m = msgs[i],
                        count = push.filter(e => e.key === '[CLY]_push_action' && e.segmentation.i === m.id).map(e => e.count).reduce((a, b) => a + b, 0);
                    if (count) {
                        await m.update({$inc: {'result.actioned': count}}, () => m.result.actioned += count);
                    }
                    push.filter(e => e.segmentation.i === m.id).forEach(e => {
                        e.segmentation.a = m.triggers.filter(t => t.kind === TriggerKind.Cohort || t.kind === TriggerKind.Event).length > 0;
                        e.segmentation.t = m.triggers.filter(t => t.kind === TriggerKind.API).length > 0;
                    });
                }
            }
            catch (e) {
                log.e('Wrong [CLY]_push_* event i segmentation', e);
            }
        }
    }

    if (params.qstring.token_session) {
        onTokenSession(params.app_user, params);
    }
});

/**
 * Handy function for handling api calls (see apis obj above)
 * 
 * @param {object} apisObj apis.i or apis.o
 * @param {object} ob object from pluginManager ({params, qstring, ...})
 * @returns {boolean} true if the call has been handled
 */
function apiCall(apisObj, ob) {
    let {params, paths} = ob,
        method = paths[3],
        sub = paths[4];

    log.d('handling api request %s%s', method, sub ? `/${sub}` : '');
    if (method in apisObj) {
        if (!sub) {
            let [check, fn] = apisObj[method];
            check(params, FEATURE_NAME, par => fn(par).catch(e => {
                log.e('Error during API request /%s', method, e);
                common.returnOutput(par, {errors: ['Server error']});
            }));
            return true;
        }
        else if (sub in apisObj[method]) {
            let [check, fn] = apisObj[method][sub];
            check(params, FEATURE_NAME, par => fn(par).catch(e => {
                log.e('Error during API request /%s/%s', method, sub, e);
                common.returnOutput(par, {errors: ['Server error']});
            }));
            return true;
        }
    }

    log.d('invalid endpoint', paths);
    common.returnMessage(params, 404, 'Invalid endpoint');
    return true;
}

// Token handling, push internal events handling, evented auto push
plugins.register('/session/user', onSessionUser);

// API
plugins.register('/i/push', ob => apiCall(apis.i, ob));
plugins.register('/o/push', ob => apiCall(apis.o, ob));
plugins.register('/i/apps/update/plugins/push', onAppPluginsUpdate);

// Cohort hooks for cohorted auto push
plugins.register('/cohort/enter', ({cohort, uids}) => autoOnCohort(true, cohort, uids));
plugins.register('/cohort/exit', ({cohort, uids}) => autoOnCohort(false, cohort, uids));
plugins.register('/cohort/delete', ({_id, ack}) => autoOnCohortDeletion(_id, ack));

// Drill hooks for user profiles
plugins.register('/drill/add_push_events', drillAddPushEvents);
plugins.register('/drill/preprocess_query', drillPreprocessQuery);
plugins.register('/drill/postprocess_uids', drillPostprocessUids);

// Permissions
plugins.register('/permissions/features', ob => ob.features.push(FEATURE_NAME));

module.exports = PUSH;