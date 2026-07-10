/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function getParts(value) {
  const [date = "", time = ""] = value.split("T");
  const [hour = "", minute = ""] = time.split(":");
  const hourNumber = Number(hour);

  if (!date || !Number.isInteger(hourNumber) || hourNumber < 0 || hourNumber > 23) {
    return { date, hour: "", minute: "", period: "AM" };
  }

  return {
    date,
    hour: String(hourNumber % 12 || 12),
    minute: minute.padStart(2, "0"),
    period: hourNumber >= 12 ? "PM" : "AM",
  };
}

function toDateTimeValue({ date, hour, minute, period }) {
  if (!date || !hour || minute === "" || !period) return "";

  let hour24 = Number(hour) % 12;
  if (period === "PM") hour24 += 12;

  return `${date}T${String(hour24).padStart(2, "0")}:${minute}`;
}

export default function CampaignDateTimePicker({ label, name, value, onChange }) {
  const [parts, setParts] = useState(() => getParts(value));

  useEffect(() => {
    setParts(getParts(value));
  }, [value]);

  const update = (nextParts) => {
    const updatedParts = { ...parts, ...nextParts };
    setParts(updatedParts);
    onChange(toDateTimeValue(updatedParts));
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <input type="hidden" name={name} value={value} />

      <div className="campaign-date-time-picker">
        <input
          type="date"
          value={parts.date}
          onChange={(event) => update({ date: event.target.value })}
          required
          className="form-control"
          aria-label={`${label} date`}
        />
        <select
          value={parts.hour}
          onChange={(event) => update({ hour: event.target.value })}
          required
          className="form-control"
          aria-label={`${label} hour`}
        >
          <option value="">Hour</option>
          {HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
        </select>
        <select
          value={parts.minute}
          onChange={(event) => update({ minute: event.target.value })}
          required
          className="form-control"
          aria-label={`${label} minute`}
        >
          <option value="">Min</option>
          {MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
        </select>
        <select
          value={parts.period}
          onChange={(event) => update({ period: event.target.value })}
          required
          className="form-control"
          aria-label={`${label} AM or PM`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
