
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export function getLocalDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatShowTime(startTime) {
  return new Date(startTime).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price));
}

export function buildTheaterGroups({
  shows,
  theaters,
  screens,
  movieId,
  selectedDate,
}) {
  const now = Date.now();

  const screenMap = new Map(
    screens.map((screen) => [Number(screen.id), screen])
  );

  const theaterMap = new Map(
    theaters.map((theater) => [Number(theater.id), theater])
  );

  const groups = new Map();

  const matchingShows = shows
    .filter((show) => Number(show.movie_id) === Number(movieId))
    .filter((show) => {
      const timestamp = new Date(show.start_time).getTime();

      return (
        Number.isFinite(timestamp) &&
        timestamp > now &&
        getLocalDateKey(show.start_time) === selectedDate
      );
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() -
        new Date(b.start_time).getTime()
    );

  for (const show of matchingShows) {
    const screen = screenMap.get(Number(show.screen_id));
    if (!screen) continue;

    const theater = theaterMap.get(Number(screen.theater_id));
    if (!theater) continue;

    const theaterId = Number(theater.id);

    if (!groups.has(theaterId)) {
      groups.set(theaterId, {
        theater,
        shows: [],
      });
    }

    groups.get(theaterId).shows.push({
      ...show,
      screenName: screen.name,
    });
  }

  return [...groups.values()].sort((a, b) =>
    a.theater.name.localeCompare(b.theater.name)
  );
}
