import { motion } from "framer-motion";
import { MapPin, AlertTriangle, CheckCircle, ArrowRight, Users, Clock } from "lucide-react";
import { useClinicData } from "@/hooks/use-clinic-data";
import NavBar from "@/components/NavBar";

const REDIRECT_THRESHOLD = 80;

const District = () => {
  const { status, waitTime } = useClinicData();

  const currentOccupancy = status
    ? Math.round((status.patient_count / 40) * 100)
    : 0;

  const districtStats: any[] = status?.district_stats ?? [];

  // Find available clinics for redirection (lower load, not critical)
  const available = districtStats.filter(
    (s) => s.status !== "CRITICAL" && s.occupancy < REDIRECT_THRESHOLD
  );
  const shouldRedirect = currentOccupancy >= REDIRECT_THRESHOLD;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="pt-24 pb-12 px-6 max-w-4xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">District Health Network</h1>
          <p className="text-sm text-muted-foreground">
            Live occupancy across Gqeberha clinics. Use this view to decide when to redirect walk-in patients and which facility to send them to.
          </p>
        </div>

        {/* This clinic */}
        <div className="glass-card p-5 mb-6 border border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">This Clinic — Gqeberha Central</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-extrabold text-foreground">{status?.patient_count ?? "--"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Active patients</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-foreground">{currentOccupancy}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Occupancy</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-foreground">{waitTime != null ? `${waitTime}m` : "--"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Wait time</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${currentOccupancy >= 90 ? "bg-destructive" : currentOccupancy >= 70 ? "bg-warning" : "bg-primary"}`}
                initial={{ width: 0 }}
                animate={{ width: `${currentOccupancy}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Redirect recommendation */}
        {shouldRedirect && available.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl px-5 py-4 bg-warning/10 border border-warning/30"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Your clinic is at {currentOccupancy}% capacity — consider redirecting new walk-ins.
                </p>
                <p className="text-xs text-muted-foreground">
                  Recommended: send patients to{" "}
                  <span className="text-success font-semibold">{available[0].suburb}</span>
                  {" "}({available[0].occupancy}% occupied) — shortest wait likely there.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {shouldRedirect && available.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl px-5 py-4 bg-destructive/10 border border-destructive/30 flex items-start gap-3"
          >
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-foreground">
              All district clinics are under high load. Contact the district health office to activate overflow protocols.
            </p>
          </motion.div>
        )}

        {/* District clinics */}
        {districtStats.length > 0 ? (
          <>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Nearby Clinics</h2>
            <div className="space-y-3">
              {districtStats.map((s: any, idx: number) => {
                const isCritical = s.status === "CRITICAL";
                const isModerate = s.status === "MODERATE";
                const isAvailable = !isCritical && s.occupancy < REDIRECT_THRESHOLD;
                return (
                  <motion.div
                    key={s.suburb}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className={`glass-card p-5 border ${
                      isCritical ? "border-destructive/30" : isModerate ? "border-warning/30" : "border-success/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <MapPin className={`w-4 h-4 shrink-0 ${isCritical ? "text-destructive" : isModerate ? "text-warning" : "text-success"}`} />
                        <div>
                          <p className="font-semibold text-foreground text-sm">{s.suburb}</p>
                          <p className="text-xs text-muted-foreground">{s.occupancy}% occupied</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isAvailable ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-success bg-success/15 px-3 py-1 rounded-full border border-success/30">
                            <CheckCircle className="w-3 h-3" /> Can accept patients
                          </span>
                        ) : (
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                            isCritical
                              ? "text-destructive bg-destructive/15 border-destructive/30"
                              : "text-warning bg-warning/15 border-warning/30"
                          }`}>
                            {isCritical ? "Do not redirect here" : "High load — monitor"}
                          </span>
                        )}

                        {isAvailable && shouldRedirect && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                            <ArrowRight className="w-3 h-3" /> Redirect here
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${isCritical ? "bg-destructive" : isModerate ? "bg-warning" : "bg-success"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.occupancy}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.07 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="glass-card p-8 text-center text-muted-foreground text-sm">
            District data not available. Ensure the backend is connected and district_stats are being returned from the /status endpoint.
          </div>
        )}

        {/* Guidance footer */}
        <div className="mt-8 glass-card p-5 border border-border">
          <div className="flex items-start gap-3">
            <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">How to use this page</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When your clinic reaches <span className="text-warning font-semibold">80% capacity</span>, begin directing non-urgent walk-ins to available clinics.
                At <span className="text-destructive font-semibold">90%+</span>, activate your clinic's overflow protocol and notify the district office.
                This data refreshes every 2 seconds.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default District;
