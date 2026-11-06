
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getMovie,
  getShows,
  getTheaters,
  getScreensByTheater,
} from "../services/api";

import DateSelector from "../components/DateSelector";
import TheaterCard from "../components/TheaterCard";

import {
  asList,
  buildTheaterGroups,
  getLocalDateKey,
} from "../utils/showtimes";

export default function MovieDetailsPage() {
  const { movieId } = useParams();
  console.log("Selected movie ID:", movieId);
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);

  const [selectedDate, setSelectedDate] = useState(
    () => getLocalDateKey(new Date())
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBookingData() {
      setLoading(true);
      setError("");

      try {
        // Load the movie, all shows and theaters.
        const [movieData, showData, theaterData] =
          await Promise.all([
            getMovie(movieId),
            getShows(),
            getTheaters(),
          ]);

        const theaterList = asList(theaterData);

        // Load screens for every theater.
        const screenResults = await Promise.all(
          theaterList.map((theater) =>
            getScreensByTheater(theater.id)
          )
        );

        const allScreens = screenResults.flatMap(asList);

        if (!active) return;

        setMovie(movieData);
        setShows(asList(showData));
        setTheaters(theaterList);
        setScreens(allScreens);
      } catch (err) {
        if (!active) return;

        console.error("Booking API error:", {
        message: err.message,
        url: err.config?.url,
        status: err.response?.status,
        data: err.response?.data,
      });

        setError(
        `Unable to load booking information: ${
          err.response?.status
            ? `HTTP ${err.response.status}`
            : err.message
        }`
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBookingData();

    return () => {
      active = false;
    };
  }, [movieId]);

  const theaterGroups = useMemo(
    () =>
      buildTheaterGroups({
        shows,
        theaters,
        screens,
        movieId,
        selectedDate,
      }),
    [shows, theaters, screens, movieId, selectedDate]
  );

  if (loading) {
    return (
      <main className="content-page">
        <p>Loading theaters and showtimes...</p>
      </main>
    );
  }

  if (error || !movie) {
    return (
      <main className="content-page">
        <p className="error">{error || "Movie not found."}</p>
        <Link to="/">Back to movies</Link>
      </main>
    );
  }

  return (
    <main className="content-page">
      <Link to="/" className="back-link">
        ← Back to movies
      </Link>

      <section className="details-header">
        <span className="eyebrow">NOW BOOKING</span>

        <h1>{movie.title}</h1>

        <p>
          {movie.genre} • {movie.language} •{" "}
          {movie.duration_minutes} minutes
        </p>

        <p>{movie.description}</p>
      </section>

      <section className="booking-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">STEP 1</span>
            <h2>Select a date</h2>
          </div>
        </div>

        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        <div className="section-heading theater-section-heading">
          <div>
            <span className="eyebrow">STEP 2</span>
            <h2>Choose your theater & showtime</h2>
          </div>
        </div>

        {theaterGroups.length === 0 ? (
          <div className="empty-showtimes">
            <h3>No showtimes available</h3>
            <p>
              No upcoming shows are scheduled for this
              movie on the selected date. Try another day.
            </p>
          </div>
        ) : (
          <div className="theater-list">
            {theaterGroups.map(({ theater, shows }) => (
              <TheaterCard
                key={theater.id}
                theater={theater}
                shows={shows}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
