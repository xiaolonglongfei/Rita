---
name: Production canonical host
description: Why SEO identity uses www and why deployment checks must target the existing Vercel site.
---

The user states that the production host is `https://www.rovi.training`; the apex domain permanently redirects to www with HTTP 308. Use www for SEO identity, not the redirecting apex.

**Why:** A single canonical host avoids publishing conflicting identities and unnecessary redirects. Plain-text legal references to "rovi.training" identify the brand/domain and must remain unchanged.

**How to apply:** Keep canonical, Open Graph, sitemap, robots and structured-data URLs consistent. The user manages this production site on Vercel, with NEXT_PUBLIC_SITE_URL set for both Production and Preview. A Replit workspace reporting no deployment does not mean the existing public website is unpublished. Do not claim production reflects workspace changes until the Vercel deployment has been checked.
