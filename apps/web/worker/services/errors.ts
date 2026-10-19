export class ApiError extends Error {
  constructor(
    public status:
      400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 429 | 500 | 503,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const invalid = () =>
  new ApiError(400, 'invalid_input', 'Check the report fields and try again.');
