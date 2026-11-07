
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000",
  timeout: 10000,
});

export async function getMovies() {
  const response = await api.get("/movies/");
  return response.data;
}

export async function getMovie(movieId) {
  const response = await api.get(`/movies/${movieId}`);
  return response.data;
}

export async function getShows() {
  const response = await api.get("/shows/");
  return response.data;
}

export async function getTheaters() {
  const response = await api.get("/theaters/");
  return response.data;
}

export async function getScreensByTheater(theaterId) {
  const response = await api.get(
    `/theaters/${theaterId}/screens`
  );
  return response.data;
}

export async function getSeats(screenId) {
  const response = await api.get(
    `/screens/${screenId}/seats`
  );
  return response.data;
}


export async function getShowById(showId) {
  const response = await api.get(`/shows/${showId}`);
  return response.data;
}

export async function getSeatsByScreen(screenId) {
  const response = await api.get(
    `/screens/${screenId}/seats`
  );
  return response.data;
}

export async function getSeatAvailability(showId) {
  const response = await api.get(
    `/bookings/shows/${showId}/availability`
  );
  return response.data;
}

export async function createSeatHold(showId, seatIds) {
  const response = await api.post("/bookings/holds", {
    show_id: Number(showId),
    seat_ids: seatIds,
  });
  return response.data;
}

export async function confirmSeatHold(holdId, token) {
  const response = await api.post(
    `/bookings/holds/${holdId}/confirm`,
    {},
    { headers: { "X-Hold-Token": token } }
  );
  return response.data;
}

export async function releaseSeatHold(holdId, token) {
  const response = await api.post(
    `/bookings/holds/${holdId}/release`,
    {},
    { headers: { "X-Hold-Token": token } }
  );
  return response.data;
}

export default api;
