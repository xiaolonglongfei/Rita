import { InstructorsList } from "@/components/instructor/InstructorsList";
import { getInitialInstructorPage } from "@/lib/instructor-directory";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "/instructors",
  "Find a Tennis Instructor",
  "Browse verified tennis instructors and find the right coach for you or your child.",
);
export const dynamic = "force-dynamic";

export default async function InstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const [initialPage, query] = await Promise.all([getInitialInstructorPage(), searchParams]);
  return <InstructorsList initialItems={initialPage.items} initialTotal={initialPage.total} startingReview={query.review === "true"} />;
}
