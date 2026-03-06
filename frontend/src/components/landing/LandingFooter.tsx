import appIcon from "@/assets/app-icon.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={appIcon} alt="MedNoteAI" className="w-6 h-6 rounded" />
          <span className="text-sm font-semibold text-foreground">MedNoteAI</span>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 MedNoteAI. All rights reserved.</p>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
        </div>
      </div>
    </footer>
  );
}
