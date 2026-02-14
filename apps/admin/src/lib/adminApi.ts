// apps/admin/src/lib/adminApi.ts
import type { ApiResult } from "@/lib/contracts/taskContract";

function getAdminToken(): string {
	if (typeof window === "undefined") {
		return process.env.ADMIN_TOKEN ?? "";
	}
	const stored = window.localStorage.getItem("adminToken");
	const envToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
	return stored ?? envToken ?? "";
}

type RequestOptions = Omit<RequestInit, "headers"> & {
	headers?: Record<string, string>;
};

export async function adminApi<T>(
	path: string,
	options: RequestOptions = {},
): Promise<ApiResult<T>> {
	const headers = new Headers(options.headers ?? {});
	headers.set("accept", "application/json");
	const token = getAdminToken();
	if (token) headers.set("x-admin-token", token);

	const res = await fetch(path, {
		...options,
		headers,
		cache: "no-store",
	});

	const data = (await res.json().catch(() => null)) as ApiResult<T> | null;
	if (data && typeof data === "object" && "ok" in data) {
		return data;
	}

	if (!res.ok) {
		return {
			ok: false,
			error: {
				code: `http_${res.status}`,
				message: "Request failed.",
				details: data,
			},
		};
	}

	return {
		ok: true,
		data: (data as T) ?? (null as T),
	};
}
