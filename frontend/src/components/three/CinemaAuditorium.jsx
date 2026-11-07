
import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

import CinemaSeat from "./CinemaSeat";
import CinemaEnvironment from "./CinemaEnvironment";
import AuditoriumControls from "./AuditoriumControls";

import { getAuditoriumLayout } from "../../utils/auditorium";

export default function CinemaAuditorium({
  seats,
  selectedSeatIds,
  onToggleSeat,
}) {
  const layout = useMemo(
    () => getAuditoriumLayout(seats),
    [seats]
  );

  if (layout.seats.length === 0) {
    return (
      <div className="empty-showtimes">
        No seats configured for this auditorium.
      </div>
    );
  }

  const centerZ =
    Math.max(0, layout.rowCount - 1) * 1.55 / 2;

  const cameraDistance = Math.max(
    18,
    layout.width * 1.15,
    layout.depth * 1.25
  );

  const target = [0, 1, centerZ];

  return (
    <div className="cinema-3d-wrapper">
      <Canvas
        shadows
        camera={{
          position: [
            0,
            cameraDistance * 0.65,
            centerZ + cameraDistance,
          ],
          fov: 45,
          near: 0.1,
          far: 300,
        }}
        gl={{ antialias: true }}
        fallback={
          <p>
            WebGL is unavailable in this browser.
            Please use the 2D seat view.
          </p>
        }
      >
        <color attach="background" args={["#090b12"]} />

        <ambientLight intensity={1.2} />

        <directionalLight
          position={[5, 12, 8]}
          intensity={2.0}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <pointLight
          position={[0, 6, -3]}
          intensity={35}
          color="#fbbf24"
          distance={22}
        />

        <Environment preset="city" />

        <CinemaEnvironment layout={layout} />

        {layout.seats.map((seat) => (
          <CinemaSeat
            key={seat.id}
            seat={seat}
            selected={selectedSeatIds.includes(seat.id)}
            onToggle={onToggleSeat}
          />
        ))}

        <AuditoriumControls target={target} />
      </Canvas>

      <div className="cinema-3d-hint">
        Drag to rotate • Scroll to zoom • Click seats to select
      </div>
    </div>
  );
}
