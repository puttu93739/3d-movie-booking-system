
import { useState } from "react";
import { RoundedBox, Text } from "@react-three/drei";

export default function CinemaSeat({
  seat,
  selected,
  onToggle,
}) {
  const [hovered, setHovered] = useState(false);

  const color = selected
    ? "#fbbf24"
    : hovered
      ? "#38bdf8"
      : "#8b2337";

  return (
    <group
      position={seat.position}
      rotation={[0, seat.rotationY ?? 0, 0]}
    onClick={(event) => {
      event.stopPropagation();

      if (!unavailable) {
        onToggle(seat.id);
      }
    }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Metal pedestal */}
      <mesh position={[0, -0.36, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.46, 12]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Outer seat shell */}
      <RoundedBox
        args={[0.94, 0.24, 0.9]}
        radius={0.08}
        position={[0, -0.06, 0]}
        castShadow
      >
        <meshStandardMaterial color="#202633" />
      </RoundedBox>

      {/* Upholstered cushion */}
      <RoundedBox
        args={[0.79, 0.2, 0.76]}
        radius={0.09}
        position={[0, 0.09, -0.02]}
        castShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.85}
          emissive={selected ? "#b45309" : "#000000"}
          emissiveIntensity={selected ? 0.22 : 0}
        />
      </RoundedBox>

      {/* Recliner backrest */}
      <group
        position={[0, 0.47, 0.36]}
        rotation={[-0.13, 0, 0]}
      >
        <RoundedBox
          args={[0.86, 1.02, 0.22]}
          radius={0.12}
          castShadow
        >
          <meshStandardMaterial
            color={color}
            roughness={0.8}
          />
        </RoundedBox>

        {/* Headrest */}
        <RoundedBox
          args={[0.68, 0.24, 0.26]}
          radius={0.08}
          position={[0, 0.36, -0.02]}
          castShadow
        >
          <meshStandardMaterial
            color={color}
            roughness={0.75}
          />
        </RoundedBox>
      </group>

      {/* Armrests */}
      {[-0.48, 0.48].map((x) => (
        <RoundedBox
          key={x}
          args={[0.13, 0.27, 0.78]}
          radius={0.045}
          position={[x, 0.16, 0.02]}
          castShadow
        >
          <meshStandardMaterial
            color="#303847"
            metalness={0.25}
          />
        </RoundedBox>
      ))}

      {/* Seat number */}
      <Text
        position={[0, 0.205, -0.13]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.18}
        color={selected ? "#111827" : "#ffffff"}
        anchorX="center"
        anchorY="middle"
      >
        {String(seat.seat_number)}
      </Text>

      {/* Selected-seat indicator */}
      {selected && (
        <mesh position={[0, -0.48, 0]}>
          <cylinderGeometry args={[0.56, 0.56, 0.025, 32]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
