import { motion } from "framer-motion";
import { Layers, Cpu } from "lucide-react";

const RightHUD = () => {
  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-3 w-64">
      {/* Edge Context */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="glass-card-sm p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Edge Context</span>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Protocol</span>
            <span className="font-mono font-medium text-foreground">MQTT v5</span>
          </div>
          <div className="flex justify-between">
            <span>Cluster</span>
            <span className="font-mono font-medium text-foreground">SA-NW-01</span>
          </div>
          <div className="flex justify-between">
            <span>Uptime</span>
            <span className="font-mono font-medium text-success">99.97%</span>
          </div>
        </div>
      </motion.div>

      {/* Zone Key */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="glass-card-sm p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Zone Key</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary/30 border border-primary/50" />
            <span className="text-xs text-foreground font-medium">QueueSense Lobby</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-success/30 border border-success/50" />
            <span className="text-xs text-foreground font-medium">MediTrack Pharmacy</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RightHUD;
