import { motion } from "framer-motion";
import { Package, AlertTriangle, CheckCircle, Bot, Loader2, TrendingDown } from "lucide-react";
import { useClinicData } from "@/hooks/use-clinic-data";
import NavBar from "@/components/NavBar";

const STATUS_CONFIG = {
  CRITICAL: { label: "Critical — Act Now", color: "text-destructive", bg: "bg-destructive/15 border-destructive/30", bar: "bg-destructive" },
  LOW: { label: "Low — Monitor", color: "text-warning", bg: "bg-warning/15 border-warning/30", bar: "bg-warning" },
  OK: { label: "Sufficient", color: "text-success", bg: "bg-success/15 border-success/30", bar: "bg-success" },
};

const getDaysRemaining = (level: number, status: string) => {
  // Rough heuristic based on status level
  if (status === "CRITICAL") return `~${Math.max(1, Math.floor(level / 3))} day(s) left`;
  if (status === "LOW") return `~${Math.floor(level / 3)}-${Math.floor(level / 2)} days left`;
  return "Well stocked";
};

const Inventory = () => {
  const { status, triggerRestock } = useClinicData();
  const inventory = status?.inventory ?? [];

  const critical = inventory.filter((i) => i.status === "CRITICAL");
  const low = inventory.filter((i) => i.status === "LOW");
  const ok = inventory.filter((i) => i.status === "OK");

  const sorted = [...critical, ...low, ...ok];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="pt-24 pb-12 px-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Pharmacy & Supply Stock</h1>
          <p className="text-sm text-muted-foreground">
            Live inventory levels from your MediTrack sensor. Items marked <span className="text-destructive font-semibold">Critical</span> need immediate attention — use the AI agent to trigger a restock request automatically.
          </p>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 border border-destructive/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground">{critical.length}</p>
              <p className="text-xs text-muted-foreground">Critical items</p>
            </div>
          </div>
          <div className="glass-card p-4 border border-warning/30 flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-warning shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground">{low.length}</p>
              <p className="text-xs text-muted-foreground">Running low</p>
            </div>
          </div>
          <div className="glass-card p-4 border border-success/30 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground">{ok.length}</p>
              <p className="text-xs text-muted-foreground">Well stocked</p>
            </div>
          </div>
        </div>

        {/* Critical alert banner */}
        {critical.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl px-5 py-4 bg-destructive/10 border border-destructive/30 flex items-start gap-3"
          >
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-foreground">
              <span className="text-destructive font-bold">{critical.length} item(s)</span> are critically low and may run out within 24 hours.
              Deploy the AI restock agent for each item or contact your supplier directly.
            </p>
          </motion.div>
        )}

        {/* Inventory list */}
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground text-sm">
              No inventory data available. Ensure the backend is running and the MediTrack sensor is connected.
            </div>
          ) : (
            sorted.map((item, idx) => {
              const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.OK;
              const maxLevel = 100;
              const pct = Math.min((item.level / maxLevel) * 100, 100);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`glass-card p-5 border ${cfg.bg}`}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{getDaysRemaining(item.level, item.status)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {item.status !== "OK" && (
                        <button
                          onClick={() => triggerRestock.mutate(item.id)}
                          disabled={triggerRestock.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {triggerRestock.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Bot className="w-3 h-3" />
                          )}
                          AI Restock
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stock bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                      <span>Stock level</span>
                      <span className="font-mono">{item.level} units</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${cfg.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default Inventory;
