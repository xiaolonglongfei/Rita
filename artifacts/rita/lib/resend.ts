import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export async function sendVerificationRequestEmail({
  to,
  instructorName,
  studentName,
  sessionDate,
  sessionTime,
  sessionLocation,
}: {
  to: string;
  instructorName: string;
  studentName: string;
  sessionDate: string;
  sessionTime: string;
  sessionLocation: string;
}) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `A student wants you to verify a session`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e2a38;">Rovi<span style="color: #b8d400;">.</span></h2>
          <p style="color: #1e2a38; font-size: 16px;">Hi ${instructorName},</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            <strong>${studentName}</strong> has submitted a review and is asking you to confirm the session happened.
          </p>
          <div style="background: #fff7ed; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #1e2a38; font-size: 14px;">📅 ${new Date(sessionDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            <p style="margin: 4px 0; color: #1e2a38; font-size: 14px;">🕐 ${sessionTime}</p>
            <p style="margin: 4px 0; color: #1e2a38; font-size: 14px;">📍 ${sessionLocation}</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">
            Log in to Rovi to confirm or deny this session. You will not see the student's rating or comments — only the session details.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/sessions" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 16px;">
            Review Request →
          </a>
        </div>
      `,
    });
    return result;
  } catch (error) {
    console.error("Failed to send verification request email:", error);
    throw error;
  }
}

export async function sendWelcomeEmail({
  to,
  fullName,
}: {
  to: string;
  fullName: string;
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to Rovi!`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e2a38;">Rovi<span style="color: #b8d400;">.</span></h2>
          <p style="color: #1e2a38; font-size: 16px;">Hi ${fullName},</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Welcome to Rovi! You can now browse tennis instructors
            and leave honest, anonymous reviews.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/instructors"
             style="display: inline-block; background: #f97316; color: white;
             padding: 12px 24px; border-radius: 10px; text-decoration: none;
             font-weight: bold; margin-top: 16px;">
            Browse Instructors →
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            🔒 All your reviews are completely anonymous.
            Your identity is never revealed to instructors.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export async function sendVerificationConfirmedEmail({
  to,
  instructorName,
  sessionDate,
}: {
  to: string;
  instructorName: string;
  sessionDate: string;
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your session has been verified ✓`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e2a38;">Rovi<span style="color: #b8d400;">.</span></h2>
          <p style="color: #1e2a38; font-size: 16px;">Good news!</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            <strong>${instructorName}</strong> has confirmed your session on 
            ${new Date(sessionDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
            Your review is now marked as <strong>Verified</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            🔒 Your identity remains anonymous. The instructor only confirmed the session details — they cannot see your rating.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification confirmed email:", error);
    throw error;
  }
}
