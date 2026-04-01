import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, Zap, AlertTriangle, Bot, Loader2, Cpu, Layers } from "lucide-react";
import { useClinicData } from "@/hooks/use-clinic-data";
import { ClinicConfig } from "@/lib/clinics";

const Divider = () => <div className="w-px h-8 bg-border/60 shrink-0" />;

const Stat = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) => (
  <div className="flex items-center gap-3 px-4 shrink-0">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color ?? "#2563eb"}18` }}>
      <Icon className="w-3.5 h-3.5" style={{ color: color ?? "#2563eb" }} />
    </div>
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-0.5">{label}</p>
      <p className="text-sm font-bold text-foreground leading-none">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{sub}</p>}
    </div>
  </div>
);

const CapacityBar = ({ count, capacity }: { count: number; capacity: number }) => {
  const pct = Math.min(Math.round((count / capacity) * 100), 100);
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#2563eb";
  return (
    <div className="flex items-center gap-3 px-4 shrink-0">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Users className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="w-32">
        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-1">
          <span className="uppercase tracking-wider">Patients</span>
          <span className="font-mono text-foreground">{count} / {capacity}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% capacity</p>
      </div>
    </div>
  );
};

const PharmacyAlert = ({ inventory, onRestock, isRestocking }: { inventory?: any[]; onRestock: (id: string) => void; isRestocking: boolean }) => {
  const critical = inventory?.find((i) => i.status === "CRITICAL");
  if (!critical) return null;
  return (
    <>
      <Divider />
      <div className="flex items-center gap-3 px-4 shrink-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-warning/15 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-warning rounded-full animate-ping" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-warning uppercase tracking-wider leading-none mb-0.5">Stock Alert</p>
          <p className="text-sm font-bold text-foreground leading-none">{critical.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{critical.level} units left</p>
        </div>
        <button
          onClick={() => onRestock(critical.id)}
          disabled={isRestocking}
          className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
        >
          {isRestocking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
          AI Restock
        </button>
      </div>
    </>
  );
};

const TickerFeed = ({ logs }: { logs?: string[] }) => {
  if (!logs?.length) return null;
  return (
    <>
      <Divider />
      <div className="flex items-center gap-2 px-4 shrink-0 max-w-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
        <p className="text-[10px] text-muted-foreground truncate">{logs[0]}</p>
      </div>
    </>
  );
};

const BentoSidebar = ({ clinic }: { clinic: ClinicConfig }) => {
  const { status: liveStatus, waitTime: liveWaitTime, triggerRestock, isLoading, isError } = useClinicData();

  const status = clinic.live ? liveStatus : ({ ...clinic.staticData, logs: clinic.staticData?.logs } as any);
  const waitTime = clinic.live ? liveWaitTime : clinic.staticData?.waitTime;

  if (clinic.live && isLoading) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-30 flex items-center justify-center h-16">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (clinic.live && isError) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-30 glass-card rounded-[1.5rem] px-6 py-3 flex items-center justify-center">
        <p className="text-xs text-destructive font-medium">Backend offline — cannot sync clinic data.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
      className="fixed bottom-4 left-4 right-4 z-30"
    >
      <div className="glass-card rounded-[1.5rem] px-2 py-3 flex items-center overflow-x-auto scrollbar-hide">

        {/* Patients + capacity */}
        <CapacityBar count={status?.patient_count ?? 0} capacity={clinic.capacity} />

        <Divider />

        {/* Wait time */}
        <Stat
          icon={Clock}
          label="Wait Time"
          value={waitTime != null ? `${waitTime} min` : "--"}
          sub={waitTime != null && waitTime > 30 ? "Above target" : "On target"}
          color={waitTime != null && waitTime > 30 ? "#f59e0b" : "#10b981"}
        />

        <Divider />

        {/* Node sync */}
        <Stat icon={Zap} label="Node Sync" value="8.4 ms" sub="Edge latency" color="#10b981" />

        <Divider />

        {/* Edge info */}
        <Stat icon={Cpu} label="Protocol" value="MQTT v5" sub="SA-NW-01" color="#6366f1" />

        <Divider />

        {/* Zone key */}
        <div className="flex items-center gap-3 px-4 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary/30 border border-primary/50 shrink-0" />
              <span className="text-[10px] text-foreground font-medium">Lobby</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-success/30 border border-success/50 shrink-0" />
              <span className="text-[10px] text-foreground font-medium">Pharmacy</span>
            </div>
          </div>
        </div>

        {/* Pharmacy alert (conditional) */}
        <PharmacyAlert
          inventory={status?.inventory}
          onRestock={(id) => triggerRestock.mutate(id)}
          isRestocking={triggerRestock.isPending}
        />

        {/* Live log ticker */}
        <TickerFeed logs={status?.logs} />

        {/* Uptime — pushed to far right */}
        <div className="ml-auto pl-4 shrink-0 flex items-center gap-2 pr-2">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </div>
          <span className="text-[10px] font-semibold text-success">99.97% uptime</span>
        </div>
      </div>
    </motion.div>
  );
};

export default BentoSidebar;
