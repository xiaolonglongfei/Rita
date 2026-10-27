import { privatePageMetadata } from "@/lib/site";
export const metadata = privatePageMetadata("/instructor-info", "Information for Tennis Instructors");
export default function InstructorInfoLayout({ children }: { children: React.ReactNode }) { return children; }
