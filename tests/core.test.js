const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../core");
const defaults = require("../default-plan");
const base = () => C.migrate({}, defaults);
test("períodos individuais incluem exatamente N datas e coincidem com o Geral", () => {
  const today = "2026-09-22";
  for (const days of [30, 90, 365]) {
    const dates = [
      today,
      C.shiftDate(today, 1 - days),
      C.shiftDate(today, -days),
      C.shiftDate(today, 1),
    ];
    const d = {
      sessions: dates.map((date) => ({
        date,
        entries: [
          { exerciseId: "x", type: "forca", sets: [{ weight: 10, reps: 10 }] },
        ],
      })),
    };
    const records = C.exerciseRecords(d, "x", "forca", days, today);
    assert.deepEqual(
      records.map((r) => r.session.date),
      [dates[1], today],
    );
    assert.equal(records.length, C.periodStats(d, today, days).workouts);
    assert.equal(C.exerciseRecords(d, "x", "forca", "all", today).length, 3);
  }
});
test("lembrete respeita sete dias, adiamento e treino ativo; não aparece sem registros", () => {
  const d = base(),
    now = Date.parse("2026-09-22T12:00:00Z"),
    day = 86400000;
  d.backupReminderStartedAt = new Date(now - 7 * day).toISOString();
  assert.equal(C.backupReminderDue(d, now), false);
  d.sessions.push({ id: "test" });
  assert.equal(C.backupReminderDue(d, now - 1), false);
  assert.equal(C.backupReminderDue(d, now), true);
  d.backupReminderSnoozedUntil = new Date(now + 3 * day).toISOString();
  assert.equal(C.backupReminderDue(d, now + 3 * day - 1), false);
  assert.equal(C.backupReminderDue(d, now + 3 * day), true);
  delete d.backupReminderSnoozedUntil;
  d.activeSession = {};
  assert.equal(C.backupReminderDue(d, now), false);
  d.activeSession = null;
  d.lastBackupAt = new Date(now).toISOString();
  assert.equal(C.backupReminderDue(d, now + 7 * day - 1), false);
  assert.equal(C.backupReminderDue(d, now + 7 * day), true);
});
test("carregamento inicia prazo de backup sem alterar armazenamento e preserva adiamento", () => {
  const d = base(),
    raw = JSON.stringify(d);
  const storage = { getItem: (key) => (key === C.KEY ? raw : null) };
  const loaded = C.load(storage, defaults);
  assert.ok(Number.isFinite(Date.parse(loaded.backupReminderStartedAt)));
  assert.equal(storage.getItem(C.KEY), raw);
  loaded.backupReminderSnoozedUntil = "2026-10-01T12:00:00Z";
  const saved = JSON.stringify(loaded);
  const again = C.load({ getItem: () => saved }, defaults);
  assert.equal(again.backupReminderStartedAt, loaded.backupReminderStartedAt);
  assert.equal(
    again.backupReminderSnoozedUntil,
    loaded.backupReminderSnoozedUntil,
  );
});
test("resumo de 30 dias separa atividades e conta o mesmo dia uma vez", () => {
  const d = base();
  d.sessions = [
    {
      date: "2026-09-22",
      entries: [
        {
          type: "forca",
          sets: [
            { weight: 100, reps: 5, done: true },
            { weight: 60, reps: 12, done: true },
            { weight: 1000, reps: 10, done: false },
          ],
        },
        { type: "cardio", sets: [{ minutes: 10, done: true }] },
      ],
    },
    {
      date: "2026-09-22",
      kind: "cardio",
      entries: [{ type: "cardio", sets: [{ minutes: 45 }] }],
    },
    {
      date: "2026-09-22",
      kind: "cardio",
      entries: [{ type: "cardio", sets: [{ minutes: 20 }] }],
    },
    {
      date: "2026-09-21",
      entries: [
        { type: "forca", sets: [{ weight: 20, reps: 10 }] },
        { type: "tempo", sets: [{ seconds: 30 }] },
      ],
    },
    { date: "2026-09-20", entries: [] },
  ];
  d.activeSession = C.startSession(d, C.cycle(d).workouts[0]);
  const original = C.clone(d),
    stats = C.periodStats(d, "2026-09-22");
  assert.equal(stats.activeDays, 2);
  assert.equal(stats.workouts, 2);
  assert.equal(stats.cardios, 3);
  assert.equal(stats.cardioMinutes, 75);
  assert.equal(stats.volume, 1420);
  assert.equal(stats.averageVolume, 710);
  assert.equal(stats.strengthWorkouts, 2);
  assert.equal(stats.records, 4);
  assert.deepEqual(d, original);
});
test("janelas de 30 dias incluem limites sem sobreposição, ignorando datas futuras", () => {
  const d = base();
  d.sessions = [
    "2026-09-23",
    "2026-09-22",
    "2026-08-24",
    "2026-08-23",
    "2026-07-25",
    "2026-07-24",
  ].map((date) => ({
    date,
    entries: [{ type: "forca", sets: [{ weight: 20, reps: 10 }] }],
  }));
  const result = C.activityOverview(d, "2026-09-22");
  assert.equal(result.current.start, "2026-08-24");
  assert.equal(result.current.end, "2026-09-22");
  assert.equal(result.previous.start, "2026-07-25");
  assert.equal(result.previous.end, "2026-08-23");
  assert.equal(result.current.workouts, 2);
  assert.equal(result.previous.workouts, 2);
  assert.equal(result.periods[3].workouts, 1);
  assert.equal(result.periods.length, 6);
  for (let i = 1; i < 6; i++)
    assert.equal(
      result.periods[i].start,
      C.shiftDate(result.periods[i - 1].end, 1),
    );
  assert.equal(C.shiftDate("2024-03-01", -1), "2024-02-29");
  assert.equal(C.shiftDate("2026-01-01", -1), "2025-12-31");
});
test("média ignora séries legadas incompletas e mantém peso corporal válido", () => {
  const d = base();
  d.sessions = [
    {
      date: "2026-09-22",
      entries: [{ type: "forca", sets: [{ weight: "", reps: 10 }] }],
    },
    {
      date: "2026-09-22",
      entries: [{ type: "forca", sets: [{ weight: 0, reps: 10 }] }],
    },
    {
      date: "2026-09-21",
      entries: [{ type: "forca", sets: [{ weight: 20, reps: 10 }] }],
    },
  ];
  const stats = C.periodStats(d, "2026-09-22");
  assert.equal(stats.strengthWorkouts, 2);
  assert.equal(stats.volume, 200);
  assert.equal(stats.averageVolume, 100);
  assert.equal(stats.workouts, 3);
});
test("visão geral vazia e cardio sem musculação retornam métricas finitas", () => {
  const d = base();
  assert.equal(C.activityOverview(d).current.averageVolume, 0);
  C.saveCardio(d, { activity: "Boxe", minutes: 45, date: C.localDate() });
  const stats = C.activityOverview(d).current;
  assert.equal(stats.activeDays, 1);
  assert.equal(stats.cardios, 1);
  assert.equal(stats.workouts, 0);
  assert.equal(stats.averageVolume, 0);
  assert.equal(stats.volume, 0);
});
test("cardios no mesmo dia preservam ficha, sequência, rascunho e timer", () => {
  const d = base();
  d.activeSession = C.startSession(d, C.cycle(d).workouts[0]);
  d.restEnd = Date.now() + 90000;
  const before = C.clone(d);
  const a = C.saveCardio(d, {
    activity: "Boxe",
    minutes: "45",
    date: C.localDate(),
  });
  const b = C.saveCardio(d, {
    activity: "Caminhada rápida",
    minutes: "20.5",
    distance: "2.1",
    date: C.localDate(),
  });
  assert.notEqual(a.id, b.id);
  assert.equal(d.sessions.length, 2);
  for (const key of [
    "cycles",
    "nextWorkoutId",
    "activeSession",
    "restEnd",
    "legacyDraft",
  ])
    assert.deepEqual(d[key], before[key]);
  assert.equal(b.entries[0].sets[0].minutes, 20.5);
  C.validateData(d);
});
test("editar cardio mantém identidade e permite corrigir data, tipo e duração", () => {
  const d = base();
  const original = C.saveCardio(d, {
    activity: "Boxe",
    minutes: 30,
    date: C.localDate(),
  });
  const edited = C.saveCardio(
    d,
    { activity: "Corrida", minutes: 25, date: "2026-01-01", notes: "Esteira" },
    original.id,
  );
  assert.equal(d.sessions.length, 1);
  assert.equal(edited.id, original.id);
  assert.equal(edited.startedAt, original.startedAt);
  assert.equal(edited.date, "2026-01-01");
  assert.equal(edited.notes, "Esteira");
  assert.equal(
    C.exerciseRecords(d, "cardio-avulso-corrida", "cardio").length,
    1,
  );
  assert.equal(C.exerciseRecords(d, "cardio-avulso-boxe", "cardio").length, 0);
});
test("cardio rejeita duração, distância, tipo e data inválidos sem modificar dados", () => {
  const d = base(),
    before = C.clone(d);
  const input = { activity: "Boxe", minutes: 30, date: C.localDate() };
  for (const invalid of [
    { minutes: 0 },
    { minutes: -1 },
    { minutes: "" },
    { minutes: "abc" },
    { distance: -2 },
    { activity: "  " },
    { date: "2099-01-01" },
    { date: "2026-02-30" },
    { notes: "x".repeat(2001) },
  ]) {
    assert.throws(() => C.saveCardio(d, { ...input, ...invalid }));
    assert.deepEqual(d, before);
  }
  assert.throws(() => C.saveCardio(d, input, "missing"));
});
test("backup de cardio preserva registros e valida formato; ciclos novos não apagam cardio", () => {
  const d = base();
  C.saveCardio(d, {
    activity: "Caminhada leve",
    minutes: 15,
    date: C.localDate(),
  });
  const restored = C.backupData(
    JSON.parse(JSON.stringify({ app: "Treino Tiago", version: 2, data: d })),
    defaults,
  );
  assert.deepEqual(restored, d);
  C.activateCycle(restored, { ...C.clone(C.cycle(d)), id: C.uid() });
  assert.deepEqual(restored.sessions, d.sessions);
  restored.sessions[0].entries[0].sets[0].minutes = 0;
  assert.throws(() => C.validateData(restored));
});
test("migração conserva ficha, sessões, rascunhos e data local; timer desativado", () => {
  const old = {
    plan: defaults,
    sessions: [
      {
        id: "s1",
        date: "2026-09-10T10:00:00Z",
        workoutId: "dia-1",
        workoutName: "Perna",
        entries: [
          {
            exerciseId: "agachamento",
            exerciseName: "Agachamento",
            sets: [{ reps: "5", weight: "100" }],
          },
        ],
      },
    ],
    draft: { "dia-1": { x: [{ reps: "10", weight: "50" }] } },
  };
  const d = C.migrate(old, defaults);
  C.validateData(d);
  assert.equal(d.sessions[0].id, "s1");
  assert.equal(d.sessions[0].date, C.localDate(new Date(old.sessions[0].date)));
  assert.equal(d.sessions[0].entries[0].sets[0].weight, "100");
  assert.deepEqual(d.legacyDraft, old.draft);
  assert.equal(d.settings.timer, false);
  assert.equal(old.sessions[0].entries[0].sets[0].done, undefined);
});
test("load não sobrescreve armazenamento legado ou dados corrompidos", () => {
  const map = new Map([["treinoTiago.plan.v1", JSON.stringify(defaults)]]),
    storage = { getItem: (k) => map.get(k) ?? null };
  const before = [...map];
  C.load(storage, defaults);
  assert.deepEqual([...map], before);
  map.set(C.KEY, "INVALID");
  assert.throws(() => C.load(storage, defaults));
  assert.equal(map.get(C.KEY), "INVALID");
});
test("maior carga considera todas as séries e não o produto carga × reps", () => {
  const records = [
    {
      entry: {
        sets: [
          { weight: 100, reps: 5 },
          { weight: 60, reps: 12 },
        ],
      },
    },
  ];
  assert.equal(C.maxWeight(records), 100);
  assert.equal(C.volume(records[0].entry), 1220);
});
test("finalização valida, salva só séries concluídas, avança sequência e não duplica edição", () => {
  const d = base(),
    w = C.cycle(d).workouts[0];
  d.activeSession = C.startSession(d, w);
  assert.throws(() => C.finish(d));
  d.activeSession.entries[0].sets[0] = { reps: 12, weight: 0, done: true };
  d.activeSession.entries[0].sets[1] = { reps: 10, weight: 20, done: false };
  const s = C.finish(d);
  assert.equal(s.entries[0].sets.length, 1);
  assert.equal(d.sessions.length, 1);
  assert.equal(d.nextWorkoutId, "dia-2");
  d.activeSession = { ...C.clone(s), editing: true, runningSince: null };
  d.activeSession.entries[0].sets[0].reps = 15;
  C.finish(d);
  assert.equal(d.sessions.length, 1);
  assert.equal(d.sessions[0].entries[0].sets[0].reps, 15);
  assert.equal(d.nextWorkoutId, "dia-2");
});
test("validação de força, tempo e cardio", () => {
  for (const set of [
    { weight: 50, reps: "" },
    { weight: "", reps: 10 },
    { weight: 20, reps: -2 },
    { weight: 20, reps: 1.5 },
  ])
    assert.notEqual(C.validateSet(set, "forca"), "");
  assert.equal(C.validateSet({ weight: 0, reps: 10 }, "forca"), "");
  assert.equal(C.validateSet({ seconds: 45 }, "tempo"), "");
  assert.notEqual(C.validateSet({ seconds: 0 }, "tempo"), "");
  assert.equal(C.validateSet({ minutes: 30, distance: "" }, "cardio"), "");
  assert.notEqual(C.validateSet({ minutes: 30, distance: -1 }, "cardio"), "");
});
test("rascunho incompleto pode ser retomado sem travar a leitura", () => {
  const d = base();
  d.activeSession = C.startSession(d, C.cycle(d).workouts[0]);
  d.activeSession.entries[0].sets[0].reps = "-1";
  C.validateData(d);
});
test("pausa usa somente tempo ativo", () => {
  assert.equal(
    C.elapsed({ elapsedMs: 5000, runningSince: 10000 }, 15000),
    10000,
  );
  assert.equal(C.elapsed({ elapsedMs: 5000, runningSince: null }, 20000), 5000);
});
test("exportar/importar ficha mantém os exercícios e suas identidades", () => {
  const d = base(),
    c = C.cycle(d),
    parsed = C.parsePlan(C.planText(c), d.cycles);
  assert.equal(parsed.workouts.length, 7);
  assert.equal(
    parsed.workouts[0].exercises[2].id,
    c.workouts[0].exercises[2].id,
  );
  assert.equal(
    parsed.workouts[0].exercises[2].notes,
    c.workouts[0].exercises[2].notes,
  );
  assert.notEqual(parsed.id, c.id);
});
test("importação rejeita formato desconhecido, duplicados e séries fora do limite", () => {
  assert.throws(() => C.parsePlan("Documento livre"));
  assert.throws(() =>
    C.parsePlan("Ciclo: A\nTreino: A\nExercício: X\nExercício: X"),
  );
  assert.throws(() =>
    C.parsePlan("Ciclo: A\nTreino: A\nExercício: X\nSéries: 99"),
  );
  assert.throws(() => C.parsePlan("Ciclo: A\nTreino: A\nCampo: inválido"));
});
test("novo ciclo arquiva ficha sem tocar histórico; treino ativo bloqueia importação", () => {
  const d = base();
  const w = C.cycle(d).workouts[0];
  d.activeSession = C.startSession(d, w);
  assert.throws(() =>
    C.activateCycle(d, C.parsePlan("Ciclo: Novo\nTreino: Descanso")),
  );
  d.activeSession.entries[0].sets[0] = { reps: 15, weight: 0, done: true };
  C.finish(d);
  const history = JSON.stringify(d.sessions),
    first = d.activeCycleId;
  C.activateCycle(d, C.parsePlan("Ciclo: Novo\nTreino: Descanso"));
  assert.equal(d.cycles.length, 2);
  assert.notEqual(d.activeCycleId, first);
  assert.equal(JSON.stringify(d.sessions), history);
});
test("histórico continua consultável após remover exercício do plano", () => {
  const d = base(),
    w = C.cycle(d).workouts[0];
  d.activeSession = C.startSession(d, w);
  d.activeSession.entries[0].sets[0] = { reps: 15, weight: 0, done: true };
  const id = w.exercises[0].id;
  C.finish(d);
  w.exercises.shift();
  assert.equal(C.exerciseRecords(d, id, "forca").length, 1);
});
test("agenda distingue sequência de dias fixos e descanso", () => {
  const d = base();
  assert.equal(C.suggest(d, "2026-09-22").id, "dia-1");
  d.settings.scheduleMode = "semana";
  d.settings.weekdays = { 2: "dia-3" };
  assert.equal(C.suggest(d, "2026-09-22").id, "dia-3");
  assert.equal(C.suggest(d, "2026-09-23"), null);
});
test("backup completo inclui sessão e ciclos, valida antes da substituição", () => {
  const d = base();
  d.activeSession = C.startSession(d, C.cycle(d).workouts[0]);
  const backup = { app: "Treino Tiago", version: 2, data: d };
  assert.deepEqual(C.backupData(backup, defaults), d);
  const invalid = C.clone(backup);
  invalid.data.cycles = [];
  assert.throws(() => C.backupData(invalid, defaults));
  assert.equal(d.cycles.length, 1);
  assert.throws(() => C.backupData({ plan: [], sessions: [] }, defaults));
});
test("datas impossíveis são rejeitadas", () => {
  assert.equal(C.dateOK("2026-02-31"), false);
  assert.equal(C.dateOK("2026-02-28"), true);
});
test("orientações em várias linhas sobrevivem ao ciclo exportar/importar", () => {
  const d = base(),
    c = C.cycle(d);
  c.workouts[0].exercises[0].notes = "Primeira linha\nSegunda linha";
  const result = C.parsePlan(C.planText(c), d.cycles);
  assert.equal(
    result.workouts[0].exercises[0].notes,
    "Primeira linha\nSegunda linha",
  );
});
test("modelo baixável é importável com força, tempo, cardio e descanso", () => {
  const fs = require("node:fs"),
    path = require("node:path");
  const c = C.parsePlan(
    fs.readFileSync(path.join(__dirname, "../modelo-treino.txt"), "utf8"),
  );
  assert.equal(c.workouts.length, 3);
  assert.deepEqual(
    c.workouts.flatMap((w) => w.exercises.map((e) => e.type)),
    ["forca", "tempo", "cardio"],
  );
  assert.equal(c.workouts[2].exercises.length, 0);
});
test("importação reaproveita ID de exercício customizado presente somente no histórico", () => {
  const sessions = [
    { entries: [{ exerciseId: "custom-uuid", exerciseName: "Meu exercício" }] },
  ];
  const c = C.parsePlan(
    "Ciclo: Novo\nTreino: A\nExercício: Meu exercício",
    [],
    sessions,
  );
  assert.equal(c.workouts[0].exercises[0].id, "custom-uuid");
});
