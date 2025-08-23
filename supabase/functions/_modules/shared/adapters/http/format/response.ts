import { CONTENT_TYPES } from "./constant.ts";

export class HttpResponse {
  private readonly response: Response;

  constructor(status: number, body?: unknown) {
    this.response = new Response(body ? JSON.stringify(body) : undefined, {
      status,
      headers: {
        "Content-Type": CONTENT_TYPES.JSON,
      },
    });
  }

  static void(status: number) {
    return new HttpResponse(status).response;
  }

  static message(status: number, body: unknown) {
    return new HttpResponse(status, body).response;
  }
}
