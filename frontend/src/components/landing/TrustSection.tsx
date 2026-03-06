import { motion } from "framer-motion";
import { Check } from "lucide-react";
import securityImage from "@/assets/feature-security.png";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

const items = [
  "End-to-end encryption at rest and in transit",
  "Role-based access control",
  "Full audit trail and session logging",
  "SOC 2 Type II compliant infrastructure",
];

export default function TrustSection() {
  return (
    <section id="trust" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp()} className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Built for trust</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Security isn't an afterthought. MedNoteAI is designed from the ground up with healthcare-grade protections so you can document with confidence.
            </p>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src={securityImage}
              alt="Healthcare data security and encryption"
              className="w-64 h-64 rounded-2xl object-cover border border-border/40"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
