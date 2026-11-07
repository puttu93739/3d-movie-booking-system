
import {
  calculateTotal,
  formatCurrency,
  getSeatLabel,
} from "../utils/seats";

export default function BookingSummary({
  selectedSeats,
  ticketPrice,
  onClear,
}) {
  const total = calculateTotal(
    selectedSeats.length,
    ticketPrice
  );

  const labels = [...selectedSeats]
    .sort((a, b) =>
      a.row_label.localeCompare(b.row_label) ||
      a.seat_number - b.seat_number
    )
    .map(getSeatLabel);

  return (
    <aside className="booking-summary">
      <h2>Your selection</h2>

      <div className="summary-line">
        <span>Selected seats</span>
        <strong>{selectedSeats.length}</strong>
      </div>

      <div className="selected-seat-labels">
        {labels.length > 0
          ? labels.join(", ")
          : "No seats selected"}
      </div>

      <div className="summary-line">
        <span>Ticket price</span>
        <strong>{formatCurrency(ticketPrice)}</strong>
      </div>

      <div className="summary-line">
        <span>Tickets</span>
        <strong>{selectedSeats.length}</strong>
      </div>

      <div className="summary-total">
        <span>Estimated total</span>
        <strong>{formatCurrency(total)}</strong>
      </div>

      <button
        type="button"
        className="clear-seats-button"
        onClick={onClear}
        disabled={selectedSeats.length === 0}
      >
        Clear selection
      </button>

      <p className="booking-disclaimer">
        Seats are not reserved yet. Booking and payment
        will be added in a later stage.
      </p>
    </aside>
  );
}
