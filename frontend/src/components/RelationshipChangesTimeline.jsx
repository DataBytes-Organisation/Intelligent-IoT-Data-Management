import "./RelationshipChangesTimeline.css";


const normalizeText = (value) =>
    String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const formatLabel = (value) => {
    if(!value) return "";

    return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
        character.toUpperCase()
    );
};

const formatTime = (timestamp) => {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
};

const formatAxisTime = (
    timestamp,
    timelineStart,
    timelineEnd
) => {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const oneDay = 24 * 60 * 60 * 1000;
    const range = timelineEnd - timelineStart;

    if (range > oneDay) {
        return date.toLocaleString([], {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
};

const createPairs = (streams) => {
    const pairs = [];

    for (let i = 0; i < streams.length; i++) {
        for (let j = i + 1; j < streams.length; j++) {
            pairs.push([
                streams[i],
                streams[j],
            ]);
        }
    }

    return pairs;
};

const getAlertMetrics = (alert) => {
    if (Array.isArray(alert?.target?.metrics)) {
        return alert.target.metrics;
    }

    return [];
};

const isSamePair = (
    pair,
    alertMetrics,
    streamLabels
) => {
    if (
        pair.length !== 2 ||
        alertMetrics.length !== 2
    ) {
        return false;
    }

    const normalizedAlertMetrics =
        alertMetrics.map(normalizeText);

    return pair.every((streamId) => {
        const normalizedId =
            normalizeText(streamId);

        const normalizedLabel =
            normalizeText(
                streamLabels[streamId]
            );

        return normalizedAlertMetrics.some(
            (metric) =>
                metric === normalizedId ||
                metric === normalizedLabel
        );
    });
};

const RelationshipChangesTimeline = ({
    selectedStreams = [],
    alerts = [],
    streamLabels = {},
    startTime = null,
    endTime = null,
}) => {
    if (selectedStreams.length < 2){
        return(
            <section className="relationship-timeline">
                <h3 className="relationship-title">Relationship Changes</h3>

                <p className="relationship-description">
                    Select at least two streams to view relationship changes.
                </p>

            </section>
        );
    }

    const pairs = createPairs(selectedStreams);

    const correlationAlerts = alerts.filter(
        (alert) => alert.alert_type === "CORRELATION_CHANGE"
    );

    const timelineStart = startTime !== null ? new Date(startTime).getTime(): null;
    const timelineEnd = endTime !== null ? new Date(endTime).getTime(): null;
    const hasTimeline = Number.isFinite(timelineStart) && Number.isFinite(timelineEnd) && timelineEnd > timelineStart;

    const getDisplayName = (stream) => streamLabels[stream] || formatLabel(stream);

    const calculatePosition = (timestamp) => {
        if(!hasTimeline) return 0;

        const time = new Date(timestamp).getTime();
        return (((time - timelineStart)/ (timelineEnd - timelineStart))* 100);
    };

    const createTimeTicks = () => {
        if (!hasTimeline) {
            return [];
        }

        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;

        const duration =
            timelineEnd - timelineStart;

        let interval;

        if (duration <= hour) {
            // 10-minute intervals
            interval = 10 * minute;
        } else if (duration <= 6 * hour) {
            // 1-hour intervals
            interval = hour;
        } else if (duration <= 24 * hour) {
            // 3-hour intervals
            interval = 3 * hour;
        } else if (duration <= 3 * day) {
            // 12-hour intervals
            interval = 12 * hour;
        } else if (duration <= 7 * day) {
            // 1-day intervals
            interval = day;
        } else if (duration <= 30 * day) {
            // 3-day intervals
            interval = 3 * day;
        } else {
            // 7-day intervals
            interval = 7 * day;
        }

        const ticks = [];

        // Start at the next clean interval.
        const firstTick =
            Math.ceil(timelineStart / interval) *
            interval;

        for (
            let time = firstTick;
            time <= timelineEnd;
            time += interval
        ) {
            ticks.push({
                time,
                percentage:
                    ((time - timelineStart) /
                        duration) *
                    100,
            });
        }

        return ticks;
    };
    const timeTicks = createTimeTicks();

    return (
        <section className="relationship-timeline">
            <div className="relationship-header">
                <div>
                    <h3 className="relationship-title">Relationship Changes</h3>

                    <p className="relationship-description">
                        Highlighted periods show when the relationship between sensor pairs changes.
                    </p>
                </div>
            </div>


            <div className="relationship-chart">
                <div className="relationship-rows">
                    {pairs.map((pair) =>{
                        const matchingAlerts = correlationAlerts.filter(
                            (alert) => isSamePair(pair, getAlertMetrics(alert), streamLabels
                        ));

                        return (
                            <div className="relationship-row" key={pair.join("-")}>
                                <div className="relationship-label">
                                    {getDisplayName(pair[0])}
                                    {" + "}
                                    {getDisplayName(pair[1])}
                                </div>

                                <div className="relationship-track">
                                    {timeTicks.map((tick, index) =>(
                                        <div key={index} className="relationship-grid-line" style={{left: `${tick.percentage}%`, }} />
                                    ))}

                                    {matchingAlerts.map((alert, index)=>{
                                        if (!hasTimeline || !alert.time_window){
                                            return null;
                                        }

                                        const start = calculatePosition(alert.time_window.start);
                                        const end = calculatePosition(alert.time_window.end);

                                        if (end <0 || start > 100){
                                            return null;
                                        }

                                        const left = Math.max(0, Math.min(100, start));
                                        const right = Math.max(0, Math.min(100, end));
                                        const width = Math.max(1, right - left);

                                        return (
                                            <div className="relationship-change" 
                                            key={alert.alert_id ?? `${pair.join("-")}-${index}`} 
                                            style = {{left: `${left}%`, width: `${width}%`,}} 
                                            tabIndex={0}>

                                                <div className="relationship-tooltip">
                                                    <strong>Relationship Changed</strong>
                                                    <span className="tooltip-pair">
                                                        {getDisplayName(pair[0])}
                                                        {" + "}
                                                        {getDisplayName(pair[1])}
                                                    </span>
                                                    <span>
                                                        {formatTime(alert.time_window.start)}
                                                        {" - "}
                                                        {formatTime(alert.time_window.end)}
                                                    </span>

                                                    <p>
                                                        These sensors stopped behaving together as expected.
                                                    </p>
                                                </div>

                                            </div>
                                        );
                                    })}
                                    
                                </div>
                            </div>
                        );

                    })}
                </div>

                {hasTimeline && (
                    <div className="relationship-axis">
                        <div className="relationship-axis-space"/>
                        <div className="relationship-axis-track">
                            {timeTicks.map((tick, index) => (
                                <span className="relationship-time-label" key={index} style={{left: `${tick.percentage}%`, }}>
                                    {formatAxisTime(
                                        tick.time,
                                        timelineStart,
                                        timelineEnd)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                
            </div>

            <div className="relationship-legend">
                <span className="relationship-legend-block" />
                <span>
                    = Relationship change period
                </span>
            </div>



        </section>
    );
};

export default RelationshipChangesTimeline;