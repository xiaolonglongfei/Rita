export type Instructor = {
  id: number;
  name: string;
  bio: string | null;
  specialty: string;
  photo_url: string | null;
  location: string | null;
  verified: boolean;
  avg_score: number;
  avg_value: number;
  avg_effectiveness: number;
  avg_punctuality: number;
  review_count: number;
  public_rank: number | null;
  created_at: string;
};

export type Review = {
  id: number;
  user_id: string;
  instructor_id: number;
  session_id: number | null;
  value: number;
  effectiveness: number;
  punctuality: number;
  overall_score: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  moderation_note: string | null;
  created_at: string;
};

export type Session = {
  id: number;
  user_id: string;
  instructor_id: number;
  session_date: string;
  verified: boolean;
  verification_code: string | null;
  notes: string | null;
  created_at: string;
};

export type Notification = {
  id: number;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

export type RankingEntry = {
  rank: number;
  instructorId: number;
  instructorName: string;
  instructorPhotoUrl: string | null;
  specialty: string;
  avgScore: number;
  reviewCount: number;
  verified: boolean;
};
