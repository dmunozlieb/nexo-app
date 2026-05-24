const fallbackUrl = "https://example.supabase.co";
const fallbackAnonKey = "demo-anon-key";

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? fallbackUrl,
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? fallbackAnonKey,
  demoMode: process.env.EXPO_PUBLIC_DEMO_MODE === "true",
};

export const isSupabaseConfigured =
  env.supabaseUrl !== fallbackUrl && env.supabaseAnonKey !== fallbackAnonKey;
