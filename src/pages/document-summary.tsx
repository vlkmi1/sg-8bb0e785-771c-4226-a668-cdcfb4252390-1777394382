import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Sparkles, LogOut, Loader2, Coins, Upload, Download, Trash2, Star } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { documentSummaryService, type DocumentSummary } from "@/services/documentSummaryService";
import { creditsService } from "@/services/creditsService";
import { favoritePromptsService } from "@/services/favoritePromptsService";
import { PromptSelector } from "@/components/PromptSelector";
import { authState } from "@/services/authStateService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ModuleHeader } from "@/components/ModuleHeader";

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "claude-3-opus", name: "Claude 3 Opus" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
  { id: "gemini-pro", name: "Gemini Pro" },
];

const SUMMARY_LEVELS = [
  { value: "short", label: "Krátké (1-2 odstavce)" },
  { value: "medium", label: "Střední (5-7 odstavců)" },
  { value: "detailed", label: "Detailní (s bullet points)" },
];

export default function DocumentSummary() {
  const router = useRouter();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [summaryLevel, setSummaryLevel] = useState("medium");
  const [model, setModel] = useState("gpt-4");
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState<DocumentSummary[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [credits, setCredits] = useState(0);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadSummaries = async () => {
    try {
      const data = await documentSummaryService.getSummaries();
      setSummaries(data);
    } catch (error) {
      console.error("Error loading summaries:", error);
    }
  };

  useState(() => {
    loadCredits();
    loadSummaries();
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (credits < 2) {
      toast({
        title: "Nedostatek kreditů",
        description: "Shrnutí stojí 2 kredity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await authState.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          level: summaryLevel,
          model: model,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate summary");
      }

      const { summary } = await response.json();

      await documentSummaryService.createSummary({
        originalText: text.trim(),
        summaryText: summary,
        summaryLevel: summaryLevel as any,
        modelUsed: model,
      });

      await loadCredits();
      await loadSummaries();
      setText("");
      setActiveTab("history");

      toast({
        title: "Shrnutí vytvořeno",
        description: "Text byl úspěšně shrnut",
      });
    } catch (error: any) {
      console.error("Error creating summary:", error);
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!text.trim()) return;

    try {
      await favoritePromptsService.createPrompt({
        title: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
        prompt_text: text,
        category: "summary",
      });
      toast({
        title: "Prompt uložen",
        description: "Text byl přidán do oblíbených",
      });
    } catch (error) {
      console.error("Error saving prompt:", error);
    }
  };

  const handleLoadPrompt = (promptText: string) => {
    setText(promptText);
  };

  const handleDelete = async (id: string) => {
    try {
      await documentSummaryService.deleteSummary(id);
      await loadSummaries();
      toast({ title: "Shrnutí smazáno" });
    } catch (error) {
      console.error("Error deleting summary:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <ModuleHeader credits={credits} />

        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="create">Vytvořit shrnutí</TabsTrigger>
              <TabsTrigger value="history">Historie ({summaries.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Shrnutí textu
                  </CardTitle>
                  <CardDescription>
                    Vložte text nebo nahrajte dokument pro automatické shrnutí pomocí AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="text">Text ke shrnutí</Label>
                        <div className="flex gap-2">
                          <PromptSelector category="summary" onSelect={handleLoadPrompt} />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSavePrompt}
                            disabled={!text.trim()}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Uložit
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        id="text"
                        placeholder="Vložte text který chcete shrnout..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={12}
                        className="resize-none font-mono text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Délka: {text.length} znaků
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="level">Úroveň shrnutí</Label>
                        <Select value={summaryLevel} onValueChange={(v) => setSummaryLevel(v)}>
                          <SelectTrigger id="level">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUMMARY_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="model">AI Model</Label>
                        <Select value={model} onValueChange={setModel}>
                          <SelectTrigger id="model">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AI_MODELS.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading || !text.trim()}>
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Generuji shrnutí...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Vytvořit shrnutí (2 kredity)
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <div className="max-w-4xl mx-auto space-y-4">
                {summaries.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Žádná shrnutí</h3>
                      <p className="text-muted-foreground mb-4">
                        Vytvořte své první shrnutí textu
                      </p>
                      <Button onClick={() => setActiveTab("create")}>
                        Vytvořit shrnutí
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  summaries.map((summary) => (
                    <Card key={summary.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="font-heading text-base">
                                {summary.file_name || "Text shrnutí"}
                              </CardTitle>
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                {SUMMARY_LEVELS.find(l => l.value === summary.summary_level)?.label}
                              </span>
                            </div>
                            <CardDescription className="text-xs">
                              Model: {summary.model_used} • {new Date(summary.created_at).toLocaleDateString("cs-CZ")}
                            </CardDescription>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(summary.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Shrnutí:</h4>
                          <p className="text-sm whitespace-pre-wrap">{summary.summary_text}</p>
                        </div>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Zobrazit původní text
                          </summary>
                          <p className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap font-mono text-xs">
                            {summary.original_text}
                          </p>
                        </details>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}