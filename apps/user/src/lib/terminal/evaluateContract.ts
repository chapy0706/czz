// apps/user/src/lib/terminal/evaluateContract.ts
import { z } from "zod";

export const EvaluateErrorKindSchema = z.enum(["ZOD", "TEST", "NETWORK", "UNKNOWN"]);

export const EvaluateErrorSchema = z.object({
  kind: EvaluateErrorKindSchema,
  message: z.string(),
  details: z.unknown().optional(),
});

export const EvaluateResponseOkSchema = z.object({
  ok: z.literal(true),
  passed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  output: z.unknown().optional(),
});

export const EvaluateResponseErrSchema = z.object({
  ok: z.literal(false),
  passed: z.number().int().nonnegative().optional(),
  total: z.number().int().nonnegative().optional(),
  error: EvaluateErrorSchema,
});

export const EvaluateResponseSchema = z.union([
  EvaluateResponseOkSchema,
  EvaluateResponseErrSchema,
]);

export type EvaluateResponse = z.infer<typeof EvaluateResponseSchema>;
export type EvaluateErrorKind = z.infer<typeof EvaluateErrorKindSchema>;
export type EvaluateError = z.infer<typeof EvaluateErrorSchema>;
