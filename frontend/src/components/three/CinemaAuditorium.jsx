
import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";

import CinemaSeat from "./CinemaSeat";
import CinemaEnvironment from "./CinemaEnvironment";
import AuditoriumControls from "./AuditoriumControls";

import {
  AUDITORIUM,
  getAuditoriumLayout,
} from "../../utils/auditorium";

export default function CinemaAuditorium({
  seats,
  selectedSeatIds,
  onToggleSeat,
}) {
  const controlsRef = useRef(null);

  const layout = useMemo(
    () => getAuditoriumLayout(seats),
    [seats]
  );

  const selectedIds = useMemo(
    () => new Set(selectedSeatIds),
    [selectedSeatIds]
  );

  if (layout.seats.length === 0) {
    return (
      <div className="empty-showtimes">
        No seats are configured for this auditorium.
      </div>
    );
  }

  const centerZ = layout.lastRowZ / 2;

  // Dynamically scale the camera for different screen sizes.
  const distance = Math.max(
    19,
    layout.width * 1.3,
    layout.depth * 1.1
  );

  const initialCameraPosition = [
    distance * 0.2,
    Math.max(9, distance * 0.65),
    centerZ + distance,
  ];

  const target = [
    0,
    1.5 + layout.rowCount * AUDITORIUM.rowRise * 0.2,
    centerZ - 0.5,
  ];

  function resetCamera() {
    const controls = controlsRef.current;

    if (!controls) return;

    controls.object.position.set(
      ...initialCameraPosition
    );

    controls.target.set(...target);
    controls.update();
  }

  return (
    <section className="imax-viewer">
      <div className="imax-toolbar">
        <div className="imax-toolbar-title">
          <span className="imax-status-dot" />
          <span>IMAX-STYLE 3D VIEW</span>
        </div>

        <button
          type="button"
          className="imax-reset-button"
          onClick={resetCamera}
        >
          Reset camera
        </button>
      </div>

      <div className="imax-canvas-container">
        <Canvas
          shadows={false}
          dpr={[1, 1.75]}
          camera={{
            position: initialCameraPosition,
            fov: 48,
            near: 0.1,
            far: 350,
          }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
          }}
          fallback={
            <p className="imax-fallback">
              WebGL is unavailable. Please switch to
              the 2D seat map.
            </p>
          }
        >
          <color
            attach="background"
            args={["#080c16"]}
          />

          <fog
            attach="fog"
            args={["#080c16", 35, 95]}
          />

            {/* Base lighting for the entire auditorium */}
            <ambientLight intensity={2.5} color="#ffffff" />

            {/* Light from above */}
            <hemisphereLight
              args={["#ffffff", "#64748b", 2.0]}
            />

            {/* Main overhead light */}
            <directionalLight
              position={[0, 15, 10]}
              intensity={4}
              color="#ffffff"
            />

            {/* Front lighting */}
            <directionalLight
              position={[0, 8, -8]}
              intensity={3}
              color="#bfdbfe"
            />

            {/* Additional seat lighting */}
            <pointLight
              position={[0, 7, 5]}
              intensity={120}
              distance={35}
              decay={2}
              color="#ffffff"
            />


          <CinemaEnvironment layout={layout} />

          {layout.seats.map((seat) => (
            <CinemaSeat
              key={seat.id}
              seat={seat}
              selected={selectedIds.has(seat.id)}
              onToggle={onToggleSeat}
            />
          ))}

          <AuditoriumControls
            controlsRef={controlsRef}
            target={target}
            maxDistance={Math.max(60, distance * 2)}
          />
        </Canvas>
      </div>

      <div className="imax-viewer-footer">
        <div className="imax-legend">
          <span>
            <i className="imax-legend-dot available" />
            Available
          </span>

          <span>
            <i className="imax-legend-dot selected" />
            Selected
          </span>
        </div>

        <p>
          Drag to rotate • Scroll to zoom • Click to select
        </p>
      </div>
    </section>
  );
}
