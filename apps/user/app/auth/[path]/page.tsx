// apps/user/app/auth/[path]/page.tsx
import { redirect } from "next/navigation";

export default function AuthPathPage() {
	redirect("/auth/sign-in");
}
