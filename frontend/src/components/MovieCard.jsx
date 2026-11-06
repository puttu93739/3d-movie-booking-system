
import { Link } from "react-router-dom";
import { Clock3, Film, ArrowUpRight } from "lucide-react";

const gradients = [
  "linear-gradient(145deg, #4c1d95, #111827)",
  "linear-gradient(145deg, #9a3412, #18181b)",
  "linear-gradient(145deg, #0f766e, #111827)",
  "linear-gradient(145deg, #1d4ed8, #18181b)",
];

export default function MovieCard({ movie }) {
  if (!movie) return null;

  const gradient = gradients[
    Number(movie.id) % gradients.length
  ];

  return (
    <article className="movie-card">
      <div
        className="movie-poster"
        style={{ background: gradient }}
      >
        <Film size={56} strokeWidth={1} />

        <span className="poster-title">
          {movie.title}
        </span>
      </div>

      <div className="movie-info">
        <div className="movie-meta">
          <span>{movie.genre}</span>
          <span>{movie.language}</span>
        </div>

        <h3>{movie.title}</h3>

        <p className="duration">
          <Clock3 size={15} />
          {movie.duration_minutes} minutes
        </p>

        <Link
          to={`/movies/${movie.id}`}
          className="book-button"
        >
          View showtimes
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </article>
  );
}
