import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp()}
          className="relative rounded-2xl bg-primary/5 border border-primary/15 p-10 sm:p-16 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative">
            <Zap className="w-10 h-10 text-primary mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to transform your documentation?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              Join hundreds of healthcare professionals saving hours every week with MedNoteAI.
            </p>
            <Link to="/register">
              <Button size="lg" className="font-semibold h-12 px-8 text-base">
                Get Started for Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
