import { useMemo, useState } from "react";
import { Plus, Save, Trash2, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate,
} from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";

export default function TemplatesPage() {
  const { toast } = useToast();
  const { data: templates = [], isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) || null,
    [templates, selectedId]
  );

  const resetForm = () => {
    setSelectedId(null);
    setName("");
    setContent("");
  };

  const handleSelect = (id: string) => {
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setSelectedId(template.id);
    setName(template.name);
    setContent(template.content);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      toast({ title: "Missing fields", description: "Name and content are required.", variant: "destructive" });
      return;
    }

    try {
      if (selectedId) {
        await updateTemplate.mutateAsync({
          id: selectedId,
          payload: { name: name.trim(), content: content.trim() }
        });
        toast({ title: "Template updated" });
      } else {
        await createTemplate.mutateAsync({
          name: name.trim(),
          content: content.trim()
        });
        toast({ title: "Template created" });
      }
      resetForm();
    } catch (error: any) {
      toast({
        title: "Operation failed",
        description: error?.message || "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      if (selectedId === id) {
        resetForm();
      }
      toast({ title: "Template deleted" });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || "Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clinical Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create reusable clinical note templates for your clinic.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Templates</CardTitle>
            <Button size="sm" variant="outline" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading templates...</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates yet.</p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-3 transition-colors ${
                    selectedId === template.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      className="text-left flex-1"
                      onClick={() => handleSelect(template.id)}
                    >
                      <p className="text-sm font-medium text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.content}</p>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedTemplate ? <Pencil className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {selectedTemplate ? "Edit Template" : "Create Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., SOAP Follow-up Template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">Template Content</Label>
              <Textarea
                id="template-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your reusable clinical note template..."
                className="min-h-[300px]"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={createTemplate.isPending || updateTemplate.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {selectedTemplate ? "Update Template" : "Create Template"}
              </Button>
              {selectedTemplate && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
