const test = require("node:test");
const assert = require("node:assert/strict");

const engine = require("../engine.js");

test("estimateTdee returns expected BMR/TDEE (rounded)", () => {
  const p = {
    sex: "male",
    age: 32,
    heightCm: 178,
    weightKg: 82,
    activityLevel: "light",
  };
  const est = engine.estimateTdee(p);
  assert.equal(est.bmr, 1778);
  assert.equal(est.tdee, 2444);
});

test("macroTargets sets calories by goal and returns macros", () => {
  const base = {
    sex: "female",
    age: 30,
    heightCm: 165,
    weightKg: 60,
    activityLevel: "moderate",
  };
  const gen = engine.macroTargets({ ...base, goal: "general" });
  const cut = engine.macroTargets({ ...base, goal: "fat_loss" });
  const bulk = engine.macroTargets({ ...base, goal: "muscle_gain" });

  assert.ok(gen && cut && bulk);
  assert.ok(gen.tdee > 0);
  assert.equal(gen.calories, gen.tdee);
  assert.equal(cut.calories, Math.round(gen.tdee * 0.85));
  assert.equal(bulk.calories, Math.round(gen.tdee * 1.08));

  for (const m of [gen, cut, bulk]) {
    assert.ok(m.proteinG > 0);
    assert.ok(m.carbsG >= 0);
    assert.ok(m.fatG > 0);
  }
});

test("generatePlan creates a 7-day week with <= daysPerWeek strength days", () => {
  const plan = engine.generatePlan({
    sex: "male",
    age: 25,
    heightCm: 180,
    weightKg: 80,
    goal: "general",
    experience: "beginner",
    daysPerWeek: 3,
    sessionMinutes: 45,
    equipment: "none",
    activityLevel: "light",
  });

  assert.ok(plan.training);
  assert.equal(plan.training.days.length, 7);
  const strengthish = plan.training.days.filter((d) => d.kind === "strength" || d.kind === "conditioning").length;
  assert.ok(strengthish <= 3);
});

