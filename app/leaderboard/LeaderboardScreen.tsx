'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFinishedGames, getAllPlayers } from '@/lib/storage';

interface Entry {
  playerId: string;
  name: string;
  won: number;
  played: number;
  winPct: number;
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getFinishedGames(), getAllPlayers()])
      .then(([games, players]) => {
        const stats = new Map<string, { played: number; won: number }>();

        for (const game of games) {
          for (const playerId of game.playerIds) {
            const s = stats.get(playerId) ?? { played: 0, won: 0 };
            s.played++;
            if (game.winnerId === playerId) s.won++;
            stats.set(playerId, s);
          }
        }

        const result: Entry[] = [];
        for (const [playerId, { played, won }] of stats) {
          const player = players.find((p) => p.id === playerId);
          if (!player) continue;
          result.push({
            playerId,
            name: player.name,
            won,
            played,
            winPct: played > 0 ? Math.round((won / played) * 100) : 0,
          });
        }

        result.sort((a, b) => b.won - a.won || b.winPct - a.winPct);
        setEntries(result);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return <div className="min-h-[100dvh] bg-zinc-950" />;
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-50 flex flex-col select-none">

      {/* ── Header ── */}
      <header className="px-5 pt-5 pb-5 flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-zinc-600 mb-5 active:text-zinc-300 transition-colors duration-100"
        >
          <IconChevronLeft />
          <span className="text-sm">Home</span>
        </button>
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.22em] mb-1.5">RondjeBull</p>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 px-5 overflow-y-auto min-h-0">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-zinc-600 text-sm">Nog geen potjes gespeeld</p>
            <p className="text-zinc-800 text-xs mt-2">Finish een potje om hier te verschijnen</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="flex items-center pb-3 border-b border-zinc-800">
              <span className="flex-1 text-zinc-700 text-[10px] uppercase tracking-[0.22em]">
                Speler
              </span>
              <div className="flex text-right">
                <span className="w-9 text-zinc-700 text-[10px] uppercase tracking-[0.18em]">W</span>
                <span className="w-9 text-zinc-700 text-[10px] uppercase tracking-[0.18em]">P</span>
                <span className="w-12 text-zinc-700 text-[10px] uppercase tracking-[0.18em]">Win%</span>
              </div>
            </div>

            {/* Rows */}
            {entries.map((entry, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={entry.playerId}
                  className="flex items-center py-4 border-b border-zinc-900 last:border-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-mono text-xs text-zinc-700 w-4 text-right tabular-nums flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className={`text-sm font-semibold truncate ${
                        isFirst ? 'text-amber-400' : 'text-zinc-300'
                      }`}
                    >
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex text-right flex-shrink-0">
                    <span
                      className={`w-9 font-mono text-sm font-bold tabular-nums ${
                        isFirst ? 'text-amber-400' : 'text-zinc-300'
                      }`}
                    >
                      {entry.won}
                    </span>
                    <span className="w-9 font-mono text-sm tabular-nums text-zinc-600">
                      {entry.played}
                    </span>
                    <span className="w-12 font-mono text-sm tabular-nums text-zinc-600">
                      {entry.winPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Footer button ── */}
      <div className="px-4 pt-4 pb-8 flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="w-full h-14 bg-zinc-900 text-zinc-400 font-semibold rounded-xl border border-zinc-800 transition-transform duration-75 active:scale-[0.97]"
        >
          Terug naar Home
        </button>
      </div>
    </div>
  );
}
