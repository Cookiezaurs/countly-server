/* global Vue, countlyCommon, VueECharts, _merge */

(function(countlyVue) {

    var countlyBaseComponent = countlyVue.components.BaseComponent,
        _mixins = countlyVue.mixins;

    var fontFamily = "Inter";
    /*
        Use xAxis.axisLabel.showMinLabel to change visibility of minimum label
        Use xAxis.axisLabel.showMaxLabel to change visibility of maximum label
        Use xAxis.inverse to inverse the labels

        xAxis.data - https://echarts.apache.org/en/option.html#xAxis.data
        yAxis.data - https://echarts.apache.org/en/option.html#yAxis.data
        xAxis.boundaryGap - Sets some gap from both the edges of the graph of the corresponding axis

        Category data, available in type: 'category' axis.
        If type is not specified, but axis.data is specified, the type is auto set as 'category'.
        should notice that axis.data provides then value range of the 'category' axis.

        If it is auto collected from series.data, Only the values appearing in series.data can be collected.
        For example, if series.data is empty, nothing will be collected.

        - axisPointer - Automatically shown if tooltip.trigger = 'axis'

        - toolbox. feature - Besides the tools we provide, user-defined toolbox is also supported.

        - tooltip. trigger - Is item for charts that dont have category axis
        - tooltip. confine, tooltip. appendToBody - Used when there is overflow
        - tooltip. formatter - Tooltip content formatter
    */

    var BaseChart = _mixins.BaseContent.extend({
        provide: function() {
            var obj = {};
            obj[VueECharts.THEME_KEY] = "white";
            return obj;
        },
        props: {
            height: {
                type: Number,
                default: 400
            },
            autoresize: {
                type: Boolean,
                default: true
            },
            option: {
                type: Object,
                default: function() {
                    return {};
                }
            },
            showZoom: {
                type: Boolean,
                default: true
            }
        },
        data: function() {
            return {
                echartRef: {
                    type: Object
                },
                baseOptions: {
                    title: {
                        show: false
                    },
                    grid: {
                        top: 60,
                        bottom: 65,
                        left: 35,
                        right: 35,
                        containLabel: true
                    },
                    legend: {
                        show: true,
                        bottom: 10,
                        padding: 15,
                        itemGap: 25,
                        lineStyle: {
                            width: 0
                        },
                        textStyle: {
                            color: "#333C48",
                            fontSize: 12,
                            overflow: "truncate",
                        },
                        icon: "roundRect",
                        itemHeight: 6,
                        itemWidth: 12
                    },
                    toolbox: {
                        id: "toolbox",
                        feature: {
                            saveAsImage: {
                                show: true
                            },
                            dataView: {
                                show: false
                            },
                            restore: {
                                show: false
                            },
                            dataZoom: {
                                show: false
                            },
                            magicType: {
                                show: true,
                                type: ['line', 'bar']
                            }
                        },
                        right: 15,
                        top: 5
                    },
                    tooltip: {
                        show: true,
                        trigger: 'axis',
                        axisPointer: {
                            type: "line",
                            label: {
                                show: false
                            },
                            lineStyle: {
                                color: "#A7AEB8",
                                type: "dashed",
                                cap: "round"
                            }
                        },
                        showContent: true,
                        alwaysShowContent: false,
                        enterable: true,
                        renderMode: 'html',
                        position: function(pt) {
                            return [pt[0], '10%'];
                        },
                        textStyle: {
                            color: "#A7AEB8",
                            fontSize: 14
                        }
                    },
                    xAxis: {
                        boundaryGap: true,
                        offset: 10,
                        type: 'category',
                        axisLine: {
                            show: true,
                            lineStyle: {
                                type: "solid",
                                color: "#ECECEC"
                            }
                        },
                        axisTick: {
                            show: false
                        },
                        axisLabel: {
                            show: true,
                            color: "#A7AEB8",
                            showMinLabel: true,
                            showMaxLabel: true,
                            fontSize: 14
                        },
                        splitLine: {
                            show: false
                        }
                    },
                    yAxis: {
                        boundaryGap: false,
                        offset: 10,
                        type: 'value',
                        axisLine: {
                            show: false
                        },
                        axisTick: {
                            show: false
                        },
                        axisLabel: {
                            show: true,
                            color: "#A7AEB8",
                            fontSize: 12
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: "#ECECEC",
                                type: "dashed"
                            }
                        }
                    },
                    dataZoom: [
                        {
                            type: 'slider',
                            show: false,
                            xAxisIndex: 0,
                            filterMode: 'none'
                        },
                        {
                            type: 'slider',
                            show: false,
                            yAxisIndex: 0,
                            filterMode: 'none'
                        },
                        {
                            type: 'inside',
                            xAxisIndex: 0,
                            filterMode: 'none',
                            zoomLock: true
                        },
                        {
                            type: 'inside',
                            yAxisIndex: 0,
                            filterMode: 'none',
                            zoomLock: true
                        }
                    ],
                    color: countlyCommon.GRAPH_COLORS,
                    textStyle: {
                        fontFamily: fontFamily
                    }
                }
            };
        },
        computed: {
            mergedOptions: function() {
                var opt = _merge({}, this.baseOptions, this.mixinOptions, this.internalOptions, this.option);
                var series = JSON.parse(JSON.stringify(opt.series || []));
                var legendData = [];

                for (var i = 0; i < series.length; i++) {
                    series[i] = _merge({}, this.seriesOptions, series[i]);
                    legendData.push(series[i].name);
                }

                opt.legend.data = !opt.legend.data ? legendData : opt.legend.data;
                opt.series = series;
                return opt;
            }
        }
    });

    /*
        Some handy series option for line series

        - series-line. name - Series name used for displaying in tooltip and filtering with legend, or updating data and configuration with setOption.
        - series-line. color - To change the series color
        - series-line. sampling : To improve performance
        - series-line. dimensions : Used in tooltips
        - series-line. encode
        - series-line. areaStyle : Will simply create an area chart
        - series-line. data
            Example - Sample data -
                        [
                            [0, 12],
                            {
                                value: [1, 32],
                                label: {},
                                labelStyle: {},
                            },
                            [2, 33]
                        ]
            Note: '-' or null or undefined or NaN can be used to describe that a data item does not exist
                    (ps：not exist does not means its value is 0)
    */

    var BaseLineChart = BaseChart.extend({
        data: function() {
            return {
                mixinOptions: {},
                seriesOptions: {
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        type: "solid",
                        cap: "round",
                    },
                    smooth: false,
                    emphasis: {
                        focus: 'series'
                    }
                }
            };
        }
    });

    /*
        Some handy series option for bar series

        series-bar. stack - Name of stack. On the same category axis, the series with the same stack name would be put on top of each other.
            - stack basic example - https://echarts.apache.org/examples/en/editor.html?c=bar-waterfall
        series-bar. large - Whether to enable the optimization of large-scale data.
        series-bar. barGap - The gap between bars between different series.

        To make a horizontal bar chart, set xAxis.type = "value" and yAxis.type = "category"
    */
    var BaseBarChart = BaseChart.extend({
        data: function() {
            return {
                mixinOptions: {},
                seriesOptions: {
                    type: 'bar',
                    legendHoverLink: true,
                    showBackground: false,
                    label: {
                        show: false,
                        fontSize: 12,
                        color: "#fff"
                    },
                    selectedMode: false,
                    progressive: true,
                    emphasis: {
                        focus: 'series'
                    }
                }
            };
        }
    });

    var ZoomDropdown = countlyBaseComponent.extend({
        props: {
            echartRef: {
                type: Object
            }
        },
        data: function() {
            return {
                zoomNumbers: [
                    {
                        value: 0,
                        name: "Reset"
                    },
                    {
                        value: 10,
                        name: "10%"
                    },
                    {
                        value: 20,
                        name: "20%"
                    },
                    {
                        value: 30,
                        name: "30%"
                    },
                    {
                        value: 40,
                        name: "40%"
                    },
                    {
                        value: 50,
                        name: "50%"
                    },
                    {
                        value: 60,
                        name: "60%"
                    },
                    {
                        value: 70,
                        name: "70%"
                    },
                    {
                        value: 80,
                        name: "80%"
                    },
                    {
                        value: 90,
                        name: "90%"
                    },
                    {
                        value: 100,
                        name: "100%"
                    },
                ],
                selZoomNumber: ""
            };
        },
        computed: {
            selZoom: {
                get: function() {
                    return this.selZoomNumber;
                },
                set: function(v) {
                    this.echartRef.dispatchAction({
                        type: "dataZoom",
                        start: v / 2,
                        end: 100 - v / 2
                    });

                    this.selZoomNumber = v;
                }
            }
        },
        template: "<div style='width: 94px'>\
                        <el-select v-model='selZoom'>\
                            <el-option :key='item.value' :value='item.value' :label='item.name'\
                                v-for='item in zoomNumbers'></el-option>\
                        </el-select>\
                    </div>"
    });

    var ChartHeader = countlyBaseComponent.extend({
        props: {
            echartRef: {
                type: Object
            },
            showZoom: {
                type: Boolean
            }
        },
        components: {
            "zoom-dropdown": ZoomDropdown
        },
        template: '<div class="bu-level">\
                        <div class="bu-level-left">\
                            <div class="bu-level-item">\
                                <slot name="chart-left" v-bind:echart="echartRef">\
                                </slot>\
                            </div>\
                            <div class="bu-level-item" v-if="showZoom">\
                                <zoom-dropdown :echartRef="echartRef"></zoom-dropdown>\
                            </div>\
                        </div>\
                        <div class="bu-level-right">\
                            <slot name="chart-right" v-bind:echart="echartRef">\
                            </slot>\
                        </div>\
                    </div>'
    });

    Vue.component("cly-chart-line", BaseLineChart.extend({
        data: function() {
            return {
                internalOptions: {},
                forwardedSlots: ["chart-left", "chart-right"]
            };
        },
        mounted: function() {
            this.echartRef = this.$refs.echarts;
        },
        components: {
            'chart-header': ChartHeader
        },
        computed: {
            chartOptions: function() {
                var opt = _merge({}, this.mergedOptions);
                return opt;
            }
        },
        template: '<div class="cly-vue-line-chart bu-columns bu-is-gapless bu-is-multiline">\
                        <div class="bu-column bu-is-10 cly-vue-line-chart__header-left">\
                            <chart-header :echartRef="echartRef" :showZoom="showZoom">\
                                <template v-for="item in forwardedSlots" v-slot:[item]="slotScope">\
                                    <slot :name="item" v-bind="slotScope"></slot>\
                                </template>\
                            </chart-header>\
                        </div>\
                        <div class="bu-column bu-is-full" :style="{height: height + \'px\'}">\
                            <echarts\
                                ref="echarts"\
                                v-bind="$attrs"\
                                v-on="$listeners"\
                                :option="chartOptions"\
                                :autoresize="autoresize">\
                            </echarts>\
                        </div>\
                    </div>'
    }));

    Vue.component("cly-chart-time", BaseLineChart.extend({
        data: function() {
            return {
                internalOptions: {},
                forwardedSlots: ["chart-left", "chart-right"]
            };
        },
        props: {
            bucket: {
                type: String,
            },
            dummy: {
                type: Boolean
            }
        },
        mounted: function() {
            this.echartRef = this.$refs.echarts;
        },
        components: {
            'chart-header': ChartHeader
        },
        computed: {
            chartOptions: function() {
                var opt = _merge({}, this.mergedOptions);

                var xAxisData = [];
                if (!opt.xAxis.data) {
                    /*
                        If xAxis.data is not provided,
                        create xAxis.data automatically
                    */

                    var period = countlyCommon.getPeriod();
                    var tickObj = {};

                    if (period === "month" && !this.bucket) {
                        tickObj = countlyCommon.getTickObj("monthly", false, true);
                    }
                    else {
                        tickObj = countlyCommon.getTickObj(this.bucket, false, true);
                    }

                    var ticks = tickObj.ticks;
                    for (var i = 0; i < ticks.length; i++) {
                        var tick = ticks[i];
                        var tickIndex = tick[0];
                        var tickValue = tick[1];
                        while (xAxisData.length < tickIndex) {
                            /*
                                tickIndex is the array index
                                Although ticks should be continuous, but they might not be
                            */
                            xAxisData.push("");
                        }
                        xAxisData.push(tickValue);
                    }

                    opt.xAxis.data = xAxisData;
                }

                if (this.dummy) {
                    //Adding dummy data start
                    var dummyData = [];
                    for (var j = 0; j < xAxisData.length; j++) {
                        dummyData.push(parseInt(Math.random() * 100));
                    }

                    for (var k = 0; k < opt.series.length; k++) {
                        opt.series[k].data = dummyData;
                    }
                    //Adding dummy data end
                }

                return opt;
            }
        },
        template: '<div class="cly-vue-line-chart bu-columns bu-is-gapless bu-is-multiline">\
                        <div class="bu-column bu-is-10 cly-vue-line-chart__header-left">\
                            <chart-header :echartRef="echartRef" :showZoom="showZoom">\
                                <template v-for="item in forwardedSlots" v-slot:[item]="slotScope">\
                                    <slot :name="item" v-bind="slotScope"></slot>\
                                </template>\
                            </chart-header>\
                        </div>\
                        <div class="bu-column bu-is-full" :style="{height: height + \'px\'}">\
                            <echarts\
                                ref="echarts"\
                                v-bind="$attrs"\
                                v-on="$listeners"\
                                :option="chartOptions"\
                                :autoresize="autoresize">\
                            </echarts>\
                        </div>\
                        {{bucket}}\
                    </div>'
    }));

    Vue.component("cly-chart-bar", BaseBarChart.extend({
        data: function() {
            return {
                internalOptions: {},
                forwardedSlots: ["chart-left", "chart-right"]
            };
        },
        mounted: function() {
            this.echartRef = this.$refs.echarts;
        },
        components: {
            'chart-header': ChartHeader
        },
        computed: {
            chartOptions: function() {
                var opt = _merge({}, this.mergedOptions);
                return opt;
            }
        },
        template: '<div class="cly-vue-line-chart bu-columns bu-is-gapless bu-is-multiline">\
                        <div class="bu-column bu-is-10 cly-vue-line-chart__header-left">\
                            <chart-header :echartRef="echartRef" :showZoom="showZoom">\
                                <template v-for="item in forwardedSlots" v-slot:[item]="slotScope">\
                                    <slot :name="item" v-bind="slotScope"></slot>\
                                </template>\
                            </chart-header>\
                        </div>\
                        <div class="bu-column bu-is-full" :style="{height: height + \'px\'}">\
                            <echarts\
                                ref="echarts"\
                                v-bind="$attrs"\
                                v-on="$listeners"\
                                :option="chartOptions"\
                                :autoresize="autoresize">\
                            </echarts>\
                        </div>\
                    </div>'
    }));

}(window.countlyVue = window.countlyVue || {}));
