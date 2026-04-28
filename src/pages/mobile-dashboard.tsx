import { useState } from "react";
import { SEO } from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Bell, Settings } from "lucide-react";
import { CreditsWidget, QuickActionsWidget, RecentActivityWidget, StatsCardsWidget } from "@/components/dashboard/MobileWidgets";
import { UserMenu } from "@/components/UserMenu";

export default function MobileDashboard() {
  const [open, setOpen] = useState(false);

  return (
    <AuthGuard>
      <SEO 
        title="Mobilní Dashboard - kAIkus"
        description="Přehled vašich AI nástrojů optimalizovaný pro mobilní telefony"
      />
      
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    kAIkus
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-2">
                  <a href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-muted">
                    Dashboard
                  </a>
                  <a href="/chat" className="block px-3 py-2 rounded-lg hover:bg-muted">
                    Chat
                  </a>
                  <a href="/generate" className="block px-3 py-2 rounded-lg hover:bg-muted">
                    Generování obrázků
                  </a>
                  <a href="/settings" className="block px-3 py-2 rounded-lg hover:bg-muted">
                    Nastavení
                  </a>
                </nav>
              </SheetContent>
            </Sheet>

            <h1 className="text-lg font-bold">Dashboard</h1>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 pb-20 space-y-4">
          <CreditsWidget />
          <QuickActionsWidget />
          <RecentActivityWidget />
          <StatsCardsWidget />
        </main>
      </div>
    </AuthGuard>
  );
}