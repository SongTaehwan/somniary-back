import { HTTP_ERRORS, HTTP_STATUS, CONTENT_TYPES } from "../error/constant.ts";

export class HttpException {
  private readonly response: Response;

  constructor(
    error: keyof typeof HTTP_ERRORS,
    status: number,
    message?: string,
    details?: Record<string, unknown>
  ) {
    const body = {
      error: HTTP_ERRORS[error],
      message: message || null,
      ...(details && { details }),
    };

    this.response = new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": CONTENT_TYPES.JSON,
      },
    });
  }

  // 편의 메서드들
  static badRequest(
    message?: string,
    details?: Record<string, unknown>
  ): Response {
    return new HttpException(
      "BAD_REQUEST",
      HTTP_STATUS.BAD_REQUEST,
      message,
      details
    ).response;
  }

  static unauthorized(
    message?: string,
    details?: Record<string, unknown>
  ): Response {
    return new HttpException(
      "UNAUTHORIZED",
      HTTP_STATUS.UNAUTHORIZED,
      message,
      details
    ).response;
  }

  static forbidden(
    message?: string,
    details?: Record<string, unknown>
  ): Response {
    return new HttpException(
      "FORBIDDEN",
      HTTP_STATUS.FORBIDDEN,
      message,
      details
    ).response;
  }

  static notFound(
    message?: string,
    details?: Record<string, unknown>
  ): Response {
    return new HttpException(
      "NOT_FOUND",
      HTTP_STATUS.NOT_FOUND,
      message,
      details
    ).response;
  }

  static methodNotAllowed(
    message?: string,
    allowedMethods?: string[]
  ): Response {
    const response = new HttpException(
      "METHOD_NOT_ALLOWED",
      HTTP_STATUS.METHOD_NOT_ALLOWED,
      message
    ).response;

    if (allowedMethods) {
      response.headers.set("Allow", allowedMethods.join(", "));
    }

    return response;
  }

  static conflict(
    message?: string,
    details?: Record<string, unknown>
  ): Response {
    return new HttpException("CONFLICT", HTTP_STATUS.CONFLICT, message, details)
      .response;
  }

  static unprocessableEntity(
    message?: string,
    details?: Record<string, unknown>
  ): Response {
    return new HttpException(
      "UNPROCESSABLE_ENTITY",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message,
      details
    ).response;
  }

  static tooManyRequests(message?: string, retryAfter?: number): Response {
    const response = new HttpException(
      "TOO_MANY_REQUESTS",
      HTTP_STATUS.TOO_MANY_REQUESTS,
      message
    ).response;

    if (retryAfter) {
      response.headers.set("Retry-After", retryAfter.toString());
    }

    return response;
  }

  static internalError(
    message?: string,
    details?: Record<string, unknown>
  ): Response {
    return new HttpException(
      "INTERNAL_ERROR",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message,
      details
    ).response;
  }
}
