import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SEO } from "@/components/SEO";
import { Send, Loader2, Menu, Home, Plus, Trash2, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/ChatMessage";
import { conversationsService, Message } from "@/services/conversationsService";
import { UserMenu } from "@/components/UserMenu";
import { authService } from "@/services/authService";
import { creditsService } from "@/services/creditsService";

const availableModels = [
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5" },
  { id: "claude-3-opus", name: "Claude 3" },
  { id: "gemini-pro", name: "Gemini" },
];

export default function Chat() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const user = await authService.getCurrentUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const [convData, userCredits] = await Promise.all([
        conversationsService.getConversations(),
        creditsService.getCredits(),
      ]);
      setConversations(convData || []);
      setCredits(userCredits);
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
      setMenuOpen(false);
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit konverzaci",
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = async (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setSelectedConversation(conv);
      setMenuOpen(false);
      
      // Load messages for this conversation
      try {
        const msgs = await conversationsService.getMessages(id);
        setMessages(msgs || []);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      
      {/* Mobile/PWA Fullscreen Layout */}
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
          <div className="flex items-center gap-2">
            {/* Menu Button */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="font-heading">Konverzace</SheetTitle>
                </SheetHeader>
                
                {/* New Chat Button */}
                <div className="p-3 border-b">
                  <Button onClick={handleNewConversation} className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nový chat
                  </Button>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-2">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Žádné konverzace
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedConversation?.id === conv.id ? "bg-muted" : ""
                          }`}
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Close Button */}
                <div className="p-4 border-t bg-muted/30">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setMenuOpen(false)}
                  >
                    Zavřít a pokračovat v chatu
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Dashboard Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>

          {/* Right Side - User Menu */}
          <UserMenu credits={credits} showCredits={false} />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 mx-auto">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-bold mb-2">
                  {selectedConversation ? selectedConversation.title : "Začněte nový chat"}
                </h2>
                <p className="text-muted-foreground">
                  Položte otázku nebo začněte konverzaci s AI
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} role={msg.role as any} content={msg.content} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI přemýšlí...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-card px-4 py-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Model Selection - Compact Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModel(model.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedModel === model.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {model.name}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Napište zprávu..."
                className="min-h-[60px] pr-12 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}