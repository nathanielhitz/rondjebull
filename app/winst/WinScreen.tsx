'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadActiveSession, clearActiveSession, saveActiveSession } from '@/lib/storage';
import { buildInitialSession } from '@/lib/scoring';
import type { Player } from '@/lib/types';

function IconTrophy() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}

export default function WinScreen() {
  const router = useRouter();
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = loadActiveSession();
    if (!data || data.session.game.status !== 'finished' || !data.session.game.winnerId) {
      router.replace('/spelers');
      return;
    }
    const winner = data.players.find((p) => p.id === data.session.game.winnerId);
    if (!winner) {
      router.replace('/spelers');
      return;
    }
    setWinnerName(winner.name);
    setPlayers(data.players);
    setLoaded(true);
  }, [router]);

  const handleNewGame = () => {
    const newSession = buildInitialSession(
      `game-${Date.now()}`,
      players.map((p) => p.id)
    );
    saveActiveSession({ players, session: newSession });
    router.push('/spel');
  };

  const handleLeaderboard = () => {
    clearActiveSession();
    router.push('/leaderboard');
  };

  if (!loaded) {
    return <div className="min-h-[100dvh] bg-zinc-950" />;
  }

  return (
    <div className="relative min-h-[100dvh] bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center px-6 text-center select-none overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 50% at 50% 42%, rgba(251,191,36,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center">
        <div className="text-amber-400 mb-6">
          <IconTrophy />
        </div>
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.22em] mb-3">Winnaar</p>
        <h1
          className="font-bold tracking-tighter text-zinc-50 leading-none"
          style={{ fontSize: 'clamp(3rem, 18vw, 5.5rem)' }}
        >
          {winnerName}
        </h1>
        <p className="text-zinc-600 mt-3 text-sm">heeft de Bull geraakt</p>

        <div className="w-full max-w-xs mt-16 flex flex-col gap-3">
          <button
            onClick={handleNewGame}
            className="h-16 w-full bg-amber-500 text-zinc-950 font-bold text-lg rounded-xl transition-transform duration-75 active:scale-[0.97]"
          >
            Nog een potje
          </button>
          <button
            onClick={handleLeaderboard}
            className="h-14 w-full bg-zinc-900 text-zinc-400 font-semibold rounded-xl border border-zinc-800 transition-transform duration-75 active:scale-[0.97]"
          >
            Naar leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
