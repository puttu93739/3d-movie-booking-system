
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

export default api;
