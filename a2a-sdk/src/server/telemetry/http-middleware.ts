/**
 * HTTP Middleware for Telemetry
 *
 * Provides Express and Fastify middleware for automatic request tracing
 * and metrics collection for HTTP operations.
 */

import type { Request, Response, NextFunction } from 'express';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { A2ATelemetryWrapper } from './telemetry-wrapper';

export interface TelemetryMiddlewareOptions {
  /** Enable request tracing */
  enabled?: boolean;

  /** Custom attribute extractor function */
  attributeExtractor?: (req: any) => Record<string, string | number | boolean>;

  /** Skip paths (regex patterns) */
  skipPaths?: RegExp[];
}

/**
 * Express middleware for request tracing
 */
export function createExpressTelemetryMiddleware(
  telemetry: A2ATelemetryWrapper,
  options: TelemetryMiddlewareOptions = {}
) {
  const { enabled = true, attributeExtractor, skipPaths = [] } = options;

  if (!enabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const path = req.route?.path || req.path || req.url;

    // Skip telemetry for certain paths
    if (skipPaths.some(pattern => pattern.test(path))) {
      return next();
    }

    // Create span
    const span = telemetry.traceServerRequest(req.method, path);

    // Add custom attributes if provided
    if (attributeExtractor) {
      const attributes = attributeExtractor(req);
      telemetry.addAttributes(span, attributes);
    }

    // Add request ID if available
    const requestId = (req.headers['x-request-id'] as string) ||
                     (req.headers['x-correlation-id'] as string);
    if (requestId) {
      telemetry.addAttributes(span, {
        'http.request.id': requestId,
      });
    }

    // Capture response
    const originalSend = res.send;
    res.send = function(data?: any): Response {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      telemetry.recordHttpRequest(req.method, path, statusCode, duration);
      telemetry.setSuccess(span, statusCode < 400);

      span?.end();
      return originalSend.call(this, data);
    };

    // Handle errors
    res.on('error', (error) => {
      const duration = Date.now() - startTime;
      telemetry.recordException(span, error);
      telemetry.recordHttpRequest(req.method, path, 500, duration);
      telemetry.setSuccess(span, false);
      span?.end();
    });

    next();
  };
}

/**
 * Fastify middleware for request tracing
 */
export function createFastifyTelemetryMiddleware(
  telemetry: A2ATelemetryWrapper,
  options: TelemetryMiddlewareOptions = {}
) {
  const { enabled = true, attributeExtractor, skipPaths = [] } = options;

  if (!enabled) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      // No-op
    };
  }

  return async (req: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const path = req.routerPath || req.url;

    // Skip telemetry for certain paths
    if (skipPaths.some(pattern => pattern.test(path))) {
      return;
    }

    // Create span
    const span = telemetry.traceServerRequest(req.method, path);

    // Add custom attributes if provided
    if (attributeExtractor) {
      const attributes = attributeExtractor(req);
      telemetry.addAttributes(span, attributes);
    }

    // Add request ID if available
    const requestId = req.headers['x-request-id'] as string ||
                     req.headers['x-correlation-id'] as string;
    if (requestId) {
      telemetry.addAttributes(span, {
        'http.request.id': requestId,
      });
    }

    // Capture response when sent
    reply.raw.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = reply.statusCode;

      telemetry.recordHttpRequest(req.method, path, statusCode, duration);
      telemetry.setSuccess(span, statusCode < 400);
      span?.end();
    });

    // Handle errors
    reply.raw.on('error', (error: Error) => {
      const duration = Date.now() - startTime;
      telemetry.recordException(span, error);
      telemetry.recordHttpRequest(req.method, path, 500, duration);
      telemetry.setSuccess(span, false);
      span?.end();
    });
  };
}

/**
 * Extract common HTTP attributes from request
 */
export function extractHttpAttributes(req: any): Record<string, string | number | boolean> {
  const attributes: Record<string, string | number | boolean> = {
    'http.url': req.url,
    'http.scheme': req.protocol || req.scheme,
    'http.host': req.get?.('host') || req.headers?.host,
  };

  // Add user agent
  const userAgent = req.get?.('user-agent') || req.headers?.['user-agent'];
  if (userAgent) {
    attributes['http.user_agent'] = userAgent;
  }

  // Add content length
  const contentLength = req.get?.('content-length') || req.headers?.['content-length'];
  if (contentLength) {
    attributes['http.request.content_length'] = parseInt(contentLength as string, 10);
  }

  // Add content type
  const contentType = req.get?.('content-type') || req.headers?.['content-type'];
  if (contentType) {
    attributes['http.request.content_type'] = contentType;
  }

  return attributes;
}
