import { useState } from "react";
import { Link } from "react-router-dom";
import "./AboutPage.css";

const dashboardGuide = [
  {
    id: "selector",
    number: "1",
    title: "Stream Selector",
    description:
      "Choose which sensor streams to explore, set the time interval and focus on a specific time range.",
  },
  {
    id: "insights",
    number: "2",
    title: "Insight Cards",
    description:
      "See a quick view of each selected sensor, including its trend and average reading.",
  },
  {
    id: "summary",
    number: "3",
    title: "Analysis Summary",
    description:
      "See a clear summary of unusual readings or relationship changes that may need attention.",
  },
  {
    id: "sensorTimeline",
    number: "4",
    title: "Sensor Timeline",
    description:
      "Compare selected sensor readings over time and see where unusual readings occur.",
  },
  {
    id: "relationshipTimeline",
    number: "5",
    title: "Relationship Changes",
    description:
      "See periods where the relationship between selected sensor streams changes.",
  },
];

const AboutPage = () => {
  const [activeGuide, setActiveGuide] =
    useState("selector");

  return (
    <main className="about-page">
      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero__content">
          <span className="about-eyebrow">
            About the platform
          </span>

          <h1>
            Understand your IoT data at a glance
          </h1>

          <p>
            Intelligent IoT Data Management brings
            sensor data into one place so you can
            explore readings, compare behaviour and
            quickly see activity that may need
            attention.
          </p>

          <div className="about-hero__actions">
            <Link
              to="/home"
              className="about-button about-button--primary"
            >
              Explore datasets
            </Link>

            <a
              href="#dashboard-guide"
              className="about-button about-button--secondary"
            >
              View dashboard guide
            </a>
          </div>
        </div>

        <div
          className="about-data-visual"
          aria-label="Different IoT data sources represented together in one platform"
        >
          <div className="about-data-visual__glow about-data-visual__glow--one" />
          <div className="about-data-visual__glow about-data-visual__glow--two" />

          <div className="about-data-node about-data-node--live">
            <span className="about-data-node__dot" />

            <div>
              <strong>Live IoT data</strong>
              <small>Available data sources</small>
            </div>
          </div>

          <div className="about-data-node about-data-node--upload">
            <span className="about-data-node__upload-icon">
              ↑
            </span>

            <div>
              <strong>Uploaded data</strong>
              <small>Your own dataset</small>
            </div>
          </div>

          <div className="about-data-visual__connector about-data-visual__connector--left" />
          <div className="about-data-visual__connector about-data-visual__connector--right" />

          <div className="about-data-core">
            <div className="about-data-core__top">
              <span className="about-data-core__logo">
                IoT
              </span>

              <div>
                <small>
                  Intelligent IoT Data Management
                </small>

                <strong>
                  Your data, in one place
                </strong>
              </div>
            </div>

            <div className="about-data-core__fields">
              <span>Selected fields</span>
              <span>Flexible data</span>
              <span>Custom datasets</span>
              <span>+ more</span>
            </div>
          </div>

          <div className="about-data-visual__caption">
            Different datasets.
            <strong> One place to explore them.</strong>
          </div>
        </div>
      </section>

      {/* BUILT AROUND YOUR DATA */}
      <section className="about-section about-data-flexibility">
        <div className="about-data-flexibility__copy">
          <span className="about-eyebrow">
            Built around your data
          </span>

          <h2>
            Work with the data that matters to you
          </h2>

          <p>
            Use sensor data already available in the
            platform or upload your own dataset. When
            you upload data, you can choose the fields
            you want to work with.
          </p>
        </div>

        <div className="about-field-panel">
          <div className="about-field-panel__header">
            <div>
              <span className="about-field-panel__file">
                DATA
              </span>

              <div>
                <strong>
                  Your dataset
                </strong>

                <small>
                  Select the fields you want to use
                </small>
              </div>
            </div>

            <span className="about-field-panel__status">
              Ready
            </span>
          </div>

          <div className="about-field-panel__label">
            Available fields
          </div>

          <div className="about-field-panel__fields">
            <button
              type="button"
              className="about-field-chip"
              tabIndex={-1}
            >
              Field 1
            </button>

            <button
              type="button"
              className="about-field-chip"
              tabIndex={-1}
            >
              Field 2
            </button>

            <button
              type="button"
              className="about-field-chip"
              tabIndex={-1}
            >
              Field 3
            </button>

            <button
              type="button"
              className="about-field-chip"
              tabIndex={-1}
            >
              Field 4
            </button>

            <button
              type="button"
              className="about-field-chip"
              tabIndex={-1}
            >
              Field 5
            </button>

            <button
              type="button"
              className="about-field-chip about-field-chip--more"
              tabIndex={-1}
            >
              + more
            </button>
          </div>

          <div className="about-field-panel__footer">
            <span>
              Dashboard adapts to your data
            </span>
          </div>
        </div>
      </section>

      {/* KNOW WHERE TO LOOK */}
      <section
        className="about-section"
        id="dashboard-guide"
      >
        <div className="about-section__heading">
          <span className="about-eyebrow">
            Quick dashboard guide
          </span>

          <h2>
            Know where to look
          </h2>

          <p>
            Select an item to highlight where that
            section appears on the dashboard.
          </p>
        </div>

        <div className="about-tour">
          <div className="about-tour__preview">
            <div className="about-tour__preview-header">
              <span className="about-tour__preview-logo">
                IoT
              </span>

              <div>
                <strong>
                  Sensor Dashboard
                </strong>

                <small>
                  Follow the dashboard from top to
                  bottom
                </small>
              </div>
            </div>

            {/* STREAM SELECTOR */}
            <div
              className={`about-dashboard-block ${
                activeGuide === "selector"
                  ? "is-active"
                  : ""
              }`}
            >
              <span className="about-dashboard-number">
                1
              </span>

              <h3>Stream Selector</h3>

              <div className="guide-selector">
                <div className="guide-selector__field">
                  <small>Select Streams</small>
                  <span />
                </div>

                <div className="guide-selector__field">
                  <small>Time Interval</small>
                  <span />
                </div>

                <div className="guide-selector__field">
                  <small>Time Range</small>
                  <span />
                </div>

                <div className="guide-selector__action">
                  Run Analysis
                </div>
              </div>
            </div>

            {/* INSIGHT CARDS */}
            <div
              className={`about-dashboard-block ${
                activeGuide === "insights"
                  ? "is-active"
                  : ""
              }`}
            >
              <span className="about-dashboard-number">
                2
              </span>

              <h3>Insight Cards</h3>

              <div className="guide-insights">
                <div className="guide-insight-card">
                  <strong>Selected sensor</strong>

                  <svg
                    className="guide-insight-line-chart"
                    viewBox="0 0 240 70"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <line
                      className="guide-insight-grid"
                      x1="0"
                      y1="18"
                      x2="240"
                      y2="18"
                    />

                    <line
                      className="guide-insight-grid"
                      x1="0"
                      y1="38"
                      x2="240"
                      y2="38"
                    />

                    <line
                      className="guide-insight-grid"
                      x1="0"
                      y1="58"
                      x2="240"
                      y2="58"
                    />

                    <polyline
                      className="guide-insight-line guide-insight-line--blue"
                      points="
                        0,23
                        20,25
                        40,24
                        55,25
                        65,52
                        78,55
                        95,48
                        115,40
                        135,32
                        155,26
                        175,20
                        195,18
                        215,24
                        240,22
                      "
                    />
                  </svg>

                  <small>
                    Average reading
                  </small>
                </div>

                <div className="guide-insight-card">
                  <strong>Selected sensor</strong>

                  <svg
                    className="guide-insight-line-chart"
                    viewBox="0 0 240 70"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <line
                      className="guide-insight-grid"
                      x1="0"
                      y1="18"
                      x2="240"
                      y2="18"
                    />

                    <line
                      className="guide-insight-grid"
                      x1="0"
                      y1="38"
                      x2="240"
                      y2="38"
                    />

                    <line
                      className="guide-insight-grid"
                      x1="0"
                      y1="58"
                      x2="240"
                      y2="58"
                    />

                    <polyline
                      className="guide-insight-line guide-insight-line--green"
                      points="
                        0,24
                        25,24
                        50,25
                        75,24
                        100,25
                        125,25
                        150,24
                        175,25
                        200,24
                        220,25
                        240,24
                      "
                    />
                  </svg>

                  <small>
                    Average reading
                  </small>
                </div>
              </div>
            </div>

            {/* ANALYSIS SUMMARY */}
            <div
              className={`about-dashboard-block ${
                activeGuide === "summary"
                  ? "is-active"
                  : ""
              }`}
            >
              <span className="about-dashboard-number">
                3
              </span>

              <h3>Analysis Summary</h3>

              <div className="guide-summary">
                <div className="guide-summary__top">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="guide-summary__bottom">
                  <div>
                    <strong>
                      Unusual reading
                    </strong>

                    <span />
                    <span />
                  </div>

                  <div>
                    <strong>
                      Relationship changed
                    </strong>

                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>

            {/* SENSOR TIMELINE */}
            <div
              className={`about-dashboard-block ${
                activeGuide === "sensorTimeline"
                  ? "is-active"
                  : ""
              }`}
            >
              <span className="about-dashboard-number">
                4
              </span>

              <h3>Sensor Timeline</h3>

              <div className="guide-sensor-timeline">
                <svg
                  className="guide-sensor-chart"
                  viewBox="0 0 260 90"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line
                    className="guide-sensor-grid"
                    x1="0"
                    y1="22"
                    x2="260"
                    y2="22"
                  />

                  <line
                    className="guide-sensor-grid"
                    x1="0"
                    y1="45"
                    x2="260"
                    y2="45"
                  />

                  <line
                    className="guide-sensor-grid"
                    x1="0"
                    y1="68"
                    x2="260"
                    y2="68"
                  />

                  <polyline
                    className="guide-sensor-line guide-sensor-line--green"
                    points="
                      0,22
                      25,24
                      50,23
                      75,25
                      100,25
                      125,30
                      150,40
                      175,51
                      200,59
                      225,54
                      260,56
                    "
                  />

                  <polyline
                    className="guide-sensor-line guide-sensor-line--blue"
                    points="
                      0,38
                      25,40
                      50,41
                      65,42
                      70,68
                      80,72
                      95,66
                      110,59
                      125,51
                      140,43
                      155,37
                      170,31
                      185,25
                      200,22
                      215,27
                      235,28
                      260,27
                    "
                  />

                  <circle
                    className="guide-sensor-anomaly"
                    cx="70"
                    cy="68"
                    r="4.5"
                  />

                  <circle
                    className="guide-sensor-anomaly"
                    cx="80"
                    cy="72"
                    r="4.5"
                  />

                  <circle
                    className="guide-sensor-anomaly"
                    cx="95"
                    cy="66"
                    r="4.5"
                  />

                  <circle
                    className="guide-sensor-anomaly"
                    cx="110"
                    cy="59"
                    r="4.5"
                  />

                  <circle
                    className="guide-sensor-anomaly"
                    cx="125"
                    cy="51"
                    r="4.5"
                  />

                  <circle
                    className="guide-sensor-anomaly"
                    cx="200"
                    cy="22"
                    r="4.5"
                  />
                </svg>
              </div>

              <div className="guide-timeline-key">
                <span>
                  <i className="guide-key-line guide-key-line--blue" />
                  Selected stream
                </span>

                <span>
                  <i className="guide-key-dot" />
                  Unusual reading
                </span>
              </div>
            </div>

            {/* RELATIONSHIP CHANGES */}
            <div
              className={`about-dashboard-block ${
                activeGuide ===
                "relationshipTimeline"
                  ? "is-active"
                  : ""
              }`}
            >
              <span className="about-dashboard-number">
                5
              </span>

              <h3>
                Relationship Changes
              </h3>

              <div className="guide-relationship">
                <div className="guide-relationship__label">
                  Selected sensor pair
                </div>

                <div className="guide-relationship__track">
                  <span className="guide-change-block guide-change-block--one" />
                  <span className="guide-change-block guide-change-block--two" />
                </div>
              </div>
            </div>
          </div>

          {/* CLICKABLE GUIDE */}
          <div className="about-tour__controls">
            {dashboardGuide.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`about-tour__control ${
                  activeGuide === item.id
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  setActiveGuide(item.id)
                }
                aria-pressed={
                  activeGuide === item.id
                }
              >
                <span className="about-tour__control-number">
                  {item.number}
                </span>

                <span className="about-tour__control-copy">
                  <strong>
                    {item.title}
                  </strong>

                  <small>
                    {item.description}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* READY TO EXPLORE */}
      <section className="about-cta">
        <div>
          <span className="about-eyebrow about-eyebrow--light">
            Ready to explore?
          </span>

          <h2>
            Start with a dataset and see what your
            sensors are telling you.
          </h2>

          <p>
            Open the dataset library, choose your data
            and begin exploring the dashboard.
          </p>
        </div>

        <Link
          to="/home"
          className="about-button about-button--light"
        >
          Explore datasets
        </Link>
      </section>
    </main>
  );
};

export default AboutPage;