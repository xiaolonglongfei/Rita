---
name: Instructor opt-out privacy
description: Removed instructors must disappear from public and member-facing views while admin records and reviews remain intact.
---

A coach with an opt-out timestamp has asked to be removed from Rovi. Nothing about them may be visible or reachable publicly. Treat them like a nonexistent instructor, including on saved review links and submission paths. Keep their instructor record and reviews unchanged; administrators still see an “Opted out” label.

**Why:** The user explicitly requires complete removal from public visibility without deleting the coach or their review history.

**How to apply:** Exclude opted-out coaches before pagination, counts, search, rankings, metadata, club listings, and giveaway qualification. Related review/session histories and notifications must not reveal their identity. Check visibility before side effects, including writes and emails. Do not change stored review status to accomplish removal.
