import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSupabaseAuth() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testSignIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "vlk.miroslav@gmail.com",
      password: "TestHeslo123"
    });
    setResults({ signIn: { data, error: error?.message || error } });
    setLoading(false);
  };

  const testSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: "Test123456"
    });
    setResults({ signUp: { data, error: error?.message || error } });
    setLoading(false);
  };

  const testPasswordReset = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      "vlk.miroslav@gmail.com",
      {
        redirectTo: `${window.location.origin}/auth/update-password`
      }
    );
    setResults({ passwordReset: { data, error: error?.message || error } });
    setLoading(false);
  };

  const testApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        }
      );
      const data = await response.json();
      setResults({ 
        apiKeyTest: { 
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries())
        } 
      });
    } catch (error: any) {
      setResults({ apiKeyTest: { error: error.message } });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Auth Diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={testApiKey} disabled={loading}>
                Test API Key
              </Button>
              <Button onClick={testSignIn} disabled={loading}>
                Test Sign In
              </Button>
              <Button onClick={testSignUp} disabled={loading}>
                Test Sign Up
              </Button>
              <Button onClick={testPasswordReset} disabled={loading}>
                Test Password Reset
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Environment Variables:</h3>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                {JSON.stringify({
                  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                  ANON_KEY_PREFIX: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + "...",
                  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
                }, null, 2)}
              </pre>
            </div>

            {Object.keys(results).length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Results:</h3>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}