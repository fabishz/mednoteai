import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  LayoutDashboard, Users, FileText, BarChart3, Settings, ClipboardList,
  LogOut, Moon, Sun, Shield, ChevronLeft, Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import appIcon from "@/assets/app-icon.png";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Patients", path: "/dashboard/patients", icon: Users },
  { label: "Notes", path: "/dashboard/notes", icon: FileText },
  { label: "Templates", path: "/dashboard/templates", icon: ClipboardList },
  { label: "Reports", path: "/dashboard/reports", icon: BarChart3, feature: "advanced_reports" as const },
  { label: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setTick] = useState(0);

  // Listen to theme changes for re-render
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentDark = document.documentElement.classList.contains("dark");

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-60",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center gap-2 px-4 h-16 border-b border-border shrink-0", collapsed && "justify-center px-2")}>
          <img src={appIcon} alt="MedNoteAI" className="w-8 h-8 rounded-lg shrink-0" />
          {!collapsed && <span className="font-bold text-foreground text-lg">MedNoteAI</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            const isFeatureRestricted = item.feature === "advanced_reports"
              ? !user?.subscription?.features?.advanced_reports
              : false;
            return (
              <NavLink
                key={item.path}
                to={isFeatureRestricted ? "#" : item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  isFeatureRestricted && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={isFeatureRestricted ? "Upgrade to Professional or Clinic to access reports" : item.label}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}{isFeatureRestricted ? " (Locked)" : ""}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-2">
          <div className={cn("flex items-center gap-2 text-xs text-success", collapsed && "justify-center")}>
            <Shield className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Secure session active</span>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex-1 flex flex-col transition-all duration-300", collapsed ? "lg:ml-[68px]" : "lg:ml-60")}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{user?.clinicName || "Clinic"}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {currentDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">{user?.name?.split(" ")[0]}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
