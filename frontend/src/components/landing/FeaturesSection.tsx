import { motion } from "framer-motion";
import { FileText, Users, Clock, Shield, BarChart3, Globe } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

const features = [
  { icon: FileText, title: "SOAP Note Generation", desc: "Create structured clinical notes in seconds with AI-powered formatting and medical terminology." },
  { icon: Users, title: "Patient Management", desc: "Organize patient records, track visits, and maintain comprehensive medical histories effortlessly." },
  { icon: Clock, title: "Save 18+ Min per Visit", desc: "Reduce documentation time dramatically so you can focus on what matters — patient care." },
  { icon: Shield, title: "HIPAA-Ready Security", desc: "Enterprise-grade encryption, role-based access, and audit trails to protect sensitive data." },
  { icon: BarChart3, title: "Clinical Analytics", desc: "Track documentation patterns, monitor productivity, and generate actionable insights." },
  { icon: Globe, title: "Telemedicine Ready", desc: "Works seamlessly across clinics, mobile health programs, and remote consultations." },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp()} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Everything your practice needs</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Purpose-built for doctors, nurses, clinics, and telemedicine providers.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp(i * 0.06)}
              className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
