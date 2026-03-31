import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Float, Text } from "@react-three/drei";
import * as THREE from "three";
import { useClinicData } from "@/hooks/use-clinic-data";

const HolographicRoom = ({
  position,
  size,
  label,
  occupancy,
  color,
  opacity = 0.08,
}: {
  position: [number, number, number];
  size: [number, number, number];
  label: string;
  occupancy: string;
  color: string;
  opacity?: number;
}) => {
  return (
    <group position={position}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial color={color} transparent opacity={opacity * 2} side={THREE.DoubleSide} />
      </mesh>

      {/* Walls - semi-transparent box */}
      <mesh position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Edge glow lines */}
      <lineSegments position={[0, size[1] / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color={color} transparent opacity={0.5} linewidth={1} />
      </lineSegments>

      {/* Label */}
      <Html position={[0, size[1] + 0.4, 0]} center distanceFactor={12}>
        <div className="glass-card-sm px-2 py-1 text-center pointer-events-none border-none bg-white/10 backdrop-blur-md" style={{ borderRadius: '0.5rem' }}>
          <p className="text-[9px] font-bold text-foreground/80 leading-none">{label}</p>
          <p className="text-[8px] font-mono text-primary font-bold mt-0.5">{occupancy}</p>
        </div>
      </Html>
    </group>
  );
};

const DistrictLabel = () => (
  <group position={[0, -0.5, 12]}>
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <Html center>
        <div className="flex flex-col items-center gap-1 opacity-60">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground">Gqeberha District Node</span>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      </Html>
    </Float>
  </group>
);

const GridFloor = () => (
  <gridHelper args={[40, 40, "#1e293b", "#0f172a"]} position={[0, 0, 0]} />
);

const ClinicFloorPlan = () => {
  const { status } = useClinicData();
  const lobbyCount = status?.patient_count ?? 0;
  const lobbyOccupancy = Math.round((lobbyCount / 40) * 100);

  return (
    <div className="absolute inset-0 z-0 bg-background">
      <Canvas
        camera={{ position: [15, 12, 15], fov: 45 }}
        style={{ background: "transparent" }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 15, 10]} intensity={1} castShadow />
        <pointLight position={[-10, 8, -10]} intensity={0.5} color="#2563eb" />
        <spotLight position={[0, 20, 0]} angle={0.3} penumbra={1} intensity={0.5} />

        <GridFloor />
        <DistrictLabel />

        {/* --- MAIN LOBBY & RECEPTION --- */}
        <HolographicRoom
          position={[-3, 0, 2]}
          size={[10, 3, 8]}
          label="QueueSense Lobby [GATE A]"
          occupancy={`${lobbyCount} Patients (${lobbyOccupancy}%)`}
          color="#2563eb"
        />

        {/* --- TRIAGE AREA --- */}
        <HolographicRoom
          position={[4.5, 0, 0]}
          size={[4, 2.5, 4]}
          label="Triage Unit"
          occupancy="3 Patients"
          color="#f59e0b"
        />

        {/* --- CONSULTING WING --- */}
        <group position={[4.5, 0, 5]}>
          <HolographicRoom position={[0, 0, 0]} size={[4, 2.5, 2]} label="Consulting Rm 1" occupancy="In Use" color="#6366f1" />
          <HolographicRoom position={[0, 0, 2.5]} size={[4, 2.5, 2]} label="Consulting Rm 2" occupancy="Available" color="#10b981" />
        </group>

        {/* --- PHARMACY --- */}
        <HolographicRoom
          position={[-3, 0, -5]}
          size={[6, 2.5, 5]}
          label="MediTrack Dispensary"
          occupancy="42% Stocked"
          color="#10b981"
        />

        {/* --- EMERGENCY WING --- */}
        <HolographicRoom
          position={[-9.5, 0, -2]}
          size={[3, 3, 10]}
          label="Emergency Wing"
          occupancy="Active"
          color="#ef4444"
          opacity={0.12}
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={10}
          maxDistance={35}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
};

export default ClinicFloorPlan;
