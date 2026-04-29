import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Coins, LogOut, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserMenuProps {
  credits?: number;
  showCredits?: boolean;
}

export function UserMenu({ credits, showCredits = true }: UserMenuProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        return;
      }

      if (user) {
        setUser(user);
        
        // Load profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileError) {
          console.error("Error loading profile:", profileError);
          // Don't fail if profile doesn't exist, just use user data
        } else if (profileData) {
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error("Unexpected error in UserMenu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleNavigateToCredits = () => {
    router.push("/credits");
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split("@")[0];
    return "Uživatel";
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5">
          <Avatar className="h-8 w-8 bg-gradient-to-br from-primary to-accent">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-white text-sm font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{getDisplayName()}</span>
            {showCredits && credits !== undefined && (
              <div className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">{credits} kreditů</span>
              </div>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{getDisplayName()}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {showCredits && credits !== undefined && (
          <>
            <DropdownMenuItem onClick={handleNavigateToCredits}>
              <Coins className="h-4 w-4 mr-2 text-primary" />
              <div className="flex-1 flex items-center justify-between">
                <span>Kredity</span>
                <Badge variant="secondary" className="ml-2">
                  {credits}
                </Badge>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="h-4 w-4 mr-2" />
          Nastavení
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <User className="h-4 w-4 mr-2" />
          Dashboard
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Odhlásit se
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}