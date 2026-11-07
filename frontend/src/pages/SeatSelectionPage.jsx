
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getShowById,
  getMovie,
  getSeatsByScreen,
  getSeatAvailability,
  createSeatHold,
  confirmSeatHold,
  releaseSeatHold,
} from "../services/api";

import SeatGrid from "../components/SeatGrid";
import BookingSummary from "../components/BookingSummary";
import HoldCountdown from "../components/HoldCountdown";
import CinemaAuditorium from "../components/three/CinemaAuditorium";

import { normalizeSeats } from "../utils/seats";
import { toggleSeatId } from "../utils/auditorium";

export default function SeatSelectionPage() {
  const { showId } = useParams();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [seats, setSeats] = useState([]);

  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [unavailableSeatIds, setUnavailableSeatIds] =
    useState([]);

  const [viewMode, setViewMode] = useState("3d");
  const [hold, setHold] = useState(null);
  const [booking, setBooking] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshAvailability = useCallback(async () => {
    const data = await getSeatAvailability(showId);
    setUnavailableSeatIds(data.unavailable_seat_ids);
    return data.unavailable_seat_ids;
  }, [showId]);

  // Keep seat availability synchronized across browser sessions.
  useEffect(() => {
    if (!showId || booking) return;

    const intervalId = setInterval(() => {
      refreshAvailability().catch((error) => {
        console.error("Automatic availability refresh failed:", error);
      });
    }, 3000);

    return () => clearInterval(intervalId);
  }, [showId, booking, refreshAvailability]);

  // Remove seats from a pending selection if another customer holds them.
  useEffect(() => {
    if (hold || booking) return;

    setSelectedSeatIds((previous) => {
      const blocked = new Set(unavailableSeatIds);
      const next = previous.filter((id) => !blocked.has(id));
      return next.length === previous.length ? previous : next;
    });
  }, [unavailableSeatIds, hold, booking]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");
      setShow(null);
      setMovie(null);
      setSeats([]);
      setSelectedSeatIds([]);
      setUnavailableSeatIds([]);
      setHold(null);
      setBooking(null);

      try {
        const showData = await getShowById(showId);

        const [movieData, seatResponse, availability] =
          await Promise.all([
            getMovie(showData.movie_id),
            getSeatsByScreen(showData.screen_id),
            getSeatAvailability(showId),
          ]);

        if (!active) return;

        setShow(showData);
        setMovie(movieData);
        setSeats(normalizeSeats(seatResponse));
        setUnavailableSeatIds(
          availability.unavailable_seat_ids
        );
      } catch (err) {
        if (!active) return;

        console.error("Booking page loading failed:", err);
        setError("Unable to load booking information.");
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

  // Once the user owns a hold, its seats are locked
  // for editing, but remain highlighted as selected.
  const lockedSelection = Boolean(hold || booking);
    const ownedSeatIds = hold || booking
    ? selectedSeatIds
    : [];

  // Seats unavailable to this customer
  const visibleUnavailableSeatIds = unavailableSeatIds.filter(
    (id) => !ownedSeatIds.includes(id)
  );
  function handleToggleSeat(seatId) {
    if (lockedSelection || busy) return;

    if (unavailableSeatIds.includes(seatId)) return;

    setSelectedSeatIds((previous) =>
      toggleSeatId(previous, seatId)
    );
  }

  async function handleCreateHold() {
    if (selectedSeatIds.length === 0 || busy) return;

    setBusy(true);
    setError("");

    try {
      const result = await createSeatHold(
        showId,
        selectedSeatIds
      );

      setHold(result);
      await refreshAvailability();
    } catch (err) {
      console.error("Hold creation failed:", err);

      setError(
        err.response?.status === 409
          ? "One or more selected seats are no longer available."
          : "Unable to hold seats. Please try again."
      );

      try {
        await refreshAvailability();
      } catch {
        // Keep the original error message.
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!hold || busy) return;

    setBusy(true);
    setError("");

    try {
      const result = await confirmSeatHold(
        hold.hold_id,
        hold.hold_token
      );

      setBooking(result);
      setHold(null);
      await refreshAvailability();
    } catch (err) {
      console.error("Confirmation failed:", err);

      if (err.response?.status === 409) {
        setHold(null);
        setSelectedSeatIds([]);
        setError("Your hold is no longer valid.");
      } else {
        setError(
          "Could not confirm booking. Retry while your hold is valid."
        );
      }

      try {
        await refreshAvailability();
      } catch {
        // Don't replace the confirmation error.
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRelease() {
    if (!hold || busy) return;

    setBusy(true);
    setError("");

    try {
      await releaseSeatHold(
        hold.hold_id,
        hold.hold_token
      );

      setHold(null);
      setSelectedSeatIds([]);
      await refreshAvailability();
    } catch (err) {
      console.error("Release failed:", err);
      setError("Unable to release the hold.");
    } finally {
      setBusy(false);
    }
  }

  const handleExpired = useCallback(() => {
    setHold(null);
    setSelectedSeatIds([]);
    setError("Your seat hold has expired.");

    refreshAvailability().catch((err) => {
      console.error("Availability refresh failed:", err);
    });
  }, [refreshAvailability]);

  if (loading) {
    return (
      <main className="content-page">
        Loading seats and availability...
      </main>
    );
  }

  if (!show) {
    return (
      <main className="content-page">
        <p>{error || "Showtime not found."}</p>
        <Link to="/">Back to movies</Link>
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
          3D CINEMA BOOKING
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
      </header>

      {error && (
        <p className="booking-error" role="alert">
          {error}
        </p>
      )}

      {booking && (
        <div className="booking-success" role="status">
          <h2>Booking confirmed!</h2>
          <p>Booking ID: {booking.booking_id}</p>
          <p>
            Seats: {booking.seat_ids.join(", ")}
          </p>
          <p>
            This is a development booking.
            No payment has been processed.
          </p>
        </div>
      )}

      {hold && (
        <HoldCountdown
          expiresAt={hold.expires_at}
          onExpired={handleExpired}
        />
      )}

      <div className="view-switcher">
        <button
          type="button"
          className={viewMode === "2d" ? "view-active" : ""}
          onClick={() => setViewMode("2d")}
        >
          2D Seat Map
        </button>

        <button
          type="button"
          className={viewMode === "3d" ? "view-active" : ""}
          onClick={() => setViewMode("3d")}
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
                  unavailableSeatIds={visibleUnavailableSeatIds}
                  onToggleSeat={handleToggleSeat}
                />
          ) : (
<SeatGrid
  seats={seats}
  selectedSeatIds={selectedSeatIds}
  unavailableSeatIds={visibleUnavailableSeatIds}
  onToggleSeat={handleToggleSeat}
/>
          )}

          <button
            type="button"
            className="refresh-availability-button"
            onClick={() => {
              refreshAvailability().catch(() => {
                setError("Unable to refresh availability.");
              });
            }}
          >
            Refresh availability
          </button>
        </div>

        <div>
          <BookingSummary
            selectedSeats={selectedSeats}
            ticketPrice={show.ticket_price}
            onClear={() => {
              if (!lockedSelection && !busy) {
                setSelectedSeatIds([]);
              }
            }}
          />

          <div className="booking-actions">
            {!hold && !booking && (
              <button
                type="button"
                className="booking-primary-button"
                disabled={
                  selectedSeatIds.length === 0 || busy
                }
                onClick={handleCreateHold}
              >
                {busy ? "Processing..." : "Hold seats"}
              </button>
            )}

            {hold && (
              <>
                <button
                  type="button"
                  className="booking-primary-button"
                  disabled={busy}
                  onClick={handleConfirm}
                >
                  Confirm booking
                </button>

                <button
                  type="button"
                  className="booking-secondary-button"
                  disabled={busy}
                  onClick={handleRelease}
                >
                  Release seats
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
