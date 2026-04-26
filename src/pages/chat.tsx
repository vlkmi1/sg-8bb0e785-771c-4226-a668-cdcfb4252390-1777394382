import { useEffect, useState, useRef, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { Send, LogOut, MessageSquare, Sparkles, Edit2, Check, X } from "lucide-react";
import { conversationsService } from "@/services/conversationsService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Conversation = Tables<"conversations">;
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
};

export default function Chat() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const models = [
    { id: "gpt-4", name: "GPT-4", provider: "OpenAI", icon: "🤖" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", icon: "⚡" },
    { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", icon: "🧠" },
    { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "Anthropic", icon: "🎵" },
    { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "Anthropic", icon: "🌸" },
    { id: "gemini-pro", name: "Gemini Pro", provider: "Google", icon: "🔮" },
    { id: "mistral-large", name: "Mistral Large", provider: "Mistral", icon: "⚡" },
    { id: "mistral-medium", name: "Mistral Medium", provider: "Mistral", icon: "🌟" },
    { id: "grok-2", name: "Grok-2", provider: "X AI", icon: "𝕏" },
  ];

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await conversationsService.getConversations();
      setConversations(data);
      
      // Auto-create first conversation if none exists
      if (data.length === 0) {
        await createAutoConversation();
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const createAutoConversation = async () => {
    try {
      const title = `Chat ${new Date().toLocaleDateString("cs-CZ")}`;
      const conversation = await conversationsService.createConversation({ title, model_provider: selectedModel });
      setConversations([conversation]);
      setCurrentConversation(conversation);
      setMessages([]);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit konverzaci",
        variant: "destructive",
      });
    }
  };

  const handleConversationSelect = async (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;
    
    setCurrentConversation(conversation);
    
    try {
      const msgs = await conversationsService.getMessages(conversation.id);
      setMessages(msgs.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })));
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleNewConversation = async () => {
    const title = `Chat ${new Date().toLocaleDateString("cs-CZ")} ${new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}`;
    try {
      const conversation = await conversationsService.createConversation({ title, model_provider: selectedModel });
      setConversations([conversation, ...conversations]);
      setCurrentConversation(conversation);
      setMessages([]);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleTitleEdit = async () => {
    if (!currentConversation || !editedTitle.trim()) return;
    
    try {
      await conversationsService.updateConversation(currentConversation.id, { title: editedTitle.trim() });
      setCurrentConversation({ ...currentConversation, title: editedTitle.trim() });
      setConversations(conversations.map(c => 
        c.id === currentConversation.id ? { ...c, title: editedTitle.trim() } : c
      ));
      setIsEditingTitle(false);
      toast({
        title: "Název upraven",
        description: "Název konverzace byl úspěšně změněn",
      });
    } catch (error) {
      console.error("Error updating title:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit název",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Auto-create conversation if none exists
    let conversation = currentConversation;
    if (!conversation) {
      const title = input.slice(0, 50) + (input.length > 50 ? "..." : "");
      conversation = await conversationsService.createConversation({ title });
      setConversations([conversation, ...conversations]);
      setCurrentConversation(conversation);
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Save user message
      await conversationsService.createMessage({
        conversation_id: conversation.id,
        role: "user",
        content: input
      });

      // Call AI API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          model: selectedModel,
          conversationId: conversation.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Nepodařilo se získat odpověď");
      }

      const data = await response.json();
      const assistantMessage: Message = { 
        role: "assistant", 
        content: data.response, 
        model: selectedModel 
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      await conversationsService.createMessage({
        conversation_id: conversation.id,
        role: "assistant",
        content: data.response
      });

      // Auto-rename conversation with first message if title is generic
      if (conversation.title.startsWith("Chat ") && messages.length === 0) {
        const autoTitle = input.slice(0, 50) + (input.length > 50 ? "..." : "");
        await conversationsService.updateConversation(conversation.id, { title: autoTitle });
        setCurrentConversation({ ...conversation, title: autoTitle });
        setConversations(conversations.map(c => 
          c.id === conversation.id ? { ...c, title: autoTitle } : c
        ));
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odeslat zprávu",
        variant: "destructive",
      });
      
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
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
      <div className="flex h-screen bg-background">
        <ConversationSidebar
          selectedId={currentConversation?.id}
          onSelectConversation={handleConversationSelect}
          onNewConversation={handleNewConversation}
        />

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    {currentConversation ? (
                      isEditingTitle ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="h-8 w-64"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleTitleEdit();
                              if (e.key === "Escape") setIsEditingTitle(false);
                            }}
                          />
                          <Button size="sm" variant="ghost" onClick={handleTitleEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h1 className="text-lg font-heading font-bold">{currentConversation.title}</h1>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditedTitle(currentConversation.title);
                              setIsEditingTitle(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    ) : (
                      <h1 className="text-lg font-heading font-bold">AI Chat</h1>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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

          <main className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6">
                <div className="text-center max-w-2xl space-y-6">
                  <div className="inline-flex p-4 bg-primary/10 rounded-2xl">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold">Začněte konverzaci</h2>
                  <p className="text-muted-foreground text-lg">
                    Vyberte AI model a začněte chatovat s nejmodernějšími jazykovými modely
                  </p>

                  <div className="pt-6">
                    <p className="text-sm text-muted-foreground mb-4">Dostupné AI modely:</p>
                    <Tabs value={selectedModel} onValueChange={setSelectedModel} className="w-full">
                      <TabsList className="grid grid-cols-3 lg:grid-cols-5 gap-2 h-auto p-2">
                        {models.map((model) => (
                          <TabsTrigger
                            key={model.id}
                            value={model.id}
                            className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                          >
                            <span className="text-2xl">{model.icon}</span>
                            <div className="text-xs font-medium">{model.name}</div>
                            <div className="text-xs opacity-70">{model.provider}</div>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="grid gap-3 text-left max-w-md mx-auto pt-6">
                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">💡 Tipy pro lepší odpovědi</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Buďte konkrétní ve svých dotazech</li>
                          <li>• Poskytněte kontext když je to potřeba</li>
                          <li>• Vyzkoušejte různé modely pro srovnání</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <div className="container mx-auto max-w-4xl p-6 space-y-6">
                {messages.map((message, index) => (
                  <ChatMessage key={index} role={message.role} content={message.content} />
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="text-sm">
                      {models.find(m => m.id === selectedModel)?.name} přemýšlí...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </main>

          <div className="border-t bg-card">
            <div className="container mx-auto max-w-4xl p-6">
              {messages.length > 0 && (
                <div className="mb-4">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-64">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span>{models.find(m => m.id === selectedModel)?.icon}</span>
                          <span>{models.find(m => m.id === selectedModel)?.name}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.icon}</span>
                            <div>
                              <div className="font-medium">{model.name}</div>
                              <div className="text-xs text-muted-foreground">{model.provider}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Napište zprávu..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Model: <Badge variant="secondary" className="ml-1">{models.find(m => m.id === selectedModel)?.name}</Badge>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}