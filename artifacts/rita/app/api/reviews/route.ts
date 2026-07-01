import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  sendVerificationRequestEmail,
} from "@/lib/resend";

export async function GET() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("reviews")
    .select("*, instructors(full_name)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((r) => {
      const overallScore =
        (r.rating_value + r.rating_effectiveness + r.rating_punctuality) / 3;
      return {
        id: r.id,
        instructorId: r.instructor_id,
        instructorName:
          (r.instructors as { full_name: string } | null)?.full_name ?? null,
        value: r.rating_value,
        effectiveness: r.rating_effectiveness,
        punctuality: r.rating_punctuality,
        overallScore,
        comment: r.comment,
        status: r.moderation_status,
        createdAt: r.created_at,
      };
    })
  );
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    instructor_id,
    rating_value,
    rating_effectiveness,
    rating_punctuality,
    comment,
    session_date,
    session_time,
    session_location,
  } = body;

  if (
    !instructor_id ||
    rating_value == null ||
    rating_effectiveness == null ||
    rating_punctuality == null ||
    !session_date ||
    !session_time ||
    !session_location
  ) {
    return NextResponse.json(
      { error: "All session details are required" },
      { status: 400 }
    );
  }

  const scores = [rating_value, rating_effectiveness, rating_punctuality];
  if (scores.some((s: number) => s < 0 || s > 5)) {
    return NextResponse.json(
      { error: "Scores must be between 0 and 5" },
      { status: 400 }
    );
  }

  if (new Date(session_date) > new Date()) {
    return NextResponse.json(
      { error: "Session date cannot be in the future" },
      { status: 400 }
    );
  }

  const db = createServiceClient();

  // Ensure user exists in users table
  await db.from("users").upsert(
    {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email!,
    },
    { onConflict: "id" }
  );

  // Check for duplicate (same student, same instructor, same date)
  const { data: existing } = await db
    .from("reviews")
    .select("id")
    .eq("student_id", user.id)
    .eq("instructor_id", instructor_id)
    .eq("session_date", session_date)
    .single();

  if (existing) {
    return NextResponse.json(
      {
        error:
          "You have already submitted a review for a session with this instructor on this date",
      },
      { status: 409 }
    );
  }

  const { data: review, error } = await db
    .from("reviews")
    .insert({
      student_id: user.id,
      instructor_id,
      rating_value,
      rating_effectiveness,
      rating_punctuality,
      comment: comment || null,
      session_date,
      session_time,
      session_location,
      is_verified: false,
      moderation_status: "approved",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch instructor details for notifications/emails
  const { data: instructorData } = await db
    .from("instructors")
    .select("full_name, is_claimed, claimed_by")
    .eq("id", instructor_id)
    .single();

  // Notification to reviewer (student)
  await db.from("notifications").insert({
    user_id: user.id,
    type: "review_submitted",
    message: `Your review for ${
      instructorData?.full_name ?? "the instructor"
    } has been submitted and is pending verification.`,
  });

  // If instructor has claimed their profile, send them a verification request
  console.log("[reviews/POST] instructorData:", JSON.stringify(instructorData));
  console.log("[reviews/POST] is_claimed:", instructorData?.is_claimed, "claimed_by:", instructorData?.claimed_by);

  if (instructorData?.is_claimed && instructorData.claimed_by) {
    const [{ data: instructorUser }, { data: studentData }] = await Promise.all([
      db.from("users").select("email").eq("id", instructorData.claimed_by).single(),
      db.from("users").select("full_name").eq("id", user.id).single(),
    ]);

    console.log("[reviews/POST] instructorUser email:", instructorUser?.email ?? "(none)");
    console.log("[reviews/POST] studentData:", JSON.stringify(studentData));

    // In-app notification to instructor
    await db.from("notifications").insert({
      user_id: instructorData.claimed_by,
      type: "verification_requested",
      related_review_id: review.id,
      related_instructor_id: instructor_id,
      message: `A student wants you to verify a session on ${session_date}`,
    });

    // Email to instructor (best-effort, never blocks the response)
    console.log('=== EMAIL DEBUG ===');
    console.log('instructor is_claimed:', instructorData?.is_claimed);
    console.log('claimed_by:', instructorData?.claimed_by);
    console.log('instructor email:', instructorUser?.email);
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL);

    if (instructorUser?.email) {
      console.log("[reviews/POST] Sending verification email to:", instructorUser.email);
      try {
        const result = await sendVerificationRequestEmail({
          to: instructorUser.email,
          instructorName: instructorData.full_name,
          studentName: studentData?.full_name || "A student",
          sessionDate: session_date,
          sessionTime: session_time,
          sessionLocation: session_location,
        });
        console.log('Email send result:', result);
        console.log("[reviews/POST] Verification email sent successfully");
      } catch (emailErr) {
        console.error('Email send FAILED:', emailErr);
      }
    } else {
      console.log("[reviews/POST] No instructor email found — skipping email");
    }
  } else {
    console.log("[reviews/POST] Instructor not claimed — no email sent");
  }

  return NextResponse.json({ review }, { status: 201 });
}
