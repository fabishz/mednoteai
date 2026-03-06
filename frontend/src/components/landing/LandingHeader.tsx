import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import appIcon from "@/assets/app-icon.png";

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-2.5">
          <img src={appIcon} alt="MedNoteAI" className="w-8 h-8 rounded-lg" />
          <span className="text-lg font-bold text-foreground">MedNoteAI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#trust" className="hover:text-foreground transition-colors">Security</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="font-semibold">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
