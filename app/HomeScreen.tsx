'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadActiveSession } from '@/lib/storage';

interface Props {
  version: string;
}

export default function HomeScreen({ version }: Props) {
  const router = useRouter();
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    const data = loadActiveSession();
    setHasActive(data !== null && data.session.game.status !== 'finished');
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-zinc-950 text-zinc-50 flex flex-col select-none px-6 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 45% at 50% 38%, rgba(251,191,36,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex-1 flex flex-col justify-center">
        <p className="text-zinc-700 text-[10px] uppercase tracking-[0.28em] mb-4">Darts</p>
        <h1
          className="font-bold tracking-tighter leading-none mb-14"
          style={{ fontSize: 'clamp(3.8rem, 23vw, 8rem)' }}
        >
          <span className="text-zinc-300">Rondje</span>
          <br />
          <span className="text-amber-400">Bull</span>
        </h1>

        <div className="flex flex-col gap-3 max-w-xs">
          {hasActive && (
            <button
              onClick={() => router.push('/spel')}
              className="h-16 w-full rounded-xl font-bold text-lg border border-amber-400/40 bg-amber-400/10 text-amber-300 transition-transform duration-75 active:scale-[0.97]"
            >
              Potje hervatten
            </button>
          )}
          <button
            onClick={() => router.push('/spelers')}
            className={`h-16 w-full rounded-xl font-bold text-lg transition-transform duration-75 active:scale-[0.97] ${
              hasActive
                ? 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                : 'bg-amber-500 text-zinc-950'
            }`}
          >
            Nieuw potje
          </button>
          <button
            onClick={() => router.push('/leaderboard')}
            className="h-14 w-full rounded-xl font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800 transition-transform duration-75 active:scale-[0.97]"
          >
            Leaderboard
          </button>
        </div>
      </div>

      <div className="relative pb-8 flex items-center justify-center">
        <span className="text-zinc-800 text-xs font-mono tabular-nums">v{version}</span>
      </div>
    </div>
  );
}
