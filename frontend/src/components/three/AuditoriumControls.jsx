
import { OrbitControls } from "@react-three/drei";

export default function AuditoriumControls({ target }) {
  return (
    <OrbitControls
      makeDefault
      target={target}
      enablePan={false}
      enableZoom
      enableRotate
      minDistance={5}
      maxDistance={45}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2.05}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
