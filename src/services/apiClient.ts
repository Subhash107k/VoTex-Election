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
  // Ensure headers exist and inject a dev bypass header for local development
  const headers = new Headers(options.headers || {});
  try {
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    const hasAuth =
      headers.get("authorization") || headers.get("Authorization");
    if (isLocalhost && !hasAuth) {
      headers.set("x-votex-dev-bypass", "true");
    }
    try {
      // If a dev user override is stored in localStorage, forward it to the server
      if (typeof window !== "undefined" && (window as any).localStorage) {
        const devUser = (window as any).localStorage.getItem("votex_dev_user");
        if (devUser) headers.set("x-votex-dev-user", devUser);
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
  options = { ...options, headers };

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
