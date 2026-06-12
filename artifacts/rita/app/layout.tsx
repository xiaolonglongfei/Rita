import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rita — Find the Right Tennis Instructor",
  description:
    "Data-driven reviews and rankings for tennis instructors in Westchester County, NY.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
