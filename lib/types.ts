export interface Player {
  id: string;
  name: string;
}

export interface Game {
  id: string;
  date: string; // ISO-string
  playerIds: string[]; // volgorde = beurtvolgorde
  status: "playing" | "finished";
  winnerId: string | null;
}

export interface PlayerGameState {
  playerId: string;
  targetIndex: number; // 0=20, 1=19, 2=18, 3=17, 4=16, 5=15, 6=Bull
  finished: boolean;
}

export interface LeaderboardEntry {
  playerId: string;
  played: number;
  won: number;
  winPct: number;
}

export type DartOutcome = "hit" | "miss";

export interface DartAction {
  type: DartOutcome;
  playerId: string;
  targetIndexBefore: number;
  dartCountBefore: number; // 0-2
  playerIndexBefore: number; // index in game.playerIds
}

export interface GameSession {
  game: Game;
  playerStates: PlayerGameState[];
  currentPlayerIndex: number;
  dartCount: number; // 0-2 (darts thrown this turn)
  history: DartAction[];
}
