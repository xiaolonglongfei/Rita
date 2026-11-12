"use client";

import { useEffect } from "react";
import { rememberClubSource } from "@/lib/club-source";

export function ClubSource({ slug }: { slug: string }) {
  useEffect(() => { rememberClubSource(slug); }, [slug]);
  return null;
}
