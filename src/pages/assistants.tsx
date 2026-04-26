import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Bot, Plus, LogOut, MessageSquare, Edit, Trash2, Sparkles, Coins, Settings } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { assistantService, assistantTemplates, type Assistant } from "@/services/assistantService";
import { creditsService } from "@/services/creditsService";

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "Anthropic" },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
  { id: "mistral-large", name: "Mistral Large", provider: "Mistral" },
  { id: "grok-2", name: "Grok-2", provider: "X AI" },
];

export default function Assistants() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("my-assistants");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [credits, setCredits] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructions: "",
    personality: "",
    model: "gpt-4",
    avatar_emoji: "🤖",
    is_public: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assistantsData, userCredits] = await Promise.all([
        assistantService.getAssistants(),
        creditsService.getCredits(),
      ]);
      setAssistants(assistantsData);
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = assistantTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        instructions: template.instructions,
        personality: template.personality,
        model: template.model,
        avatar_emoji: template.emoji,
        is_public: false,
      });
      setSelectedTemplate(templateId);
    }
  };

  const handleCreateAssistant = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.instructions.trim()) return;

    try {
      await assistantService.createAssistant(formData);
      await loadData();
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating assistant:", error);
      alert("Chyba při vytváření asistenta.");
    }
  };

  const handleUpdateAssistant = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAssistant) return;

    try {
      await assistantService.updateAssistant(selectedAssistant.id, formData);
      await loadData();
      setEditDialogOpen(false);
      setSelectedAssistant(null);
      resetForm();
    } catch (error) {
      console.error("Error updating assistant:", error);
      alert("Chyba při aktualizaci asistenta.");
    }
  };

  const handleDeleteAssistant = async (id: string) => {
    if (!confirm("Opravdu chcete smazat tohoto asistenta? Tato akce je nevratná.")) return;

    try {
      await assistantService.deleteAssistant(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting assistant:", error);
    }
  };

  const handleEditClick = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setFormData({
      name: assistant.name,
      description: assistant.description || "",
      instructions: assistant.instructions,
      personality: assistant.personality || "",
      model: assistant.model,
      avatar_emoji: assistant.avatar_emoji || "🤖",
      is_public: assistant.is_public,
    });
    setEditDialogOpen(true);
  };

  const handleChatClick = (assistantId: string) => {
    router.push(`/assistant-chat?id=${assistantId}`);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      instructions: "",
      personality: "",
      model: "gpt-4",
      avatar_emoji: "🤖",
      is_public: false,
    });
    setSelectedTemplate(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">AI Asistenti</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{credits}</span>
                  <span className="text-xs text-muted-foreground">kreditů</span>
                </div>
                <ThemeSwitch />
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="my-assistants">
                  <Bot className="h-4 w-4 mr-2" />
                  Moji asistenti
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Šablony
                </TabsTrigger>
              </TabsList>

              <Dialog open={createDialogOpen} onOpenChange={(open) => {
                setCreateDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Vytvořit asistenta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Vytvořit nového asistenta</DialogTitle>
                    <DialogDescription>
                      Definujte osobnost, instrukce a chování vašeho AI asistenta
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAssistant} className="space-y-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Jméno asistenta *</Label>
                        <Input
                          id="name"
                          placeholder="např. Business Consultant"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar (emoji)</Label>
                        <Input
                          id="avatar"
                          placeholder="🤖"
                          value={formData.avatar_emoji}
                          onChange={(e) => setFormData({ ...formData, avatar_emoji: e.target.value })}
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Popis</Label>
                      <Input
                        id="description"
                        placeholder="Stručný popis asistenta a jeho schopností"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instrukce a role *</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Jsi [role]. Tvým úkolem je [co dělá]. Vždy [jak se chová]..."
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        className="min-h-[120px]"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Definujte roli, odpovědnosti a styl komunikace asistenta
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personality">Osobnost</Label>
                      <Input
                        id="personality"
                        placeholder="např. Profesionální, analytický, trpělivý"
                        value={formData.personality}
                        onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">AI Model</Label>
                      <Select value={formData.model} onValueChange={(v) => setFormData({ ...formData, model: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name} ({model.provider})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                      />
                      <Label htmlFor="public" className="cursor-pointer">
                        Zveřejnit asistenta (ostatní uživatelé ho budou moci použít)
                      </Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="flex-1">
                        Zrušit
                      </Button>
                      <Button type="submit" className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Vytvořit asistenta
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <TabsContent value="my-assistants" className="space-y-6">
              {assistants.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center space-y-4">
                      <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Žádní asistenti</h3>
                        <p className="text-muted-foreground mb-4">
                          Vytvořte svého prvního AI asistenta nebo vyberte z připravených šablon
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Vytvořit asistenta
                          </Button>
                          <Button variant="outline" onClick={() => setActiveTab("templates")}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Procházet šablony
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {assistants.map((assistant) => (
                    <Card key={assistant.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-4xl">{assistant.avatar_emoji}</div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(assistant)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAssistant(assistant.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardTitle className="font-heading">{assistant.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {assistant.description || assistant.instructions.substring(0, 100) + "..."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {AI_MODELS.find(m => m.id === assistant.model)?.name || assistant.model}
                          </Badge>
                          {assistant.is_public && (
                            <Badge variant="secondary" className="bg-accent/10">
                              Veřejný
                            </Badge>
                          )}
                        </div>
                        <Button className="w-full" onClick={() => handleChatClick(assistant.id)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Začít konverzaci
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Připravené šablony asistentů</CardTitle>
                  <CardDescription>
                    Vyberte šablonu a přizpůsobte ji svým potřebám
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {assistantTemplates.map((template) => (
                      <Card key={template.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="text-4xl mb-2">{template.emoji}</div>
                          <CardTitle className="font-heading text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => {
                              handleTemplateSelect(template.id);
                              setCreateDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Použít šablonu
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setSelectedAssistant(null);
              resetForm();
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Upravit asistenta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateAssistant} className="space-y-4 py-4">
                {/* Same form fields as create dialog */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Jméno asistenta *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-avatar">Avatar (emoji)</Label>
                    <Input
                      id="edit-avatar"
                      value={formData.avatar_emoji}
                      onChange={(e) => setFormData({ ...formData, avatar_emoji: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Popis</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-instructions">Instrukce a role *</Label>
                  <Textarea
                    id="edit-instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-personality">Osobnost</Label>
                  <Input
                    id="edit-personality"
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-model">AI Model</Label>
                  <Select value={formData.model} onValueChange={(v) => setFormData({ ...formData, model: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.provider})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                  <Label htmlFor="edit-public" className="cursor-pointer">
                    Zveřejnit asistenta
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
                    Zrušit
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Uložit změny
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  );
}