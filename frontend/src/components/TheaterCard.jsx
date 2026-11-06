
import { Link } from "react-router-dom";
import { MapPin, MonitorPlay } from "lucide-react";
import {
  formatPrice,
  formatShowTime,
} from "../utils/showtimes";

export default function TheaterCard({ theater, shows }) {
  return (
    <article className="theater-card">
      <div className="theater-heading">
        <div>
          <h3>{theater.name}</h3>

          <p className="theater-location">
            <MapPin size={16} />
            {theater.address}, {theater.city}
          </p>
        </div>

        <span className="theater-count">
          {shows.length} shows
        </span>
      </div>

      <div className="showtime-list">
        {shows.map((show) => (
          <Link
            key={show.id}
            className="showtime-option"
            to={`/shows/${show.id}/seats`}
          >
            <strong>{formatShowTime(show.start_time)}</strong>

            <span className="screen-label">
              <MonitorPlay size={14} />
              {show.screenName}
            </span>

            <span className="show-price">
              {formatPrice(show.ticket_price)}
            </span>

            <span className="show-cta">Select seats →</span>
          </Link>
        ))}
      </div>
    </article>
  );
}
