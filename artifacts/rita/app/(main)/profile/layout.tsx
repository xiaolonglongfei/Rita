import { privatePageMetadata } from "@/lib/site";
export const metadata = privatePageMetadata("/profile", "Your Profile");
export default function ProfileLayout({ children }: { children: React.ReactNode }) { return children; }
