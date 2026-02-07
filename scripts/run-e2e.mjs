// scripts/run-e2e.mjs
import { spawn } from "node:child_process";
import http from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = process.env.E2E_PORT ?? "3100";
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const HEALTH_PATH = process.env.E2E_HEALTH_PATH ?? "/";
const ATTACH = process.env.E2E_ATTACH === "1";

function log(msg) {
	process.stdout.write(`[e2e] ${msg}\n`);
}

function requestOk(url) {
	return new Promise((resolve) => {
		const req = http.get(url, (res) => {
			// “サーバが起きているか” の確認なので、HTTP応答が返れば基本OK。
			// 4xx は「ページが無い」だけで、サーバは起きている。
			// 5xx は起動途中/異常の可能性があるのでNG寄りにする。
			resolve(res.statusCode != null && res.statusCode < 500);
			res.resume();
		});
		req.on("error", () => resolve(false));
		req.setTimeout(1000, () => {
			req.destroy();
			resolve(false);
		});
	});
}

async function waitForServer(url, timeoutMs = 30_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		if (await requestOk(url)) return;
		await sleep(250);
	}
	throw new Error(`Server did not become ready in ${timeoutMs}ms: ${url}`);
}

function run(cmd, args, opts = {}) {
	return spawn(cmd, args, { stdio: "inherit", shell: false, ...opts });
}

async function main() {
	let dev = null;

	const shutdown = async () => {
		if (!dev) return;
		if (dev.killed) return;
		log("stopping dev server...");
		dev.kill("SIGTERM");
		await sleep(1500);
		if (!dev.killed) dev.kill("SIGKILL");
	};

	// すでにサーバが起きてるなら、自動で attach 扱いにする（EADDRINUSE回避）
	const url = `${BASE_URL}${HEALTH_PATH}`;
	const alreadyUp = await requestOk(url);

	if (ATTACH || alreadyUp) {
		log(
			ATTACH
				? "attach mode: will NOT start dev server (expect already running)"
				: `server already running: ${url} (skip starting dev server)`,
		);
	} else {
		log(`starting dev server: apps/user on port ${PORT}`);
		dev = run("pnpm", ["-C", "apps/user", "dev"], {
			// biome-ignore lint/style/useNamingConvention: env var keys are intentionally uppercase (PORT)
			env: { ...process.env, PORT: String(PORT) },
		});
	}

	const onSignal = async (sig) => {
		log(`received ${sig}`);
		await shutdown();
		process.exit(1);
	};

	process.on("SIGINT", onSignal);
	process.on("SIGTERM", onSignal);

	try {
		log(`waiting for server: ${BASE_URL}${HEALTH_PATH}`);
		await waitForServer(`${BASE_URL}${HEALTH_PATH}`, 45_000);
		log("server is ready");

		log("running playwright tests...");
		const pw = run("pnpm", ["-C", "e2e", "test"], {
			// biome-ignore lint/style/useNamingConvention: env var keys are intentionally uppercase (E2E_BASE_URL)
			env: { ...process.env, E2E_BASE_URL: BASE_URL },
		});

		const exitCode = await new Promise((resolve) =>
			pw.on("exit", (code) => resolve(code ?? 1)),
		);

		if (exitCode !== 0) {
			process.exitCode = exitCode;
		}
	} finally {
		await shutdown();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
