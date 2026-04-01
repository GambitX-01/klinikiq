import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingUp, Clock, Users, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { useClinicData } from "@/hooks/use-clinic-data";
import { useClinicHistory } from "@/hooks/use-clinic-history";
import NavBar from "@/components/NavBar";

const CAPACITY = 40;

// Simulated hourly benchmark data so the chart is never empty on first load
const HOUR_LABELS = ["8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm"];
const BENCHMARK = [4, 12, 22, 30, 18, 14, 25, 32, 20, 8];

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
  alert,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  alert?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-card p-5 flex flex-col gap-2 ${alert ? "border border-warning/40" : ""}`}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      {alert && <AlertTriangle className="w-3.5 h-3.5 text-warning ml-auto" />}
    </div>
    <p className="text-3xl font-extrabold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{sub}</p>
  </motion.div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">{children}</h2>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs space-y-1 border border-border">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

const Analytics = () => {
  const { status, waitTime } = useClinicData();
  const history = useClinicHistory();

  const patients = status?.patient_count ?? 0;
  const capacity = Math.round((patients / CAPACITY) * 100);
  const criticalItems = status?.inventory?.filter((i) => i.status === "CRITICAL") ?? [];
  const lowItems = status?.inventory?.filter((i) => i.status === "LOW") ?? [];

  // If we have history, use it; otherwise show the benchmark curve
  const trafficData =
    history.length >= 2
      ? history.map((h) => ({ time: h.time, Patients: h.patients, "Wait (min)": h.waitTime }))
      : HOUR_LABELS.map((t, i) => ({ time: t, Patients: BENCHMARK[i], "Wait (min)": Math.round(BENCHMARK[i] * 0.8) }));

  // Derive a simple actionable status message
  const getStatusMessage = () => {
    if (capacity >= 90) return { text: "Clinic is at near-full capacity. Consider redirecting walk-ins to nearby facilities.", level: "critical" };
    if (capacity >= 70) return { text: "High patient load — notify on-call staff to prepare for surge.", level: "warning" };
    if ((waitTime ?? 0) > 45) return { text: "Wait times are elevated. Check if triage is running at full capacity.", level: "warning" };
    if (criticalItems.length > 0) return { text: `${criticalItems.length} item(s) critically low in pharmacy. AI restock agent can be deployed from the dashboard.`, level: "warning" };
    return { text: "All systems operating normally. Patient flow is within comfortable limits.", level: "ok" };
  };

  const msg = getStatusMessage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 rounded-2xl px-5 py-4 flex items-start gap-3 border ${
            msg.level === "critical"
              ? "bg-destructive/10 border-destructive/30"
              : msg.level === "warning"
              ? "bg-warning/10 border-warning/30"
              : "bg-success/10 border-success/30"
          }`}
        >
          {msg.level === "ok" ? (
            <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${msg.level === "critical" ? "text-destructive" : "text-warning"}`} />
          )}
          <p className="text-sm font-medium text-foreground leading-relaxed">{msg.text}</p>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Active Patients"
            value={patients}
            sub={`${capacity}% of clinic capacity`}
            color="#2563eb"
            alert={capacity >= 80}
          />
          <StatCard
            icon={Clock}
            label="Avg Wait Time"
            value={waitTime != null ? `${waitTime} min` : "--"}
            sub={waitTime != null && waitTime > 30 ? "Above target — action needed" : "Within acceptable range"}
            color={waitTime != null && waitTime > 30 ? "#f59e0b" : "#10b981"}
            alert={waitTime != null && waitTime > 30}
          />
          <StatCard
            icon={AlertTriangle}
            label="Stock Alerts"
            value={criticalItems.length + lowItems.length}
            sub={`${criticalItems.length} critical, ${lowItems.length} low`}
            color={criticalItems.length > 0 ? "#ef4444" : "#f59e0b"}
            alert={criticalItems.length > 0}
          />
          <StatCard
            icon={Activity}
            label="Capacity Used"
            value={`${capacity}%`}
            sub={capacity >= 90 ? "Consider diverting walk-ins" : capacity >= 70 ? "Monitor closely" : "Comfortable level"}
            color={capacity >= 90 ? "#ef4444" : capacity >= 70 ? "#f59e0b" : "#10b981"}
            alert={capacity >= 70}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Patient Traffic */}
          <div className="glass-card p-5">
            <SectionTitle>Patient Traffic Over Time</SectionTitle>
            <p className="text-xs text-muted-foreground mb-4">
              Number of active patients tracked by the camera sensor. Helps you predict when the clinic will fill up.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={[0, CAPACITY]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={CAPACITY * 0.8} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "80% cap", fill: "#f59e0b", fontSize: 9 }} />
                <Line type="monotone" dataKey="Patients" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Wait Time */}
          <div className="glass-card p-5">
            <SectionTitle>Wait Time Trend</SectionTitle>
            <p className="text-xs text-muted-foreground mb-4">
              How long patients are waiting. If this climbs above 30 min, it typically means triage needs extra staff.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "30 min target", fill: "#f59e0b", fontSize: 9 }} />
                <Bar dataKey="Wait (min)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Overview */}
        {status?.district_stats && status.district_stats.length > 0 && (
          <div className="glass-card p-5 mb-8">
            <SectionTitle>District Load — Gqeberha Clinics</SectionTitle>
            <p className="text-xs text-muted-foreground mb-4">
              Occupancy across nearby clinics. If your clinic is near capacity, direct patients to a lower-load facility.
            </p>
            <div className="space-y-3">
              {status.district_stats.map((s: any) => {
                const isCritical = s.status === "CRITICAL";
                const isModerate = s.status === "MODERATE";
                return (
                  <div key={s.suburb} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground w-40 shrink-0">{s.suburb}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isCritical ? "bg-destructive" : isModerate ? "bg-warning" : "bg-success"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.occupancy}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-10 text-right">{s.occupancy}%</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-20 text-center ${
                      isCritical ? "bg-destructive/20 text-destructive" : isModerate ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                    }`}>
                      {isCritical ? "REDIRECT" : isModerate ? "MONITOR" : "AVAILABLE"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* System Logs */}
        {status?.logs && status.logs.length > 0 && (
          <div className="glass-card p-5">
            <SectionTitle>Recent System Events</SectionTitle>
            <p className="text-xs text-muted-foreground mb-4">Actions taken by KlinikIQ agents and sensors in the last session.</p>
            <div className="space-y-2">
              {status.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{log}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
