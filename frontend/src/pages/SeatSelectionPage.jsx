
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getShows } from "../services/api";
import { asList, formatPrice } from "../utils/showtimes";

export default function SeatSelectionPage() {
  const { showId } = useParams();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadShow() {
      try {
        const shows = asList(await getShows());
        const selectedShow = shows.find(
          (item) => Number(item.id) === Number(showId)
        );

        if (active) {
          setShow(selectedShow || null);
        }
      } catch (err) {
        if (active) setError("Unable to load show details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadShow();

    return () => {
      active = false;
    };
  }, [showId]);

  return (
    <main className="content-page">
      <Link to="/" className="back-link">
        ← Back to movies
      </Link>

      <span className="eyebrow">STAGE 2.4</span>
      <h1>Choose your seats</h1>

      {loading && <p>Loading show details...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && !show && (
        <p>Showtime not found.</p>
      )}

      {show && (
        <div className="seat-placeholder">
          <h2>Selected show #{show.id}</h2>
          <p>
            Showtime:{" "}
            {new Date(show.start_time).toLocaleString("en-IN")}
          </p>
          <p>Screen ID: {show.screen_id}</p>
          <p>Ticket price: {formatPrice(show.ticket_price)}</p>

          <div className="cinema-screen-preview">
            CINEMA SCREEN
          </div>

          <p>
            Interactive 2D and 3D seat selection will
            be implemented in Stage 2.4 and 2.5.
          </p>
        </div>
      )}
    </main>
  );
}
