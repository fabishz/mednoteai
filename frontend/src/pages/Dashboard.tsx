import { motion } from "framer-motion";
import { Users, FileText, Clock, UserCheck, FileBarChart, UserPlus } from "lucide-react";
import { mockRecentActivity } from "@/lib/mockData";
import { useState, useEffect } from "react";

const kpis = [
  { label: "Patients This Month", value: "127", change: "+12%", icon: Users, color: "text-primary" },
  { label: "Notes Created", value: "68", change: "+23%", icon: FileText, color: "text-accent" },
  { label: "Avg. Time Saved", value: "18 min", change: "+5 min", icon: Clock, color: "text-success" },
  { label: "Active Users", value: "8", change: "—", icon: UserCheck, color: "text-chart-4" },
];

const activityIcons: Record<string, React.ElementType> = {
  note: FileBarChart,
  patient: UserPlus,
  report: FileBarChart,
};

const anim = {
  card: { hidden: { opacity: 0, y: 12 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }) },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back. Here's your clinical overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={anim.card}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-foreground">{kpi.value}</span>
                  <span className="text-xs text-success mb-1">{kpi.change}</span>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-48 bg-muted rounded" />
                <div className="h-2.5 w-24 bg-muted rounded" />
              </div>
            </div>
          )) : mockRecentActivity.map((item) => {
            const Icon = activityIcons[item.type] || FileBarChart;
            return (
              <div key={item.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.patient} • {item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
