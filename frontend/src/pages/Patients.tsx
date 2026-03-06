import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockPatients } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";
import { useAuth } from "@/contexts/AuthContext";

interface Patient {
  id: string; name: string; age: number; gender: string; contact: string; medicalId: string; lastVisit: string;
}

export default function Patients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", gender: "Male", contact: "", medicalId: "" });

  const canAddPatient = Boolean(user?.subscription?.features?.canAddPatient ?? true);
  const maxPatients = user?.subscription?.limits?.maxPatients ?? null;

  const filtered = patients.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.medicalId.toLowerCase().includes(search.toLowerCase());
    const matchGender = genderFilter === "all" || p.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const handleAdd = () => {
    if (!canAddPatient) {
      toast({
        title: "Patient limit reached",
        description: maxPatients
          ? `Your current plan allows up to ${maxPatients} patients.`
          : "Your current plan does not allow adding more patients.",
        variant: "destructive"
      });
      return;
    }

    if (!form.name || !form.age || !form.contact) return;
    const newPatient: Patient = {
      id: `P${String(patients.length + 1).padStart(3, "0")}`,
      name: form.name,
      age: parseInt(form.age),
      gender: form.gender,
      contact: form.contact,
      medicalId: form.medicalId || `MID-2026-${String(patients.length + 1).padStart(3, "0")}`,
      lastVisit: new Date().toISOString().split("T")[0],
    };
    setPatients([newPatient, ...patients]);
    setModalOpen(false);
    setForm({ name: "", age: "", gender: "Male", contact: "", medicalId: "" });
    toast({ title: "Patient added", description: `${newPatient.name} has been added to your records.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">{patients.length} patients in your records</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="font-semibold" disabled={!canAddPatient}>
          <Plus className="w-4 h-4 mr-2" /> Add Patient
        </Button>
      </div>

      {!canAddPatient && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            You have reached your patient limit{maxPatients ? ` (${maxPatients})` : ""}. Upgrade your subscription to add more patients.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <PatientSearch value={search} onChange={setSearch} />
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-full sm:w-40 h-10">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No patients found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or add a new patient.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium hidden sm:table-cell">Age</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium hidden md:table-cell">Gender</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium hidden lg:table-cell">Medical ID</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{p.name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{p.age}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{p.gender}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell"><span className="text-xs bg-muted px-2 py-1 rounded font-mono">{p.medicalId}</span></td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{p.contact}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{p.lastVisit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Age *</Label><Input type="number" placeholder="35" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Contact *</Label><Input placeholder="+1-555-0100" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div className="space-y-2"><Label>Medical ID</Label><Input placeholder="Auto-generated if empty" value={form.medicalId} onChange={(e) => setForm({ ...form, medicalId: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.name || !form.age || !form.contact}>Add Patient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
