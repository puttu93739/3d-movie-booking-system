
export const AUDITORIUM = {
  seatSpacing: 1.15,
  rowSpacing: 1.55,
  rowRise: 0.22,
  seatBaseHeight: 0.48,
  aisleGap: 1.2,
  cameraPosition: [0, 10, 18],
  maxSelectableSeats: 8,
};

export function getAuditoriumLayout(seats) {
  if (!Array.isArray(seats) || seats.length === 0) {
    return {
      seats: [],
      rowCount: 0,
      maxSeatsPerRow: 0,
      width: 12,
      depth: 12,
    };
  }

  const rowLabels = [
    ...new Set(seats.map((seat) => String(seat.row_label))),
  ].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const rowCount = rowLabels.length;
  const rowIndexMap = new Map(
    rowLabels.map((label, index) => [label, index])
  );

  const maxSeatsPerRow = Math.max(
    ...rowLabels.map(
      (label) =>
        seats.filter(
          (seat) => String(seat.row_label) === label
        ).length
    )
  );

  const positionedSeats = [];

  for (const label of rowLabels) {
    const rowIndex = rowIndexMap.get(label);

    const rowSeats = seats
      .filter(
        (seat) => String(seat.row_label) === label
      )
      .sort(
        (a, b) =>
          Number(a.seat_number) - Number(b.seat_number)
      );

    const center = (rowSeats.length - 1) / 2;

    rowSeats.forEach((seat, index) => {
      const middleAisleOffset =
        rowSeats.length >= 6
          ? index < rowSeats.length / 2
            ? -AUDITORIUM.aisleGap / 2
            : AUDITORIUM.aisleGap / 2
          : 0;

      const x =
        (index - center) * AUDITORIUM.seatSpacing +
        middleAisleOffset;

      const z = rowIndex * AUDITORIUM.rowSpacing;

      const y =
        AUDITORIUM.seatBaseHeight +
        rowIndex * AUDITORIUM.rowRise;

      positionedSeats.push({
        ...seat,
        position: [x, y, z],
        rowIndex,
      });
    });
  }

  const width =
    maxSeatsPerRow * AUDITORIUM.seatSpacing +
    AUDITORIUM.aisleGap +
    5;

  const depth =
    Math.max(1, rowCount - 1) *
      AUDITORIUM.rowSpacing +
    10;

  return {
    seats: positionedSeats,
    rowCount,
    maxSeatsPerRow,
    width,
    depth,
  };
}

export function toggleSeatId(
  currentIds,
  seatId,
  maxSeats = AUDITORIUM.maxSelectableSeats
) {
  if (currentIds.includes(seatId)) {
    return currentIds.filter((id) => id !== seatId);
  }

  if (currentIds.length >= maxSeats) {
    return currentIds;
  }

  return [...currentIds, seatId];
}
