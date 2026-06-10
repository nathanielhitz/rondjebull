'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAllPlayers, savePlayer, saveActiveSession } from '@/lib/storage';
import { buildInitialSession } from '@/lib/scoring';
import type { Player } from '@/lib/types';

function generateId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function PlayerSelectionScreen() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [knownPlayers, setKnownPlayers] = useState<Player[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    getAllPlayers().then(setKnownPlayers).catch(() => {});
  }, []);

  const addPlayer = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
        setInputError('Naam staat er al in');
        return;
      }
      setInputError(null);
      const known = knownPlayers.find(
        (p) => p.name.toLowerCase() === trimmed.toLowerCase()
      );
      const player: Player = known ?? { id: generateId(), name: trimmed };
      setPlayers((prev) => [...prev, player]);
      setInputValue('');
      inputRef.current?.focus();
    },
    [players, knownPlayers]
  );

  const addKnownPlayer = useCallback(
    (player: Player) => {
      if (players.some((p) => p.id === player.id)) return;
      setPlayers((prev) => [...prev, player]);
    },
    [players]
  );

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setPlayers((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((idx: number) => {
    setPlayers((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleStart = useCallback(async () => {
    if (players.length < 2) return;
    try {
      await Promise.all(players.map((p) => savePlayer(p)));
    } catch {
      // Fail silently — game still starts without history
    }
    const session = buildInitialSession(
      `game-${Date.now()}`,
      players.map((p) => p.id)
    );
    saveActiveSession({ players, session });
    router.push('/spel');
  }, [players, router]);

  const suggestions = knownPlayers.filter(
    (kp) =>
      !players.some(
        (p) =>
          p.id === kp.id || p.name.toLowerCase() === kp.name.toLowerCase()
      )
  );

  const canStart = players.length >= 2;

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-50 flex flex-col select-none">
      {/* ── Header ── */}
      <header className="px-5 pt-5 pb-5 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-zinc-600 mb-5 active:text-zinc-300 transition-colors duration-100"
        >
          <IconChevronLeft />
          <span className="text-sm">Terug</span>
        </button>
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.22em] mb-1.5">RondjeBull</p>
        <h1 className="text-2xl font-bold tracking-tight">Spelers kiezen</h1>
      </header>

      {/* ── Input ── */}
      <div className="px-4 mb-5 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addPlayer(inputValue);
            }}
            placeholder="Naam toevoegen…"
            autoCapitalize="words"
            autoCorrect="off"
            autoComplete="off"
            className="flex-1 h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-zinc-50 placeholder:text-zinc-600 text-sm outline-none focus:border-amber-500/50 transition-colors duration-150"
          />
          <button
            onClick={() => addPlayer(inputValue)}
            disabled={!inputValue.trim()}
            aria-label="Speler toevoegen"
            className="h-12 w-12 bg-amber-500 text-zinc-950 rounded-xl font-bold text-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-[0.97] transition-all duration-75"
          >
            +
          </button>
        </div>
        {inputError && (
          <p className="text-amber-600 text-xs mt-2 px-1">{inputError}</p>
        )}
      </div>

      {/* ── Quick-select chips ── */}
      {suggestions.length > 0 && (
        <div className="px-4 mb-5 flex-shrink-0">
          <p className="text-zinc-700 text-[10px] uppercase tracking-[0.22em] mb-2.5">
            Eerder gespeeld
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => addKnownPlayer(p)}
                className="h-9 px-4 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm rounded-full flex-shrink-0 transition-colors duration-100 active:bg-zinc-800 active:text-zinc-200"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Player list ── */}
      <div className="flex-1 px-4 overflow-y-auto min-h-0">
        {players.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <p className="text-zinc-700 text-sm">Voeg minimaal 2 spelers toe</p>
            <p className="text-zinc-800 text-xs mt-1.5">De volgorde bepaalt wie begint</p>
          </div>
        ) : (
          <>
            <p className="text-zinc-700 text-[10px] uppercase tracking-[0.22em] mb-3">
              Volgorde{' '}
              <span className="text-zinc-600">
                · {players.length} speler{players.length !== 1 ? 's' : ''}
              </span>
            </p>
            <div className="flex flex-col gap-2">
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl h-14 px-4"
                >
                  {/* Position */}
                  <span className="font-mono text-xs text-zinc-600 w-4 text-right tabular-nums flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* Name */}
                  <span className="flex-1 text-sm font-medium truncate">{player.name}</span>

                  {/* Reorder */}
                  <div className="flex flex-col flex-shrink-0">
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="h-7 w-8 flex items-center justify-center text-zinc-600 disabled:opacity-20 active:text-zinc-200 transition-colors"
                    >
                      <IconChevronUp />
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === players.length - 1}
                      className="h-7 w-8 flex items-center justify-center text-zinc-600 disabled:opacity-20 active:text-zinc-200 transition-colors"
                    >
                      <IconChevronDown />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="h-10 w-10 flex items-center justify-center text-zinc-700 active:text-zinc-300 transition-colors flex-shrink-0 -mr-1"
                  >
                    <IconX />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Start button ── */}
      <div className="px-4 pt-4 pb-8 flex-shrink-0">
        {!canStart && players.length === 1 && (
          <p className="text-center text-zinc-700 text-xs mb-3">Voeg nog 1 speler toe</p>
        )}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full h-16 bg-amber-500 text-zinc-950 font-bold text-lg rounded-xl disabled:opacity-30 transition-all duration-100 active:scale-[0.97]"
        >
          {canStart ? `Start potje (${players.length})` : 'Start potje'}
        </button>
      </div>
    </div>
  );
}
