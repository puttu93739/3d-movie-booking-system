
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import MoviesPage from "./pages/MoviesPage";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import SeatSelectionPage from "./pages/SeatSelectionPage";

import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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

          {/* Authentication routes */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          {/* 404 page */}
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
      </AuthProvider>
    </BrowserRouter>
  );
}
