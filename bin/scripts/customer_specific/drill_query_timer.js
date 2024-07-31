/**
 *  Description: Test the time taken to run a query on a drill collection
 *  Server: countly
 *  Path: $(countly dir)/bin/scripts/customer_specific
 *  Command: node drill_query_timer.js
 * 
 * "simple - simple drill query without any segmentation"
 * "segmented - simple drill query with segmentation platform = Android"
 * "byval - segmentation by plarform"
 * "byval2 - segmentation by country"
 */

const pluginManager = require('../../../plugins/pluginManager.js');

const moment = require('moment-timezone');

const COLLECTION_NAME = "drill_events5c74510c706e95a2322b7919da37db58f6fd1a3c"; // drill collection name
const DATA_SET_SIZES = [100000, 1000000, 10000000];//100K, 1M, 10M
const QUERY_TYPES = ["simple", "segmented", "byval", "byval2"];
const PROJECTION_KEYS = ["up.p", "up.cc"];
const PERIOD = [1704063600000];

var results = {};

pluginManager.dbConnection("countly_drill").then(async function(drillDb) {
    console.log("Connected to drill database...");

    // SET TIMESTAMP RANGE
    let minTs = PERIOD[0];
    let maxTs = PERIOD[1] || moment().valueOf();

    // FOR EACH QUERY TYPE
    for (let i = 0; i < QUERY_TYPES.length; i++) {

        var QUERY_TYPE = QUERY_TYPES[i];
        results[QUERY_TYPE] = {};

        // ADD MATCH STAGE FOR QUERY TYPE TO PIPELINE
        var pipeline = [
            {
                "$match": {
                    "ts": { "$gte": minTs, "$lt": maxTs }
                }
            }
        ];
        // ADD SEGMENTED MATCH STAGE TO PIPELINE
        if (QUERY_TYPE === "segmented") {
            pipeline[0].$match["up.p"] = "Android";
        }
        // FOR EACH DATA SET SIZE
        for (let j = 0; j < DATA_SET_SIZES.length; j++) {
            var DATA_SET_SIZE = DATA_SET_SIZES[j];
            console.log("Running pipeline for query type:", QUERY_TYPE, "and data set size:", DATA_SET_SIZE);
            // ADD LIMIT AND FACET STAGES TO PIPELINE
            pipeline.push(
                {
                    "$limit": DATA_SET_SIZE
                },
                {
                    "$facet": {
                        "totals": [
                            {
                                "$group": {
                                    "_id": "$uid",
                                    "t": { "$sum": "$c" },
                                    "s": { "$sum": "$s" },
                                    "dur": { "$sum": "$dur" }
                                }
                            },
                            {
                                "$group": {
                                    "_id": "totals",
                                    "u": { "$sum": 1 },
                                    "t": { "$sum": "$t" },
                                    "s": { "$sum": "$s" },
                                    "dur": { "$sum": "$dur" }
                                }
                            }
                        ],
                        "hourly": [
                            {
                                "$group": {
                                    "_id": "$h",
                                    "uid": { "$addToSet": "$uid" },
                                    "t": { "$sum": "$c" },
                                    "s": { "$sum": "$s" },
                                    "dur": { "$sum": "$dur" }
                                }
                            },
                            {
                                "$project": {
                                    "_id": "$_id",
                                    "u": { "$size": "$uid" },
                                    "t": "$t",
                                    "s": "$s",
                                    "dur": "$dur"
                                }
                            }
                        ],
                        "daily": [
                            {
                                "$group": {
                                    "_id": "$d",
                                    "uid": { "$addToSet": "$uid" },
                                    "t": { "$sum": "$c" },
                                    "s": { "$sum": "$s" },
                                    "dur": { "$sum": "$dur" }
                                }
                            },
                            {
                                "$project": {
                                    "_id": "$_id",
                                    "u": { "$size": "$uid" },
                                    "t": "$t",
                                    "s": "$s",
                                    "dur": "$dur"
                                }
                            }
                        ],
                        "weekly": [
                            {
                                "$group": {
                                    "_id": "$w",
                                    "uid": { "$addToSet": "$uid" },
                                    "t": { "$sum": "$c" },
                                    "s": { "$sum": "$s" },
                                    "dur": { "$sum": "$dur" }
                                }
                            },
                            {
                                "$project": {
                                    "_id": "$_id",
                                    "u": { "$size": "$uid" },
                                    "t": "$t",
                                    "s": "$s",
                                    "dur": "$dur"
                                }
                            }
                        ],
                        "monthly": [
                            {
                                "$group": {
                                    "_id": "$m",
                                    "uid": { "$addToSet": "$uid" },
                                    "t": { "$sum": "$c" },
                                    "s": { "$sum": "$s" },
                                    "dur": { "$sum": "$dur" }
                                }
                            },
                            {
                                "$project": {
                                    "_id": "$_id",
                                    "u": { "$size": "$uid" },
                                    "t": "$t",
                                    "s": "$s",
                                    "dur": "$dur"
                                }
                            }
                        ]
                    }
                }
            );
            // IF QUERY TYPE IS BYVAL, USE SNAPSHOTS
            if (QUERY_TYPE === "byval" || QUERY_TYPE === "byval2") {
                var timeNow2 = Date.now();
                var projectionKey;
                if (QUERY_TYPE === "byval2") {
                    projectionKey = [PROJECTION_KEYS[1]];
                }
                else {
                    projectionKey = [PROJECTION_KEYS[0]];
                }
                await new Promise((resolve/*, reject*/) => {
                    createSnapshot(drillDb, {
                        collectionName: COLLECTION_NAME,
                        projectionKey: projectionKey,
                        limit: DATA_SET_SIZE,
                        uids: null,
                        queryObject: {
                            "ts": { "$gte": minTs, "$lt": maxTs }
                        },
                        segmentationTypes: ["s"]
                    }, function(error, hashid) {
                        var timeAfter2 = Date.now();

                        if (!error) {
                            results[QUERY_TYPE][DATA_SET_SIZE] = Math.round((timeAfter2 - timeNow2) / 10) / 100; //result in seconds with two decimal after comma
                            //clean out created snapshot
                            console.log('clearing out snapshot');
                            //Test Fetching data from snapshot
                            results["snapshot_fetch_" + QUERY_TYPE] = results["snapshot_fetch_" + QUERY_TYPE] || {};

                            fetchDataFromSnapshot(drillDb, {hashId: hashid, params: {qstring: {sort: {u: -1}}}}, function(err2) {
                                if (err2) {
                                    console.log(err2);
                                    results["snapshot_fetch_" + QUERY_TYPE][DATA_SET_SIZE] = "FAILED"; //result in seconds with one decimal after comma

                                }
                                else {
                                    results["snapshot_fetch_" + QUERY_TYPE][DATA_SET_SIZE] = Math.round((Date.now() - timeAfter2) / 10) / 100; //result in seconds with two decimal after comma
                                }
                                drillDb.collection("drill_snapshots").deleteMany({_id: {"$regex": "^" + hashid + ".*"}}, function(err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    resolve();
                                });
                            });
                        }
                        else {
                            results[QUERY_TYPE][DATA_SET_SIZE] = "FAILED"; //result in seconds with one decimal after comma
                            resolve();
                        }

                    });
                });
            }
            else {
                // RUN PIPELINE
                var timeNow = Date.now();
                try {
                    await drillDb.collection(COLLECTION_NAME).aggregate(pipeline, {allowDiskUse: true}).toArray();
                    var timeAfter = Date.now();
                    results[QUERY_TYPE][DATA_SET_SIZE] = Math.round((timeAfter - timeNow) / 10) / 100; //result in seconds with one decimal after comma
                }
                catch (e) {
                    results[QUERY_TYPE][DATA_SET_SIZE] = "FAILED"; //result in seconds with one decimal after comma
                    console.log(e);
                }
            }
        }
        print_out_results();

    }
    print_out_results(true);
    close();

    function close(err) {
        if (err) {
            console.log("Finished with errors: ", err);
        }
        else {
            console.log("Finished successfully.");
        }
        drillDb.close();
    }
    function print_out_results(end) {
        console.log("Results(JSON):");
        console.log(JSON.stringify(results));

        if (end) {
            console.log("Results(CSV):");
            console.log("Query Type, Data Set Size, Time");
            for (let queryType in results) {
                for (let dataSetSize in results[queryType]) {
                    console.log(queryType + ", " + dataSetSize + ", " + results[queryType][dataSetSize]);
                }

            }
        }
    }
    function createSnapshot(drillDb, options, callback) {
        var projectionKey = options.projectionKey;
        var uids = options.uids;
        var queryObject = options.queryObject;
        var segmentationType = options.segmentationTypes;

        var cacheTime = 60 * 60 * 24;
        var lu_time = Date.now().valueOf() + cacheTime * 1000;

        var hashId = "test_snapshot_" + Date.now().valueOf();

        if (uids) {
            queryObject.uid = {$in: uids};
        }
        var pipeline = [];

        pipeline.push({
            $match: queryObject
        });
        pipeline.push({"$limit": options.limit});

        let project = {};
        var idProj = [];
        if (Array.isArray(projectionKey)) {
            projectionKey.forEach(function(pKey, pIndex) {
                project["s" + pIndex] = "$" + pKey;
                pipeline.push(
                    {
                        $unwind: {path: "$" + pKey, preserveNullAndEmptyArrays: true}
                    }
                );
                idProj.push("_");
                idProj.push({"$convert": {"input": {$ifNull: ["$_id.s" + pIndex, ""]}, "to": "string", "onError": "[object Object]"}});
                if (segmentationType[pIndex] === "d") {
                    var tsToDateField = {};
                    var dateToTsField = {};
                    tsToDateField[pKey] = {
                        "$dateToString": {
                            "format": "%d-%m-%Y",
                            "date": {
                                "$toDate": {
                                    "$multiply": [ "$" + pKey, 1000 ]
                                }
                            }
                        }
                    };
                    dateToTsField[pKey] = {
                        "$toInt": {
                            "$divide": [
                                {
                                    "$toLong": {
                                        "$dateFromString": {
                                            "dateString": {
                                                "$concat": ["$" + pKey, "T00:00:00"]
                                            },
                                            "format": "%d-%m-%YT%H:%M:%S"
                                        }
                                    }
                                },
                                1000
                            ]
                        }
                    };
                    pipeline.push({ "$set": tsToDateField });
                    pipeline.push({ "$set": dateToTsField });
                }
            });
        }
        pipeline.push(
            {
                "$group": {
                    "_id": project,

                    "uids": {
                        "$addToSet": "$uid"
                    },
                    "t": {
                        "$sum": "$c"
                    },
                    "s": {
                        "$sum": "$s"
                    },
                    "dur": {
                        "$sum": "$dur"
                    }
                }
            },
            {
                $project: {
                    _id: {"$concat": [hashId, {$concat: idProj}]},
                    u: { $size: "$uids" },
                    t: "$t",
                    s: "$s",
                    dur: "$dur",
                    lu: new Date(lu_time),
                    segments: "$_id"
                }
            }
        );
        pipeline.push({"$unionWith": {coll: "drill_snapshots", pipeline: [{ "$documents": [{ _id: hashId + "_$meta", lu: new Date(lu_time), "calculating": 0, created: new Date() }] }] }});
        pipeline.push({"$merge": {into: "drill_snapshots", on: "_id", whenMatched: "merge", whenNotMatched: "insert"}});
        drillDb.collection(options.collectionName).aggregate(pipeline, {allowDiskUse: true}, function(err) {
            if (err) {

                console.log(err);
            }
            callback(err, hashId);
        });
    }


    function fetchDataFromSnapshot(drillDb, options, callback) {
        var params = options.params;
        var pipeline = [];
        var hashId = options.hashId;
        pipeline.push({"$match": {_id: {"$regex": "^" + hashId + "_.*"}}});
        var facets = {"segments": [{"$match": {"_id": {"$ne": hashId + "_$meta"}}}], "pageInfo": [{"$match": {"_id": {"$ne": hashId + "_$meta"}}}, {$group: { _id: null, count: { $sum: 1 } }}], "mata": [{"$match": {"_id": hashId + "_$meta"}}]};
        let sort = params.qstring.sort || {};
        if (typeof sort === "string" && sort.length) {
            try {
                sort = JSON.parse(sort);
                sort._id = 1;
            }
            catch (ex) {
                sort = {};
            }
        }
        sort = { u: -1, _id: 1 };
        facets.segments.push({$sort: sort});
        facets.segments.push(
            {
                $limit: 10
            }
        );

        facets.segments.push({"$project": {"_id": "$segments", "segments": 1, "u": 1, "t": 1, "s": 1, "lu": 1, "dur": 1}});
        pipeline.push({"$facet": facets});
        drillDb.collection("drill_snapshots").aggregate(pipeline, {allowDiskUse: true}, function(err, res) {
            callback(err, res);
        });

    }

});