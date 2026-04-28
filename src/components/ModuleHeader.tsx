import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

interface ModuleHeaderProps {
  credits: number;
}

export function ModuleHeader({ credits }: ModuleHeaderProps) {
  const router = useRouter();

  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          
          <UserMenu credits={credits} />
        </div>
      </div>
    </header>
  );
}