import { SEO } from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Bell, Settings, Menu } from "lucide-react";
import { TabletCreditsWidget, TabletQuickActionsWidget, TabletRecentActivityWidget, TabletStatsCardsWidget } from "@/components/dashboard/TabletWidgets";
import { UserMenu } from "@/components/UserMenu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function TabletDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <SEO 
        title="Tablet Dashboard - kAIkus"
        description="Přehled vašich AI nástrojů optimalizovaný pro tablety"
      />
      
      <div className="min-h-screen bg-background">
        {/* Tablet Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      kAIkus
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2">
                    <a href="/dashboard" className="block px-4 py-3 rounded-lg hover:bg-muted font-medium">
                      Dashboard
                    </a>
                    <a href="/chat" className="block px-4 py-3 rounded-lg hover:bg-muted">
                      AI Chat
                    </a>
                    <a href="/generate" className="block px-4 py-3 rounded-lg hover:bg-muted">
                      Generování obrázků
                    </a>
                    <a href="/video-generate" className="block px-4 py-3 rounded-lg hover:bg-muted">
                      Video generátor
                    </a>
                    <a href="/settings" className="block px-4 py-3 rounded-lg hover:bg-muted">
                      Nastavení
                    </a>
                  </nav>
                </SheetContent>
              </Sheet>

              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                kAIkus
              </h1>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </a>
              <a href="/chat" className="text-sm font-medium hover:text-primary transition-colors">
                Chat
              </a>
              <a href="/generate" className="text-sm font-medium hover:text-primary transition-colors">
                Generování
              </a>
              <a href="/settings" className="text-sm font-medium hover:text-primary transition-colors">
                Nastavení
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content - 2 Column Grid */}
        <main className="p-6 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <TabletCreditsWidget />
              <TabletStatsCardsWidget />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <TabletQuickActionsWidget />
              <TabletRecentActivityWidget />
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}