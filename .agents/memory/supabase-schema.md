---
name: New Supabase schema column mapping
description: Column name differences between old code and new Supabase project schema
---

**Why:** New Supabase project was created with different column names than the original Express/Drizzle schema.

**How to apply:** Any new route or page querying these tables must use the new column names.

## instructors
- `name` → `full_name`
- `photo_url` → `avatar_url`
- `location` → `teaching_locations`
- `avg_score` → `avg_overall`
- `review_count` → `total_reviews`
- `verified` → `is_claimed`
- `specialty` → REMOVED
- `public_rank` → REMOVED
- `id` → UUID string (not integer)

## users
- `name` → `full_name`
- no `password_hash` (Supabase Auth handles passwords)
- `id` → UUID string matching `auth.users.id`

## sessions
- `user_id` → `student_id`
- `notes` → REMOVED
- `verified` → `verified_at IS NOT NULL` (boolean derived)
- new: `session_time`, `location`, `status`, `initiated_by`

## reviews
- `user_id` → `student_id`
- `value` → `rating_value`
- `effectiveness` → `rating_effectiveness`
- `punctuality` → `rating_punctuality`
- `overall_score` → COMPUTED as avg of three rating fields (not stored)
- `status` → `moderation_status`
- new: `is_verified`, `is_flagged`, `flag_reason`, layer1/layer2 moderation fields

## notifications
- `read` → `is_read`
- new: `related_session_id`, `related_review_id`, `related_instructor_id`
