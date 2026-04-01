export interface RoomDef {
  position: [number, number, number];
  size: [number, number, number];
  label: string;
  occupancy: string;
  color: string;
  opacity?: number;
  isLobby?: boolean; // room that gets live patient count injected
}

export interface ClinicConfig {
  id: string;
  name: string;
  subtitle: string;
  live: boolean;
  capacity: number;
  footerLabel: string;
  rooms: RoomDef[];
  staticData?: {
    patient_count: number;
    waitTime: number;
    inventory: Array<{ id: string; name: string; level: number; status: string }>;
    logs: string[];
  };
}

export const CLINICS: ClinicConfig[] = [
  {
    id: "central",
    name: "Gqeberha Central",
    subtitle: "Health Node · Live",
    live: true,
    capacity: 40,
    footerLabel: "Central Health Node",
    rooms: [
      {
        position: [-3, 0, 2],
        size: [10, 3, 8],
        label: "QueueSense Lobby [GATE A]",
        occupancy: "", // injected at runtime
        color: "#2563eb",
        isLobby: true,
      },
      {
        position: [4.5, 0, 0],
        size: [4, 2.5, 4],
        label: "Triage Unit",
        occupancy: "3 Patients",
        color: "#f59e0b",
      },
      {
        position: [4.5, 0, 5],
        size: [4, 2.5, 2],
        label: "Consulting Rm 1",
        occupancy: "In Use",
        color: "#6366f1",
      },
      {
        position: [4.5, 0, 7.5],
        size: [4, 2.5, 2],
        label: "Consulting Rm 2",
        occupancy: "Available",
        color: "#10b981",
      },
      {
        position: [-3, 0, -5],
        size: [6, 2.5, 5],
        label: "MediTrack Dispensary",
        occupancy: "42% Stocked",
        color: "#10b981",
      },
      {
        position: [-9.5, 0, -2],
        size: [3, 3, 10],
        label: "Emergency Wing",
        occupancy: "Active",
        color: "#ef4444",
        opacity: 0.12,
      },
    ],
  },
  {
    id: "motherwell",
    name: "Motherwell Clinic",
    subtitle: "Health Node · Demo",
    live: false,
    capacity: 35,
    footerLabel: "Motherwell Health Node",
    rooms: [
      // Wide front waiting area — community clinic style
      {
        position: [0, 0, 6],
        size: [12, 2.5, 5],
        label: "Waiting Area [GATE B]",
        occupancy: "", // injected
        color: "#2563eb",
        isLobby: true,
      },
      // Central nurse station
      {
        position: [0, 0, 1],
        size: [4, 2, 3],
        label: "Nurse Station",
        occupancy: "Staffed",
        color: "#f59e0b",
      },
      // Left consulting rooms
      {
        position: [-5.5, 0, -1],
        size: [3.5, 2.5, 4],
        label: "Consulting A",
        occupancy: "In Use",
        color: "#6366f1",
      },
      {
        position: [-5.5, 0, -6],
        size: [3.5, 2.5, 4],
        label: "Consulting B",
        occupancy: "Available",
        color: "#10b981",
      },
      // Right consulting rooms
      {
        position: [5.5, 0, -1],
        size: [3.5, 2.5, 4],
        label: "Consulting C",
        occupancy: "In Use",
        color: "#6366f1",
      },
      {
        position: [5.5, 0, -6],
        size: [3.5, 2.5, 4],
        label: "Maternal Health",
        occupancy: "2 Patients",
        color: "#ec4899",
      },
      // Back dispensary — centered
      {
        position: [0, 0, -7],
        size: [5, 2.5, 4],
        label: "MediTrack Dispensary",
        occupancy: "61% Stocked",
        color: "#10b981",
      },
    ],
    staticData: {
      patient_count: 28,
      waitTime: 22,
      inventory: [
        { id: "mw-1", name: "Bandages", level: 4, status: "CRITICAL" },
        { id: "mw-2", name: "Paracetamol", level: 18, status: "LOW" },
        { id: "mw-3", name: "Gloves (Box)", level: 52, status: "OK" },
        { id: "mw-4", name: "Antiseptic", level: 67, status: "OK" },
      ],
      logs: [
        "Agent: Bandages restock initiated via WhatsApp",
        "QueueSense: 3 new patients registered at Gate B",
        "MediTrack: Full stock scan complete",
        "AI: Wait time updated — 22 min",
      ],
    },
  },
];
