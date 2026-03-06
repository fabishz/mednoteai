import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

const plans = [
  {
    name: "Basic", price: "$29", period: "/mo", desc: "For individual practitioners",
    features: ["Up to 50 notes/month", "1 user", "Patient management", "SOAP note generation", "Email support"],
    cta: "Start Free Trial", highlighted: false,
  },
  {
    name: "Pro", price: "$79", period: "/mo", desc: "For growing practices",
    features: ["Unlimited notes", "Up to 10 users", "Advanced analytics", "Priority support", "Custom templates", "API access"],
    cta: "Start Free Trial", highlighted: true,
  },
  {
    name: "Enterprise", price: "Custom", period: "", desc: "For hospitals & networks",
    features: ["Unlimited everything", "Unlimited users", "SSO & SAML", "Dedicated account manager", "Custom integrations", "SLA guarantee"],
    cta: "Contact Sales", highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-card/50 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp()} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Start free for 14 days. No credit card required.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} {...fadeUp(i * 0.08)}
              className={`relative rounded-xl p-6 sm:p-8 border transition-all duration-300 ${
                plan.highlighted
                  ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/5 scale-[1.02]"
                  : "bg-card border-border hover:border-primary/15"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button variant={plan.highlighted ? "default" : "outline"} className="w-full font-semibold">
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
