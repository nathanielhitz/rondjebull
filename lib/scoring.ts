import { TARGETS } from "./constants";
import type { GameSession, DartAction } from "./types";

export function applyHit(session: GameSession): GameSession {
  const state = session.playerStates[session.currentPlayerIndex];
  const action: DartAction = {
    type: "hit",
    playerId: state.playerId,
    targetIndexBefore: state.targetIndex,
    dartCountBefore: session.dartCount,
    playerIndexBefore: session.currentPlayerIndex,
  };

  const newTargetIndex = state.targetIndex + 1;
  const isWinner = newTargetIndex === TARGETS.length;

  const newPlayerStates = session.playerStates.map((s, i) =>
    i === session.currentPlayerIndex
      ? { ...s, targetIndex: newTargetIndex, finished: isWinner }
      : s
  );

  if (isWinner) {
    return {
      ...session,
      game: {
        ...session.game,
        status: "finished",
        winnerId: state.playerId,
      },
      playerStates: newPlayerStates,
      dartCount: session.dartCount + 1,
      history: [...session.history, action],
    };
  }

  const newDartCount = session.dartCount + 1;
  if (newDartCount === 3) {
    const nextPlayerIndex =
      (session.currentPlayerIndex + 1) % session.game.playerIds.length;
    return {
      ...session,
      playerStates: newPlayerStates,
      currentPlayerIndex: nextPlayerIndex,
      dartCount: 0,
      history: [...session.history, action],
    };
  }

  return {
    ...session,
    playerStates: newPlayerStates,
    dartCount: newDartCount,
    history: [...session.history, action],
  };
}

export function applyMiss(session: GameSession): GameSession {
  const state = session.playerStates[session.currentPlayerIndex];
  const action: DartAction = {
    type: "miss",
    playerId: state.playerId,
    targetIndexBefore: state.targetIndex,
    dartCountBefore: session.dartCount,
    playerIndexBefore: session.currentPlayerIndex,
  };

  const newDartCount = session.dartCount + 1;
  if (newDartCount === 3) {
    const nextPlayerIndex =
      (session.currentPlayerIndex + 1) % session.game.playerIds.length;
    return {
      ...session,
      currentPlayerIndex: nextPlayerIndex,
      dartCount: 0,
      history: [...session.history, action],
    };
  }

  return {
    ...session,
    dartCount: newDartCount,
    history: [...session.history, action],
  };
}

export function applyUndo(session: GameSession): GameSession {
  if (session.history.length === 0) return session;

  const last = session.history[session.history.length - 1];
  const newHistory = session.history.slice(0, -1);

  const newPlayerStates = session.playerStates.map((s) =>
    s.playerId === last.playerId
      ? { ...s, targetIndex: last.targetIndexBefore, finished: false }
      : s
  );

  return {
    ...session,
    game:
      session.game.status === "finished" && last.type === "hit"
        ? { ...session.game, status: "playing", winnerId: null }
        : session.game,
    playerStates: newPlayerStates,
    currentPlayerIndex: last.playerIndexBefore,
    dartCount: last.dartCountBefore,
    history: newHistory,
  };
}

export function buildInitialSession(
  gameId: string,
  playerIds: string[]
): GameSession {
  return {
    game: {
      id: gameId,
      date: new Date().toISOString(),
      playerIds,
      status: "playing",
      winnerId: null,
    },
    playerStates: playerIds.map((id) => ({
      playerId: id,
      targetIndex: 0,
      finished: false,
    })),
    currentPlayerIndex: 0,
    dartCount: 0,
    history: [],
  };
}
