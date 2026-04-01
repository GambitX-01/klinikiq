import { Link, useLocation } from "react-router-dom";
import { Activity, BarChart2, Package, MapPin } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Live View", icon: Activity },
  { to: "/analytics", label: "Insights", icon: BarChart2 },
  { to: "/inventory", label: "Stock", icon: Package },
  { to: "/district", label: "District", icon: MapPin },
];

const NavBar = () => {
  const { pathname } = useLocation();

  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <div className="glass-card rounded-[2rem] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">KlinikIQ</span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 glass-card-sm rounded-2xl px-4 py-1.5">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </div>
          <span className="text-xs font-semibold text-success">Live</span>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
