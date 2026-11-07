
import { useState } from "react";
import { Text } from "@react-three/drei";

export default function CinemaSeat({
  seat,
  selected,
  onToggle,
}) {
  const [hovered, setHovered] = useState(false);

  const color = selected
    ? "#fbbf24"
    : hovered
      ? "#34d399"
      : "#0f766e";

  return (
    <group
      position={seat.position}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(seat.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Seat cushion */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.82, 0.18, 0.78]} />
        <meshStandardMaterial
          color={color}
          roughness={0.65}
        />
      </mesh>

      {/* Backrest */}
      <mesh position={[0, 0.43, 0.34]}>
        <boxGeometry args={[0.82, 0.88, 0.16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.65}
        />
      </mesh>

      {/* Left armrest */}
      <mesh position={[-0.45, 0.15, 0]}>
        <boxGeometry args={[0.12, 0.24, 0.78]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Right armrest */}
      <mesh position={[0.45, 0.15, 0]}>
        <boxGeometry args={[0.12, 0.24, 0.78]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Seat label */}
      <Text
        position={[0, 0.14, -0.05]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color={selected ? "#111827" : "#ffffff"}
        anchorX="center"
        anchorY="middle"
      >
        {seat.seat_number}
      </Text>
    </group>
  );
}
