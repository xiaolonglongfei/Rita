---
name: Instructor opt-out privacy
description: Removed instructors must disappear from public and member-facing views while admin records and reviews remain intact.
---

A coach with an opt-out timestamp has asked to be removed from Rovi. Nothing about them may be visible or reachable publicly. Treat them like a nonexistent instructor, including on saved review links and submission paths. Keep their instructor record and reviews unchanged; administrators still see an “Opted out” label.

**Why:** The user explicitly requires complete removal from public visibility without deleting the coach or their review history.

**How to apply:** Exclude opted-out coaches before pagination, counts, search, rankings, metadata, club listings, and giveaway qualification. Related review/session histories and notifications must not reveal their identity. Check visibility before side effects, including writes and emails. Do not change stored review status to accomplish removal.

Student-created coaches awaiting directory approval are different from opted-out coaches: their direct profile and review form must remain accessible, while they stay out of directory/search/rankings and remain noindex.

**Why:** The user explicitly wants students to review newly added coaches immediately, before an administrator approves directory publication. Inactivity alone is not a removal request.

**How to apply:** Keep pending publication separate from opt-out privacy. Do not extend the opt-out 404 rule to every inactive coach.

Do not advertise coach removal on instructor profiles or on the contact page. Keep contact copy neutral, leave the report-a-review flow intact, and keep the user-created-profile policy paragraph within Terms only.

**Why:** The user explicitly wants profile concerns handled through support without promoting self-serve removal.

**How to apply:** Offer the shared “Contact us” route and neutral club contact wording; only administrators manage opt-out and restoration.
