export function isIndexableInstructor(instructor: {
  is_active?: boolean | null;
  is_test?: boolean | null;
  reviews_visible?: boolean | null;
}) {
  return instructor.is_active === true &&
    instructor.is_test === false &&
    instructor.reviews_visible === true;
}

export function plainTextBio(bio: string | null | undefined) {
  return (bio ?? "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, value: string) => {
      const point = value[0].toLowerCase() === "x"
        ? parseInt(value.slice(1), 16) : parseInt(value, 10);
      return point <= 0x10ffff ? String.fromCodePoint(point) : "";
    })
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}
