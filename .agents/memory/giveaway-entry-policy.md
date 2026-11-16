---
name: Giveaway entry policy
description: Product intent for giveaway eligibility, instructor verification, and alternate entries.
---

Giveaway signup records consent, not entry completion. A user is entered only after at least one qualifying review: saved after passing Layer 1, created at/after their giveaway opt-in and within the promotion period, and not subsequently removed or rejected. Reviews for opted-out coaches are excluded from qualification without changing or deleting the stored reviews; see [instructor opt-out privacy](instructor-opt-out-privacy.md).

**Why:** The user explicitly said the campaign is intended to get reviews and must not silently depend on instructor-side session verification. A saved, accepted review is the earliest reliable eligibility signal.

**How to apply:** Keep giveaway UI eligibility and draw selection on one shared definition. Do not add instructor verification as a requirement. Alternate-method email entries are added manually at draw time, not inferred from account data.

Free entry is a separate no-account, no-review path. Free entrants get up to three entries per promotion, at least seven days apart, with one equally weighted drawing entry per recorded free entry. Preserve existing reviewer qualification, the reviewer cap, and prior email-entry rights. Do not backfill, recompute, or reduce existing entries when adding free entry.

**Why:** The user explicitly added a free-entry method while requiring existing entrants' entries and rights to remain intact.

**How to apply:** Keep free entrants separate from user accounts and marketing. Link to the form only from Official Rules, not directly from the homepage, review form, or giveaway landing page. At manual drawing time include recorded free entries alongside reviewer entries and existing eligible email entries.

Free-entry count-then-insert must retain cross-instance duplicate-slot protection, not just an in-process lock.

**Why:** Independent server instances can both read the same entry count before either insert completes, bypassing the seven-day and total limits if each generates a random primary key.

**How to apply:** Keep the new-entry slot identifier deterministic for the normalized email, promotion, and next ordinal, relying on primary-key uniqueness; never rewrite historical records.

The confirmation page may encourage opted-in users to review other coaches truthfully: each qualifying review adds an entry up to the shared cap. Never display the numeric cap or the user's entry count. Stop the additional-entry encouragement when the cap is reached, and remind users to review only coaches they have actually had a lesson with.

**Why:** The user explicitly replaced the earlier prohibition on mentioning additional entries on the confirmation page. They specified that entries equal qualifying review count, capped at GIVEAWAY_MAX_ENTRIES.

**How to apply:** Use the existing giveaway progress and shared cap for confirmation-page messaging only; do not change flyers, /win, Official Rules, or entry logic as part of this copy change.

Names collected during giveaway signup are private account information. Do not display the user's name publicly; reviews stay anonymous.

**Why:** The user explicitly required that collecting first and last names must not expose reviewer identities.

**How to apply:** Keep account-name collection separate from public review presentation. Do not add names to public review cards or giveaway status displays.
