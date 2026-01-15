/**
 * Response helpers for formatting A2A responses
 */

/**
 * Prepares a response object by wrapping the result in the appropriate success or error response type
 */
export function prepareResponseObject<T, TResponse, TSuccessResponse, TErrorResponse>(
  requestId: string | number | null,
  result: any,
  allowedTypes: any[],
  successResponseClass: any,
  responseClass: any
): TResponse {
  // Check if result is an allowed type
  const isAllowedType = allowedTypes.some(type => {
    if (type === Array) {
      return Array.isArray(result);
    }
    return result?.kind === type?.kind || result instanceof type;
  });

  if (isAllowedType) {
    // Return success response
    return {
      root: {
        id: requestId,
        result: result,
      } as TSuccessResponse,
    } as TResponse;
  }

  // Return error response
  return {
    root: {
      id: requestId,
      error: {
        code: -32000,
        message: 'Invalid result type',
      },
    } as any,
  } as TResponse;
}
