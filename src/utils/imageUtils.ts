// Get Supabase base URL from environment
const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

/**
 * Converts a relative URL to an absolute URL
 * @param url - The URL to convert (can be relative or absolute)
 * @returns The absolute URL
 */
export const getImageUrl = (url?: string | null): string => {
  if (!url) return '';

  // If it's already an absolute URL (starts with http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a relative URL, prepend the Supabase base URL
  if (url.startsWith('/')) {
    return `${SUPABASE_BASE_URL}${url}`;
  }

  return `${SUPABASE_BASE_URL}/${url}`;
};

/**
 * Gets the best image URL for display (preferring thumbnail format)
 * @param photo - The photo object from Strapi API
 * @returns The optimal image URL
 */
export const getOptimalImageUrl = (photo?: {
  url?: string;
  formats?: {
    thumbnail?: {
      url?: string;
    };
    small?: {
      url?: string;
    };
    medium?: {
      url?: string;
    };
  };
}): string => {
  if (!photo) return '';

  // Prefer thumbnail format
  if (photo.formats?.thumbnail?.url) {
    return getImageUrl(photo.formats.thumbnail.url);
  }

  // Fall back to small format
  if (photo.formats?.small?.url) {
    return getImageUrl(photo.formats.small.url);
  }

  // Fall back to medium format
  if (photo.formats?.medium?.url) {
    return getImageUrl(photo.formats.medium.url);
  }

  // Fall back to original image
  return getImageUrl(photo.url);
};