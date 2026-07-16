// FisherMart — Utility Helper Functions

/**
 * Format a number as Nigerian Naira currency
 */
export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

/**
 * Format a date string to a human-readable relative time (e.g. "2 hours ago")
 */
export const formatRelativeTime = (isoString: string): string => {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
};

/**
 * Format a date string for display (e.g. "Jul 11, 2026")
 */
export const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/**
 * Format a date/time string (e.g. "Jul 11, 2026 10:45 AM")
 */
export const formatDateTime = (isoString: string): string => {
  return new Date(isoString).toLocaleString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/**
 * Truncate text to a max length with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generate a display-friendly product description
 */
export const getProductSummary = (quantity: number, unit: string, price: number): string => {
  return `${quantity} ${unit} @ ${formatNaira(price)}/${unit}`;
};

/**
 * Compute total price for a given quantity and price per unit
 */
export const computeTotal = (quantity: number, pricePerUnit: number): number => {
  return Math.round(quantity * pricePerUnit * 100) / 100;
};

/**
 * Validate Nigerian phone number (e.g. 080xxxxxxxx)
 */
export const isValidNigerianPhone = (phone: string): boolean => {
  return /^(0|\+234)[789][01]\d{8}$/.test(phone.trim());
};

/**
 * Return the initials from a full name (e.g. "Iyio Emmanuel" → "IE")
 */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Delay for a given number of milliseconds (async sleep)
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
