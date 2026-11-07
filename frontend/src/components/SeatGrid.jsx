
import Seat from "./Seat";
import { groupSeatsByRow } from "../utils/seats";

export default function SeatGrid({
  seats,
  selectedSeatIds,
  onToggleSeat,
}) {
  const rows = groupSeatsByRow(seats);

  if (rows.length === 0) {
    return (
      <div className="empty-showtimes">
        No seats have been configured for this screen.
      </div>
    );
  }

  return (
    <section className="seat-grid-panel">
      <div className="screen-container">
        <div className="cinema-screen" />
        <span>SCREEN THIS WAY</span>
      </div>

      <div className="seat-map-scroll">
        <div className="seat-map">
          {rows.map((row) => (
            <div className="seat-row" key={row.label}>
              <span className="row-label">{row.label}</span>

              <div className="seat-row-buttons">
                {row.seats.map((seat) => (
                  <Seat
                    key={seat.id}
                    seat={seat}
                    selected={selectedSeatIds.includes(
                      seat.id
                    )}
                    onToggle={onToggleSeat}
                  />
                ))}
              </div>

              <span className="row-label">{row.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="seat-legend">
        <div>
          <span className="legend-seat legend-available" />
          Available
        </div>

        <div>
          <span className="legend-seat legend-selected" />
          Selected
        </div>
      </div>
    </section>
  );
}
