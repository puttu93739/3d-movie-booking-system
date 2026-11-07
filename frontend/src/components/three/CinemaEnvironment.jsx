
export default function CinemaEnvironment({ layout }) {
  const { width, depth, rowCount } = layout;

  const lastRowZ = Math.max(0, rowCount - 1) * 1.55;
  const floorCenterZ = (lastRowZ - 4) / 2;

  return (
    <group>
      {/* =====================================
          1. AUDITORIUM LIGHTING
         ===================================== */}

      {/* General lighting */}
      <ambientLight
        intensity={2.5}
        color="#ffffff"
      />

      {/* Natural overhead lighting */}
      <hemisphereLight
        args={["#ffffff", "#64748b", 2]}
      />

      {/* Main white overhead light */}
      <directionalLight
        position={[0, 15, 10]}
        intensity={4}
        color="#ffffff"
      />

      {/* Light from the cinema screen */}
      <directionalLight
        position={[0, 8, -8]}
        intensity={3}
        color="#bfdbfe"
      />

      {/* Light over the seating area */}
      <pointLight
        position={[0, 7, 5]}
        intensity={120}
        distance={35}
        decay={2}
        color="#ffffff"
      />

      {/* Additional rear auditorium lighting */}
      <pointLight
        position={[0, 8, lastRowZ]}
        intensity={90}
        distance={30}
        decay={2}
        color="#93c5fd"
      />

      {/* =====================================
          2. AUDITORIUM FLOOR
         ===================================== */}

      <mesh
        position={[0, -0.25, floorCenterZ]}
        receiveShadow
      >
        <boxGeometry
          args={[width, 0.3, depth]}
        />

        <meshStandardMaterial
          color="#334155"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* =====================================
          3. CINEMA SCREEN
         ===================================== */}

      <mesh position={[0, 3.2, -4]}>
        <boxGeometry
          args={[width * 0.72, 4.2, 0.12]}
        />

        <meshStandardMaterial
          color="#f8fafc"
          emissive="#93c5fd"
          emissiveIntensity={0.4}
          roughness={0.7}
        />
      </mesh>

      {/* Screen border */}
      <mesh position={[0, 3.2, -4.1]}>
        <boxGeometry
          args={[width * 0.75, 4.45, 0.08]}
        />

        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>

      {/* Screen glow */}
      <pointLight
        position={[0, 4, -2.5]}
        color="#93c5fd"
        intensity={80}
        distance={25}
        decay={2}
      />

      {/* =====================================
          4. LEFT SIDE WALL
         ===================================== */}

      <mesh
        position={[-width / 2, 2.4, floorCenterZ]}
      >
        <boxGeometry
          args={[0.25, 5.3, depth]}
        />

        <meshStandardMaterial
          color="#263449"
          roughness={0.9}
        />
      </mesh>

      {/* =====================================
          5. RIGHT SIDE WALL
         ===================================== */}

      <mesh
        position={[width / 2, 2.4, floorCenterZ]}
      >
        <boxGeometry
          args={[0.25, 5.3, depth]}
        />

        <meshStandardMaterial
          color="#263449"
          roughness={0.9}
        />
      </mesh>

      {/* =====================================
          6. RAISED SEATING PLATFORMS
         ===================================== */}

      {Array.from(
        { length: rowCount },
        (_, index) => (
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

            <meshStandardMaterial
              color="#475569"
              roughness={0.85}
            />
          </mesh>
        )
      )}

      {/* =====================================
          7. BLUE AISLE LIGHTS
         ===================================== */}

      {/* Left aisle light */}
      <mesh
        position={[
          -width / 2 + 0.6,
          0.03,
          lastRowZ / 2,
        ]}
      >
        <boxGeometry
          args={[0.08, 0.04, lastRowZ + 2]}
        />

        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Right aisle light */}
      <mesh
        position={[
          width / 2 - 0.6,
          0.03,
          lastRowZ / 2,
        ]}
      >
        <boxGeometry
          args={[0.08, 0.04, lastRowZ + 2]}
        />

        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}
