import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { Send, Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { conversationsService, Message } from "@/services/conversationsService";
import { UserMenu } from "@/components/UserMenu";
import { authService } from "@/services/authService";
import { ModuleHeader } from "@/components/ModuleHeader";

export default function Chat() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableModels = [
    { id: "gpt-4", name: "GPT-4" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5" },
    { id: "claude-3-opus", name: "Claude 3" },
    { id: "gemini-pro", name: "Gemini" },
  ];

  const loadConversations = useCallback(async () => {
    const user = await authService.getCurrentUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const data = await conversationsService.getConversations();
      setConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, [router]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = async () => {
    const user = await authService.getCurrentUser();
    if (!user) return;

    try {
      const data = await conversationsService.createConversation({
        title: "Nová konverzace",
        model_provider: "openai",
        model_name: selectedModel,
      });

      setSelectedConversation(data);
      setMessages([]);
      await loadConversations();
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit konverzaci",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await conversationsService.deleteConversation(id);
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat konverzaci",
        variant: "destructive",
      });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const user = await authService.getCurrentUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!selectedConversation) {
      await handleNewConversation();
      return;
    }

    const userMessage = {
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
          conversationId: selectedConversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Chyba při komunikaci s API");
      }

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCredits(data.remainingCredits || credits);
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odeslat zprávu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="AI Chat - kAIkus"
        description="Komunikujte s různými AI modely prostřednictvím jednotného rozhraní"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <ModuleHeader credits={credits} />
        
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar s konverzacemi */}
            <div className="lg:col-span-1">
              <ConversationSidebar
                selectedId={selectedConversation?.id}
                onSelectConversation={(id) => {
                  const conv = conversations.find(c => c.id === id);
                  if (conv) setSelectedConversation(conv);
                }}
                onNewConversation={handleNewConversation}
              />
            </div>

            {/* Hlavní chat oblast */}
            <div className="lg:col-span-3">
              <Card className="h-[calc(100vh-10rem)] flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquarePlus className="h-5 w-5 text-primary" />
                    {selectedConversation?.title || "Nová konverzace"}
                  </CardTitle>
                </CardHeader>

                {/* Oblast zpráv */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Začněte konverzaci s AI modelem</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <ChatMessage key={idx} role={msg.role as any} content={msg.content} />
                    ))
                  )}
                  {loading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>AI přemýšlí...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Input oblast */}
                <CardContent className="border-t pt-4 pb-2">
                  <form onSubmit={handleSend} className="space-y-3">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Napište svou zprávu..."
                      className="min-h-[100px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />

                    {/* Výběr AI modelu - KOMPAKTNÍ TLAČÍTKA */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Vyberte AI model:</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableModels.map((model) => (
                          <Button
                            key={model.id}
                            type="button"
                            variant={selectedModel === model.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedModel(model.id)}
                            className="text-xs"
                          >
                            {model.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Kredity: {credits}
                      </span>
                      <Button type="submit" disabled={loading || !input.trim()}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Odesílám...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Odeslat
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}