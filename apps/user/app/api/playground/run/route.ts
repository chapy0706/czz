// apps/user/app/api/playground/run/route.ts
import { NextResponse } from "next/server";

import {
	PlaygroundRequestSchema,
	PlaygroundResponseSchema,
} from "@/lib/terminal/playgroundContract";
import { execute } from "../../../../../../packages/dsl-core/src/execute";
import { dslProgramSchema } from "../../../../../../packages/dsl-core/src/schema";

export async function POST(req: Request) {
	const json = await req.json().catch(() => null);
	const parsed = PlaygroundRequestSchema.safeParse(json);

	if (!parsed.success) {
		return NextResponse.json(
			PlaygroundResponseSchema.parse({
				ok: false,
				error: { message: "Invalid request", details: parsed.error.flatten() },
			}),
			{ status: 400 },
		);
	}

	try {
		const { debugInput, submittedProgram } = parsed.data;

		const programParsed = dslProgramSchema.safeParse(submittedProgram);
		if (!programParsed.success) {
			return NextResponse.json(
				PlaygroundResponseSchema.parse({
					ok: false,
					error: {
						message: "Invalid program",
						details: programParsed.error.flatten(),
					},
				}),
				{ status: 400 },
			);
		}

		const output = execute(programParsed.data, debugInput);

		return NextResponse.json(
			PlaygroundResponseSchema.parse({
				ok: true,
				output,
			}),
		);
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Playground failed";
		return NextResponse.json(
			PlaygroundResponseSchema.parse({
				ok: false,
				error: { message, details: String(e) },
			}),
			{ status: 500 },
		);
	}
}
