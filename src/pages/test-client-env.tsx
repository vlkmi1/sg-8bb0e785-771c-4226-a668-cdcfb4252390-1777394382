export default function TestClientEnv() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full bg-card p-6 rounded-lg border">
        <h1 className="text-2xl font-bold mb-4">Client Environment Check</h1>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
            <br />
            <code className="bg-muted p-2 rounded block mt-1">
              {process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING"}
            </code>
          </div>
          <div>
            <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY (first 50 chars):</strong>
            <br />
            <code className="bg-muted p-2 rounded block mt-1 break-all">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + "..." || "MISSING"}
            </code>
          </div>
          <div>
            <strong>NEXT_PUBLIC_SITE_URL:</strong>
            <br />
            <code className="bg-muted p-2 rounded block mt-1">
              {process.env.NEXT_PUBLIC_SITE_URL || "MISSING"}
            </code>
          </div>
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <strong>Expected values:</strong>
            <ul className="mt-2 space-y-1 text-xs">
              <li>URL: https://pcedodoywieqkejeeprp.supabase.co</li>
              <li>Key prefix: eyJhbGciOiJIUzI1NiIs...</li>
              <li>Site: https://3000-8bb0e785-771c-4226-a668-cdcfb4252390.softgen.dev</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}