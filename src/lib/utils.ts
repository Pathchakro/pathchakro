import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\p{L}\p{N}\p{M}\-]+/gu, '') // Remove non-word chars (keeping letters, numbers, AND marks)
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}
export function calculateProfileCompletion(user: any): number {
  if (!user) return 0;

  const fields = [
    user.name,
    user.email,
    user.image,
    user.bio,
    user.location,
    user.phone,
    user.academic?.institution,
    user.career?.currentPosition,
    user.address?.present,
    user.address?.permanent,
    user.verification?.documentUrl
  ];

  const filledFields = fields.filter(field => field && field.toString().length > 0).length;
  return Math.round((filledFields / fields.length) * 100);
}
