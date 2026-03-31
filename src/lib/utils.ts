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
    timeZone: "Asia/Dhaka"
  }).replace(/\u202f/g, ' ')
}

export function formatTime(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka"
  }).replace(/\u202f/g, ' ')
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

export function validateAndSanitizeImage(image: any): string | undefined {
  if (!image) return undefined;

  if (typeof image !== 'string') {
    throw new Error('Image must be a string');
  }

  // Data URI validation
  if (image.startsWith('data:')) {
    // Check max size (approx 5MB)
    // Base64 is ~1.33x larger than binary. 5MB binary ~= 6.65MB base64
    if (image.length > 7 * 1024 * 1024) {
      throw new Error('Image is too large. Maximum size is 5MB.');
    }

    // Validate MIME type and format
    // Allow commonly supported web image formats
    const dataUriPattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/;
    if (!dataUriPattern.test(image)) {
      throw new Error('Invalid image format. Only PNG, JPEG, GIF, and WebP are allowed.');
    }

    return image;
  }

  // URL validation
  if (image.startsWith('http')) {
    if (image.length > 2048) {
      throw new Error('Image URL is too long');
    }

    try {
      const url = new URL(image);
      if (url.protocol !== 'https:') {
        throw new Error('Image URL must use HTTPS');
      }
      return image;
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error('Invalid image URL');
    }
  }

  // Reject unsupported formats
  throw new Error('Invalid image source. Must be a valid HTTPS URL or Data URI.');
}

export function isValidVisibility(visibility: string): boolean {
  return ['public', 'private'].includes(visibility);
}

export function isValidStatus(status: string): boolean {
  return ['draft', 'published'].includes(status);
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractPlainText(description: string | any): string {
  if (!description) return "";

  try {
    let content = description;

    // Handle stringified JSON (including potentially double-stringified)
    if (typeof content === "string") {
      try {
        let parsed = JSON.parse(content);
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            // ignore second parse error
          }
        }
        content = parsed;
      } catch (e) {
        // content is already plain text
        return content;
      }
    }

    // Ensure content matches Tiptap schema structure
    if (!content || typeof content !== "object") {
      return String(content || "");
    }

    // Handle both { type: 'doc', content: [...] } and direct array
    const nodes = Array.isArray(content) ? content : content.content;

    if (!Array.isArray(nodes)) {
      return "";
    }

    const processNodes = (nodeList: any[]): string => {
      return nodeList
        .map((node: any) => {
          if (node.type === "text") {
            return node.text || "";
          }
          if (node.content && Array.isArray(node.content)) {
            return processNodes(node.content);
          }
          if (node.type === "hardBreak") {
            return "\n";
          }
          // Add spacing for block elements
          if (["paragraph", "heading", "listItem"].includes(node.type)) {
            return processNodes(node.content || []) + "\n";
          }
          return "";
        })
        .join("");
    };

    return processNodes(nodes).trim();
  } catch (e) {
    console.error("Error extracting plain text:", e);
    return typeof description === "string" ? description : "";
  }
}


