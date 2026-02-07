// apps/user/src/lib/terminal/playgroundClient.ts
import {
	PlaygroundRequestSchema,
	type PlaygroundResponse,
	PlaygroundResponseSchema,
} from "@/lib/terminal/playgroundContract";

export async function runPlayground(params: {
	debugInput: number[];
	submittedProgram: unknown;
}): Promise<PlaygroundResponse> {
	const parsedReq = PlaygroundRequestSchema.safeParse(params);
	if (!parsedReq.success) {
		return {
			ok: false,
			error: {
				message: "Invalid playground params",
				details: parsedReq.error.flatten(),
			},
		};
	}

	try {
		const res = await fetch("/api/playground/run", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(parsedReq.data),
		});

		const data = await res.json().catch(() => null);
		const parsedRes = PlaygroundResponseSchema.safeParse(data);

		if (parsedRes.success) return parsedRes.data;

		return {
			ok: false,
			error: {
				message: !res.ok ? `HTTP ${res.status}` : "Invalid API response shape",
				details: data,
			},
		};
	} catch (e) {
		return {
			ok: false,
			error: {
				message: "Network error (failed to reach playground API)",
				details: String(e),
			},
		};
	}
}
