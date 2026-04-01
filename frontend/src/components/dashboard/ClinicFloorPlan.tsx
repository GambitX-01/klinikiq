import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Float, Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useClinicData } from "@/hooks/use-clinic-data";
import { ClinicConfig, RoomDef } from "@/lib/clinics";

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
      {/* Floor fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial color={color} transparent opacity={opacity * 2.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Walls */}
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
        <lineBasicMaterial color={color} transparent opacity={0.85} linewidth={1} />
      </lineSegments>

      {/* Top cap glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, size[1], 0]}>
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial color={color} transparent opacity={opacity * 1.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Label */}
      <Html position={[0, size[1] + 0.5, 0]} center distanceFactor={12}>
        <div
          className="pointer-events-none text-center"
          style={{
            background: "rgba(10, 18, 36, 0.75)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${color}55`,
            borderRadius: "0.6rem",
            padding: "4px 10px",
            boxShadow: `0 0 12px ${color}33`,
          }}
        >
          <p className="text-[9px] font-bold text-white/80 leading-none tracking-wide whitespace-nowrap">{label}</p>
          <p className="text-[8px] font-mono mt-0.5 whitespace-nowrap" style={{ color }}>{occupancy}</p>
        </div>
      </Html>
    </group>
  );
};

const SceneFooterLabel = ({ label }: { label: string }) => (
  <group position={[0, -0.5, 12]}>
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4}>
      <Html center>
        <div className="flex flex-col items-center gap-1.5 select-none pointer-events-none">
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-blue-300/50">
            {label}
          </span>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
        </div>
      </Html>
    </Float>
  </group>
);

const SceneGrid = () => (
  <group>
    <gridHelper args={[60, 30, "#0f172a", "#0f172a"]} position={[0, 0, 0]} />
    <gridHelper args={[40, 80, "#1e293b28", "#1e293b"]} position={[0, 0.01, 0]} />
  </group>
);

const GroundGlow = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
    <planeGeometry args={[60, 60]} />
    <meshStandardMaterial color="#0a1628" transparent opacity={0.6} side={THREE.DoubleSide} />
  </mesh>
);

const ClinicFloorPlan = ({ clinic }: { clinic: ClinicConfig }) => {
  const { status } = useClinicData();

  const liveCount = status?.patient_count ?? 0;
  const lobbyCount = clinic.live ? liveCount : (clinic.staticData?.patient_count ?? 0);
  const lobbyOccupancy = Math.round((lobbyCount / clinic.capacity) * 100);

  return (
    <div className="absolute inset-0 z-0 bg-background">
      <Canvas
        camera={{ position: [16, 13, 16], fov: 42 }}
        style={{ background: "transparent" }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        {/* Atmosphere */}
        <fog attach="fog" args={["#060d1a", 28, 55]} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <hemisphereLight args={["#1e3a5f", "#060d1a", 0.6]} />
        <pointLight position={[10, 18, 10]} intensity={1.2} color="#ffffff" castShadow />
        <pointLight position={[-10, 10, -10]} intensity={0.8} color="#2563eb" />
        <pointLight position={[8, 5, -8]} intensity={0.5} color="#6366f1" />
        <pointLight position={[-8, 3, 8]} intensity={0.4} color="#10b981" />
        <spotLight position={[0, 22, 0]} angle={0.35} penumbra={1} intensity={0.6} color="#93c5fd" castShadow />

        <GroundGlow />
        <SceneGrid />

        <Sparkles count={60} scale={[30, 6, 30]} size={0.6} speed={0.25} opacity={0.35} color="#60a5fa" />
        <Stars radius={80} depth={40} count={800} factor={2} saturation={0.3} fade speed={0.5} />

        <SceneFooterLabel label={clinic.footerLabel} />

        {clinic.rooms.map((room, i) => (
          <HolographicRoom
            key={i}
            position={room.position}
            size={room.size}
            label={room.label}
            occupancy={
              room.isLobby
                ? `${lobbyCount} Patients (${lobbyOccupancy}%)`
                : room.occupancy
            }
            color={room.color}
            opacity={room.opacity}
          />
        ))}

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
