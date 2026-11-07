
import { getSeatLabel } from "../utils/seats";

export default function Seat({
  seat,
  selected,
  onToggle,
}) {
  const label = getSeatLabel(seat);

  return (
    <button
      type="button"
      className={`cinema-seat ${
        selected ? "cinema-seat--selected" : ""
      }`}
      onClick={() => onToggle(seat.id)}
      aria-label={`Seat ${label}`}
      aria-pressed={selected}
      title={`Seat ${label} — ${
        selected ? "Selected" : "Available"
      }`}
    >
      {seat.seat_number}
    </button>
  );
}
