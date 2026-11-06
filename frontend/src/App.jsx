
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import MoviesPage from "./pages/MoviesPage";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import SeatSelectionPage from "./pages/SeatSelectionPage";

import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<MoviesPage />} />

        <Route
          path="/movies/:movieId"
          element={<MovieDetailsPage />}
        />

        <Route
          path="/shows/:showId/seats"
          element={<SeatSelectionPage />}
        />

        <Route
          path="*"
          element={
            <main className="content-page">
              <h1>Page not found</h1>
              <a href="/">Return to movies</a>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
