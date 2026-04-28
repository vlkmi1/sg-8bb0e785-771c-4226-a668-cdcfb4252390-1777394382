import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { UserMenu } from "@/components/UserMenu";
import { AuthGuard } from "@/components/AuthGuard";
import { creditsService } from "@/services/creditsService";
import { documentSummaryService } from "@/services/documentSummaryService";
import { toast } from "@/hooks/use-toast";

interface Summary {
  id: string;
  title: string;
  content: string;
  summary: string;
  created_at: string;
}

export default function DocumentSummary() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [credits, setCredits] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted]);

  const loadData = async () => {
    try {
      const [userCredits, userSummaries] = await Promise.all([
        creditsService.getCredits(),
        documentSummaryService.getSummaries(),
      ]);
      setCredits(userCredits);
      setSummaries(userSummaries);
    } catch (error: any) {
      console.error("Error loading data:", error);
    }
  };

  const handleSummarize = async () => {
    if (!content.trim()) {
      toast({
        title: "Chyba",
        description: "Zadejte text k sumarizaci",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          title: title.trim() || "Bez názvu",
        }),
      });

      if (!response.ok) {
        throw new Error("Chyba při sumarizaci");
      }

      const data = await response.json();
      
      toast({
        title: "Úspěch",
        description: "Dokument byl sumarizován",
      });

      setCredits(data.remainingCredits || credits);
      await loadData();
      setContent("");
      setTitle("");
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se sumarizovat dokument",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <AuthGuard>
      <SEO
        title="Sumarizace dokumentů - kAIkus"
        description="Vytvořte stručné shrnutí dlouhých textů pomocí AI"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <UserMenu credits={credits} />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold mb-2 flex items-center justify-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Sumarizace dokumentů
            </h1>
            <p className="text-muted-foreground">
              Vytvořte stručné shrnutí dlouhých textů pomocí AI
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input karta */}
            <Card>
              <CardHeader>
                <CardTitle>Vložte text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Název (volitelné)</Label>
                  <Input
                    id="title"
                    placeholder="Název dokumentu..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Text k sumarizaci</Label>
                  <Textarea
                    id="content"
                    placeholder="Vložte dlouhý text, který chcete sumarizovat..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[400px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.length} znaků
                  </p>
                </div>

                <Button
                  onClick={handleSummarize}
                  disabled={loading || !content.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sumarizuji...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Sumarizovat (1 kredit)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Historie */}
            <Card>
              <CardHeader>
                <CardTitle>Historie sumarizací</CardTitle>
              </CardHeader>
              <CardContent>
                {summaries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Zatím nemáte žádné sumarizace</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {summaries.map((summary) => (
                      <Card key={summary.id} className="bg-muted/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            {summary.title}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {new Date(summary.created_at).toLocaleDateString("cs-CZ")}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm whitespace-pre-wrap">
                            {summary.summary}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}