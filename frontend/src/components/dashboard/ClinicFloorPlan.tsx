import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useClinicData } from "@/hooks/use-clinic-data";

const HolographicRoom = ({
  position,
  size,
  label,
  occupancy,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  label: string;
  occupancy: string;
  color: string;
}) => {
  return (
    <group position={position}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Walls - wireframe box */}
      <mesh position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Edge glow lines */}
      <lineSegments position={[0, size[1] / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color={color} transparent opacity={0.6} linewidth={1} />
      </lineSegments>

      {/* Label */}
      <Html position={[0, size[1] + 0.5, 0]} center distanceFactor={10}>
        <div className="glass-card-sm px-3 py-1.5 text-center pointer-events-none whitespace-nowrap" style={{ borderRadius: '0.75rem' }}>
          <p className="text-[10px] font-semibold text-foreground">{label}</p>
          <p className="text-[9px] font-mono text-primary font-bold">{occupancy}</p>
        </div>
      </Html>
    </group>
  );
};

const GridFloor = () => (
  <gridHelper args={[30, 30, "#cbd5e1", "#e2e8f0"]} position={[0, 0, 0]} />
);

const ClinicFloorPlan = () => {
  const { status } = useClinicData();
  const lobbyOccupancy = status ? Math.round((status.patient_count / 40) * 100) : 0;

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [12, 10, 12], fov: 50 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, 5, -10]} intensity={0.4} color="#2563eb" />

        <GridFloor />

        <HolographicRoom
          position={[-2, 0, -1]}
          size={[8, 3, 6]}
          label="QueueSense Lobby"
          occupancy={`${status?.patient_count ?? 0} Patients (${lobbyOccupancy}%)`}
          color="#2563eb"
        />

        <HolographicRoom
          position={[6, 0, 3]}
          size={[4, 2.5, 4]}
          label="MediTrack Pharmacy"
          occupancy="42% Occupied"
          color="#10b981"
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={8}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
};

export default ClinicFloorPlan;
