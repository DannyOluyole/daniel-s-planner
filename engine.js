(function (root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    root.PFSEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const round = (n, digits = 0) => {
    const p = Math.pow(10, digits);
    return Math.round(n * p) / p;
  };

  function normalizeProfile(profile) {
    const p = profile || {};
    return {
      name: (p.name || "").trim(),
      sex: p.sex === "female" ? "female" : "male",
      age: Number.isFinite(+p.age) ? clamp(+p.age, 10, 120) : null,
      heightCm: Number.isFinite(+p.heightCm) ? clamp(+p.heightCm, 120, 230) : null,
      weightKg: Number.isFinite(+p.weightKg) ? clamp(+p.weightKg, 35, 250) : null,
      goal: ["fat_loss", "muscle_gain", "endurance", "general"].includes(p.goal) ? p.goal : "general",
      experience: ["beginner", "intermediate", "advanced"].includes(p.experience) ? p.experience : "beginner",
      daysPerWeek: Number.isFinite(+p.daysPerWeek) ? clamp(Math.round(+p.daysPerWeek), 2, 6) : 3,
      sessionMinutes: Number.isFinite(+p.sessionMinutes) ? clamp(Math.round(+p.sessionMinutes), 20, 120) : 45,
      equipment: ["none", "dumbbells", "full_gym"].includes(p.equipment) ? p.equipment : "none",
      activityLevel: ["sedentary", "light", "moderate", "high"].includes(p.activityLevel) ? p.activityLevel : "light",
      injuries: (p.injuries || "").trim(),
      preferences: (p.preferences || "").trim(),
    };
  }

  function mifflinStJeorBmr({ sex, weightKg, heightCm, age }) {
    if (!weightKg || !heightCm || !age) return null;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === "female" ? base - 161 : base + 5;
  }

  function activityFactor(level) {
    switch (level) {
      case "sedentary":
        return 1.2;
      case "light":
        return 1.375;
      case "moderate":
        return 1.55;
      case "high":
        return 1.725;
      default:
        return 1.375;
    }
  }

  function estimateTdee(profile) {
    const p = normalizeProfile(profile);
    const bmr = mifflinStJeorBmr(p);
    if (!bmr) return null;
    const tdee = bmr * activityFactor(p.activityLevel);
    return { bmr: round(bmr), tdee: round(tdee) };
  }

  function calorieTarget(goal, tdee) {
    if (!tdee) return null;
    switch (goal) {
      case "fat_loss":
        return round(tdee * 0.85);
      case "muscle_gain":
        return round(tdee * 1.08);
      case "endurance":
        return round(tdee * 1.05);
      case "general":
      default:
        return round(tdee);
    }
  }

  function macroTargets(profile) {
    const p = normalizeProfile(profile);
    const est = estimateTdee(p);
    if (!est || !p.weightKg) return null;

    const calories = calorieTarget(p.goal, est.tdee);
    const proteinPerKg =
      p.goal === "fat_loss" ? 1.8 :
      p.goal === "muscle_gain" ? 1.6 :
      p.goal === "endurance" ? 1.4 : 1.6;
    const fatPerKg = p.goal === "endurance" ? 0.7 : 0.8;

    const proteinG = round(p.weightKg * proteinPerKg);
    const fatG = round(p.weightKg * fatPerKg);
    const proteinCals = proteinG * 4;
    const fatCals = fatG * 9;
    const carbCals = Math.max(0, calories - proteinCals - fatCals);
    const carbsG = round(carbCals / 4);

    const calsFromMacros = proteinCals + fatCals + carbsG * 4;

    return {
      calories,
      proteinG,
      carbsG,
      fatG,
      bmr: est.bmr,
      tdee: est.tdee,
      note: calsFromMacros !== calories ? "Macros rounded; calories approximate." : "",
    };
  }

  function dayNames() {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }

  function chooseSplit(profile) {
    const p = normalizeProfile(profile);
    const d = p.daysPerWeek;
    if (d <= 3) return "full_body";
    if (d === 4) return "upper_lower";
    if (d === 5) return "upper_lower_plus";
    return "ppl";
  }

  function templateExercises(equipment) {
    if (equipment === "full_gym") {
      return {
        squat: ["Back Squat", "Leg Press", "Goblet Squat"],
        hinge: ["Romanian Deadlift", "Deadlift (light)", "Hip Thrust"],
        push: ["Bench Press", "Incline DB Press", "Push-ups"],
        pull: ["Lat Pulldown", "Barbell Row", "Cable Row"],
        shoulders: ["Overhead Press", "DB Shoulder Press", "Lateral Raise"],
        core: ["Dead Bug", "Plank", "Cable Chop"],
        cardio: ["Incline Walk", "Bike", "Row Erg"],
      };
    }
    if (equipment === "dumbbells") {
      return {
        squat: ["Goblet Squat", "Split Squat", "DB Front Squat"],
        hinge: ["DB Romanian Deadlift", "Hip Hinge Good Morning", "Glute Bridge"],
        push: ["DB Floor Press", "Push-ups", "DB Incline Press (bench)"],
        pull: ["1-Arm DB Row", "Chest-Supported DB Row", "Band Row (if available)"],
        shoulders: ["DB Shoulder Press", "Lateral Raise", "Rear Delt Fly"],
        core: ["Plank", "Side Plank", "Hollow Hold"],
        cardio: ["Brisk Walk", "Jog", "Bike (if available)"],
      };
    }
    return {
      squat: ["Air Squat", "Split Squat", "Step-ups"],
      hinge: ["Hip Hinge", "Single-Leg RDL (bodyweight)", "Glute Bridge"],
      push: ["Push-ups", "Pike Push-ups", "Incline Push-ups"],
      pull: ["Doorway Row (towel)", "Isometric Row (towel)", "Prone Swimmer"],
      shoulders: ["Pike Push-ups", "Y-T-W Raises", "Scapular Push-ups"],
      core: ["Plank", "Dead Bug", "Hollow Hold"],
      cardio: ["Brisk Walk", "Intervals (walk/jog)", "Stairs"],
    };
  }

  function repScheme(experience, goal) {
    if (goal === "endurance") return { sets: "2–3", reps: "12–20", rest: "45–75s" };
    if (goal === "fat_loss") return { sets: "2–4", reps: "8–15", rest: "60–90s" };
    if (experience === "advanced") return { sets: "3–5", reps: "5–10", rest: "90–150s" };
    if (experience === "intermediate") return { sets: "3–4", reps: "6–12", rest: "75–120s" };
    return { sets: "2–3", reps: "8–12", rest: "60–90s" };
  }

  function cardioPrescription(goal, sessionMinutes) {
    if (goal === "muscle_gain") {
      return sessionMinutes >= 60
        ? "Optional: 1–2x/week Zone 2 (20–30 min) for recovery."
        : "Optional: light walks on rest days.";
    }
    if (goal === "endurance") return "2–4x/week: Zone 2 (30–45 min) + 1 interval day.";
    if (goal === "fat_loss") return "2–3x/week: Zone 2 (25–40 min) + 8–12k steps/day target.";
    return "2x/week: Zone 2 (20–30 min) + daily walks.";
  }

  function buildWeeklyTraining(profile) {
    const p = normalizeProfile(profile);
    const split = chooseSplit(p);
    const ex = templateExercises(p.equipment);
    const scheme = repScheme(p.experience, p.goal);
    const days = [];
    const names = dayNames();

    function strengthDay(title, focus, blocks) {
      return {
        kind: "strength",
        title,
        focus,
        durationMinutes: p.sessionMinutes,
        scheme,
        blocks,
      };
    }

    function restDay() {
      return {
        kind: "recovery",
        title: "Recovery",
        focus: "Mobility + easy movement",
        durationMinutes: Math.min(25, p.sessionMinutes),
        blocks: [
          { label: "Walk", items: ["Easy walk 20–30 min"] },
          { label: "Mobility", items: ["Hips + ankles 5 min", "Thoracic + shoulders 5 min"] },
        ],
      };
    }

    const pick = (arr, idx) => arr[idx % arr.length];
    const injuriesNote = p.injuries ? `Constraints: ${p.injuries}` : "";

    let dayTemplates = [];
    if (split === "full_body") {
      dayTemplates = [
        strengthDay("Full Body A", "Squat + Push + Pull", [
          { label: "Main", items: [pick(ex.squat, 0), pick(ex.push, 0), pick(ex.pull, 0)] },
          { label: "Accessory", items: [pick(ex.hinge, 0), pick(ex.shoulders, 1), pick(ex.core, 0)] },
          { label: "Finisher", items: [pick(ex.cardio, 0) + " 8–12 min (easy/moderate)"] },
        ]),
        restDay(),
        strengthDay("Full Body B", "Hinge + Pull + Push", [
          { label: "Main", items: [pick(ex.hinge, 1), pick(ex.pull, 1), pick(ex.push, 1)] },
          { label: "Accessory", items: [pick(ex.squat, 1), pick(ex.shoulders, 0), pick(ex.core, 1)] },
          { label: "Finisher", items: [pick(ex.cardio, 1) + " 8–12 min (easy/moderate)"] },
        ]),
        restDay(),
        strengthDay("Full Body C", "Squat + Upper", [
          { label: "Main", items: [pick(ex.squat, 2), pick(ex.push, 2), pick(ex.pull, 2)] },
          { label: "Accessory", items: [pick(ex.hinge, 2), pick(ex.shoulders, 2), pick(ex.core, 2)] },
          { label: "Finisher", items: [pick(ex.cardio, 2) + " 8–12 min (easy/moderate)"] },
        ]),
        restDay(),
        restDay(),
      ];
    } else if (split === "upper_lower") {
      dayTemplates = [
        strengthDay("Upper 1", "Push + Pull", [
          { label: "Main", items: [pick(ex.push, 0), pick(ex.pull, 0), pick(ex.shoulders, 0)] },
          { label: "Accessory", items: [pick(ex.pull, 1), pick(ex.core, 0)] },
        ]),
        strengthDay("Lower 1", "Squat + Hinge", [
          { label: "Main", items: [pick(ex.squat, 0), pick(ex.hinge, 0)] },
          { label: "Accessory", items: [pick(ex.core, 1), pick(ex.cardio, 0) + " 10 min easy"] },
        ]),
        restDay(),
        strengthDay("Upper 2", "Pull + Push", [
          { label: "Main", items: [pick(ex.pull, 2), pick(ex.push, 1), pick(ex.shoulders, 1)] },
          { label: "Accessory", items: [pick(ex.core, 2)] },
        ]),
        strengthDay("Lower 2", "Hinge + Squat", [
          { label: "Main", items: [pick(ex.hinge, 1), pick(ex.squat, 1)] },
          { label: "Accessory", items: [pick(ex.cardio, 1) + " 10 min easy"] },
        ]),
        restDay(),
        restDay(),
      ];
    } else if (split === "upper_lower_plus") {
      dayTemplates = [
        strengthDay("Upper 1", "Push + Pull", [
          { label: "Main", items: [pick(ex.push, 0), pick(ex.pull, 0), pick(ex.shoulders, 0)] },
          { label: "Accessory", items: [pick(ex.core, 0)] },
        ]),
        strengthDay("Lower 1", "Squat + Hinge", [
          { label: "Main", items: [pick(ex.squat, 0), pick(ex.hinge, 0)] },
          { label: "Accessory", items: [pick(ex.core, 1)] },
        ]),
        restDay(),
        strengthDay("Upper 2", "Pull + Push", [
          { label: "Main", items: [pick(ex.pull, 1), pick(ex.push, 1), pick(ex.shoulders, 1)] },
          { label: "Accessory", items: [pick(ex.core, 2)] },
        ]),
        strengthDay("Lower 2", "Hinge + Squat", [
          { label: "Main", items: [pick(ex.hinge, 1), pick(ex.squat, 1)] },
          { label: "Accessory", items: [pick(ex.cardio, 0) + " 10–15 min easy"] },
        ]),
        strengthDay("Conditioning", "Cardio + Mobility", [
          { label: "Cardio", items: [pick(ex.cardio, 2) + " 25–40 min Zone 2"] },
          { label: "Mobility", items: ["Hips + ankles 6 min", "T-spine + shoulders 6 min"] },
        ]),
        restDay(),
      ];
    } else {
      // ppl
      dayTemplates = [
        strengthDay("Push", "Chest + Shoulders + Triceps", [
          { label: "Main", items: [pick(ex.push, 0), pick(ex.shoulders, 0)] },
          { label: "Accessory", items: [pick(ex.push, 1), pick(ex.core, 0)] },
        ]),
        strengthDay("Pull", "Back + Biceps", [
          { label: "Main", items: [pick(ex.pull, 0), pick(ex.pull, 1)] },
          { label: "Accessory", items: [pick(ex.core, 1)] },
        ]),
        strengthDay("Legs", "Squat + Hinge", [
          { label: "Main", items: [pick(ex.squat, 0), pick(ex.hinge, 0)] },
          { label: "Accessory", items: [pick(ex.squat, 1), pick(ex.core, 2)] },
        ]),
        restDay(),
        strengthDay("Push (light)", "Hypertrophy + Pump", [
          { label: "Main", items: [pick(ex.push, 2), pick(ex.shoulders, 1)] },
          { label: "Accessory", items: [pick(ex.core, 0)] },
        ]),
        strengthDay("Pull (light)", "Hypertrophy + Posture", [
          { label: "Main", items: [pick(ex.pull, 2), pick(ex.shoulders, 2)] },
          { label: "Accessory", items: [pick(ex.core, 1)] },
        ]),
        strengthDay("Legs (light)", "Volume + Cardio", [
          { label: "Main", items: [pick(ex.hinge, 1), pick(ex.squat, 2)] },
          { label: "Accessory", items: [pick(ex.cardio, 1) + " 10–15 min easy"] },
        ]),
      ];
    }

    // Select first N training days, distribute rest days between.
    // We’ll use the first 7 entries as a canonical week, but only keep up to daysPerWeek strength/conditioning days.
    let strengthCount = 0;
    for (let i = 0; i < 7; i++) {
      const t = dayTemplates[i];
      if (t.kind === "strength" || t.kind === "conditioning") {
        if (strengthCount < p.daysPerWeek) {
          strengthCount++;
          days.push({ ...t, day: names[i], notes: injuriesNote });
        } else {
          days.push({ ...restDay(), day: names[i] });
        }
      } else {
        days.push({ ...t, day: names[i] });
      }
    }

    return {
      split,
      cardio: cardioPrescription(p.goal, p.sessionMinutes),
      progression: [
        "Pick a weight that leaves ~2–3 reps in reserve (RIR).",
        "When you hit the top of the rep range for all sets, add 2–5% load next time.",
        "If energy is low, keep the plan but reduce sets by 1 (minimum effective dose).",
      ],
      days,
    };
  }

  function generatePlan(profile) {
    const p = normalizeProfile(profile);
    const macros = macroTargets(p);
    const training = buildWeeklyTraining(p);
    const cautions = [];
    if (!p.age || !p.heightCm || !p.weightKg) cautions.push("Add age/height/weight for calorie + macro targets.");
    if (p.injuries) cautions.push("Injuries/constraints noted—consider professional guidance if pain is involved.");

    return {
      createdAt: new Date().toISOString(),
      profile: p,
      nutrition: macros
        ? {
            calories: macros.calories,
            proteinG: macros.proteinG,
            carbsG: macros.carbsG,
            fatG: macros.fatG,
            bmr: macros.bmr,
            tdee: macros.tdee,
            guidelines: [
              "Protein: spread across 3–5 meals; include 25–40g per meal.",
              "Fiber: target 25–35g/day (fruits, veg, legumes, whole grains).",
              "Hydration: 30–40 ml/kg/day; more if sweating heavily.",
              "Sleep: target 7–9 hours; keep wake time consistent.",
            ],
          }
        : {
            calories: null,
            proteinG: null,
            carbsG: null,
            fatG: null,
            bmr: null,
            tdee: null,
            guidelines: [
              "Add age/height/weight to get calorie + macro targets.",
              "Prioritize protein + plants + water; keep portions consistent.",
            ],
          },
      training,
      cautions,
      disclaimer:
        "This is a general, educational plan—no medical advice. If you have a medical condition or pain, talk to a qualified professional.",
    };
  }

  return {
    normalizeProfile,
    estimateTdee,
    macroTargets,
    generatePlan,
  };
});

