/* global PFSEngine */
(function () {
  "use strict";

  const STORAGE_KEY = "pfs-state";
  const STATE_VERSION = 1;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function nowISODate() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function defaultState() {
    return {
      version: STATE_VERSION,
      updatedAt: new Date().toISOString(),
      settings: {
        units: "metric",
      },
      profile: {
        name: "",
        sex: "male",
        age: "",
        heightCm: "",
        weightKg: "",
        goal: "general",
        experience: "beginner",
        daysPerWeek: 3,
        sessionMinutes: 45,
        equipment: "none",
        activityLevel: "light",
        injuries: "",
        preferences: "",
      },
      generated: {
        plan: null,
      },
      logs: {
        workouts: [],
        body: [],
      },
    };
  }

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== "object") return defaultState();
    return migrateState(parsed);
  }

  function migrateState(s) {
    const state = { ...defaultState(), ...s };
    state.version = STATE_VERSION;
    state.settings = { ...defaultState().settings, ...(s.settings || {}) };
    state.profile = { ...defaultState().profile, ...(s.profile || {}) };
    state.generated = { ...defaultState().generated, ...(s.generated || {}) };
    state.logs = { ...defaultState().logs, ...(s.logs || {}) };
    state.logs.workouts = Array.isArray(state.logs.workouts) ? state.logs.workouts : [];
    state.logs.body = Array.isArray(state.logs.body) ? state.logs.body : [];
    return state;
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function setView(name) {
    $$(".view").forEach((v) => v.classList.remove("active"));
    $$(".tab").forEach((t) => t.classList.remove("active"));
    $(`#view-${name}`).classList.add("active");
    $(`#tab-${name}`).classList.add("active");
    render();
  }

  function openModal(title, bodyNodeOrHtml) {
    $("#modalTitle").textContent = title;
    const body = $("#modalBody");
    body.innerHTML = "";
    if (typeof bodyNodeOrHtml === "string") body.innerHTML = bodyNodeOrHtml;
    else body.appendChild(bodyNodeOrHtml);
    $("#modalOverlay").classList.add("open");
  }
  function closeModal() {
    $("#modalOverlay").classList.remove("open");
  }

  function toMetricProfile(profile) {
    // In this MVP we store metric; inputs already metric. Placeholder for future unit conversions.
    return { ...profile };
  }

  function readProfileFromForm() {
    const p = { ...state.profile };
    p.name = $("#p_name").value.trim();
    p.sex = $("#p_sex").value;
    p.age = $("#p_age").value;
    p.heightCm = $("#p_height").value;
    p.weightKg = $("#p_weight").value;
    p.goal = $("#p_goal").value;
    p.experience = $("#p_exp").value;
    p.daysPerWeek = Number($("#p_days").value);
    p.sessionMinutes = Number($("#p_minutes").value);
    p.equipment = $("#p_eq").value;
    p.activityLevel = $("#p_activity").value;
    p.injuries = $("#p_injuries").value.trim();
    p.preferences = $("#p_prefs").value.trim();
    return toMetricProfile(p);
  }

  function fillProfileForm() {
    const p = state.profile;
    $("#p_name").value = p.name || "";
    $("#p_sex").value = p.sex || "male";
    $("#p_age").value = p.age ?? "";
    $("#p_height").value = p.heightCm ?? "";
    $("#p_weight").value = p.weightKg ?? "";
    $("#p_goal").value = p.goal || "general";
    $("#p_exp").value = p.experience || "beginner";
    $("#p_days").value = String(p.daysPerWeek || 3);
    $("#p_minutes").value = String(p.sessionMinutes || 45);
    $("#p_eq").value = p.equipment || "none";
    $("#p_activity").value = p.activityLevel || "light";
    $("#p_injuries").value = p.injuries || "";
    $("#p_prefs").value = p.preferences || "";
  }

  function generatePlan() {
    state.profile = readProfileFromForm();
    const plan = PFSEngine.generatePlan(state.profile);
    state.generated.plan = plan;
    saveState();
    toast("Plan generated.");
    setView("plan");
  }

  function formatNumber(n, suffix = "") {
    if (n == null || n === "") return "—";
    if (!Number.isFinite(+n)) return "—";
    return `${Math.round(+n)}${suffix}`;
  }

  function renderHero() {
    const p = PFSEngine.normalizeProfile(state.profile);
    const name = p.name ? p.name : "Your";
    $("#heroTitle").textContent = `${name} Personalized Fitness System`;

    const hasPlan = !!state.generated.plan;
    const updated = state.updatedAt ? new Date(state.updatedAt) : null;
    $("#pillPlan").innerHTML = `<strong>Plan</strong> ${hasPlan ? "ready" : "not generated"}`;
    $("#pillUpdated").innerHTML = `<strong>Updated</strong> ${updated ? updated.toLocaleString() : "—"}`;
    $("#pillDays").innerHTML = `<strong>${p.daysPerWeek}</strong> days/week`;
    $("#pillGoal").innerHTML = `<strong>Goal</strong> ${p.goal.replace("_", " ")}`;
  }

  function renderPlanView() {
    const plan = state.generated.plan;
    const wrap = $("#planWrap");
    wrap.innerHTML = "";
    if (!plan) {
      wrap.innerHTML =
        `<div class="hint">No plan yet. Go to <strong>Profile</strong>, fill details, then hit <strong>Generate plan</strong>.</div>`;
      return;
    }

    const n = plan.nutrition || {};
    const kpi = document.createElement("div");
    kpi.className = "kpi";
    kpi.innerHTML = `
      <div class="k">
        <div class="l">Calories/day</div>
        <div class="v">${formatNumber(n.calories, " kcal")}</div>
        <div class="s">Based on BMR ${formatNumber(n.bmr)} and TDEE ${formatNumber(n.tdee)}.</div>
      </div>
      <div class="k">
        <div class="l">Macros/day</div>
        <div class="v">${formatNumber(n.proteinG, "g")} P • ${formatNumber(n.carbsG, "g")} C • ${formatNumber(n.fatG, "g")} F</div>
        <div class="s">Use as a target range; consistency beats perfection.</div>
      </div>
    `;

    const nut = document.createElement("div");
    nut.className = "card";
    nut.innerHTML = `
      <div class="head"><div class="h">Nutrition guidelines</div></div>
      <div class="body">
        <div class="list" id="nutList"></div>
        <div class="hint" style="margin-top:10px;">${plan.disclaimer}</div>
      </div>
    `;

    const nutList = nut.querySelector("#nutList");
    (n.guidelines || []).forEach((g) => {
      const it = document.createElement("div");
      it.className = "item";
      it.innerHTML = `<div class="meta"><div class="t">${escapeHtml(g)}</div></div>`;
      nutList.appendChild(it);
    });

    const train = document.createElement("div");
    train.className = "card";
    train.innerHTML = `
      <div class="head"><div class="h">Weekly training plan</div><div class="hint" style="margin:0;">Split: <strong>${escapeHtml(plan.training.split.replaceAll("_", " "))}</strong></div></div>
      <div class="body">
        <div class="hint"><strong>Cardio:</strong> ${escapeHtml(plan.training.cardio)}</div>
        <div class="hint" style="margin-top:8px;"><strong>Progression:</strong> ${escapeHtml((plan.training.progression || []).join(" "))}</div>
        <hr style="border:0;border-top:1px solid rgba(255,255,255,0.10);margin:14px 0;">
        <div class="list" id="dayList"></div>
      </div>
    `;
    const dayList = train.querySelector("#dayList");
    (plan.training.days || []).forEach((d) => {
      const blocks = (d.blocks || []).map((b) => {
        const items = (b.items || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
        return `<div style="margin-top:8px;"><div class="hint" style="margin:0;"><strong>${escapeHtml(b.label)}</strong></div><ul style="margin:6px 0 0 18px;color:rgba(255,255,255,0.80);">${items}</ul></div>`;
      }).join("");
      const scheme = d.scheme ? `${d.scheme.sets} sets • ${d.scheme.reps} reps • rest ${d.scheme.rest}` : "";
      const note = d.notes ? `<div class="hint"><span class="warn">Note:</span> ${escapeHtml(d.notes)}</div>` : "";
      const it = document.createElement("div");
      it.className = "item";
      it.innerHTML = `
        <div class="meta">
          <div class="t">${escapeHtml(d.day)} — ${escapeHtml(d.title)}</div>
          <div class="d">${escapeHtml(d.focus || "")}${scheme ? ` • ${escapeHtml(scheme)}` : ""}</div>
          ${note}
          ${blocks}
        </div>
      `;
      dayList.appendChild(it);
    });

    if (plan.cautions && plan.cautions.length) {
      const c = document.createElement("div");
      c.className = "card";
      c.innerHTML = `
        <div class="head"><div class="h">Cautions</div></div>
        <div class="body">
          <div class="list" id="cautionList"></div>
        </div>
      `;
      const list = c.querySelector("#cautionList");
      plan.cautions.forEach((x) => {
        const it = document.createElement("div");
        it.className = "item";
        it.innerHTML = `<div class="meta"><div class="t"><span class="warn">Heads up:</span> ${escapeHtml(x)}</div></div>`;
        list.appendChild(it);
      });
      wrap.appendChild(kpi);
      wrap.appendChild(c);
      wrap.appendChild(train);
      wrap.appendChild(nut);
    } else {
      wrap.appendChild(kpi);
      wrap.appendChild(train);
      wrap.appendChild(nut);
    }
  }

  function addWorkoutFromForm() {
    const date = $("#w_date").value || nowISODate();
    const type = $("#w_type").value;
    const minutes = Number($("#w_minutes").value || 0);
    const rpe = Number($("#w_rpe").value || 0);
    const notes = $("#w_notes").value.trim();
    const title = $("#w_title").value.trim() || (type === "strength" ? "Strength session" : type === "cardio" ? "Cardio session" : "Mobility session");

    if (!minutes || minutes < 5) {
      toast("Add workout duration (min).");
      return;
    }

    state.logs.workouts.unshift({
      id: String(Date.now()),
      date,
      title,
      type,
      minutes,
      rpe: rpe ? rpe : null,
      notes,
      createdAt: new Date().toISOString(),
    });
    $("#w_title").value = "";
    $("#w_minutes").value = "";
    $("#w_rpe").value = "";
    $("#w_notes").value = "";
    saveState();
    toast("Workout logged.");
    renderLogs();
    renderCharts();
  }

  function addBodyEntryFromForm() {
    const date = $("#b_date").value || nowISODate();
    const weightKg = Number($("#b_weight").value || 0);
    const waistCm = Number($("#b_waist").value || 0);
    const notes = $("#b_notes").value.trim();

    if (!weightKg || weightKg < 30) {
      toast("Add body weight (kg).");
      return;
    }

    state.logs.body.unshift({
      id: String(Date.now()),
      date,
      weightKg,
      waistCm: waistCm ? waistCm : null,
      notes,
      createdAt: new Date().toISOString(),
    });
    $("#b_weight").value = "";
    $("#b_waist").value = "";
    $("#b_notes").value = "";
    saveState();
    toast("Body metrics saved.");
    renderLogs();
    renderCharts();
  }

  function deleteLog(kind, id) {
    if (kind === "workout") state.logs.workouts = state.logs.workouts.filter((x) => x.id !== id);
    if (kind === "body") state.logs.body = state.logs.body.filter((x) => x.id !== id);
    saveState();
    toast("Deleted.");
    renderLogs();
    renderCharts();
  }

  function renderLogs() {
    const w = $("#workoutList");
    const b = $("#bodyList");
    w.innerHTML = "";
    b.innerHTML = "";

    const workouts = state.logs.workouts.slice(0, 50);
    if (!workouts.length) {
      w.innerHTML = `<div class="hint">No workouts logged yet.</div>`;
    } else {
      workouts.forEach((x) => {
        const it = document.createElement("div");
        it.className = "item";
        it.innerHTML = `
          <div class="meta">
            <div class="t">${escapeHtml(x.title)}</div>
            <div class="d">${escapeHtml(x.date)} • ${escapeHtml(x.type)} • ${escapeHtml(String(x.minutes))} min${x.rpe ? ` • RPE ${escapeHtml(String(x.rpe))}` : ""}</div>
            ${x.notes ? `<div class="n">${escapeHtml(x.notes)}</div>` : ""}
          </div>
          <div class="right">
            <button class="btn small danger" data-del="workout:${escapeAttr(x.id)}">Delete</button>
          </div>
        `;
        w.appendChild(it);
      });
    }

    const body = state.logs.body.slice(0, 50);
    if (!body.length) {
      b.innerHTML = `<div class="hint">No body metrics yet (weight/waist).</div>`;
    } else {
      body.forEach((x) => {
        const it = document.createElement("div");
        it.className = "item";
        it.innerHTML = `
          <div class="meta">
            <div class="t">${escapeHtml(x.date)}</div>
            <div class="d">${escapeHtml(String(Math.round(x.weightKg)))} kg${x.waistCm ? ` • ${escapeHtml(String(Math.round(x.waistCm)))} cm waist` : ""}</div>
            ${x.notes ? `<div class="n">${escapeHtml(x.notes)}</div>` : ""}
          </div>
          <div class="right">
            <button class="btn small danger" data-del="body:${escapeAttr(x.id)}">Delete</button>
          </div>
        `;
        b.appendChild(it);
      });
    }
  }

  function renderCharts() {
    drawWeightChart($("#weightChart"), state.logs.body);
    drawWorkoutsChart($("#workoutChart"), state.logs.workouts);
  }

  function drawAxes(ctx, w, h) {
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(36, 12);
    ctx.lineTo(36, h - 26);
    ctx.lineTo(w - 12, h - 26);
    ctx.stroke();
  }

  function drawWeightChart(canvas, entries) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.clientWidth * devicePixelRatio);
    const h = (canvas.height = canvas.clientHeight * devicePixelRatio);
    ctx.clearRect(0, 0, w, h);
    drawAxes(ctx, w, h);

    const pts = (entries || [])
      .map((e) => ({ date: e.date, y: Number(e.weightKg) }))
      .filter((p) => Number.isFinite(p.y))
      .sort((a, b) => a.date.localeCompare(b.date));

    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = `${12 * devicePixelRatio}px ui-sans-serif, system-ui`;
    ctx.fillText("Weight (kg)", 12 * devicePixelRatio, 16 * devicePixelRatio);

    if (pts.length < 2) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("Log at least 2 entries to see a trend.", 12 * devicePixelRatio, 36 * devicePixelRatio);
      return;
    }

    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    const pad = Math.max(1, (maxY - minY) * 0.12);
    const y0 = minY - pad;
    const y1 = maxY + pad;

    const xLeft = 36 * devicePixelRatio;
    const xRight = w - 12 * devicePixelRatio;
    const yTop = 12 * devicePixelRatio;
    const yBottom = h - 26 * devicePixelRatio;

    const xFor = (i) => xLeft + (i / (pts.length - 1)) * (xRight - xLeft);
    const yFor = (val) => yBottom - ((val - y0) / (y1 - y0)) * (yBottom - yTop);

    ctx.strokeStyle = "rgba(57,217,138,0.85)";
    ctx.lineWidth = 2 * devicePixelRatio;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = xFor(i);
      const y = yFor(p.y);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // points
    ctx.fillStyle = "rgba(57,217,138,0.95)";
    pts.forEach((p, i) => {
      const x = xFor(i);
      const y = yFor(p.y);
      ctx.beginPath();
      ctx.arc(x, y, 3.2 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    });

    // min/max labels
    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.fillText(String(Math.round(maxY)), 6 * devicePixelRatio, yFor(maxY) + 4 * devicePixelRatio);
    ctx.fillText(String(Math.round(minY)), 6 * devicePixelRatio, yFor(minY) + 4 * devicePixelRatio);
  }

  function weekKey(isoDate) {
    const d = new Date(isoDate + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) return null;
    // ISO week approximation: use Monday-start week by shifting to nearest Thursday.
    const day = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    d.setUTCDate(d.getUTCDate() - day + 3);
    const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const firstDay = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
    const week = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  function drawWorkoutsChart(canvas, workouts) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.clientWidth * devicePixelRatio);
    const h = (canvas.height = canvas.clientHeight * devicePixelRatio);
    ctx.clearRect(0, 0, w, h);
    drawAxes(ctx, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = `${12 * devicePixelRatio}px ui-sans-serif, system-ui`;
    ctx.fillText("Workouts/week", 12 * devicePixelRatio, 16 * devicePixelRatio);

    const map = new Map();
    (workouts || []).forEach((x) => {
      const k = weekKey(x.date);
      if (!k) return;
      map.set(k, (map.get(k) || 0) + 1);
    });
    const keys = Array.from(map.keys()).sort();
    if (keys.length < 2) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("Log workouts across at least 2 weeks to see a trend.", 12 * devicePixelRatio, 36 * devicePixelRatio);
      return;
    }

    const vals = keys.map((k) => map.get(k));
    const maxV = Math.max(...vals, 1);
    const xLeft = 36 * devicePixelRatio;
    const xRight = w - 12 * devicePixelRatio;
    const yTop = 12 * devicePixelRatio;
    const yBottom = h - 26 * devicePixelRatio;
    const xFor = (i) => xLeft + (i / (keys.length - 1)) * (xRight - xLeft);
    const yFor = (val) => yBottom - (val / maxV) * (yBottom - yTop);

    ctx.strokeStyle = "rgba(88,166,255,0.85)";
    ctx.lineWidth = 2 * devicePixelRatio;
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = xFor(i);
      const y = yFor(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "rgba(88,166,255,0.95)";
    vals.forEach((v, i) => {
      const x = xFor(i);
      const y = yFor(v);
      ctx.beginPath();
      ctx.arc(x, y, 3.2 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.fillText(String(maxV), 6 * devicePixelRatio, yFor(maxV) + 4 * devicePixelRatio);
    ctx.fillText("0", 12 * devicePixelRatio, yFor(0) + 4 * devicePixelRatio);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replaceAll("'", "&#39;");
  }

  function openExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pfs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Exported backup.");
  }

  function openImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = safeParse(reader.result);
        if (!parsed) {
          toast("Invalid JSON file.");
          return;
        }
        state = migrateState(parsed);
        saveState();
        fillProfileForm();
        toast("Imported.");
        render();
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function resetAll() {
    openModal(
      "Reset everything?",
      `<div class="hint">This will delete your profile, plan, and logs from this browser.</div>
       <div class="hint"><span class="dangerText">This cannot be undone.</span> Export a backup first if you want to keep your data.</div>`
    );
    $("#modalConfirm").onclick = () => {
      localStorage.removeItem(STORAGE_KEY);
      state = defaultState();
      saveState();
      fillProfileForm();
      closeModal();
      toast("Reset complete.");
      setView("profile");
    };
  }

  function renderProfileSummary() {
    const p = PFSEngine.normalizeProfile(state.profile);
    const est = PFSEngine.estimateTdee(p);
    $("#profileSummary").innerHTML = `
      <div class="k">
        <div class="l">Estimated BMR</div>
        <div class="v">${est ? formatNumber(est.bmr, " kcal") : "—"}</div>
        <div class="s">Resting energy estimate (Mifflin-St Jeor).</div>
      </div>
      <div class="k">
        <div class="l">Estimated TDEE</div>
        <div class="v">${est ? formatNumber(est.tdee, " kcal") : "—"}</div>
        <div class="s">Daily energy with activity level.</div>
      </div>
    `;
  }

  function render() {
    renderHero();
    const active = $(".view.active")?.id || "";
    if (active === "view-profile") renderProfileSummary();
    if (active === "view-plan") renderPlanView();
    if (active === "view-log") renderLogs();
    if (active === "view-progress") renderCharts();
  }

  function wireEvents() {
    // Tabs
    ["profile", "plan", "log", "progress", "settings"].forEach((name) => {
      $(`#tab-${name}`).addEventListener("click", () => setView(name));
    });

    // Profile
    $("#btnGenerate").addEventListener("click", generatePlan);
    $("#btnSaveProfile").addEventListener("click", () => {
      state.profile = readProfileFromForm();
      saveState();
      toast("Profile saved.");
      renderProfileSummary();
    });
    $$("#view-profile input, #view-profile select, #view-profile textarea").forEach((el) => {
      el.addEventListener("change", () => {
        state.profile = readProfileFromForm();
        saveState();
        renderProfileSummary();
      });
    });

    // Log
    $("#w_date").value = nowISODate();
    $("#b_date").value = nowISODate();
    $("#btnAddWorkout").addEventListener("click", addWorkoutFromForm);
    $("#btnAddBody").addEventListener("click", addBodyEntryFromForm);
    $("#view-log").addEventListener("click", (e) => {
      const btn = e.target.closest?.("[data-del]");
      if (!btn) return;
      const [kind, id] = btn.getAttribute("data-del").split(":");
      deleteLog(kind, id);
    });

    // Progress rerender on resize
    window.addEventListener("resize", () => {
      if ($("#view-progress").classList.contains("active")) renderCharts();
    });

    // Settings/actions
    $("#btnExport").addEventListener("click", openExport);
    $("#btnImport").addEventListener("click", openImport);
    $("#btnReset").addEventListener("click", resetAll);

    $("#modalCancel").addEventListener("click", () => {
      closeModal();
      $("#modalConfirm").onclick = null;
    });
    $("#modalConfirm").addEventListener("click", () => {
      if (typeof $("#modalConfirm").onclick === "function") $("#modalConfirm").onclick();
    });
  }

  let state = loadState();

  window.addEventListener("DOMContentLoaded", () => {
    fillProfileForm();
    wireEvents();
    setView("profile");
    render();
  });
})();

