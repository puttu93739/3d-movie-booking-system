
export default function CinemaEnvironment({ layout }) {
  const { width, depth, rowCount } = layout;

  const lastRowZ = Math.max(
    0,
    rowCount - 1
  ) * 1.55;

  const floorCenterZ = (lastRowZ - 4) / 2;

  return (
    <group>
      {/* Auditorium floor */}
      <mesh
        position={[0, -0.25, floorCenterZ]}
        receiveShadow
      >
        <boxGeometry args={[width, 0.3, depth]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* Cinema screen at the front */}
      <mesh position={[0, 3.2, -4]}>
        <boxGeometry args={[width * 0.72, 4.2, 0.12]} />
        <meshStandardMaterial
          color="#e2e8f0"
          emissive="#64748b"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Screen border */}
      <mesh position={[0, 3.2, -4.1]}>
        <boxGeometry args={[width * 0.75, 4.45, 0.08]} />
        <meshStandardMaterial
          color="#fbbf24"
          wireframe
        />
      </mesh>

      {/* Left side wall */}
      <mesh
        position={[-width / 2, 2.4, floorCenterZ]}
      >
        <boxGeometry args={[0.25, 5.3, depth]} />
        <meshStandardMaterial
          color="#1e293b"
          side={2}
        />
      </mesh>

      {/* Right side wall */}
      <mesh
        position={[width / 2, 2.4, floorCenterZ]}
      >
        <boxGeometry args={[0.25, 5.3, depth]} />
        <meshStandardMaterial
          color="#1e293b"
          side={2}
        />
      </mesh>

      {/* Raised platform under each row */}
      {Array.from({ length: rowCount }, (_, index) => (
        <mesh
          key={index}
          position={[
            0,
            -0.05 + index * 0.22,
            index * 1.55,
          ]}
          receiveShadow
        >
          <boxGeometry
            args={[width - 1, 0.12, 1.3]}
          />
          <meshStandardMaterial color="#263244" />
        </mesh>
      ))}
    </group>
  );
}
