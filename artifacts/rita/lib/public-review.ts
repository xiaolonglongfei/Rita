/** The complete review allow-list shared by the public API and profile page. */
export const PUBLIC_REVIEW_FIELDS =
  "id, rating_value, rating_effectiveness, rating_punctuality, comment, created_at, is_verified";

export type PublicReview = {
  id: string;
  rating_value: number;
  rating_effectiveness: number;
  rating_punctuality: number;
  comment: string | null;
  created_at: string;
  is_verified: boolean;
};

export function toPublicReview(review: PublicReview): PublicReview {
  return {
    id: review.id,
    rating_value: review.rating_value,
    rating_effectiveness: review.rating_effectiveness,
    rating_punctuality: review.rating_punctuality,
    comment: review.comment,
    created_at: review.created_at,
    is_verified: review.is_verified,
  };
}
