
import { getLocalDateKey } from "../utils/showtimes";

export default function DateSelector({
  selectedDate,
  onDateChange,
}) {
  const today = new Date();

  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + index
    );

    return {
      key: getLocalDateKey(date),
      weekday: date.toLocaleDateString("en-IN", {
        weekday: "short",
      }),
      day: date.getDate(),
      month: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
    };
  });

  return (
    <div className="date-selector">
      {dates.map((date) => (
        <button
          key={date.key}
          type="button"
          className={
            selectedDate === date.key
              ? "date-button selected"
              : "date-button"
          }
          onClick={() => onDateChange(date.key)}
          aria-pressed={selectedDate === date.key}
        >
          <span>{date.weekday}</span>
          <strong>{date.day}</strong>
          <small>{date.month}</small>
        </button>
      ))}
    </div>
  );
}

