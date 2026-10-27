import { privatePageMetadata } from "@/lib/site";
export const metadata = privatePageMetadata("/login", "Log in");
export default function LoginLayout({ children }: { children: React.ReactNode }) { return children; }
