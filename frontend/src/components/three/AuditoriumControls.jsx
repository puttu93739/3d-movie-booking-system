
import { OrbitControls } from "@react-three/drei";

export default function AuditoriumControls({
  target,
  controlsRef,
  maxDistance = 60,
}) {
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={target}
      enableRotate
      enableZoom
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      minDistance={5}
      maxDistance={maxDistance}
      minPolarAngle={0.18}
      maxPolarAngle={Math.PI / 2.12}
      rotateSpeed={0.65}
      zoomSpeed={0.85}
    />
  );
}
