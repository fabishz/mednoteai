import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-illustration.png";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

const stats = [
  { value: "12,000+", label: "Clinical Notes Generated" },
  { value: "850+", label: "Healthcare Professionals" },
  { value: "18 min", label: "Avg. Time Saved per Visit" },
  { value: "99.9%", label: "Uptime Guarantee" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 auth-gradient" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp()}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Clinical Documentation
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
              Clinical notes in seconds,{" "}
              <span className="text-primary">not hours</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
              MedNoteAI helps healthcare professionals generate structured SOAP notes, manage patients, and reclaim time for what matters most — patient care.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link to="/register">
                <Button size="lg" className="font-semibold h-12 px-8 text-base">
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  See How It Works
                </Button>
              </a>
            </div>
          </motion.div>
          <motion.div {...fadeUp(0.2)} className="hidden lg:block">
            <img
              src={heroImage}
              alt="Doctor using MedNoteAI clinical dashboard on tablet"
              className="w-full rounded-2xl shadow-2xl shadow-primary/10 border border-border/40"
            />
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div {...fadeUp(0.3)} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-4 rounded-xl bg-card/60 border border-border/60 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
