const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again later.';
const MAX_VALIDATION_MESSAGES = 3;
const MAX_SAFE_TEXT_LENGTH = 300;

const LOC_CONTAINERS = new Set(['body', 'query', 'path', 'header', 'cookie']);

const UNSAFE_SERVER_PATTERNS = [
  /<\s*(?:!doctype|html|head|body|title|script|style)\b/i,
  /traceback\s*\(most recent call last\)/i,
  /file\s+"[^"]+",\s*line\s+\d+/i,
  /\bat\s+[\w.$<>]+\s*\([^)]*:\d+:\d+\)/,
  /\b(?:sqlalchemy|psycopg|sqlite3|pydantic_core|starlette|uvicorn)\b/i,
];

function isUnsafeServerText(text) {
  if (!text) return true;
  if (text.length > MAX_SAFE_TEXT_LENGTH) return true;
  return UNSAFE_SERVER_PATTERNS.some((pattern) => pattern.test(text));
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mentionsField(text, fieldLabel) {
  if (!fieldLabel) return false;
  const pattern = new RegExp(`\\b${escapeRegExp(fieldLabel)}\\b`, 'i');
  return pattern.test(text);
}

function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || isUnsafeServerText(trimmed)) return '';
  return trimmed;
}

function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ensureSentencePunctuation(text) {
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function formatFieldLabel(loc) {
  if (!Array.isArray(loc) || loc.length === 0) return '';

  for (let i = loc.length - 1; i >= 0; i -= 1) {
    const segment = loc[i];
    if (typeof segment !== 'string') continue;
    const normalized = segment.trim();
    if (!normalized || LOC_CONTAINERS.has(normalized.toLowerCase())) continue;
    return normalized
      .split('_')
      .filter(Boolean)
      .map((part) => capitalize(part))
      .join(' ');
  }

  return '';
}

function formatValidationItem(item) {
  if (typeof item === 'string') {
    const clean = sanitizeText(item);
    return clean ? capitalize(clean) : '';
  }

  if (!item || typeof item !== 'object') return '';

  const rawMsg =
    typeof item.msg === 'string'
      ? item.msg
      : typeof item.message === 'string'
        ? item.message
        : '';

  const cleaned = sanitizeText(rawMsg.replace(/^value error,\s*/i, ''));
  if (!cleaned) return '';

  const displayMsg = capitalize(cleaned);
  const fieldLabel = formatFieldLabel(item.loc);

  if (fieldLabel && !mentionsField(displayMsg, fieldLabel)) {
    return `${fieldLabel}: ${displayMsg}`;
  }

  return displayMsg;
}

function formatValidationArray(items) {
  const unique = [];
  const seen = new Set();

  for (const item of items) {
    const formatted = formatValidationItem(item);
    if (!formatted || seen.has(formatted)) continue;
    seen.add(formatted);
    unique.push(ensureSentencePunctuation(formatted));
    if (unique.length >= MAX_VALIDATION_MESSAGES) break;
  }

  const combined = unique.join(' ');
  return combined.length > MAX_SAFE_TEXT_LENGTH ? '' : combined;
}

function extractFromDetailValue(detail) {
  if (typeof detail === 'string') {
    return sanitizeText(detail);
  }

  if (Array.isArray(detail)) {
    return formatValidationArray(detail);
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.detail === 'string' || Array.isArray(detail.detail)) {
      return extractFromDetailValue(detail.detail);
    }
    if (typeof detail.msg === 'string') {
      return sanitizeText(detail.msg);
    }
    if (typeof detail.message === 'string') {
      return sanitizeText(detail.message);
    }
  }

  return '';
}

/**
 * Convert an arbitrary notification input (string, validation array, or error object)
 * into a safe string suitable for React rendering. Returns '' for empty/nullish inputs.
 */
export function toSafeDisplayMessage(value, fallbackMessage = DEFAULT_ERROR_MESSAGE) {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'string') {
    const clean = sanitizeText(value);
    return clean || fallbackMessage;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : fallbackMessage;
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (
    value instanceof Error ||
    (value && typeof value === 'object' && ('response' in value || 'request' in value || value.isAxiosError))
  ) {
    return extractApiErrorMessage(value, fallbackMessage);
  }

  const extracted = extractFromDetailValue(value);
  return extracted || fallbackMessage;
}

/**
 * Extract a safe, human-readable error message from an Axios/FastAPI error.
 * Handles string `detail`, FastAPI 422 `detail` arrays, unexpected objects,
 * network errors, and suppresses 5xx internal error details or stack traces.
 */
export function extractApiErrorMessage(error, fallbackMessage = DEFAULT_ERROR_MESSAGE) {
  const response = error?.response;
  if (!response || typeof response !== 'object') {
    return fallbackMessage;
  }

  if (typeof response.status === 'number' && response.status >= 500) {
    return fallbackMessage;
  }

  const data = response.data;
  if (data === null || data === undefined) {
    return fallbackMessage;
  }

  if (typeof data === 'string' || Array.isArray(data)) {
    return extractFromDetailValue(data) || fallbackMessage;
  }

  if (typeof data === 'object') {
    const candidate =
      extractFromDetailValue(data.detail) ||
      extractFromDetailValue(data.message) ||
      extractFromDetailValue(data.error);
    return candidate || fallbackMessage;
  }

  return fallbackMessage;
}
