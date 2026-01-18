// apps/user/src/lib/audio/bgmRoutes.ts

export type BgmTrack = {
  src: string;
  loop: boolean;
  volume: number;
};

function stableHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickTaskLoopSrc(taskIdOrPath: string): string {
  const h = stableHash(taskIdOrPath);
  return h % 2 === 0
    ? "/audio/bgm/stage2loop.m4a"
    : "/audio/bgm/stage3loop.m4a";
}

function isResultsPath(pathname: string): boolean {
  // /result と /results 両対応
  return (
    pathname === "/results" ||
    pathname.startsWith("/results/") ||
    pathname === "/result" ||
    pathname.startsWith("/result/")
  );
}

function isTaskDetailPath(pathname: string): boolean {
  if (!pathname.startsWith("/tasks/")) return false;
  const parts = pathname.split("/").filter(Boolean);
  return parts.length >= 2;
}

export function bgmTrackForPath(pathname: string): BgmTrack | null {
  if (isResultsPath(pathname)) {
    return { src: "/audio/bgm/result.m4a", loop: false, volume: 0.6 };
  }

  if (isTaskDetailPath(pathname)) {
    const taskId = pathname.split("/")[2] ?? pathname;
    return { src: pickTaskLoopSrc(taskId), loop: true, volume: 0.5 };
  }

  if (pathname === "/" || pathname === "/tasks") {
    return { src: "/audio/bgm/top.m4a", loop: true, volume: 0.5 };
  }

  return null;
}
