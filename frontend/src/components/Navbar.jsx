
import { Link, NavLink } from "react-router-dom";
import { Clapperboard, Ticket } from "lucide-react";
import AccountLinks from "./AccountLinks";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <Clapperboard size={28} />
        <span>CineVerse 3D</span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Movies</NavLink>
      </nav>

      <div className="nav-tag">
        <Ticket size={16} />
        Book your experience
      </div>
    </header>
  );
}
