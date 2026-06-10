'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  saveGame,
} from '@/lib/storage';
import { applyHit, applyMiss, applyUndo } from '@/lib/scoring';
import { TARGETS } from '@/lib/constants';
import type { GameSession, Player } from '@/lib/types';

function triggerVibrate(ms: number): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms);
  }
}

function IconUndo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function GameScreen() {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const gameSavedRef = useRef(false);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  // Load from storage on mount; redirect if nothing there or game already finished
  useEffect(() => {
    const data = loadActiveSession();
    if (!data) {
      router.replace('/spelers');
      return;
    }
    if (data.session.game.status === 'finished') {
      router.replace('/winst');
      return;
    }
    setPlayers(data.players);
    setSession(data.session);
    setLoaded(true);
  }, [router]);

  // Persist every in-progress dart to localStorage
  useEffect(() => {
    if (!loaded || !session || session.game.status === 'finished') return;
    saveActiveSession({ players, session });
  }, [session, players, loaded]);

  // On win: save to IndexedDB, keep session for WinScreen, navigate
  useEffect(() => {
    if (!session || session.game.status !== 'finished') return;
    if (gameSavedRef.current) return;
    gameSavedRef.current = true;
    saveGame(session.game).catch(() => {});
    saveActiveSession({ players, session });
    router.push('/winst');
  }, [session, players, router]);

  // Screen Wake Lock — acquire on load, re-acquire after tab becomes visible again
  useEffect(() => {
    if (!loaded) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    const acquire = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch {
        // denied or not supported — silent
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [loaded]);

  // Warn on page refresh / close
  useEffect(() => {
    if (!loaded) return;
    const handle = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, [loaded]);

  // Intercept browser back button
  useEffect(() => {
    if (!loaded) return;
    history.pushState(null, '', location.href);
    const handle = () => {
      history.pushState(null, '', location.href);
      setShowStopDialog(true);
    };
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, [loaded]);

  const handleHit = useCallback(() => {
    triggerVibrate(30);
    setSession((s) => (s ? applyHit(s) : s));
  }, []);

  const handleMiss = useCallback(() => {
    triggerVibrate(15);
    setSession((s) => (s ? applyMiss(s) : s));
  }, []);

  const handleUndo = useCallback(() => {
    setSession((s) => (s ? applyUndo(s) : s));
  }, []);

  const handleConfirmStop = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    clearActiveSession();
    router.push('/');
  }, [router]);

  // Loading state — brief flash while localStorage is read
  if (!loaded) {
    return <div className="min-h-[100dvh] bg-zinc-950" />;
  }

  const s = session!;
  const currentState = s.playerStates[s.currentPlayerIndex];
  const currentPlayer = players.find((p) => p.id === currentState.playerId)!;
  const currentTargetIdx = currentState.targetIndex;
  const currentTarget = TARGETS[currentTargetIdx];
  const nextTarget =
    currentTargetIdx + 1 < TARGETS.length ? TARGETS[currentTargetIdx + 1] : null;

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-50 flex flex-col select-none overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-start justify-between px-5 pt-5 pb-0 flex-shrink-0">
        <div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.22em] font-medium leading-none">
            Aan de beurt
          </p>
          <p className="text-2xl font-bold tracking-tight mt-2 leading-none">
            {currentPlayer.name}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <button
            onClick={() => setShowStopDialog(true)}
            aria-label="Potje stoppen"
            className="h-10 w-10 -mr-2 -mt-1 flex items-center justify-center text-zinc-700 active:text-zinc-400 transition-colors rounded-xl"
          >
            <IconX />
          </button>
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.22em] font-medium leading-none mt-0.5">
            Dart {s.dartCount + 1} van&nbsp;3
          </p>
          <div className="flex gap-1.5 justify-end mt-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                  i < s.dartCount ? 'bg-amber-400' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* ── Target display ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 px-4">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% 50%, rgba(251,191,36,0.05) 0%, transparent 72%)',
          }}
        />
        <div
          key={`${currentTarget}-${s.currentPlayerIndex}`}
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
        <div className="mt-5 h-5 flex items-center gap-2">
          {nextTarget !== null ? (
            <>
              <span className="text-zinc-700 text-[11px] uppercase tracking-[0.18em]">hierna</span>
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
          disabled={s.history.length === 0}
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
          {s.game.playerIds.map((playerId, idx) => {
            const player = players.find((p) => p.id === playerId)!;
            const pState = s.playerStates[idx];
            const isActive = idx === s.currentPlayerIndex;
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

      {/* ── Stop dialog ── */}
      {showStopDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-4 pb-8">
          <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col gap-3">
            <div className="mb-1">
              <h2 className="text-lg font-bold text-zinc-50">Potje stoppen?</h2>
              <p className="text-zinc-500 text-sm mt-1">De huidige stand wordt verwijderd.</p>
            </div>
            <button
              onClick={handleConfirmStop}
              className="h-14 w-full bg-zinc-800 text-zinc-300 font-semibold rounded-xl border border-zinc-700 transition-transform duration-75 active:scale-[0.97]"
            >
              Ja, stoppen
            </button>
            <button
              onClick={() => setShowStopDialog(false)}
              className="h-14 w-full bg-amber-500 text-zinc-950 font-bold rounded-xl transition-transform duration-75 active:scale-[0.97]"
            >
              Nee, doorgaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
