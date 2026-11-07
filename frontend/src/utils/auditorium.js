
export const AUDITORIUM = {
  seatSpacing: 1.18,
  rowSpacing: 1.65,
  rowRise: 0.38,
  seatBaseHeight: 0.62,
  aisleGap: 1.3,
  curveDepth: 0.025,
  maxSelectableSeats: 8,
  screenDistance: 5.5,
};

export function getAuditoriumLayout(seats) {
  if (!Array.isArray(seats) || seats.length === 0) {
    return {
      seats: [],
      rowCount: 0,
      maxSeatsPerRow: 0,
      width: 14,
      depth: 14,
      lastRowZ: 0,
    };
  }

  const rowLabels = [
    ...new Set(
      seats.map((seat) => String(seat.row_label))
    ),
  ].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const positionedSeats = [];
  let maxSeatsPerRow = 0;
  let maxAbsX = 0;
  let lastRowZ = 0;

  rowLabels.forEach((label, rowIndex) => {
    const rowSeats = seats
      .filter((seat) => String(seat.row_label) === label)
      .sort(
        (a, b) =>
          Number(a.seat_number) - Number(b.seat_number)
      );

    maxSeatsPerRow = Math.max(
      maxSeatsPerRow,
      rowSeats.length
    );

    const center = (rowSeats.length - 1) / 2;

    rowSeats.forEach((seat, index) => {
      const aisleOffset =
        rowSeats.length >= 6
          ? index < rowSeats.length / 2
            ? -AUDITORIUM.aisleGap / 2
            : AUDITORIUM.aisleGap / 2
          : 0;

      const x =
        (index - center) * AUDITORIUM.seatSpacing +
        aisleOffset;

      // Seats at the edges curve slightly toward
      // the rear of the auditorium.
      const curveOffset =
        AUDITORIUM.curveDepth * x * x;

      const z =
        rowIndex * AUDITORIUM.rowSpacing +
        curveOffset;

      const y =
        AUDITORIUM.seatBaseHeight +
        rowIndex * AUDITORIUM.rowRise;

      maxAbsX = Math.max(maxAbsX, Math.abs(x));
      lastRowZ = Math.max(lastRowZ, z);

      // Seat faces toward the screen.
      const rotationY = -Math.atan2(
        x,
        AUDITORIUM.screenDistance + z
      );

      positionedSeats.push({
        ...seat,
        position: [x, y, z],
        rotationY,
        rowIndex,
      });
    });
  });

  return {
    seats: positionedSeats,
    rowCount: rowLabels.length,
    maxSeatsPerRow,
    width: Math.max(14, maxAbsX * 2 + 5),
    depth: lastRowZ + AUDITORIUM.screenDistance + 5,
    lastRowZ,
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
