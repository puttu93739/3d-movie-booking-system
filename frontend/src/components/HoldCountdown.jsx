
import { useEffect, useState } from "react";

export function secondsRemaining(expiresAt) {
  return Math.max(
    0,
    Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / 1000
    )
  );
}

export default function HoldCountdown({
  expiresAt,
  onExpired,
}) {
  const [remaining, setRemaining] = useState(
    () => secondsRemaining(expiresAt)
  );

  useEffect(() => {
    let expiredNotified = false;

    function update() {
      const seconds = secondsRemaining(expiresAt);
      setRemaining(seconds);

      if (seconds === 0 && !expiredNotified) {
        expiredNotified = true;
        onExpired();
      }
    }

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="hold-countdown" role="timer">
      <span>Seats held for</span>
      <strong>
        {minutes}:{seconds}
      </strong>
    </div>
  );
}
