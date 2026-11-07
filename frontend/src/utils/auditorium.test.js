
import { describe, it, expect } from "vitest";

import {
  AUDITORIUM,
  getAuditoriumLayout,
  toggleSeatId,
} from "./auditorium";

const seats = [
  { id: 1, row_label: "A", seat_number: 1 },
  { id: 2, row_label: "A", seat_number: 2 },
  { id: 3, row_label: "A", seat_number: 3 },
  { id: 4, row_label: "B", seat_number: 1 },
  { id: 5, row_label: "B", seat_number: 2 },
  { id: 6, row_label: "B", seat_number: 3 },
];

describe("3D auditorium layout", () => {
  it("handles empty seat arrays", () => {
    const layout = getAuditoriumLayout([]);

    expect(layout.seats).toEqual([]);
    expect(layout.rowCount).toBe(0);
  });

  it("creates a 3D position for every seat", () => {
    const layout = getAuditoriumLayout(seats);

    expect(layout.seats).toHaveLength(6);

    layout.seats.forEach((seat) => {
      expect(seat.position).toHaveLength(3);
      expect(
        seat.position.every(Number.isFinite)
      ).toBe(true);
    });
  });

  it("detects the correct row count", () => {
    const layout = getAuditoriumLayout(seats);

    expect(layout.rowCount).toBe(2);
    expect(layout.maxSeatsPerRow).toBe(3);
  });

  it("places later rows behind earlier rows", () => {
    const layout = getAuditoriumLayout(seats);

    const seatA = layout.seats.find(
      (seat) => seat.id === 1
    );

    const seatB = layout.seats.find(
      (seat) => seat.id === 4
    );

    expect(seatB.position[2]).toBeGreaterThan(
      seatA.position[2]
    );
  });

  it("raises later rows", () => {
    const layout = getAuditoriumLayout(seats);

    const seatA = layout.seats.find(
      (seat) => seat.id === 1
    );

    const seatB = layout.seats.find(
      (seat) => seat.id === 4
    );

    expect(seatB.position[1]).toBeGreaterThan(
      seatA.position[1]
    );
  });

  it("centers seats within each row", () => {
    const layout = getAuditoriumLayout(seats);

    const firstRow = layout.seats.filter(
      (seat) => seat.row_label === "A"
    );

    expect(firstRow[0].position[0]).toBeLessThan(0);
    expect(firstRow[1].position[0]).toBe(0);
    expect(firstRow[2].position[0]).toBeGreaterThan(0);
  });

  it("creates a central aisle for wide rows", () => {
    const wideRow = Array.from(
      { length: 8 },
      (_, index) => ({
        id: index + 1,
        row_label: "A",
        seat_number: index + 1,
      })
    );

    const layout = getAuditoriumLayout(wideRow);

    const gap =
      layout.seats[4].position[0] -
      layout.seats[3].position[0];

    expect(gap).toBeCloseTo(
      AUDITORIUM.seatSpacing +
      AUDITORIUM.aisleGap
    );
  });
});

describe("Shared seat selection", () => {
  it("selects a seat", () => {
    expect(toggleSeatId([], 5)).toEqual([5]);
  });

  it("deselects a selected seat", () => {
    expect(toggleSeatId([5, 6], 5)).toEqual([6]);
  });

  it("preserves existing selections", () => {
    expect(toggleSeatId([1, 2], 3))
      .toEqual([1, 2, 3]);
  });

  it("enforces the eight-seat limit", () => {
    const selected = [1, 2, 3, 4, 5, 6, 7, 8];

    expect(toggleSeatId(selected, 9))
      .toEqual(selected);
  });

  it("allows deselection at the seat limit", () => {
    const selected = [1, 2, 3, 4, 5, 6, 7, 8];

    expect(toggleSeatId(selected, 8))
      .toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
