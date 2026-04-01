import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "@/components/NavBar";
import ClinicFloorPlan from "@/components/dashboard/ClinicFloorPlan";
import BentoSidebar from "@/components/dashboard/BentoSidebar";
import { CLINICS } from "@/lib/clinics";

const Index = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const clinic = CLINICS[activeIndex];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={clinic.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ClinicFloorPlan clinic={clinic} />
        </motion.div>
      </AnimatePresence>

      <NavBar />

      {/* Clinic switcher — centered below the nav */}
      <div className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 glass-card rounded-2xl p-1">
        {CLINICS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActiveIndex(i)}
            className={`relative px-5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeIndex === i
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.name}
            {c.live && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-success" />
            )}
          </button>
        ))}
      </div>

      <BentoSidebar clinic={clinic} />
    </div>
  );
};

export default Index;
