
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getShowById,
  getMovie,
  getSeatsByScreen,
} from "../services/api";

import SeatGrid from "../components/SeatGrid";
import BookingSummary from "../components/BookingSummary";
import CinemaAuditorium from "../components/three/CinemaAuditorium";

import { normalizeSeats } from "../utils/seats";
import { toggleSeatId } from "../utils/auditorium";

export default function SeatSelectionPage() {
  const { showId } = useParams();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [seats, setSeats] = useState([]);

  const [selectedSeatIds, setSelectedSeatIds] =
    useState([]);

  const [viewMode, setViewMode] = useState("3d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");
      setShow(null);
      setMovie(null);
      setSeats([]);
      setSelectedSeatIds([]);

      try {
        const showData = await getShowById(showId);

        const [movieData, seatResponse] =
          await Promise.all([
            getMovie(showData.movie_id),
            getSeatsByScreen(showData.screen_id),
          ]);

        if (!active) return;

        setShow(showData);
        setMovie(movieData);
        setSeats(normalizeSeats(seatResponse));
      } catch (err) {
        if (!active) return;

        console.error("Seat selection error:", err);

        setError(
          err.response?.status === 404
            ? "Showtime or screen not found."
            : "Unable to load auditorium data."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

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

  function handleToggleSeat(seatId) {
    setSelectedSeatIds((previous) =>
      toggleSeatId(previous, seatId)
    );
  }

  function clearSelection() {
    setSelectedSeatIds([]);
  }

  if (loading) {
    return (
      <main className="content-page">
        Loading cinema auditorium...
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

      <header className="seat-page-header">
        <span className="eyebrow">
          INTERACTIVE CINEMA EXPERIENCE
        </span>

        <h1>{movie?.title}</h1>

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
      </header>

      <div className="view-switcher">
        <button
          type="button"
          className={
            viewMode === "2d" ? "view-active" : ""
          }
          onClick={() => setViewMode("2d")}
          aria-pressed={viewMode === "2d"}
        >
          2D Seat Map
        </button>

        <button
          type="button"
          className={
            viewMode === "3d" ? "view-active" : ""
          }
          onClick={() => setViewMode("3d")}
          aria-pressed={viewMode === "3d"}
        >
          3D Auditorium
        </button>
      </div>

      <div className="seat-booking-layout">
        <div className="auditorium-main">
          {viewMode === "3d" ? (
            <CinemaAuditorium
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={handleToggleSeat}
            />
          ) : (
            <SeatGrid
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={handleToggleSeat}
            />
          )}

          <p className="seat-help-text">
            Select up to 8 seats. Your selections are
            preserved when switching between 2D and 3D.
          </p>
        </div>

        <BookingSummary
          selectedSeats={selectedSeats}
          ticketPrice={show.ticket_price}
          onClear={clearSelection}
        />
      </div>
    </main>
  );
}
