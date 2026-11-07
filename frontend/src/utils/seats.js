
export function normalizeSeats(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.seats)) {
    return response.seats;
  }

  return [];
}

export function getSeatLabel(seat) {
  return `${seat.row_label}${seat.seat_number}`;
}

export function groupSeatsByRow(seats) {
  const groups = new Map();

  for (const seat of seats) {
    const row = String(seat.row_label).toUpperCase();

    if (!groups.has(row)) {
      groups.set(row, []);
    }

    groups.get(row).push(seat);
  }

  return [...groups.entries()]
    .sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true })
    )
    .map(([label, rowSeats]) => ({
      label,
      seats: [...rowSeats].sort(
        (a, b) => a.seat_number - b.seat_number
      ),
    }));
}

export function calculateTotal(seatCount, ticketPrice) {
  return Math.round(
    seatCount * Number(ticketPrice) * 100
  ) / 100;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}
