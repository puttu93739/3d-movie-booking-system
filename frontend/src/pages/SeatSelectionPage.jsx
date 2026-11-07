
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getShowById,
  getMovie,
  getSeatsByScreen,
} from "../services/api";

import SeatGrid from "../components/SeatGrid";
import BookingSummary from "../components/BookingSummary";

import {
  normalizeSeats,
  getSeatLabel,
} from "../utils/seats";

export default function SeatSelectionPage() {
  const { showId } = useParams();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [seats, setSeats] = useState([]);

  const [selectedSeatIds, setSelectedSeatIds] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSeatData() {
      setLoading(true);
      setError("");
      setSelectedSeatIds([]);
      setShow(null);
      setMovie(null);
      setSeats([]);

      try {
        // Step 1: Retrieve the selected show.
        const showData = await getShowById(showId);

        // Step 2: Retrieve movie and screen seats.
        const [movieData, seatData] = await Promise.all([
          getMovie(showData.movie_id),
          getSeatsByScreen(showData.screen_id),
        ]);

        if (!active) return;

        setShow(showData);
        setMovie(movieData);
        setSeats(normalizeSeats(seatData));
      } catch (err) {
        if (!active) return;

        console.error("Seat loading failed:", err);

        setError(
          err.response?.status === 404
            ? "Showtime or screen not found."
            : "Unable to load seats. Please check FastAPI."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSeatData();

    return () => {
      active = false;
    };
  }, [showId]);

  const selectedSeats = useMemo(
    () =>
      seats.filter((seat) =>
        selectedSeatIds.includes(seat.id)
      ),
    [seats, selectedSeatIds]
  );

  function toggleSeat(seatId) {
    setSelectedSeatIds((previous) => {
      if (previous.includes(seatId)) {
        return previous.filter((id) => id !== seatId);
      }

      // Optional development limit: 8 seats per selection.
      if (previous.length >= 8) {
        return previous;
      }

      return [...previous, seatId];
    });
  }

  function clearSelection() {
    setSelectedSeatIds([]);
  }

  if (loading) {
    return (
      <main className="content-page">
        <p>Loading cinema seating layout...</p>
      </main>
    );
  }

  if (error || !show) {
    return (
      <main className="content-page">
        <p className="error">
          {error || "Showtime not found."}
        </p>

        <Link to="/" className="back-link">
          ← Back to movies
        </Link>
      </main>
    );
  }

  return (
    <main className="content-page seat-selection-page">
      <Link
        to={`/movies/${show.movie_id}`}
        className="back-link"
      >
        ← Back to showtimes
      </Link>

      <div className="seat-page-header">
        <span className="eyebrow">CHOOSE YOUR SEATS</span>

        <h1>{movie?.title || "Movie"}</h1>

        <p>
          {new Date(show.start_time).toLocaleString(
            "en-IN",
            {
              dateStyle: "full",
              timeStyle: "short",
            }
          )}
        </p>

        <p>Screen #{show.screen_id}</p>
      </div>

      <div className="seat-booking-layout">
        <div>
          <SeatGrid
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={toggleSeat}
          />

          <p className="seat-help-text">
            Click a seat to select it. Click again to
            deselect. Maximum 8 seats per selection.
          </p>
        </div>

        <BookingSummary
          selectedSeats={selectedSeats}
          ticketPrice={show.ticket_price}
          onClear={clearSelection}
        />
      </div>

      {selectedSeats.length > 0 && (
        <p className="seat-selection-note">
          Selected:{" "}
          {selectedSeats.map(getSeatLabel).join(", ")}
        </p>
      )}
    </main>
  );
}
