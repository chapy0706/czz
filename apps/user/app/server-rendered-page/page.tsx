// apps/user/app/server-rendered-page/page.tsx
import { neonAuth } from "@neondatabase/auth/next/server";

export default async function ServerRenderedPage() {
	const { session, user } = await neonAuth();

	return (
		<main style={{ padding: 16 }}>
			<h1>Server Rendered Page</h1>
			<p>Authenticated: {session ? "Yes" : "No"}</p>
			{user && <p>User ID: {user.id}</p>}
			<pre>{JSON.stringify({ session, user }, null, 2)}</pre>
		</main>
	);
}
