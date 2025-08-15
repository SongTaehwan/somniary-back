export type Handler = (req: Request) => Response | Promise<Response>;

export function withMethodGuard(allowedMethods: string[], handler: Handler): Handler {
  const allowed = allowedMethods.map((method) => method.toUpperCase());

  return async (request: Request) => {
    if (!allowed.includes(request.method.toUpperCase())) {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Allow": allowed.join(", "),
        },
      });
    }

    return handler(request);
  };
}
