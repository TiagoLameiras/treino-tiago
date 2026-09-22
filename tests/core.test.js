const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../core");
const defaults = require("../default-plan");
const base = () => C.migrate({}, defaults);
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
