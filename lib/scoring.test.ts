import { describe, it, expect } from "vitest";
import { applyHit, applyMiss, applyUndo, buildInitialSession } from "./scoring";
import { TARGETS } from "./constants";

const PLAYER_A = "player-a";
const PLAYER_B = "player-b";

function makeSession() {
  return buildInitialSession("game-1", [PLAYER_A, PLAYER_B]);
}

describe("buildInitialSession", () => {
  it("starts both players at targetIndex 0", () => {
    const s = makeSession();
    expect(s.playerStates[0].targetIndex).toBe(0);
    expect(s.playerStates[1].targetIndex).toBe(0);
  });

  it("starts at dart 0, player 0", () => {
    const s = makeSession();
    expect(s.dartCount).toBe(0);
    expect(s.currentPlayerIndex).toBe(0);
  });
});

describe("applyHit", () => {
  it("advances targetIndex by 1", () => {
    const s = applyHit(makeSession());
    expect(s.playerStates[0].targetIndex).toBe(1);
  });

  it("increments dartCount", () => {
    const s = applyHit(makeSession());
    expect(s.dartCount).toBe(1);
  });

  it("does not advance targetIndex of other player", () => {
    const s = applyHit(makeSession());
    expect(s.playerStates[1].targetIndex).toBe(0);
  });

  it("switches to next player after 3 darts", () => {
    let s = makeSession();
    s = applyHit(s);
    s = applyMiss(s);
    s = applyMiss(s);
    expect(s.currentPlayerIndex).toBe(1);
    expect(s.dartCount).toBe(0);
  });

  it("wraps back to player 0 after player 1 throws 3 darts", () => {
    let s = makeSession();
    // player 0 throws 3
    s = applyMiss(applyMiss(applyMiss(s)));
    // player 1 throws 3
    s = applyMiss(applyMiss(applyMiss(s)));
    expect(s.currentPlayerIndex).toBe(0);
  });

  it("detects winner when Bull is hit", () => {
    let s = makeSession();
    // advance player 0 to just before Bull (index 6 = TARGETS.length - 1)
    s = { ...s, playerStates: s.playerStates.map((ps, i) => i === 0 ? { ...ps, targetIndex: TARGETS.length - 1 } : ps) };
    s = applyHit(s);
    expect(s.game.status).toBe("finished");
    expect(s.game.winnerId).toBe(PLAYER_A);
    expect(s.playerStates[0].finished).toBe(true);
  });

  it("winning on dart 1: game finished, player index stays at winner", () => {
    let s = makeSession();
    // dart 1 of turn (dartCount = 0)
    s = { ...s, playerStates: s.playerStates.map((ps, i) => i === 0 ? { ...ps, targetIndex: TARGETS.length - 1 } : ps) };
    s = applyHit(s);
    expect(s.game.status).toBe("finished");
    expect(s.currentPlayerIndex).toBe(0); // no turn switch
    expect(s.dartCount).toBe(1);
  });

  it("winning on dart 2: game finished, player index stays at winner", () => {
    let s = makeSession();
    s = applyMiss(s); // dart 1 wasted
    s = { ...s, playerStates: s.playerStates.map((ps, i) => i === 0 ? { ...ps, targetIndex: TARGETS.length - 1 } : ps) };
    // dartCount is now 1 (dart 2 of turn)
    s = applyHit(s);
    expect(s.game.status).toBe("finished");
    expect(s.game.winnerId).toBe(PLAYER_A);
    expect(s.currentPlayerIndex).toBe(0); // no turn switch
  });

  it("3 hits in one turn advances targetIndex by 3 (meerdere doelen doorschuiven)", () => {
    let s = makeSession();
    // dart 1, 2, 3 all hit — player moves from index 0 → 3 (targeting 17 next)
    s = applyHit(s); // index 0→1, dart 1
    s = applyHit(s); // index 1→2, dart 2
    s = applyHit(s); // index 2→3, dart 3 → turn switches
    expect(s.playerStates[0].targetIndex).toBe(3); // now targeting TARGETS[3] = 17
    expect(s.currentPlayerIndex).toBe(1);           // switched to player 1
    expect(s.dartCount).toBe(0);
  });
});

describe("applyMiss", () => {
  it("does not change targetIndex", () => {
    const s = applyMiss(makeSession());
    expect(s.playerStates[0].targetIndex).toBe(0);
  });

  it("increments dartCount", () => {
    const s = applyMiss(makeSession());
    expect(s.dartCount).toBe(1);
  });

  it("switches player after 3 misses", () => {
    let s = makeSession();
    s = applyMiss(applyMiss(applyMiss(s)));
    expect(s.currentPlayerIndex).toBe(1);
    expect(s.dartCount).toBe(0);
  });
});

describe("applyUndo", () => {
  it("returns unchanged session when history is empty", () => {
    const s = makeSession();
    expect(applyUndo(s)).toEqual(s);
  });

  it("undoes a hit: restores targetIndex", () => {
    let s = makeSession();
    s = applyHit(s);
    s = applyUndo(s);
    expect(s.playerStates[0].targetIndex).toBe(0);
    expect(s.dartCount).toBe(0);
    expect(s.currentPlayerIndex).toBe(0);
  });

  it("undoes a miss: restores dartCount", () => {
    let s = makeSession();
    s = applyMiss(s);
    s = applyUndo(s);
    expect(s.dartCount).toBe(0);
    expect(s.currentPlayerIndex).toBe(0);
  });

  it("undoes a player switch caused by 3rd dart", () => {
    let s = makeSession();
    s = applyMiss(applyMiss(applyMiss(s))); // player switches to 1
    s = applyUndo(s); // undo last miss → back to player 0, dart 2
    expect(s.currentPlayerIndex).toBe(0);
    expect(s.dartCount).toBe(2);
  });

  it("undoes a winning hit: game status back to playing", () => {
    let s = makeSession();
    s = { ...s, playerStates: s.playerStates.map((ps, i) => i === 0 ? { ...ps, targetIndex: TARGETS.length - 1 } : ps) };
    s = applyHit(s);
    expect(s.game.status).toBe("finished");
    s = applyUndo(s);
    expect(s.game.status).toBe("playing");
    expect(s.game.winnerId).toBeNull();
    expect(s.playerStates[0].finished).toBe(false);
    expect(s.playerStates[0].targetIndex).toBe(TARGETS.length - 1);
  });
});

describe("full round trip", () => {
  it("player 0 wins after hitting all 7 targets (one per turn)", () => {
    let s = makeSession();
    // Each turn: player 0 hits, then has 2 more darts as miss; then player 1 throws 3 misses
    for (let i = 0; i < TARGETS.length - 1; i++) {
      s = applyHit(s);
      s = applyMiss(s);
      s = applyMiss(s);
      // now player 1's turn
      s = applyMiss(applyMiss(applyMiss(s)));
    }
    // final turn: player 0 hits Bull
    s = applyHit(s);
    expect(s.game.status).toBe("finished");
    expect(s.game.winnerId).toBe(PLAYER_A);
  });
});
