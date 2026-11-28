import React, { useMemo, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./TimeRangePanel.css";



const TimeRangePanel = ({
  timeOptions,
  selectedTimeStart,
  setSelectedTimeStart,
  selectedTimeEnd,
  setSelectedTimeEnd,
  timeMode,
  setTimeMode,
  relativeRange,
  setRelativeRange,
  onAnalyze,
}) => {
  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

  const getDate = (value) => {
    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;

    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const formatTime = (date) => {
    if (!date) return "";

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  // ---------------------------------------------------------
  // Convert timeOptions into valid Date objects
  // ---------------------------------------------------------

  const availableDateTimes = useMemo(() => {
    return (timeOptions || [])
      .map((option) => new Date(option))
      .filter((date) => !Number.isNaN(date.getTime()));
  }, [timeOptions]);

  // ---------------------------------------------------------
  // Find the unique dates available in the dataset
  // ---------------------------------------------------------

  const availableDates = useMemo(() => {
    const uniqueDates = [];

    availableDateTimes.forEach((date) => {
      const alreadyExists = uniqueDates.some((existingDate) =>
        isSameDate(existingDate, date)
      );

      if (!alreadyExists) {
        uniqueDates.push(
          new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          )
        );
      }
    });

    return uniqueDates;
  }, [availableDateTimes]);

  // ---------------------------------------------------------
  // Current selected dates
  // ---------------------------------------------------------

  const startDate = getDate(selectedTimeStart);
  const endDate = getDate(selectedTimeEnd);
  const availableEndDates = useMemo(() => {
    if (!startDate) {
      return availableDates;
    }

    return availableDates.filter((date) =>
      availableDateTimes.some(
        (dateTime) =>
          isSameDate(dateTime, date) &&
          dateTime.getTime() >= startDate.getTime()
      )
    );
  }, [availableDates, availableDateTimes, startDate]);

  // ---------------------------------------------------------
  // Get available times for a selected date
  // ---------------------------------------------------------

  const getTimesForDate = (selectedDate) => {
    if (!selectedDate) return [];

    const times = availableDateTimes.filter((date) =>
      isSameDate(date, selectedDate)
    );

    // Remove duplicate HH:mm values
    const uniqueTimes = [];

    times.forEach((date) => {
      const time = formatTime(date);

      if (!uniqueTimes.some((item) => item.value === time)) {
        uniqueTimes.push({
          value: time,
          label: time,
          originalDate: date,
        });
      }
    });

    return uniqueTimes.sort((a, b) =>
      a.value.localeCompare(b.value)
    );
  };

  const startTimeOptions = getTimesForDate(startDate);
  const endTimeOptions = getTimesForDate(endDate).filter((option) => {
    if (!startDate) return true;

    return option.originalDate.getTime() >= startDate.getTime();
  });


  // ---------------------------------------------------------
  // Handle calendar date selection
  // ---------------------------------------------------------

  const handleDateChange = (date, setter) => {
    if (!date) return;

    // Find all dataset timestamps available on this date
    const timesForDate = availableDateTimes
      .filter((availableDate) =>
        isSameDate(availableDate, date)
      )
      .sort((a, b) => a.getTime() - b.getTime());

    if (timesForDate.length === 0) return;

    // Automatically select the first available timestamp
    setter(timesForDate[0].toISOString());
  };

  const handleEndDateChange = (date) => {
    if (!date) return;

    const validTimes = availableDateTimes
      .filter(
        (availableDate) =>
          isSameDate(availableDate, date) &&
          (!startDate ||
            availableDate.getTime() >= startDate.getTime())
      )
      .sort((a, b) => a.getTime() - b.getTime());

    if (validTimes.length === 0) return;

    // Select the first valid time on the chosen end date
    setSelectedTimeEnd(validTimes[0].toISOString());
  };

  useEffect(() => {
    if (!startDate || !endDate) return;

    if (endDate.getTime() < startDate.getTime()) {
      const nextValidEnd = availableDateTimes
        .filter(
          (dateTime) =>
            dateTime.getTime() >= startDate.getTime()
        )
        .sort((a, b) => a.getTime() - b.getTime())[0];

      if (nextValidEnd) {
        setSelectedTimeEnd(nextValidEnd.toISOString());
      } else {
        setSelectedTimeEnd("");
      }
    }
  }, [
    selectedTimeStart,
    selectedTimeEnd,
    availableDateTimes,
    setSelectedTimeEnd,
  ]);

  // ---------------------------------------------------------
  // Handle time dropdown selection
  // ---------------------------------------------------------

  const handleTimeChange = (
    event,
    selectedDate,
    setter
  ) => {
    const selectedTime = event.target.value;

    if (!selectedDate || !selectedTime) return;

    const matchingDateTime = availableDateTimes.find(
      (date) =>
        isSameDate(date, selectedDate) &&
        formatTime(date) === selectedTime
    );

    if (matchingDateTime) {
      setter(matchingDateTime.toISOString());
    }
  };

  return (
    <div className="time-range-panel">

      {/* Header */}
      <div className="time-range-header">
        <span className="time-range-title">
          Select Time Range
        </span>

        <div className="time-mode-toggle">
          <button
            type="button"
            className={timeMode === "absolute" ? "active" : ""}
            onClick={() => setTimeMode("absolute")}
          >
            Absolute
          </button>

          <button
            type="button"
            className={timeMode === "relative" ? "active" : ""}
            onClick={() => setTimeMode("relative")}
          >
            Relative
          </button>
        </div>
      </div>

      {/* Absolute mode */}
      {timeMode === "absolute" && (
        <div className="absolute-date-range">

          {/* Start date/time */}
          <div className="date-time-column">
            <label>Start date</label>

            <DatePicker
              selected={startDate}
              onChange={(date) =>
                handleDateChange(
                  date,
                  setSelectedTimeStart
                )
              }
              includeDates={availableDates}
              dateFormat="yyyy-MM-dd"
              inline
            />

            <select
              className="time-dropdown"
              value={formatTime(startDate)}
              disabled={!startDate}
              onChange={(event) =>
                handleTimeChange(
                  event,
                  startDate,
                  setSelectedTimeStart
                )
              }
            >
              {!startDate && (
                <option value="">
                  Select a date first
                </option>
              )}

              {startTimeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* End date/time */}
          <div className="date-time-column">
            <label>End date</label>

            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              includeDates={availableEndDates}
              dateFormat="yyyy-MM-dd"
              inline
            />

            <select
              className="time-dropdown"
              value={formatTime(endDate)}
              disabled={!endDate}
              onChange={(event) =>
                handleTimeChange(
                  event,
                  endDate,
                  setSelectedTimeEnd
                )
              }
            >
              {!endDate && (
                <option value="">
                  Select a date first
                </option>
              )}

              {endTimeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      )}

      {/* Relative mode */}
      {timeMode === "relative" && (
        <div className="relative-section">
          <h4>Relative time range</h4>

          <select
            value={relativeRange}
            onChange={(event) =>
              setRelativeRange(event.target.value)
            }
          >
            <option value="5min">Last 5 minutes</option>
            <option value="15min">Last 15 minutes</option>
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </div>
      )}

      {/* Footer */}
      <div className="time-range-footer">
        <button
          type="button"
          className="analyze-btn"
          onClick={onAnalyze}
        >
          Apply time range
        </button>
      </div>
    </div>
  );
};

export default TimeRangePanel;