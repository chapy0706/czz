// apps/user/app/auth/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp
      path="/auth/sign-up"
      routing="path"
      signInUrl="/auth/sign-in"
      fallbackRedirectUrl="/"
    />
  );
}
