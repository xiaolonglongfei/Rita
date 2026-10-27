import { privatePageMetadata } from "@/lib/site";
export const metadata = privatePageMetadata("/sessions", "Your Tennis Sessions");
export default function SessionsLayout({ children }: { children: React.ReactNode }) { return children; }
