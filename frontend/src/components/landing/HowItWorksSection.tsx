import { motion } from "framer-motion";
import { ClipboardList, Cpu, FileCheck, Save } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

const steps = [
  { icon: ClipboardList, title: "Input Symptoms", desc: "Enter patient symptoms, observations, and clinical data into the structured form." },
  { icon: Cpu, title: "AI Processing", desc: "Our AI engine structures and formats data into professional SOAP notes instantly." },
  { icon: FileCheck, title: "Review & Edit", desc: "Review the generated note, make edits, and customize to your documentation style." },
  { icon: Save, title: "Save Securely", desc: "Save to patient records with full encryption and audit trail compliance." },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-28 bg-card/50 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp()} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How it works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">From patient intake to documented record in under two minutes.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div key={step.title} {...fadeUp(i * 0.1)} className="relative text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-xs font-bold text-primary mb-2">STEP {i + 1}</div>
              <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
