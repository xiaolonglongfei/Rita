import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data, error } = await supabase.from("instructors").select("id, name").limit(3);
    return NextResponse.json({ data, error, url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) });
  } catch (e) {
    return NextResponse.json({ caught: String(e), stack: (e as Error).stack?.slice(0, 500) });
  }
}
