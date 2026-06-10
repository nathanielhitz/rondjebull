'use client';

import { useState, useCallback } from 'react';
import { buildInitialSession, applyHit, applyMiss, applyUndo } from '@/lib/scoring';
import { TARGETS } from '@/lib/constants';
import type { GameSession, Player } from '@/lib/types';

const TEST_PLAYERS: Player[] = [
  { id: 'p1', name: 'Bas' },
  { id: 'p2', name: 'Tim' },
  { id: 'p3', name: 'Roy' },
];

function triggerVibrate(ms: number): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms);
  }
}

function IconUndo() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}

export default function GameScreen() {
  const [session, setSession] = useState<GameSession>(() =>
    buildInitialSession('test-game-1', TEST_PLAYERS.map((p) => p.id))
  );

  const currentState = session.playerStates[session.currentPlayerIndex];
  const currentPlayer = TEST_PLAYERS.find((p) => p.id === currentState.playerId)!;
  const currentTargetIdx = currentState.targetIndex;
  const currentTarget = TARGETS[currentTargetIdx];
  const nextTarget =
    currentTargetIdx + 1 < TARGETS.length ? TARGETS[currentTargetIdx + 1] : null;

  const isFinished = session.game.status === 'finished';
  const winnerPlayer = TEST_PLAYERS.find((p) => p.id === session.game.winnerId);

  const handleHit = useCallback(() => {
    triggerVibrate(30);
    setSession((s) => applyHit(s));
  }, []);

  const handleMiss = useCallback(() => {
    triggerVibrate(15);
    setSession((s) => applyMiss(s));
  }, []);

  const handleUndo = useCallback(() => {
    setSession((s) => applyUndo(s));
  }, []);

  const handleNewGame = useCallback(() => {
    setSession(
      buildInitialSession(
        `test-game-${Date.now()}`,
        TEST_PLAYERS.map((p) => p.id)
      )
    );
  }, []);

  // ── Winner screen ─────────────────────────────────────────────────────────────
  if (isFinished && winnerPlayer) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-amber-400 mb-6">
          <IconTrophy />
        </div>
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.22em] mb-3">Winnaar</p>
        <h1
          className="font-bold tracking-tighter text-zinc-50 leading-none"
          style={{ fontSize: 'clamp(3rem, 18vw, 5.5rem)' }}
        >
          {winnerPlayer.name}
        </h1>
        <p className="text-zinc-600 mt-3 text-sm">heeft de Bull geraakt</p>

        <div className="w-full max-w-xs mt-16 flex flex-col gap-3">
          <button
            onClick={handleNewGame}
            className="h-16 w-full bg-amber-500 text-zinc-950 font-bold text-lg rounded-xl transition-transform duration-75 active:scale-[0.97]"
          >
            Nieuw potje
          </button>
          <button className="h-14 w-full bg-zinc-900 text-zinc-400 font-semibold rounded-xl border border-zinc-800 transition-transform duration-75 active:scale-[0.97]">
            Leaderboard
          </button>
        </div>
      </div>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-50 flex flex-col select-none overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-start justify-between px-5 pt-6 pb-0 flex-shrink-0">
        <div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.22em] font-medium leading-none">
            Aan de beurt
          </p>
          <p className="text-2xl font-bold tracking-tight mt-2 leading-none">
            {currentPlayer.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.22em] font-medium leading-none">
            Dart {session.dartCount + 1} van&nbsp;3
          </p>
          <div className="flex gap-1.5 justify-end mt-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                  i < session.dartCount ? 'bg-amber-400' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* ── Target display ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 px-4">
        {/* Ambient warmth behind the number */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% 50%, rgba(251,191,36,0.05) 0%, transparent 72%)',
          }}
        />

        {/* Key changes on target or player switch → CSS anim replays */}
        <div
          key={`${currentTarget}-${session.currentPlayerIndex}`}
          className="relative font-mono font-bold text-amber-400 leading-none tabular-nums tracking-tight animate-[target-in_0.14s_cubic-bezier(0.16,1,0.3,1)]"
          style={{
            fontSize:
              currentTarget === 'BULL'
                ? 'clamp(5rem, 30vw, 10rem)'
                : 'clamp(8rem, 52vw, 15rem)',
          }}
        >
          {String(currentTarget)}
        </div>

        {/* Next target */}
        <div className="mt-5 h-5 flex items-center gap-2">
          {nextTarget !== null ? (
            <>
              <span className="text-zinc-700 text-[11px] uppercase tracking-[0.18em]">
                hierna
              </span>
              <span className="text-zinc-700 text-xs">·</span>
              <span className="text-zinc-500 font-mono text-base font-semibold">
                {String(nextTarget)}
              </span>
            </>
          ) : (
            <span className="text-amber-800/70 text-[11px] uppercase tracking-[0.18em]">
              laatste doel
            </span>
          )}
        </div>
      </div>

      {/* ── Raak / Mis ── */}
      <div className="px-4 pb-2 flex-shrink-0 grid grid-cols-2 gap-3">
        <button
          onClick={handleHit}
          className="h-20 bg-amber-500 text-zinc-950 font-bold text-xl rounded-xl transition-transform duration-75 active:scale-[0.97] active:brightness-90"
        >
          Raak
        </button>
        <button
          onClick={handleMiss}
          className="h-20 bg-zinc-900 text-zinc-300 font-bold text-xl rounded-xl transition-transform duration-75 active:scale-[0.97] border border-zinc-800"
        >
          Mis
        </button>
      </div>

      {/* ── Undo ── */}
      <div className="px-4 pt-1 pb-4 flex-shrink-0">
        <button
          onClick={handleUndo}
          disabled={session.history.length === 0}
          className="w-full h-11 flex items-center justify-center gap-2 text-zinc-600 disabled:opacity-25 active:text-zinc-300 transition-colors duration-100 rounded-lg"
        >
          <IconUndo />
          <span className="text-sm font-medium">Undo laatste worp</span>
        </button>
      </div>

      {/* ── Player list ── */}
      <div className="border-t border-zinc-800 px-4 pt-4 pb-6 flex-shrink-0">
        <p className="text-zinc-700 text-[10px] uppercase tracking-[0.22em] font-medium mb-3">
          Spelers
        </p>
        <div className="flex flex-col gap-3">
          {session.game.playerIds.map((playerId, idx) => {
            const player = TEST_PLAYERS.find((p) => p.id === playerId)!;
            const pState = session.playerStates[idx];
            const isActive = idx === session.currentPlayerIndex;
            const playerTarget = TARGETS[pState.targetIndex];
            return (
              <div key={playerId} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
                      isActive ? 'bg-amber-400' : 'bg-zinc-800'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isActive ? 'text-zinc-50' : 'text-zinc-600'
                    }`}
                  >
                    {player.name}
                  </span>
                </div>
                <span
                  className={`font-mono text-sm font-semibold tabular-nums transition-colors duration-200 ${
                    isActive ? 'text-amber-400' : 'text-zinc-700'
                  }`}
                >
                  {String(playerTarget)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
