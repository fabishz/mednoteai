const DANGEROUS_TAG_PATTERN = /<\/?\s*(script|style|iframe|object|embed|svg|math)[^>]*>/gi;
const EVENT_HANDLER_PATTERN = /on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_PROTOCOL_PATTERN = /javascript\s*:/gi;

function sanitizeString(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(DANGEROUS_TAG_PATTERN, '')
    .replace(EVENT_HANDLER_PATTERN, '')
    .replace(JAVASCRIPT_PROTOCOL_PATTERN, '')
    .trim();
}

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, nested]) => {
      acc[key] = sanitizeValue(nested);
      return acc;
    }, {});
  }

  return value;
}

export function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  next();
}
