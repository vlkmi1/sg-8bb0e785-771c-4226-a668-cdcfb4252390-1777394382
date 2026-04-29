import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Debug endpoint to check env variables character by character
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  const debugInfo = {
    serviceKeyExists: !!serviceKey,
    serviceKeyLength: serviceKey.length,
    serviceKeyFirst50: serviceKey.substring(0, 50),
    serviceKeyLast10: serviceKey.substring(serviceKey.length - 10),
    serviceKeyHasSpaces: serviceKey.includes(" "),
    serviceKeyHasNewlines: serviceKey.includes("\n"),
    serviceKeyHasTabs: serviceKey.includes("\t"),
    
    anonKeyExists: !!anonKey,
    anonKeyLength: anonKey.length,
    anonKeyFirst50: anonKey.substring(0, 50),
    anonKeyLast10: anonKey.substring(anonKey.length - 10),
    
    allEnvKeys: Object.keys(process.env)
      .filter(k => k.includes("SUPABASE"))
      .map(k => ({
        key: k,
        hasValue: !!process.env[k],
        length: process.env[k]?.length || 0,
      })),
  };

  return res.status(200).json(debugInfo);
}