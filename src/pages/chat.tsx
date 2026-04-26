import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Plus, LogOut, Sparkles, Coins, AlertCircle, Loader2 } from "lucide-react";
import { conversationsService } from "@/services/conversationsService";
import { apiKeysService, type AIProvider } from "@/services/apiKeysService";
import { creditsService } from "@/services/creditsService";
import { AuthGuard } from "@/components/AuthGuard";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import type { Tables } from "@/integrations/supabase/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Message = Tables<"messages">;
type Conversation = Tables<"conversations">;

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5 Turbo" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku" },
  { id: "google", name: "Google AI", icon: "🔮", description: "Gemini Pro, Gemini Ultra" },
  { id: "mistral", name: "Mistral AI", icon: "⚡", description: "Mistral Large, Medium, Small" },
  { id: "cohere", name: "Cohere", icon: "🌟", description: "Command, Generate, Embed" },
];

export default function Chat() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [showLowCreditsWarning, setShowLowCreditsWarning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("openai");
  const [connectedProviders, setConnectedProviders] = useState<AIProvider[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadConnectedProviders();
    loadCredits();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
    }
  }, [currentConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
      setShowLowCreditsWarning(userCredits < 10);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await conversationsService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadConnectedProviders = async () => {
    try {
      const keys = await apiKeysService.getApiKeys();
      setConnectedProviders(keys.map(k => k.provider as AIProvider));
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  };

  const loadMessages = async () => {
    if (!currentConversation) return;
    
    try {
      const data = await conversationsService.getMessages(currentConversation.id);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSelectConversation = (idOrConversation: any) => {
    if (typeof idOrConversation === "string") {
      const conv = conversations.find(c => c.id === idOrConversation);
      if (conv) setCurrentConversation(conv);
    } else {
      setCurrentConversation(idOrConversation);
    }
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    try {
      await conversationsService.deleteConversation(conversation.id);
      setConversations(conversations.filter(c => c.id !== conversation.id));
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentConversation || loading) return;

    if (credits < 1) {
      alert("Nemáte dostatek kreditů. Kontaktujte administrátora.");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      await conversationsService.createMessage({
        conversation_id: currentConversation.id,
        role: "user",
        content: userMessage,
      });

      const newCredits = await creditsService.deductCredits(1);
      setCredits(newCredits);
      setShowLowCreditsWarning(newCredits < 10);

      await loadMessages();

      await conversationsService.createMessage({
        conversation_id: currentConversation.id,
        role: "assistant",
        content: `[Simulovaná odpověď od ${currentConversation.model_provider}]\n\nToto je ukázková odpověď. V reálné aplikaci by zde byla odpověď z AI modelu.`,
      });

      await loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof Error && error.message.includes("Insufficient credits")) {
        alert("Nemáte dostatek kreditů. Kontaktujte administrátora.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">kAIkus Chat</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{credits}</span>
                  <span className="text-xs text-muted-foreground">kreditů</span>
                </div>
                <Button variant="ghost" onClick={() => router.push("/")}>
                  Zpět
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex">
          <ConversationSidebar
            selectedId={currentConversation?.id}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setDialogOpen(true)}
          />

          <main className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {showLowCreditsWarning && (
                  <Alert variant="destructive" className="m-4 mb-0">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Pozor! Máte méně než 10 kreditů. Kontaktujte administrátora pro doplnění.
                    </AlertDescription>
                  </Alert>
                )}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-0">
                    {messages.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Konverzace je prázdná. Napište první zprávu.
                      </div>
                    ) : (
                      messages.map((message) => (
                        <ChatMessage
                          key={message.id}
                          role={message.role as "user" | "assistant" | "system"}
                          content={message.content}
                        />
                      ))
                    )}
                    {loading && (
                      <div className="flex gap-4 p-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-secondary text-secondary-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">AI Asistent</p>
                          <p className="text-sm text-muted-foreground mt-2">Píše odpověď...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t bg-card p-4">
                  <div className="container max-w-4xl">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Napište zprávu..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="resize-none min-h-[60px]"
                        rows={2}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={loading || !input.trim()}
                        size="icon"
                        className="h-[60px] w-[60px]"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                  <div className="p-4 bg-primary/10 rounded-full inline-block">
                    <Brain className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold">Vítejte v kAIkus Chat</h2>
                  <p className="text-muted-foreground">
                    Začněte novou konverzaci nebo vyberte existující z levého panelu.
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    Začít novou konverzaci
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Nová konverzace</DialogTitle>
              <DialogDescription>
                Vytvořte novou konverzaci s AI modelem
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Název konverzace</Label>
                <Input
                  id="title"
                  placeholder="např. Pomoc s programováním"
                  value={newConversationTitle}
                  onChange={(e) => setNewConversationTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">AI Model</Label>
                <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as AIProvider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.filter(p => connectedProviders.includes(p.id as AIProvider)).map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                if (!newConversationTitle.trim()) return;
                setDialogOpen(false);
                setNewConversationTitle("");
                setCurrentConversation({
                  id: "new",
                  title: newConversationTitle,
                  model_provider: selectedProvider,
                } as Conversation);
              }} className="w-full" disabled={!newConversationTitle.trim()}>
                Vytvořit konverzaci
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}