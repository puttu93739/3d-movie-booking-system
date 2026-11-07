
import { describe, it, expect } from "vitest";

import {
  normalizeSeats,
  getSeatLabel,
  groupSeatsByRow,
  calculateTotal,
  formatCurrency,
} from "./seats";

const demoSeats = [
  {
    id: 3,
    row_label: "B",
    seat_number: 1,
    seat_type: "REGULAR",
  },
  {
    id: 2,
    row_label: "A",
    seat_number: 2,
    seat_type: "REGULAR",
  },
  {
    id: 1,
    row_label: "A",
    seat_number: 1,
    seat_type: "REGULAR",
  },
];

describe("Cinema seat utilities", () => {
  it("handles a wrapped API response", () => {
    const response = {
      total_seats: 3,
      seats: demoSeats,
    };

    expect(normalizeSeats(response)).toHaveLength(3);
  });

  it("handles an array response", () => {
    expect(normalizeSeats(demoSeats)).toHaveLength(3);
  });

  it("handles invalid responses", () => {
    expect(normalizeSeats(null)).toEqual([]);
  });

  it("creates readable seat labels", () => {
    expect(getSeatLabel(demoSeats[0])).toBe("B1");
  });

  it("groups seats by row in correct order", () => {
    const rows = groupSeatsByRow(demoSeats);

    expect(rows).toHaveLength(2);
    expect(rows[0].label).toBe("A");
    expect(rows[1].label).toBe("B");
  });

  it("sorts seats numerically within rows", () => {
    const rows = groupSeatsByRow(demoSeats);

    expect(rows[0].seats.map((seat) => seat.id))
      .toEqual([1, 2]);
  });

  it("calculates the total ticket price", () => {
    expect(calculateTotal(3, 250)).toBe(750);
  });

  it("calculates decimal prices", () => {
    expect(calculateTotal(2, 199.50)).toBe(399);
  });

  it("formats prices in INR", () => {
    expect(formatCurrency(250)).toContain("250");
  });
});
