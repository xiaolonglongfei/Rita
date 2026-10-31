---
name: Moderation action schema changes
description: User approval boundary for moderation-log CHECK constraint changes.
---

When extending moderation-log actions, check the remote action CHECK constraint and give the user the necessary SQL migration rather than altering the table yourself.

**Why:** The user explicitly requested this boundary. The remote database constrains allowed action values, so an application-side label change cannot make a new audit action valid.

**How to apply:** Preserve existing allowed actions when proposing SQL; do not guess their values or bypass audit logging to make comment removal succeed. Keep schema migrations manual unless the user separately authorizes applying them.
