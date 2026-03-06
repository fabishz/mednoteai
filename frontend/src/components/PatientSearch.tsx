import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { patientsService, PatientSearchResult } from "@/services/patients";

interface PatientSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (patient: PatientSearchResult) => void;
}

export default function PatientSearch({ value, onChange, onSelect }: PatientSearchProps) {
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const found = await patientsService.searchPatients(query);
        setResults(found);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search patients by name or patient ID..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        className="pl-9 h-10"
      />

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-md border border-border bg-card shadow-md overflow-hidden">
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matching patients</div>
          ) : (
            results.map((patient) => (
              <button
                key={patient.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(patient.fullName);
                  onSelect?.(patient);
                  setOpen(false);
                }}
              >
                <div className="font-medium text-foreground">{patient.fullName}</div>
                <div className="text-xs text-muted-foreground">{patient.patientId}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
