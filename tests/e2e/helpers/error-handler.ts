/**
 * Standardized error handling utilities for e2e tests
 */

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public responseBody?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Custom error class for element not found errors
 */
export class ElementNotFoundError extends Error {
  constructor(selector: string, context?: string) {
    const contextMsg = context ? ` in ${context}` : "";
    super(`Element not found: ${selector}${contextMsg}`);
    this.name = "ElementNotFoundError";
  }
}

/**
 * Safely executes an async operation and returns a default value on error
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  defaultValue: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (errorMessage) {
      console.warn(`${errorMessage}:`, error);
    }
    return defaultValue;
  }
}

/**
 * Checks if a response is OK and throws a standardized error if not
 */
export async function ensureResponseOk(
  response: Response,
  context: string
): Promise<void> {
  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Unable to read error response");
    throw new ApiError(
      `API request failed in ${context}`,
      response.status,
      response.statusText,
      errorText
    );
  }
}

/**
 * Gets response body as JSON with error handling
 */
export async function getResponseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError(
      `Failed to parse response as JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Standardized error message formatter
 */
export function formatErrorMessage(
  operation: string,
  context?: string,
  details?: string
): string {
  const parts = [operation];
  if (context) {
    parts.push(`(${context})`);
  }
  if (details) {
    parts.push(`: ${details}`);
  }
  return parts.join(" ");
}
