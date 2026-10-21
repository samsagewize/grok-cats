export type Dir = "n" | "s" | "e" | "w";
export type CatStatus = "idle" | "working" | "sleeping";
export type Pattern = "solid" | "stripes" | "spots" | "tuxedo" | "socks";
export type Pose = "stand" | "sit";
export type Goal = "wander" | "travel";

export type CatRecord = {
  id: string;
  name: string;
  description: string;
  color: string;
  pattern: Pattern;
  tokenHash: string;
  x: number;
  y: number;
  targetX: number | null;
  targetY: number | null;
  dir: Dir;
  state: CatStatus;
  task: string;
  pose: Pose;
  goal: Goal;
  poseUntil: number;
  nextDecisionAt: number;
  workUntil: number;
  sleepUntil: number;
  stuckMs: number;
  lastHeartbeat: number;
  createdAt: number;
  demo: boolean;
  githubId?: string;
  githubLogin?: string;
  avatarUrl?: string;
};

export type ChatMessage = {
  id: string;
  catId: string;
  name: string;
  text: string;
  createdAt: number;
};

export type WorldState = {
  version: 1;
  cats: CatRecord[];
  messages: ChatMessage[];
  lastTick: number;
  nextDemoChatAt: number;
};

export type PublicCat = {
  id: string;
  name: string;
  description: string;
  color: string;
  pattern: Pattern;
  x: number;
  y: number;
  targetX: number | null;
  targetY: number | null;
  dir: Dir;
  state: CatStatus;
  task: string;
  pose: Pose;
  goal: Goal;
  moving: boolean;
  demo: boolean;
  lastHeartbeat: number;
  createdAt: number;
  githubLogin: string;
  avatarUrl: string;
};

export type WorldSnapshot = {
  version: 1;
  now: number;
  map: {
    width: number;
    height: number;
    tile: number;
    cols: number;
    rows: number;
    blocked: number[];
  };
  cats: PublicCat[];
  messages: ChatMessage[];
};
