import { useEffect, useState, useRef, FormEvent } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Trash2, Loader2, Coins, Bot } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { assistantService, type Assistant, type AssistantConversation, type Message } from "@/services/assistantService";
import { creditsService } from "@/services/creditsService";

export default function AssistantChat() {
  const router = useRouter();
  const { id } = router.query;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [conversation, setConversation] = useState<AssistantConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadAssistant(id);
      loadConversation(id);
    }
  }, [id]);

  useEffect(() => {
    loadCredits();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadAssistant = async (assistantId: string) => {
    try {
      const data = await assistantService.getAssistant(assistantId);
      setAssistant(data);
    } catch (error) {
      console.error("Error loading assistant:", error);
      router.push("/assistants");
    }
  };

  const loadConversation = async (assistantId: string) => {
    try {
      let conv = await assistantService.getConversation(assistantId);
      
      if (!conv) {
        conv = await assistantService.createConversation(assistantId);
      }

      setConversation(conv);
      setMessages((conv.messages as Message[]) || []);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversation || !assistant) return;

    if (credits < 1) {
      alert("Nemáte dostatek kreditů. Potřebujete alespoň 1 kredit.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      await assistantService.addMessage(conversation.id, userMessage);

      const response = await assistantService.generateResponse(assistant.id, userMessage.content);

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      await assistantService.addMessage(conversation.id, assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);

      const newCredits = await creditsService.deductCredits(1);
      setCredits(newCredits);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Chyba při odesílání zprávy.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearConversation = async () => {
    if (!conversation) return;
    if (!confirm("Opravdu chcete smazat celou konverzaci? Tato akce je nevratná.")) return;

    try {
      await assistantService.clearConversation(conversation.id);
      setMessages([]);
    } catch (error) {
      console.error("Error clearing conversation:", error);
    }
  };

  if (!assistant) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push("/assistants")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="text-3xl">{assistant.avatar_emoji}</div>
                <div>
                  <h1 className="text-lg font-heading font-bold">{assistant.name}</h1>
                  <p className="text-sm text-muted-foreground">{assistant.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{credits}</span>
                  <span className="text-xs text-muted-foreground">kreditů</span>
                </div>
                <ThemeSwitch />
                <Button variant="ghost" size="icon" onClick={handleClearConversation} title="Smazat konverzaci">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-6 py-6 flex flex-col max-w-4xl">
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <div className="text-5xl">{assistant.avatar_emoji}</div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Začněte konverzaci</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        {assistant.description || "Zeptejte se mě na cokoliv a já vám rád pomohu."}
                      </p>
                      <div className="mt-4">
                        <Badge variant="secondary">
                          {assistant.personality || "AI Asistent"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === "assistant" && (
                        <span className="text-xl">{assistant.avatar_emoji}</span>
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString("cs-CZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{assistant.avatar_emoji}</span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Přemýšlím...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Napište zprávu..."
              className="min-h-[60px] max-h-[200px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button type="submit" size="lg" disabled={loading || !input.trim() || credits < 1}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Stiskněte Enter pro odeslání, Shift+Enter pro nový řádek • 1 kredit za zprávu
          </p>
        </main>
      </div>
    </AuthGuard>
  );
}