import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">MedNoteAI</span>
          </div>
          <p className="text-muted-foreground text-sm">Reset your password</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
              <p className="text-sm text-muted-foreground">We've sent a password reset link to <strong className="text-foreground">{email}</strong></p>
              <Link to="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="doctor@clinic.org" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
