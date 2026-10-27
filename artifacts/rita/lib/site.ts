import type { Metadata } from "next";

const configuredSite = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rovi.training");
// Never publish the redirecting apex host as a canonical, even with an old env value.
if (configuredSite.hostname === "rovi.training" || configuredSite.hostname === "www.rovi.training") {
  configuredSite.hostname = "www.rovi.training";
  configuredSite.protocol = "https:";
}
export const SITE_URL = configuredSite.origin;
export const SITE_TITLE = "Rovi — Tennis Instructor Reviews";
export const SITE_DESCRIPTION =
  "Honest, anonymous, verified reviews of tennis instructors. Find the right coach for you or your child.";

/** Absolute canonical on our host, without query strings or fragments. */
export function siteUrl(path = "/") {
  const pathname = new URL(path, `${SITE_URL}/`).pathname;
  return new URL(pathname, `${SITE_URL}/`).href;
}

export const SITE_IMAGE = {
  url: siteUrl("/opengraph.jpg"),
  width: 1200,
  height: 630,
  alt: "Rovi: real reviews of private instructors. Tennis.",
};

export function pageMetadata(
  path: string,
  title: string,
  description: string,
  robots?: Metadata["robots"],
): Metadata {
  const url = siteUrl(path);
  const fullTitle = title === SITE_TITLE ? title : `${title} | Rovi`;
  return {
    title: title === SITE_TITLE ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: "website",
      siteName: "Rovi",
      title: fullTitle,
      description,
      url,
      images: [SITE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [SITE_IMAGE],
    },
  };
}

export function privatePageMetadata(path: string, title: string, description = SITE_DESCRIPTION) {
  return pageMetadata(path, title, description, { index: false, follow: false });
}
