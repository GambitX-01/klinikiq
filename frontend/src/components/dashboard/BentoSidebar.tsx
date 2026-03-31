import { motion } from "framer-motion";
import { Users, Clock, Zap, AlertTriangle, Bot, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const FEED_EVENTS = [
  "[EDGE] Patient Entry Detected — Gate A",
  "[SYNC] MediTrack inventory refresh OK",
  "[QUEUE] Avg wait updated: 48 min",
  "[EDGE] Vitals upload — Bed 12",
  "[AI] Prescription validation passed",
  "[SYNC] Node heartbeat — 8.4ms",
  "[ALERT] Insulin stock below threshold",
  "[EDGE] Discharge processed — ID #4091",
  "[QUEUE] Priority override — Triage 2",
  "[AI] Anomaly scan — no issues found",
];

const PatientTrafficCard = () => (
  <motion.div variants={item} className="glass-card glass-hover p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-4.5 h-4.5 text-primary" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient Traffic</span>
      </div>
      <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">
        <TrendingUp className="w-3 h-3" /> +4.2%
      </span>
    </div>
    <p className="text-4xl font-extrabold text-foreground tracking-tight">24</p>
    <p className="text-sm text-muted-foreground mt-1">Active Patients</p>
    <div className="mt-4">
      <div className="flex justify-between text-[10px] font-medium text-muted-foreground mb-1.5">
        <span>Clinic Capacity</span>
        <span>60%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: "60%" }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
        />
      </div>
    </div>
  </motion.div>
);

const SmallStatCard = ({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  unit: string;
  color: string;
}) => (
  <motion.div variants={item} className="glass-card glass-hover p-5 flex flex-col items-center justify-center text-center">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2`} style={{ backgroundColor: `${color}18` }}>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground font-medium">{unit}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
  </motion.div>
);

const PharmacyAlertCard = () => (
  <motion.div variants={item} className="glass-card glass-hover p-5 border-warning/30">
    <div className="flex items-center gap-2 mb-3">
      <div className="relative">
        <AlertTriangle className="w-4.5 h-4.5 text-warning" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-warning rounded-full animate-ping" />
      </div>
      <span className="text-xs font-semibold text-warning uppercase tracking-wider">Pharmacy Alert</span>
    </div>
    <p className="text-sm font-semibold text-foreground">Low Stock: <span className="text-warning">Insulin</span></p>
    <p className="text-xs text-muted-foreground mt-1">Below threshold — 12 units remaining</p>
    <button className="mt-3 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
      <Bot className="w-3.5 h-3.5" />
      RESTOCK AGENTIC AI
    </button>
  </motion.div>
);

const SystemFeed = () => {
  const [events, setEvents] = useState(FEED_EVENTS.slice(0, 5));

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => {
        const next = FEED_EVENTS[Math.floor(Math.random() * FEED_EVENTS.length)];
        const timestamp = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        return [`${timestamp} ${next}`, ...prev.slice(0, 6)];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div variants={item} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Feed</span>
      </div>
      <div className="terminal-feed space-y-1.5 max-h-36 overflow-hidden text-muted-foreground">
        {events.map((e, i) => (
          <motion.p
            key={`${e}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1 - i * 0.12, x: 0 }}
            transition={{ duration: 0.3 }}
            className="truncate"
          >
            {e}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
};

const BentoSidebar = () => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="fixed top-24 left-4 bottom-4 w-80 z-30 flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-hide"
    >
      <PatientTrafficCard />
      <div className="grid grid-cols-2 gap-3">
        <SmallStatCard icon={Clock} label="Wait Time" value="48" unit="min" color="#2563eb" />
        <SmallStatCard icon={Zap} label="Node Sync" value="8.4" unit="ms latency" color="#10b981" />
      </div>
      <PharmacyAlertCard />
      <SystemFeed />
    </motion.div>
  );
};

export default BentoSidebar;
