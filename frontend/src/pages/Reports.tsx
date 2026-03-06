import { motion } from "framer-motion";
import { mockNotesOverTime, mockNoteTypes } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const COLORS = [
  "hsl(210, 76%, 55%)",
  "hsl(175, 55%, 42%)",
  "hsl(152, 56%, 42%)",
  "hsl(262, 52%, 60%)",
];

const monthlyBreakdown = [
  { month: "Sep 2025", notes: 42, patients: 38 },
  { month: "Oct 2025", notes: 58, patients: 45 },
  { month: "Nov 2025", notes: 65, patients: 52 },
  { month: "Dec 2025", notes: 51, patients: 40 },
  { month: "Jan 2026", notes: 73, patients: 61 },
  { month: "Feb 2026", notes: 68, patients: 55 },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Analytics overview of your clinical documentation</p>
        </div>
        <Button variant="outline" className="font-medium">
          <Download className="w-4 h-4 mr-2" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Notes Over Time</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockNotesOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 13,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Line type="monotone" dataKey="notes" stroke="hsl(210, 76%, 55%)" strokeWidth={2} dot={{ fill: "hsl(210, 76%, 55%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Note Types Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={mockNoteTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                {mockNoteTypes.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 13,
                  color: "hsl(var(--foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Monthly Breakdown */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Month</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Notes Created</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Patients Seen</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Avg. per Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {monthlyBreakdown.map((row) => (
                <tr key={row.month} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-foreground">{row.month}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{row.notes}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{row.patients}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{(row.notes / 30).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
