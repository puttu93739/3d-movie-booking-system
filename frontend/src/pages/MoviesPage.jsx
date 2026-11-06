
import { useEffect, useState } from "react";
import { getMovies } from "../services/api";
import MovieCard from "../components/MovieCard";

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMovies() {
      try {
        const data = await getMovies();

        if (active) {
          setMovies(
            Array.isArray(data) ? data : data.items ?? []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            "Could not load movies. Check that FastAPI is running."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMovies();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <section className="hero">
        <span className="eyebrow">
          THE ULTIMATE CINEMA EXPERIENCE
        </span>

        <h1>
          Your next great story
          <br />
          <span>starts here.</span>
        </h1>

        <p>
          Explore movies, find your perfect showtime,
          and get ready for an immersive cinema experience.
        </p>

        <a href="#now-showing" className="hero-button">
          Explore movies
        </a>
      </section>

      <section id="now-showing" className="movies-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DISCOVER</span>
            <h2>Now showing</h2>
          </div>
          <span className="movie-count">
            {movies.length} movies
          </span>
        </div>

        {loading && <p>Loading movies...</p>}

        {error && <p className="error">{error}</p>}

        {!loading && !error && movies.length === 0 && (
          <p>
            No movies found. Add a movie through
            the FastAPI Swagger UI.
          </p>
        )}

        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>
    </main>
  );
}
