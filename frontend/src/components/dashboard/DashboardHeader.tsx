import { MapPin, Activity, Wifi } from "lucide-react";

const DashboardHeader = () => {
  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <div className="glass-card px-6 py-3 flex items-center justify-between" style={{ borderRadius: '2rem' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">KlinikIQ</span>
          </div>
          <div className="h-5 w-px bg-border mx-2" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">Gqeberha Central Health Node</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 glass-card-sm px-4 py-1.5" style={{ borderRadius: '1rem' }}>
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </div>
            <span className="text-xs font-semibold text-success">Neural Sync Optimal</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Edge Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
