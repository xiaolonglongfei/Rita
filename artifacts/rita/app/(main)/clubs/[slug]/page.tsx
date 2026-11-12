import { notFound } from "next/navigation";
import { getClubCoaches, getLiveClub } from "@/lib/club-pages";
import { pageMetadata } from "@/lib/site";
import { ClubPageContent } from "@/components/club/ClubPageContent";
import { ClubSource } from "@/components/club/ClubSource";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await getLiveClub(slug);
  if (!club) notFound();
  const title = `${club.name}, ${club.city} | Tennis coaches on Rovi`;
  const metadata = pageMetadata(`/clubs/${club.slug}`, title, "Tennis coaches at this club on Rovi.", {
    index: false, follow: false,
  });
  return {
    ...metadata,
    title: { absolute: title },
    openGraph: { ...metadata.openGraph, title },
    twitter: { ...metadata.twitter, title },
  };
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await getLiveClub(slug);
  if (!club) notFound();
  const coaches = await getClubCoaches(club.teaching_location);
  return (
    <>
      <ClubSource slug={club.slug} />
      <ClubPageContent club={club} coaches={coaches} />
    </>
  );
}
