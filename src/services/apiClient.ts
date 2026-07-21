export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiResponseBody<T> = T & {
  error?: string;
  message?: string;
};

export async function requestJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponseBody<T>> {
  const response = await fetch(url, options);
  const data = (await response.json().catch(() => ({}))) as ApiResponseBody<T>;

  if (!response.ok) {
    throw new ApiError(
      data.message || data.error || "Something went wrong. Please try again.",
      response.status,
      data,
    );
  }

  return data;
}

export function jsonRequestOptions(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export function authHeader(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
