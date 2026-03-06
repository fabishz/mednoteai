import { useState } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Copy, Check, Save, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const generateSOAP = (symptoms: string, diagnosis: string, observations: string, treatment: string) => {
  return {
    subjective: `Patient presents with chief complaint of ${symptoms || "symptoms not specified"}. Patient reports onset within the past few days. No known allergies mentioned. Patient denies any recent trauma or injury.`,
    objective: `On examination: ${observations || "General appearance normal. Vital signs within normal limits."} Physical examination reveals findings consistent with the reported symptoms. No acute distress noted.`,
    assessment: `Primary diagnosis: ${diagnosis || "To be determined"}. Differential diagnoses considered based on presenting symptoms and clinical findings. Risk factors evaluated and documented.`,
    plan: `Treatment plan: ${treatment || "Pending further evaluation."} Follow-up appointment recommended in 2 weeks. Patient educated on warning signs and when to seek immediate care. Prescriptions and referrals as indicated.`,
  };
};

export default function Notes() {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [treatment, setTreatment] = useState("");
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState<ReturnType<typeof generateSOAP> | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedNote, setEditedNote] = useState<ReturnType<typeof generateSOAP> | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    const result = generateSOAP(symptoms, diagnosis, observations, treatment);
    setNote(result);
    setEditedNote(result);
    setGenerating(false);
    setEditMode(false);
  };

  const handleCopy = async () => {
    if (!note) return;
    const display = editMode ? editedNote! : note;
    const text = `SOAP NOTE\n\nS — Subjective\n${display.subjective}\n\nO — Objective\n${display.objective}\n\nA — Assessment\n${display.assessment}\n\nP — Plan\n${display.plan}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setLastSaved(new Date().toLocaleTimeString());
    toast({ title: "Note saved", description: "Your clinical note has been saved successfully." });
  };

  const display = editMode ? editedNote! : note;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clinical Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate structured SOAP notes with AI assistance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Clinical Input</h2>
          <div className="space-y-2">
            <Label>Symptoms / Chief Complaint</Label>
            <Textarea placeholder="e.g., Persistent headache for 3 days, mild nausea…" rows={3} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Diagnosis</Label>
            <Input placeholder="e.g., Tension-type headache" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observations / Examination Findings</Label>
            <Textarea placeholder="e.g., BP 120/80, alert and oriented, no focal deficits…" rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Treatment Plan</Label>
            <Textarea placeholder="e.g., Acetaminophen 500mg PRN, hydration, follow-up in 2 weeks…" rows={3} value={treatment} onChange={(e) => setTreatment(e.target.value)} />
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="w-full font-semibold h-11">
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {generating ? "Generating note…" : "Generate SOAP Note"}
          </Button>
        </div>

        {/* Output */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Generated Note</h2>
            {note && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> {editMode ? "Preview" : "Edit"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-3.5 h-3.5 mr-1" /> Save
                </Button>
              </div>
            )}
          </div>

          {generating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">AI is generating your clinical note…</p>
            </div>
          ) : !note ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Ready to generate</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Fill in the clinical input form and click generate to create a structured SOAP note.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {([
                ["S", "Subjective", "subjective"],
                ["O", "Objective", "objective"],
                ["A", "Assessment", "assessment"],
                ["P", "Plan", "plan"],
              ] as const).map(([letter, title, key]) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">{letter}</span>
                    <span className="text-sm font-semibold text-foreground">{title}</span>
                  </div>
                  {editMode ? (
                    <Textarea
                      value={editedNote![key]}
                      onChange={(e) => setEditedNote({ ...editedNote!, [key]: e.target.value })}
                      rows={3}
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed pl-9">{display[key]}</p>
                  )}
                </div>
              ))}
              {lastSaved && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">Last saved: {lastSaved}</p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
