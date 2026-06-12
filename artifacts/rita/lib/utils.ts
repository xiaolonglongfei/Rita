import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number): string {
  if (score >= 4.5) return "#1668c8";
  if (score >= 3.5) return "#c89000";
  return "#c83030";
}

export function scoreLabel(score: number): string {
  if (score >= 4.5) return "Excellent";
  if (score >= 4.0) return "Great";
  if (score >= 3.5) return "Good";
  if (score >= 3.0) return "Average";
  return "Below Average";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
