# Wagers Strategy

## Goal
Give Pitch Talk an informal betting-app feel without introducing real-money mechanics or slowing down live play.

## Product Rules
- `Pitch Paisa` is an in-app unit used for match-only settlement. It is not a wallet, bank balance, or withdrawable currency.
- Each room uses one fixed stake for the full match:
  - `Chai`: `₹5`
  - `Martini`: `₹25`
  - `Patiala`: `₹50`
- The room stake is selected before the match starts and stays locked for everyone in the room.
- Picks do not change the wager amount. A `Dot`, `Six`, or `Wicket` all risk the same room stake.
- Do not add deposits, top-ups, withdrawals, KYC, or cash-out behavior.

## Settlement Model
- Each ball is its own pool.
- Only players who submit a prediction for that ball contribute to that ball's pool.
- Winners split that ball's pool using weighted shares based on outcome difficulty.
- If nobody wins, that ball expires. Nothing rolls over to the next ball.
- Final match nets should sum to zero across all players who participated.

## Outcome Weighting
Use fixed v1 outcome multipliers only to weight winner shares, not to change stake size:

| Outcome | Weight | Multiplier |
|---|---:|---:|
| `single` | 22 | `1.25x` |
| `dot` | 20 | `1.4x` |
| `four` | 18 | `1.6x` |
| `double` | 10 | `2.5x` |
| `six` | 12 | `3.0x` |
| `wicket` | 5 | `6.0x` |
| `wide` | 5 | `6.0x` |
| `triple` | 4 | `7.0x` |
| `noball` | 4 | `7.0x` |

## UX Rules
- Pregame:
  - host selects one room stake tier
  - all players see the locked stake and the `How It Works` explainer before the match starts
- Live ball:
  - users choose outcome only
  - show the fixed room stake and an estimated share after a pick is made
  - after resolution, show the actual net result for that ball
- Live standings:
  - show running net totals only
  - do not show pairwise IOUs during the match
- Final receipt / share:
  - include final net by player
  - include pairwise settlement instructions
  - restate the room stake and per-ball pool rule in plain language

## Ranking Rules
- Leaderboard primary sort: `netWinnings`
- Leaderboard tie-breakers:
  - `accuracy`
  - `bestStreak`
- Accuracy remains visible, but running net is the main social ranking signal.

## Copy Rules
- Prefer:
  - `Pitch Paisa`
  - `stake`
  - `estimated share`
  - `net`
  - `pool`
- Avoid:
  - `fixed return`
  - `guaranteed payout`
  - `rollover`
  - bookmaker-style or wallet-style language

## Non-Goals for V1
- No per-ball wager selection
- No pick-specific wager amounts
- No rollover or jackpot mechanics
- No live-changing odds by match context
- No wallet persistence across sessions
- No compliance-sensitive real-money flows
