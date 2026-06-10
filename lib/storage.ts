"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Player, Game, GameSession } from "./types";

// ── Active session (localStorage) ──────────────────────────────────────────

export interface ActiveSessionData {
  players: Player[];
  session: GameSession;
}

const ACTIVE_KEY = "darten-active";

export function saveActiveSession(data: ActiveSessionData): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(data));
  }
}

export function loadActiveSession(): ActiveSessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveSessionData) : null;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

interface DartenDB extends DBSchema {
  players: {
    key: string;
    value: Player;
  };
  games: {
    key: string;
    value: Game;
    indexes: { "by-date": string };
  };
}

let dbPromise: Promise<IDBPDatabase<DartenDB>> | null = null;

function getDB(): Promise<IDBPDatabase<DartenDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DartenDB>("darten", 1, {
      upgrade(db) {
        db.createObjectStore("players", { keyPath: "id" });
        const games = db.createObjectStore("games", { keyPath: "id" });
        games.createIndex("by-date", "date");
      },
    });
  }
  return dbPromise;
}

export async function getAllPlayers(): Promise<Player[]> {
  const db = await getDB();
  return db.getAll("players");
}

export async function savePlayer(player: Player): Promise<void> {
  const db = await getDB();
  await db.put("players", player);
}

export async function getFinishedGames(): Promise<Game[]> {
  const db = await getDB();
  const all = await db.getAll("games");
  return all.filter((g) => g.status === "finished");
}

export async function saveGame(game: Game): Promise<void> {
  const db = await getDB();
  await db.put("games", game);
}
