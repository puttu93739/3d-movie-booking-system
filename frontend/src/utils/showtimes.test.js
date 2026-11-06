
import { describe, it, expect } from "vitest";
import {
  asList,
  buildTheaterGroups,
  getLocalDateKey,
} from "./showtimes";

describe("Showtime utilities", () => {
  it("normalizes list responses", () => {
    expect(asList([{ id: 1 }])).toHaveLength(1);
    expect(asList({ items: [{ id: 2 }] })).toHaveLength(1);
    expect(asList(null)).toEqual([]);
  });

  it("groups shows by theater and movie", () => {
    const start = new Date(Date.now() + 86400000);

    const groups = buildTheaterGroups({
      movieId: 1,
      selectedDate: getLocalDateKey(start),
      theaters: [
        {
          id: 10,
          name: "PVR Cinema",
          city: "Bengaluru",
          address: "MG Road",
        },
      ],
      screens: [
        {
          id: 20,
          theater_id: 10,
          name: "Screen 1",
        },
      ],
      shows: [
        {
          id: 30,
          movie_id: 1,
          screen_id: 20,
          start_time: start.toISOString(),
          ticket_price: 250,
        },
        {
          id: 31,
          movie_id: 2,
          screen_id: 20,
          start_time: start.toISOString(),
          ticket_price: 300,
        },
      ],
    });

    expect(groups).toHaveLength(1);
    expect(groups[0].theater.name).toBe("PVR Cinema");
    expect(groups[0].shows).toHaveLength(1);
    expect(groups[0].shows[0].id).toBe(30);
  });
});
