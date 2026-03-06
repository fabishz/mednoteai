import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [org, setOrg] = useState(user?.organization || "");
  const [currentPlan] = useState<"basic" | "pro" | "enterprise">("pro");

  const handleSaveProfile = () => {
    toast({ title: "Profile updated", description: "Your profile information has been saved." });
  };

  const handleChangePassword = () => {
    toast({ title: "Password updated", description: "Your password has been changed successfully." });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>
        <Button onClick={handleSaveProfile}>Save Changes</Button>
      </motion.section>

      {/* Organization */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Organization</h2>
        <div className="space-y-2"><Label>Organization Name</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} /></div>
        <Button onClick={() => toast({ title: "Organization updated" })}>Update</Button>
      </motion.section>

      {/* Subscription */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Subscription</h2>
        <div className="flex flex-wrap gap-3">
          {(["basic", "pro", "enterprise"] as const).map((plan) => (
            <div key={plan} className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${currentPlan === plan ? "border-primary bg-primary/5" : "border-border"}`}>
              <span className="text-sm font-medium text-foreground capitalize">{plan}</span>
              {currentPlan === plan && <Badge variant="default" className="text-xs">Current</Badge>}
            </div>
          ))}
        </div>
      </motion.section>

      {/* Change Password */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" placeholder="••••••••" /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="Min. 6 characters" /></div>
          <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" placeholder="••••••••" /></div>
        </div>
        <Button onClick={handleChangePassword}>Update Password</Button>
      </motion.section>

      {/* Danger Zone */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="border border-destructive/30 bg-destructive/5 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <Button variant="destructive">Delete Account</Button>
      </motion.section>
    </div>
  );
}
