import {
    dataPointsPageElements,
    dataPointsMetricCardElements,
    dataPointsGraphElements,
    dataPointsDataTableElements
} from "../../../../support/elements/dashboard/manage/dataPoints/dataPoints";

const verifyStaticElementsOfPage = () => {
    cy.verifyElement({
        labelElement: dataPointsPageElements.PAGE_TITLE,
        labelText: "Data Points",
        tooltipElement: dataPointsPageElements.PAGE_TITLE_TOOLTIP,
        tooltipText: "Sessions, events (custom events + internal events generated by plugins) and data points (sessions + events) for the selected period"
    });

    cy.verifyElement({
        labelElement: dataPointsPageElements.TOP_APPLICATIONS_BY_DATA_POINTS_LABEL,
        labelText: "Top applications by data points in the last 2 hours"
    });

    cy.verifyElement({
        element: dataPointsGraphElements.FILTER_DATE_PICKER,
    });

    cy.verifyElement({
        element: dataPointsDataTableElements().EXPORT_AS_BUTTON,
    });

    cy.verifyElement({
        element: dataPointsDataTableElements().DATATABLE_SEARCH_INPUT,
        elementPlaceHolder: "Search"
    });

    cy.verifyElement({
        isElementVisible: false,
        labelElement: dataPointsDataTableElements().COLUMN_NAME_APP_NAME_LABEL,
        labelText: "App Name",
    });

    cy.verifyElement({
        isElementVisible: false,
        element: dataPointsDataTableElements().COLUMN_NAME_APP_NAME_SORTABLE_ICON,
    });

    cy.verifyElement({
        labelElement: dataPointsDataTableElements().COLUMN_NAME_SESSIONS_LABEL,
        labelText: "Sessions",
        tooltipElement: dataPointsDataTableElements().COLUMN_NAME_SESSIONS_TOOLTIP,
        tooltipText: "Count of sessions. If data for this period is not available, then there will be '-'. Total data points for this period will always be accurate.",
        element: dataPointsDataTableElements().COLUMN_NAME_SESSIONS_SORTABLE_ICON,
    });

    cy.verifyElement({
        labelElement: dataPointsDataTableElements().COLUMN_NAME_NON_SESSIONS_DATA_POINTS_LABEL,
        labelText: "Non-Session Data Points",
        tooltipElement: dataPointsDataTableElements().COLUMN_NAME_NON_SESSIONS_DATA_POINTS_TOOLTIP,
        tooltipText: "Count of events. If data for this period is not available, then there will be '-'. Total data points for this period will always be accurate.",
        element: dataPointsDataTableElements().COLUMN_NAME_NON_SESSIONS_DATA_POINTS_SORTABLE_ICON,
    });

    cy.verifyElement({
        labelElement: dataPointsDataTableElements().COLUMN_NAME_TOTAL_DATA_POINTS_LABEL,
        labelText: "Total Data Points",
        element: dataPointsDataTableElements().COLUMN_NAME_TOTAL_DATA_POINTS_SORTABLE_ICON,
    });

    cy.verifyElement({
        labelElement: dataPointsDataTableElements().COLUMN_NAME_CHANGE_IN_DATA_POINTS_LABEL,
        labelText: "Change in Data Points",
        element: dataPointsDataTableElements().COLUMN_NAME_CHANGE_IN_DATA_POINTS_SORTABLE_ICON,
    });
}

const verifyEmptyPageElements = () => {

    verifyStaticElementsOfPage();

    verifyGraphElements({
        isEmpty: true
    });

    verifyDataTableElements({
        isEmpty: true
    });
};

const verifyFullDataPageElements = () => {

    verifyStaticElementsOfPage();

    verifyGraphElements({
        isEmpty: false
    });

    verifyDataTableElements({
        isEmpty: false
    });
};

const verifyMetricCardElements = ({
    index = 0,
    isEmpty = false,
    appName = null,
    appNmber = null,
}) => {

    if (isEmpty) {

        cy.shouldNotExist(dataPointsMetricCardElements(index).APP_NAME_LABEL);
        cy.shouldNotExist(dataPointsMetricCardElements(index).APP_NAME_VALUE_LABEL);

        return;
    }

    cy.verifyElement({
        shouldNot: !isEmpty,
        element: dataPointsMetricCardElements(index).APP_NAME_LABEL,
        elementText: appName,
    });

    cy.verifyElement({
        shouldNot: !isEmpty,
        element: dataPointsMetricCardElements(index).APP_NAME_VALUE_LABEL,
        elementText: appNmber,
    });
};

const verifyGraphElements = ({
    isEmpty = false,
}) => {

    if (isEmpty) {
        cy.verifyElement({
            element: dataPointsGraphElements.EMPTY_TABLE_ICON,
        });

        cy.verifyElement({
            labelElement: dataPointsGraphElements.EMPTY_TABLE_TITLE,
            labelText: "...hmm, seems empty here",
        });

        cy.verifyElement({
            labelElement: dataPointsGraphElements.EMPTY_TABLE_SUBTITLE,
            labelText: "No data found",
        });

        return;
    }

    cy.verifyElement({
        element: dataPointsGraphElements.ECHART,
    });
};

const verifyDataTableElements = ({
    index = 0,
    isEmpty = false,
    appName = null,
    sessions = null,
    nonSessionDataPoints = null,
    totalDataPoints = null,
    changeInDataPoints = null,
}) => {

    if (isEmpty) {
        cy.verifyElement({
            labelElement: dataPointsDataTableElements(0).APP_NAME_ALL_DATAPOINTS,
            labelText: "(All Datapoints)"
        });

        cy.verifyElement({
            labelElement: dataPointsDataTableElements(0).SESSIONS,
            labelText: "0",
        });

        cy.verifyElement({
            labelElement: dataPointsDataTableElements(0).NON_SESSIONS_DATA_POINTS,
            labelText: "0",
        });

        cy.verifyElement({
            labelElement: dataPointsDataTableElements(0).TOTAL_DATA_POINTS,
            labelText: "0",
        });

        cy.verifyElement({
            labelElement: dataPointsDataTableElements(0).CHANGE_IN_DATA_POINTS,
            labelText: "0",
        });

        return;
    }

    cy.verifyElement({
        shouldNot: !isEmpty,
        labelElement: dataPointsDataTableElements(index).APP_NAME,
        labelText: appName,
    });

    cy.verifyElement({
        shouldNot: !isEmpty,
        labelElement: dataPointsDataTableElements(index).SESSIONS,
        labelText: sessions,
    });

    cy.verifyElement({
        shouldNot: !isEmpty,
        labelElement: dataPointsDataTableElements(index).NON_SESSIONS_DATA_POINTS,
        labelText: nonSessionDataPoints,
    });

    cy.verifyElement({
        shouldNot: !isEmpty,
        labelElement: dataPointsDataTableElements(index).TOTAL_DATA_POINTS,
        labelText: totalDataPoints,
    });

    cy.verifyElement({
        shouldNot: !isEmpty,
        labelElement: dataPointsDataTableElements(index).CHANGE_IN_DATA_POINTS,
        labelText: changeInDataPoints,
    });
};

module.exports = {
    verifyEmptyPageElements,
    verifyFullDataPageElements,
    verifyMetricCardElements,
    verifyGraphElements,
    verifyDataTableElements
};