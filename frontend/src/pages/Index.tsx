import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ClinicFloorPlan from "@/components/dashboard/ClinicFloorPlan";
import BentoSidebar from "@/components/dashboard/BentoSidebar";
import RightHUD from "@/components/dashboard/RightHUD";

const Index = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <ClinicFloorPlan />
      <DashboardHeader />
      <BentoSidebar />
      <RightHUD />
    </div>
  );
};

export default Index;
