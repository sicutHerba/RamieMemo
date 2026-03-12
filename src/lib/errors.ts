// Custom error types for the application

/**
 * Error thrown when a memo cannot be found
 */
export class MemoNotFoundError extends Error {
  constructor(memoId: string) {
    super(`Memo not found: ${memoId}`);
    this.name = 'MemoNotFoundError';
  }
}

/**
 * Error thrown when memo index fails to load
 */
export class MemoIndexLoadError extends Error {
  constructor(message: string = 'Failed to load memo index') {
    super(message);
    this.name = 'MemoIndexLoadError';
  }
}

/**
 * Error thrown when a network request fails
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
