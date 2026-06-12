import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import * as schema from "./schema";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Local pg pool — used only for connect-pg-simple session store
const { Pool } = pg;
const localUrl = process.env.DATABASE_URL;
if (!localUrl) {
  throw new Error("DATABASE_URL must be set for session storage.");
}
export const pool = new Pool({ connectionString: localUrl });

export * from "./schema";
