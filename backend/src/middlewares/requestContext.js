import crypto from 'crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

const requestContextStorage = new AsyncLocalStorage();

export function requestContext(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.trim() ? incomingId : crypto.randomUUID();

  requestContextStorage.run({ requestId }, () => {
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });
}

export function attachResponseMeta(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};
      body.meta = { ...meta, requestId: req.requestId };
    }
    return originalJson(body);
  };

  next();
}

export function getRequestContext() {
  return requestContextStorage.getStore();
}

export function setRequestContextUser(user) {
  const store = requestContextStorage.getStore();
  if (!store) {
    return;
  }
  store.user = user;
}

export function setRequestContextMetadata(metadata) {
  const store = requestContextStorage.getStore();
  if (!store) {
    return;
  }
  Object.assign(store, metadata);
}

export function runWithRequestContext(context, callback) {
  return requestContextStorage.run(context, callback);
}
