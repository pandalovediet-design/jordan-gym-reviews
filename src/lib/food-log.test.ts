import { test } from "node:test";
import assert from "node:assert/strict";
import { healthyStreak, isHealthyDay, sanitizeFood, sanitizeWater, weekRatings, type FoodLog } from "./food-log";
import { musclesThisWeek, sanitize } from "./workout-log";

test("a day is healthy with two or more meals and no free meal", () => {
  assert.equal(isHealthyDay(undefined), false);
  assert.equal(isHealthyDay({ breakfast: { note: "", rating: "healthy" } }), false);
  assert.equal(isHealthyDay({ breakfast: { note: "", rating: "healthy" }, lunch: { note: "", rating: "ok" } }), true);
  assert.equal(isHealthyDay({ breakfast: { note: "", rating: "healthy" }, lunch: { note: "", rating: "free" } }), false);
});

test("healthy streak counts back from today, or from yesterday while today is open", () => {
  const good = { breakfast: { note: "", rating: "healthy" as const }, dinner: { note: "", rating: "ok" as const } };
  const log: FoodLog = { "2026-11-01": good, "2026-11-02": good };
  assert.equal(healthyStreak(log, "2026-11-03"), 2); // today not logged yet
  assert.equal(healthyStreak({ ...log, "2026-11-03": good }, "2026-11-03"), 3);
  assert.equal(healthyStreak({ "2026-11-01": good }, "2026-11-03"), 0); // gap yesterday breaks it
});

test("week ratings cover the last 7 days only", () => {
  const log: FoodLog = {
    "2026-11-03": { lunch: { note: "", rating: "free" } },
    "2026-10-28": { lunch: { note: "", rating: "healthy" } },
    "2026-10-27": { lunch: { note: "", rating: "healthy" } }, // 8 days back
  };
  assert.deepEqual(weekRatings(log, "2026-11-03"), { healthy: 1, ok: 0, free: 1 });
});

test("sanitizers drop bad dates, meals, ratings and water values", () => {
  const food = sanitizeFood({
    "2026-11-03": { breakfast: { note: "x".repeat(200), rating: "healthy" }, brunch: { rating: "ok" }, lunch: { rating: "great" } },
    "bad-date": { lunch: { rating: "ok" } },
  });
  assert.deepEqual(Object.keys(food), ["2026-11-03"]);
  assert.deepEqual(Object.keys(food["2026-11-03"]), ["breakfast"]);
  assert.equal(food["2026-11-03"].breakfast?.note.length, 120);
  assert.deepEqual(sanitizeWater({ "2026-11-03": 6, "2026-11-02": 0, "2026-11-01": 99, x: 3 }), { "2026-11-03": 6 });
});

test("workout log keeps only known muscles and lists this week's muscles", () => {
  const log = sanitize({
    "2026-11-01": { kind: "حديد", min: 45, muscles: ["chest", "wings", "chest"] },
    "2026-11-03": { kind: "حديد", min: 30, muscles: ["back"] },
    "2026-10-31": { kind: "حديد", min: 30, muscles: ["quads"] }, // Saturday of last week
  });
  assert.deepEqual(log["2026-11-01"].muscles, ["chest"]);
  assert.deepEqual(musclesThisWeek(log, "2026-11-03").sort(), ["back", "chest"]);
});
