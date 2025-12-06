// apps/admin/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind のクラス名をいい感じにマージするヘルパー
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
