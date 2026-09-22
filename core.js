(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Training = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const KEY = "treinoTiago.data.v2";
  const types = ["forca", "tempo", "cardio"];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = () => crypto.randomUUID();
  const slug = (text) =>
    String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const localDate = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const dateOK = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    localDate(new Date(value + "T12:00:00")) === value;
  function countSets(value) {
    return Math.max(
      1,
      Math.min(30, Number(String(value).match(/\d+/)?.[0]) || 3),
    );
  }
  function inferType(ex) {
    if (/cardio|caminhada|corrida/i.test(ex.name)) return "cardio";
    if (/seg|min/.test(ex.reps || "") && !/ou/.test(ex.reps)) return "tempo";
    return "forca";
  }
  function normalizePlan(plan) {
    return clone(plan).map((w) => ({
      ...w,
      exercises: w.exercises.map((e) => ({
        ...e,
        type: e.type || inferType(e),
      })),
    }));
  }
  function migrate(old, defaults) {
    const plan = normalizePlan(old.plan || defaults);
    const c = {
      id: uid(),
      name: "Ficha original",
      createdAt: new Date().toISOString(),
      workouts: plan,
    };
    return {
      version: 2,
      cycles: [c],
      activeCycleId: c.id,
      sessions: (old.sessions || []).map((s) => ({
        ...clone(s),
        date: dateOK(s.date) ? s.date : localDate(new Date(s.date)),
        cycleId: c.id,
        cycleName: c.name,
        updatedAt: s.date,
        elapsedMs: 0,
        entries: s.entries.map((e) => ({
          ...e,
          type: e.type || "forca",
          sets: e.sets.map((set) => ({ ...set, done: true })),
        })),
      })),
      activeSession: null,
      legacyDraft: clone(old.draft || {}),
      settings: {
        timer: false,
        restSeconds: 90,
        weeklyGoal: 4,
        scheduleMode: "sequencia",
        weekdays: {},
      },
      nextWorkoutId: plan[0].id,
    };
  }
  function assert(ok, message) {
    if (!ok) throw new Error(message);
  }
  function text(value, label, max = 500) {
    assert(
      typeof value === "string" && value.length <= max,
      `${label}: texto inválido.`,
    );
  }
  function validatePlan(plan) {
    assert(
      Array.isArray(plan) && plan.length > 0 && plan.length <= 31,
      "A ficha precisa ter entre 1 e 31 treinos.",
    );
    const ids = new Set();
    for (const w of plan) {
      text(w.id, "ID");
      text(w.name, "Nome do treino", 120);
      assert(w.name.trim() && !ids.has(w.id), "Treinos vazios ou repetidos.");
      ids.add(w.id);
      assert(
        Array.isArray(w.exercises) && w.exercises.length <= 100,
        "Máximo de 100 exercícios por treino.",
      );
      const exIds = new Set();
      for (const e of w.exercises) {
        text(e.id, "ID");
        text(e.name, "Exercício", 180);
        assert(
          e.name.trim() && !exIds.has(e.id),
          "Exercícios vazios ou repetidos no mesmo treino.",
        );
        exIds.add(e.id);
        assert(
          types.includes(e.type),
          "Tipo inválido. Use forca, tempo ou cardio.",
        );
        for (const k of ["sets", "reps", "rest", "notes"])
          text(String(e[k] ?? ""), k, k === "notes" ? 2000 : 200);
        assert(
          /^\d{1,2}(?:\s*-\s*\d{1,2})?$/.test(String(e.sets)) &&
            Number(String(e.sets).split("-")[0]) >= 1 &&
            String(e.sets)
              .split("-")
              .every((n) => Number(n) <= 30),
          "Séries: use de 1 a 30, ou um intervalo como 3-4.",
        );
      }
    }
    return plan;
  }
  function numeric(value) {
    return (
      value !== "" &&
      value !== null &&
      value !== undefined &&
      Number.isFinite(Number(value)) &&
      Number(value) >= 0
    );
  }
  function validateSet(set, type) {
    if (type === "forca") {
      if (
        !numeric(set.reps) ||
        Number(set.reps) <= 0 ||
        !Number.isInteger(Number(set.reps))
      )
        return "Preencha repetições inteiras maiores que zero.";
      if (!numeric(set.weight))
        return "Preencha a carga. Use 0 para peso corporal ou sem carga.";
    } else {
      const field = type === "tempo" ? "seconds" : "minutes";
      if (!numeric(set[field]) || Number(set[field]) <= 0)
        return `Preencha ${type === "tempo" ? "os segundos" : "os minutos"} acima de zero.`;
      if (
        type === "cardio" &&
        set.distance !== "" &&
        set.distance != null &&
        !numeric(set.distance)
      )
        return "A distância precisa ser positiva ou ficar vazia.";
    }
    return "";
  }
  function validateData(data) {
    assert(
      data &&
        data.version === 2 &&
        Array.isArray(data.cycles) &&
        data.cycles.length > 0 &&
        data.cycles.length <= 300,
      "Backup incompatível.",
    );
    const ids = new Set();
    data.cycles.forEach((c) => {
      text(c.id, "Ciclo");
      text(c.name, "Nome do ciclo", 120);
      assert(!ids.has(c.id), "Ciclos repetidos.");
      ids.add(c.id);
      validatePlan(c.workouts);
      if (c.archivedWorkouts !== undefined) {
        assert(
          Array.isArray(c.archivedWorkouts) &&
            c.archivedWorkouts.length <= 1000,
          "Treinos arquivados inválidos.",
        );
        c.archivedWorkouts.forEach((w) => validatePlan([w]));
      }
    });
    assert(ids.has(data.activeCycleId), "Ficha ativa não encontrada.");
    assert(
      Array.isArray(data.sessions) && data.sessions.length <= 50000,
      "Histórico inválido.",
    );
    const sessionIds = new Set();
    function checkSession(s, active = false) {
      text(s.id, "Sessão");
      text(s.workoutName, "Treino", 120);
      assert(dateOK(s.date), "Data inválida no histórico.");
      assert(
        Array.isArray(s.entries) && s.entries.length <= 100,
        "Exercícios inválidos no histórico.",
      );
      s.entries.forEach((e) => {
        text(e.exerciseId, "Exercício");
        text(e.exerciseName, "Nome do exercício", 180);
        assert(types.includes(e.type), "Tipo inválido no histórico.");
        assert(
          Array.isArray(e.sets) && e.sets.length <= 100,
          "Séries inválidas.",
        );
        e.sets.forEach((set) => {
          assert(set && typeof set === "object", "Série inválida.");
          assert(
            set.done === undefined || typeof set.done === "boolean",
            "Marcação de série inválida.",
          );
          for (const k of ["reps", "weight", "seconds", "minutes", "distance"])
            if (set[k] != null && set[k] !== "")
              assert(
                active ? Number.isFinite(Number(set[k])) : numeric(set[k]),
                "Há valores inválidos no histórico.",
              );
        });
      });
      if (s.kind === "cardio") {
        assert(!active, "Cardio avulso deve ser salvo após a atividade.");
        text(s.activity, "Atividade", 100);
        text(s.notes || "", "Observações", 2000);
        assert(
          s.activity.trim() &&
            s.entries.length === 1 &&
            s.entries[0].type === "cardio" &&
            s.entries[0].sets.length === 1,
          "Registro de cardio inválido.",
        );
        const error = validateSet(s.entries[0].sets[0], "cardio");
        assert(!error, error);
      }
      if (active) {
        assert(
          s.workout && Array.isArray(s.workout.exercises),
          "Sessão em andamento inválida.",
        );
        validatePlan([s.workout]);
      }
    }
    data.sessions.forEach((s) => {
      checkSession(s);
      assert(!sessionIds.has(s.id), "Sessões duplicadas no backup.");
      sessionIds.add(s.id);
    });
    if (data.activeSession) checkSession(data.activeSession, true);
    assert(
      data.settings && typeof data.settings.timer === "boolean",
      "Ajustes inválidos.",
    );
    assert(
      ["sequencia", "semana"].includes(data.settings.scheduleMode),
      "Rotina inválida.",
    );
    assert(
      Number.isFinite(data.settings.restSeconds) &&
        data.settings.restSeconds >= 5 &&
        data.settings.restSeconds <= 900,
      "Descanso inválido.",
    );
    assert(
      Number.isInteger(data.settings.weeklyGoal) &&
        data.settings.weeklyGoal >= 1 &&
        data.settings.weeklyGoal <= 7,
      "Meta semanal inválida.",
    );
    assert(
      data.settings.weekdays && typeof data.settings.weekdays === "object",
      "Agenda inválida.",
    );
    if (data.restEnd != null)
      assert(Number.isFinite(data.restEnd), "Timer inválido.");
    return data;
  }
  function load(storage, defaults) {
    const saved = storage.getItem(KEY);
    if (saved !== null) return validateData(JSON.parse(saved));
    const old = {};
    for (const k of ["plan", "sessions", "draft"]) {
      const value = storage.getItem(`treinoTiago.${k}.v1`);
      if (value !== null) old[k] = JSON.parse(value);
    }
    const data = migrate(old, defaults);
    validateData(data);
    return data;
  }
  function cycle(data) {
    return data.cycles.find((c) => c.id === data.activeCycleId);
  }
  function suggest(data, day = localDate()) {
    const plan = cycle(data).workouts;
    if (data.settings.scheduleMode === "semana") {
      const id = data.settings.weekdays[new Date(day + "T12:00:00").getDay()];
      return id ? plan.find((w) => w.id === id) || null : null;
    }
    return plan.find((w) => w.id === data.nextWorkoutId) || plan[0];
  }
  function emptySet() {
    return {
      reps: "",
      weight: "",
      seconds: "",
      minutes: "",
      distance: "",
      done: false,
    };
  }
  function startSession(data, workout, date = localDate()) {
    const c = cycle(data),
      draft = data.legacyDraft?.[workout.id];
    return {
      id: uid(),
      date,
      workoutId: workout.id,
      workoutName: workout.name,
      workout: clone(workout),
      cycleId: c.id,
      cycleName: c.name,
      notes: "",
      startedAt: new Date().toISOString(),
      runningSince: Date.now(),
      elapsedMs: 0,
      entries: workout.exercises.map((e) => ({
        exerciseId: e.id,
        exerciseName: e.name,
        type: e.type,
        sets: draft?.[e.id]?.length
          ? draft[e.id].map((s) => ({ ...emptySet(), ...s }))
          : Array.from({ length: countSets(e.sets) }, emptySet),
      })),
    };
  }
  function elapsed(s, now = Date.now()) {
    return (
      (s.elapsedMs || 0) +
      (s.runningSince ? Math.max(0, now - s.runningSince) : 0)
    );
  }
  function finish(data) {
    const s = data.activeSession;
    assert(s, "Não há treino em andamento.");
    assert(dateOK(s.date), "Escolha uma data válida.");
    const result = clone(s);
    result.entries = result.entries
      .map((e) => ({ ...e, sets: e.sets.filter((set) => set.done) }))
      .filter((e) => e.sets.length);
    assert(
      result.entries.length || s.workout.exercises.length === 0,
      "Marque pelo menos uma série como concluída.",
    );
    result.entries.forEach((e) =>
      e.sets.forEach((set) =>
        assert(
          !validateSet(set, e.type),
          `${e.exerciseName}: ${validateSet(set, e.type)}`,
        ),
      ),
    );
    result.elapsedMs = elapsed(s);
    result.runningSince = null;
    result.updatedAt = new Date().toISOString();
    delete result.editing;
    const existing = data.sessions.findIndex((item) => item.id === result.id);
    if (existing >= 0) data.sessions[existing] = result;
    else data.sessions.push(result);
    if (!s.editing && s.cycleId === data.activeCycleId) {
      const plan = cycle(data).workouts;
      const i = plan.findIndex((w) => w.id === s.workoutId);
      data.nextWorkoutId = plan[(i + 1) % plan.length].id;
    }
    if (data.legacyDraft) delete data.legacyDraft[s.workoutId];
    data.activeSession = null;
    return result;
  }
  function exerciseRecords(data, id, type, days = "all") {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    if (days !== "all") cutoff.setDate(cutoff.getDate() - Number(days));
    return data.sessions
      .filter((s) => days === "all" || new Date(s.date + "T12:00:00") >= cutoff)
      .flatMap((s) =>
        s.entries
          .filter((e) => e.exerciseId === id && (!type || e.type === type))
          .map((e) => ({ session: s, entry: e })),
      )
      .sort(
        (a, b) =>
          a.session.date.localeCompare(b.session.date) ||
          String(a.session.startedAt || a.session.updatedAt).localeCompare(
            String(b.session.startedAt || b.session.updatedAt),
          ),
      );
  }
  function saveCardio(data, input, id = null) {
    const activity = String(input.activity || "").trim();
    text(activity, "Atividade", 100);
    assert(activity && slug(activity), "Informe o tipo de cardio.");
    assert(
      dateOK(input.date) && input.date <= localDate(),
      "Escolha uma data válida, até hoje.",
    );
    const set = {
      minutes: input.minutes,
      distance: input.distance ?? "",
      done: true,
    };
    const error = validateSet(set, "cardio");
    assert(!error, error);
    const notes = String(input.notes || "").trim();
    text(notes, "Observações", 2000);
    const index = id
      ? data.sessions.findIndex((s) => s.id === id && s.kind === "cardio")
      : -1;
    assert(!id || index >= 0, "Registro de cardio não encontrado.");
    const previous = index >= 0 ? data.sessions[index] : null;
    const now = new Date().toISOString();
    const result = {
      id: previous?.id || uid(),
      kind: "cardio",
      activity,
      date: input.date,
      workoutId: "cardio-avulso-" + slug(activity),
      workoutName: activity,
      cycleId: "cardio-avulso",
      cycleName: "Cardio avulso",
      notes,
      startedAt: previous?.startedAt || now,
      updatedAt: now,
      elapsedMs: Number(set.minutes) * 60000,
      runningSince: null,
      entries: [
        {
          exerciseId: "cardio-avulso-" + slug(activity),
          exerciseName: activity,
          type: "cardio",
          sets: [
            {
              ...set,
              minutes: Number(set.minutes),
              distance: set.distance === "" ? "" : Number(set.distance),
            },
          ],
        },
      ],
    };
    if (index >= 0) data.sessions[index] = result;
    else data.sessions.push(result);
    return result;
  }
  const volume = (entry) =>
    entry.sets.reduce(
      (sum, s) => sum + (Number(s.reps) || 0) * (Number(s.weight) || 0),
      0,
    );
  const maxWeight = (records) =>
    Math.max(
      0,
      ...records.flatMap((r) => r.entry.sets.map((s) => Number(s.weight) || 0)),
    );
  function shiftDate(day, amount) {
    const date = new Date(day + "T12:00:00");
    date.setDate(date.getDate() + amount);
    return localDate(date);
  }
  function periodStats(data, end = localDate(), days = 30) {
    const start = shiftDate(end, 1 - days);
    const sessions = data.sessions.filter(
      (s) => s.date >= start && s.date <= end,
    );
    const result = {
      start,
      end,
      activeDays: 0,
      workouts: 0,
      cardios: 0,
      cardioMinutes: 0,
      volume: 0,
      strengthWorkouts: 0,
      averageVolume: 0,
      records: 0,
    };
    const dates = new Set();
    for (const session of sessions) {
      const entries = session.entries
        .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done !== false) }))
        .filter((e) => e.sets.length);
      if (!entries.length) continue;
      result.records++;
      dates.add(session.date);
      if (entries.some((e) => e.type !== "cardio")) result.workouts++;
      let hasStrength = false;
      for (const entry of entries) {
        if (entry.type === "cardio") {
          result.cardios++;
          result.cardioMinutes += entry.sets.reduce(
            (n, s) => n + (Number(s.minutes) || 0),
            0,
          );
        }
        if (entry.type === "forca") {
          const validSets = entry.sets.filter((s) => !validateSet(s, "forca"));
          if (validSets.length) {
            hasStrength = true;
            result.volume += volume({ sets: validSets });
          }
        }
      }
      if (hasStrength) result.strengthWorkouts++;
    }
    result.activeDays = dates.size;
    result.averageVolume = result.strengthWorkouts
      ? result.volume / result.strengthWorkouts
      : 0;
    return result;
  }
  function activityOverview(data, today = localDate()) {
    const periods = Array.from({ length: 6 }, (_, i) =>
      periodStats(data, shiftDate(today, -30 * (5 - i))),
    );
    return { current: periods[5], previous: periods[4], periods };
  }
  function parsePlan(source, existing = [], sessions = []) {
    assert(
      typeof source === "string" && source.length < 500000,
      "Documento muito grande.",
    );
    const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/);
    let name = "",
      w = null,
      e = null;
    const workouts = [];
    const known = new Map([
      ...sessions.flatMap((s) =>
        s.entries.map((e) => [slug(e.exerciseName), e.exerciseId]),
      ),
      ...existing
        .flatMap((c) => c.workouts.flatMap((w) => w.exercises))
        .map((e) => [slug(e.name), e.id]),
    ]);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([^:]+):\s*(.*)$/);
      assert(
        match,
        `Linha ${i + 1}: mantenha o formato Campo: valor. Use # antes de comentários.`,
      );
      const key = slug(match[1]),
        value = match[2].trim();
      if (key === "ciclo") {
        assert(!name, "Use apenas um campo Ciclo.");
        name = value;
      } else if (key === "treino") {
        w = { id: uid(), name: value, focus: "", goal: "", exercises: [] };
        workouts.push(w);
        e = null;
      } else if (key === "exercicio") {
        assert(w, `Linha ${i + 1}: coloque Treino antes do exercício.`);
        e = {
          id: known.get(slug(value)) || slug(value),
          name: value,
          type: "forca",
          sets: "3",
          reps: "",
          rest: "",
          notes: "",
        };
        w.exercises.push(e);
      } else if (key === "foco" || key === "objetivo") {
        assert(
          w && !e,
          `Linha ${i + 1}: ${match[1]} deve vir antes dos exercícios.`,
        );
        w[key === "foco" ? "focus" : "goal"] = value;
      } else if (["tipo", "series", "meta", "descanso", "obs"].includes(key)) {
        assert(e, `Linha ${i + 1}: coloque Exercício antes deste campo.`);
        const field = {
          tipo: "type",
          series: "sets",
          meta: "reps",
          descanso: "rest",
          obs: "notes",
        }[key];
        e[field] =
          key === "tipo"
            ? slug(value)
            : key === "obs" && e.notes
              ? e.notes + "\n" + value
              : value;
      } else
        throw new Error(
          `Linha ${i + 1}: campo “${match[1]}” desconhecido. Use o modelo do app.`,
        );
    }
    assert(name.trim(), "Preencha Ciclo: com o nome da ficha.");
    text(name, "Ciclo", 120);
    validatePlan(workouts);
    return { id: uid(), name, createdAt: new Date().toISOString(), workouts };
  }
  function planText(c) {
    return [
      "# Ficha do Treino Tiago",
      "# Edite apenas depois dos dois-pontos. Duplique os blocos Treino e Exercício quando precisar.",
      "# Tipos: forca (reps e kg), tempo (segundos), cardio (minutos e km). Séries: 1 a 30.",
      "# Um treino sem exercícios representa descanso. Linhas iniciadas com # são comentários.",
      "# Salve em DOCX ou TXT e importe em Fichas. O histórico anterior será mantido.",
      "",
      `Ciclo: ${c.name}`,
      "",
      ...c.workouts.flatMap((w) => [
        `Treino: ${w.name}`,
        `Foco: ${w.focus || ""}`,
        `Objetivo: ${w.goal || ""}`,
        ...w.exercises.flatMap((e) => [
          "",
          `Exercício: ${e.name}`,
          `Tipo: ${e.type}`,
          `Séries: ${e.sets}`,
          `Meta: ${e.reps}`,
          `Descanso: ${e.rest}`,
          ...String(e.notes || "")
            .split(/\r?\n/)
            .map((line) => `Obs: ${line}`),
        ]),
        "",
      ]),
    ].join("\n");
  }
  function activateCycle(data, newCycle) {
    assert(
      !data.activeSession,
      "Finalize ou descarte o treino em andamento antes de trocar a ficha.",
    );
    validatePlan(newCycle.workouts);
    data.cycles.push(newCycle);
    data.activeCycleId = newCycle.id;
    data.nextWorkoutId = newCycle.workouts[0].id;
    data.settings.weekdays = {};
    data.settings.scheduleMode = "sequencia";
  }
  function backupData(value, defaults) {
    if (value?.version === 2 && value?.app === "Treino Tiago")
      return validateData(clone(value.data));
    if (
      value?.app === "Treino Tiago" &&
      value.version === 1 &&
      Array.isArray(value.plan) &&
      Array.isArray(value.sessions)
    )
      return validateData(migrate(value, defaults));
    throw new Error("Este arquivo não é um backup compatível do Treino Tiago.");
  }
  return {
    KEY,
    types,
    clone,
    uid,
    slug,
    localDate,
    dateOK,
    countSets,
    inferType,
    normalizePlan,
    migrate,
    validatePlan,
    validateSet,
    validateData,
    load,
    cycle,
    suggest,
    emptySet,
    startSession,
    elapsed,
    finish,
    saveCardio,
    exerciseRecords,
    volume,
    maxWeight,
    shiftDate,
    periodStats,
    activityOverview,
    parsePlan,
    planText,
    activateCycle,
    backupData,
  };
});
