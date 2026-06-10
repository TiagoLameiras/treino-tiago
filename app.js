const defaultPlan = [
  {
    id: "dia-1",
    name: "Dia 1 - Perna",
    focus: "Quadriceps",
    goal: "Agachamento, unilateral, extensora e controle de amplitude.",
    exercises: [
      ex("Mobilidade tornozelo", "2", "15 por lado", "15-30 seg", "Apenas destravar. Nao transformar em aquecimento longo."),
      ex("Extensora no banco - ativacao", "3", "15 a 20", "45-60 seg", "1 seg de contracao no topo. Descida controlada. Sem chutar o peso."),
      ex("Agachamento livre com barra", "4", "6 a 10", "2 min", "Principal. Barra alta, tronco mais vertical, joelho avancando e pe inteiro no chao. Usar suporte de seguranca. Manter 1-2 RIR."),
      ex("Agachamento bulgaro foco quadriceps", "3-4", "8 a 12 por perna", "90 seg", "Tronco mais em pe, pe da frente nao muito longe, amplitude grande."),
      ex("Agachamento ciclista com calcanhar elevado", "3", "10 a 15", "90 seg", "Calcanhar em anilha ou step estavel. 3 seg descendo, pausa curta no fundo e sobe forte."),
      ex("Extensora no banco - finalizadora", "3", "10 a 15", "60 seg", "Ultima serie: 10-15 reps + 15 seg descanso + 5-8 reps. Contracao limpa."),
      ex("Panturrilha em pe no step", "4", "10 a 20", "45-60 seg", "Amplitude total. Desce tudo, sobe tudo e segura 1 seg no topo."),
      ex("Abdutora no cross/caneleira", "2", "15 a 20 por lado", "45-60 seg", "Opcional. So entra se sobrar energia.")
    ]
  },
  {
    id: "dia-2",
    name: "Dia 2 - Costas",
    focus: "Costas completa",
    goal: "Costas largas e densas, sem transformar tudo em biceps.",
    exercises: [
      ex("Mobilidade escapula/ombro", "2", "15", "15-30 seg", "Ativar escapulas antes das puxadas e remadas."),
      ex("Puxada alta pronada ou neutra no cross", "4", "8 a 12", "90 seg", "Peito aberto, cotovelos descem para as costelas."),
      ex("Remada curvada com barra pronada", "4", "6 a 10", "2 min", "Base pesada. Coluna neutra, abdomen firme, cotovelo para tras."),
      ex("Remada unilateral no cross ou halter", "3", "10 a 12 por lado", "90 seg", "Controlar a escapula. 1 seg de contracao no fim."),
      ex("Puxada alta supinada no cross", "3", "8 a 12", "90 seg", "Puxar com cotovelo para baixo. Sem jogar o tronco para tras."),
      ex("Pulldown com corda ou barra reta", "3", "12 a 15", "60-90 seg", "Bracos quase estendidos. Puxar para baixo e para tras."),
      ex("Crucifixo invertido no cross ou banco inclinado", "3", "12 a 20", "60 seg", "Posterior de ombro e parte alta das costas. Sem encolher trapezio."),
      ex("Lombar no banco inclinado ou superman", "2", "12 a 15", "60 seg", "Moderado. Nao destruir lombar antes do stiff pesado.")
    ]
  },
  {
    id: "dia-3",
    name: "Dia 3 - Peito",
    focus: "Peito principal",
    goal: "Prioridade em supino inclinado/reto com progressao real.",
    exercises: [
      ex("Alongamento peitoral menor", "1-2", "20 seg", "curto", "Soltar ombro e peitoral antes de supinar."),
      ex("Supino inclinado com barra ou halteres", "4", "6 a 10", "2 min", "Principal do peito. Use o suporte de seguranca. Progredir carga/reps quando der."),
      ex("Supino reto com barra ou halteres", "3", "8 a 12", "90-120 seg", "Escapulas firmes no banco. Descer controlando, subir forte. 1-2 RIR."),
      ex("Crucifixo inclinado no cross", "3", "10 a 15", "60-90 seg", "Alongar bem sem perder controle. Cotovelos semi-flexionados."),
      ex("Crossover alto para baixo", "3", "12 a 15", "60 seg", "1 seg contraindo. Nao deixar ombro roubar."),
      ex("Flexao no chao ou maos no step", "2", "quase falha", "60 seg", "Parar quando a tecnica cair."),
      ex("Abdominal no cross", "3", "12 a 15", "60 seg", "Contrair abdomen, nao puxar so com braco/pescoco.")
    ]
  },
  {
    id: "dia-4",
    name: "Dia 4 - Posterior",
    focus: "Posterior e gluteo",
    goal: "Dobradica pesada, flexao de joelho improvisada e gluteo forte.",
    exercises: [
      ex("Mobilidade leve gluteo/posterior", "2", "20 seg", "15-30 seg", "Soltar sem alongar demais."),
      ex("Stiff / terra romeno com barra", "4", "6 a 10", "2-3 min", "Principal do posterior. Quadril para tras, barra perto da perna, coluna neutra."),
      ex("Flexor deitado com halter no banco", "4", "10 a 15", "60-90 seg", "Halter preso entre os pes. 1 seg no topo, descida lenta."),
      ex("Elevacao pelvica com barra", "4", "8 a 12", "90-120 seg", "2 seg de contracao no topo. Queixo recolhido. Nao hiperestender lombar."),
      ex("Flexor unilateral em pe no cross/caneleira", "3", "12 a 15 por perna", "60 seg", "Quadril parado. Corrigir diferenca entre pernas."),
      ex("Pull-through no cross", "3", "12 a 15", "60-90 seg", "Dobrar o quadril. Sentir gluteo/posterior, nao lombar."),
      ex("Adutor no cross/caneleira", "3", "15 a 20 por perna", "45-60 seg", "Controle e amplitude."),
      ex("Panturrilha sentada improvisada", "4", "12 a 20", "60 seg", "Anilha ou halter sobre o joelho, pe no step. Amplitude maxima.")
    ]
  },
  {
    id: "dia-5",
    name: "Dia 5 - Ombro",
    focus: "Deltoide lateral e posterior",
    goal: "Ombros fortes sem exagerar deltoide anterior.",
    exercises: [
      ex("Mobilidade escapula/ombro", "2", "15", "15-30 seg", "Preparar articulacao antes de desenvolvimento e elevacoes."),
      ex("Desenvolvimento sentado com halteres ou barra", "4", "6 a 10", "2 min", "Base do treino. Nao falhar. Punho alinhado, abdomen firme."),
      ex("Elevacao lateral unilateral no cross", "4", "10 a 15", "60-90 seg", "Prioridade visual. Cotovelo guia o movimento."),
      ex("Elevacao lateral com halteres", "3", "12 a 20", "60 seg", "Sem embalar. Nao precisa subir acima da linha do ombro."),
      ex("Crucifixo invertido no banco inclinado ou cross", "4", "12 a 20", "60-90 seg", "Posterior de ombro. Maos e cotovelos na linha do ombro."),
      ex("Face pull com corda", "3", "12 a 20", "60 seg", "Puxar para a altura do rosto. Cotovelos abertos."),
      ex("Rotacao externa no cross", "2", "15 a 20", "45-60 seg", "Saude do ombro. Leve e limpo.")
    ]
  },
  {
    id: "dia-6",
    name: "Dia 6 - Peito + Bracos",
    focus: "Peito extra e bracos",
    goal: "Segundo estimulo de peito e bracos completos sem volume inutil.",
    exercises: [
      ex("Supino inclinado leve/moderado", "3", "8 a 12", "90 seg", "Segundo estimulo da semana. Fazer com 2 RIR, foco em tecnica."),
      ex("Crossover no cross", "2", "12 a 15", "60 seg", "Pump e contracao. Nao transformar em treino pesado de ombro."),
      ex("Triceps supinado no cross ou supino fechado", "3", "6 a 10", "90-120 seg", "Exercicio pesado de triceps. Progredir com cotovelo saudavel."),
      ex("Rosca direta com barra W", "3", "6 a 10", "90 seg", "Base do biceps. Sem roubar com lombar."),
      ex("Triceps testa com barra W ou corda", "3", "8 a 12", "90 seg", "Cabeca longa do triceps. Cotovelos controlados."),
      ex("Rosca inclinada com halteres", "3", "8 a 12", "90 seg", "Alongamento do biceps. Descida lenta."),
      ex("Triceps corda/barra no cross", "2", "12 a 15", "60-90 seg", "Finalizador. 1 seg de contracao embaixo."),
      ex("Rosca martelo com halteres ou corda", "2", "10 a 15", "60-90 seg", "Braquial e antebraco. Punho neutro."),
      ex("Abdomen: prancha ou crunch declinado", "3", "45-60 seg ou 12-15", "60 seg", "Opcional. Fazer no final.")
    ]
  },
  {
    id: "dia-7",
    name: "Dia 7 - Descanso",
    focus: "Cardio leve",
    goal: "Caminhada ou corrida leve. Nao destruir perna entre os treinos.",
    exercises: [ex("Cardio leve", "1", "20 a 40 min", "leve", "Manter confortavel.")]
  }
];

const storeKeys = {
  plan: "treinoTiago.plan.v1",
  sessions: "treinoTiago.sessions.v1",
  draft: "treinoTiago.draft.v1"
};

const state = {
  plan: load(storeKeys.plan, defaultPlan),
  sessions: load(storeKeys.sessions, []),
  draft: load(storeKeys.draft, {}),
  selectedWorkout: "dia-1",
  deferredPrompt: null
};

function ex(name, sets, reps, rest, notes) {
  return { id: slug(name), name, sets, reps, rest, notes };
}

function slug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function init() {
  document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());
  bindTabs();
  bindActions();
  renderWorkoutOptions();
  renderAll();
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab, .view").forEach((el) => el.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`view-${tab.dataset.tab}`).classList.add("active");
      if (tab.dataset.tab === "historico") renderReport();
      if (tab.dataset.tab === "editar") renderEditor();
    });
  });
}

function bindActions() {
  document.getElementById("workoutSelect").addEventListener("change", (event) => {
    state.selectedWorkout = event.target.value;
    renderAll();
  });

  document.getElementById("saveSessionBtn").addEventListener("click", saveSession);
  document.getElementById("clearSessionBtn").addEventListener("click", () => {
    delete state.draft[state.selectedWorkout];
    save(storeKeys.draft, state.draft);
    renderExercises();
  });
  document.getElementById("reportExerciseSelect").addEventListener("change", renderReport);
  document.getElementById("reportRangeSelect").addEventListener("change", renderReport);
  document.getElementById("exportBackupBtn").addEventListener("click", exportBackup);
  document.getElementById("importBackupInput").addEventListener("change", importBackup);
  document.getElementById("resetPlanBtn").addEventListener("click", () => {
    if (!confirm("Restaurar a ficha original do PDF? O historico continua salvo.")) return;
    state.plan = structuredClone(defaultPlan);
    save(storeKeys.plan, state.plan);
    renderWorkoutOptions();
    renderAll();
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
    document.getElementById("installBtn").style.display = "inline-grid";
  });
  document.getElementById("installBtn").addEventListener("click", async () => {
    if (!state.deferredPrompt) return alert("No iPhone, use Compartilhar e depois Adicionar a Tela de Inicio.");
    state.deferredPrompt.prompt();
    state.deferredPrompt = null;
  });
}

function renderWorkoutOptions() {
  const select = document.getElementById("workoutSelect");
  select.innerHTML = state.plan.map((workout) => `<option value="${workout.id}">${workout.name}</option>`).join("");
  select.value = state.selectedWorkout;
}

function renderAll() {
  const workout = currentWorkout();
  document.getElementById("selectedWorkoutTitle").textContent = workout.name;
  document.getElementById("selectedWorkoutGoal").textContent = workout.goal;
  renderExercises();
  renderReportOptions();
}

function currentWorkout() {
  return state.plan.find((workout) => workout.id === state.selectedWorkout) || state.plan[0];
}

function plannedSetCount(sets) {
  const match = String(sets).match(/\d+/);
  return match ? Number(match[0]) : 3;
}

function renderExercises() {
  const list = document.getElementById("exerciseList");
  const workout = currentWorkout();
  list.innerHTML = "";
  workout.exercises.forEach((exercise) => list.appendChild(renderExerciseCard(workout.id, exercise)));
}

function renderExerciseCard(workoutId, exercise) {
  const card = document.createElement("article");
  card.className = "exercise-card";
  const draftSets = state.draft[workoutId]?.[exercise.id] || Array.from({ length: plannedSetCount(exercise.sets) }, () => ({ reps: "", weight: "" }));
  card.innerHTML = `
    <div class="exercise-top">
      <div>
        <h3>${escapeHtml(exercise.name)}</h3>
        <div class="exercise-meta">${exercise.sets} series • ${exercise.reps} • ${exercise.rest}</div>
      </div>
      <span class="badge">RIR 1-2</span>
    </div>
    <p class="note">${escapeHtml(exercise.notes)}</p>
    <div class="sets"></div>
    <div class="card-actions">
      <button class="secondary add-set" type="button">Adicionar serie</button>
      <button class="ghost fill-last" type="button">Usar ultimo</button>
    </div>
  `;
  const sets = card.querySelector(".sets");
  draftSets.forEach((set) => sets.appendChild(renderSetRow(workoutId, exercise.id, set)));
  card.querySelector(".add-set").addEventListener("click", () => {
    sets.appendChild(renderSetRow(workoutId, exercise.id, { reps: "", weight: "" }));
    persistDraftFromScreen();
  });
  card.querySelector(".fill-last").addEventListener("click", () => fillLastSession(workoutId, exercise.id));
  return card;
}

function renderSetRow(workoutId, exerciseId, set) {
  const row = document.getElementById("setRowTemplate").content.firstElementChild.cloneNode(true);
  row.dataset.workoutId = workoutId;
  row.dataset.exerciseId = exerciseId;
  row.querySelector("[name='reps']").value = set.reps ?? "";
  row.querySelector("[name='weight']").value = set.weight ?? "";
  row.querySelectorAll("input").forEach((input) => input.addEventListener("input", persistDraftFromScreen));
  row.querySelector(".remove-set").addEventListener("click", () => {
    row.remove();
    renumberSets();
    persistDraftFromScreen();
  });
  setTimeout(renumberSets);
  return row;
}

function renumberSets() {
  document.querySelectorAll(".exercise-card").forEach((card) => {
    card.querySelectorAll(".set-row").forEach((row, index) => {
      row.querySelector(".set-index").textContent = index + 1;
    });
  });
}

function persistDraftFromScreen() {
  const workoutId = state.selectedWorkout;
  const grouped = {};
  document.querySelectorAll(".set-row").forEach((row) => {
    const exerciseId = row.dataset.exerciseId;
    grouped[exerciseId] ||= [];
    grouped[exerciseId].push({
      reps: row.querySelector("[name='reps']").value,
      weight: row.querySelector("[name='weight']").value
    });
  });
  state.draft[workoutId] = grouped;
  save(storeKeys.draft, state.draft);
}

function fillLastSession(workoutId, exerciseId) {
  const previous = [...state.sessions].reverse().find((session) => session.workoutId === workoutId && session.entries.some((entry) => entry.exerciseId === exerciseId));
  if (!previous) return alert("Ainda nao existe registro anterior para este exercicio.");
  const entry = previous.entries.find((item) => item.exerciseId === exerciseId);
  state.draft[workoutId] ||= {};
  state.draft[workoutId][exerciseId] = entry.sets.map((set) => ({ reps: set.reps, weight: set.weight }));
  save(storeKeys.draft, state.draft);
  renderExercises();
}

function saveSession() {
  persistDraftFromScreen();
  const workout = currentWorkout();
  const entries = workout.exercises.map((exercise) => ({
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    sets: (state.draft[workout.id]?.[exercise.id] || []).filter((set) => set.reps || set.weight)
  })).filter((entry) => entry.sets.length);
  if (!entries.length) return alert("Preencha pelo menos uma serie antes de salvar.");
  state.sessions.push({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    workoutId: workout.id,
    workoutName: workout.name,
    entries
  });
  save(storeKeys.sessions, state.sessions);
  delete state.draft[workout.id];
  save(storeKeys.draft, state.draft);
  renderExercises();
  renderReportOptions();
  alert("Treino salvo no historico.");
}

function renderReportOptions() {
  const select = document.getElementById("reportExerciseSelect");
  const selected = select.value;
  const names = [...new Map(state.plan.flatMap((w) => w.exercises).map((exercise) => [exercise.id, exercise])).values()];
  select.innerHTML = names.map((exercise) => `<option value="${exercise.id}">${escapeHtml(exercise.name)}</option>`).join("");
  select.value = names.some((exercise) => exercise.id === selected) ? selected : names[0]?.id;
  renderReport();
}

function renderReport() {
  const exerciseId = document.getElementById("reportExerciseSelect").value;
  const range = document.getElementById("reportRangeSelect").value;
  const cutoff = range === "all" ? 0 : Date.now() - Number(range) * 24 * 60 * 60 * 1000;
  const records = state.sessions
    .filter((session) => new Date(session.date).getTime() >= cutoff)
    .flatMap((session) => session.entries.filter((entry) => entry.exerciseId === exerciseId).map((entry) => ({ session, entry })))
    .sort((a, b) => new Date(a.session.date) - new Date(b.session.date));
  renderMetrics(records);
  renderChart(records);
  renderHistory(records);
}

function bestSet(entry) {
  return entry.sets.reduce((best, set) => {
    const weight = Number(set.weight) || 0;
    const reps = Number(set.reps) || 0;
    const score = weight * Math.max(reps, 1);
    return score > best.score ? { weight, reps, score } : best;
  }, { weight: 0, reps: 0, score: 0 });
}

function volume(entry) {
  return entry.sets.reduce((total, set) => total + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
}

function renderMetrics(records) {
  const grid = document.getElementById("metricsGrid");
  if (!records.length) {
    grid.innerHTML = `<div class="empty">Sem registros para este exercicio ainda.</div>`;
    return;
  }
  const first = records[0];
  const last = records[records.length - 1];
  const bestWeight = Math.max(...records.map(({ entry }) => bestSet(entry).weight));
  const delta = volume(last.entry) - volume(first.entry);
  grid.innerHTML = `
    <div class="metric"><span>Registros</span><strong>${records.length}</strong></div>
    <div class="metric"><span>Maior carga</span><strong>${bestWeight || "-"} kg</strong></div>
    <div class="metric"><span>Volume</span><strong>${delta >= 0 ? "+" : ""}${delta} kg</strong></div>
  `;
}

function renderChart(records) {
  const canvas = document.getElementById("progressChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#11171a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#334045";
  ctx.lineWidth = 2;
  for (let y = 60; y <= 300; y += 60) {
    ctx.beginPath();
    ctx.moveTo(42, y);
    ctx.lineTo(690, y);
    ctx.stroke();
  }
  if (!records.length) {
    ctx.fillStyle = "#aab5b4";
    ctx.font = "24px system-ui";
    ctx.fillText("Salve treinos para ver a progressao", 120, 185);
    return;
  }
  const values = records.map(({ entry }) => volume(entry));
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => ({
    x: 54 + (index * 620) / Math.max(values.length - 1, 1),
    y: 306 - (value / max) * 240
  }));
  ctx.strokeStyle = "#93c572";
  ctx.lineWidth = 5;
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.stroke();
  points.forEach((point) => {
    ctx.fillStyle = "#7fb4d8";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderHistory(records) {
  const list = document.getElementById("historyList");
  if (!records.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = records.slice().reverse().map(({ session, entry }) => {
    const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(session.date));
    const sets = entry.sets.map((set, index) => `S${index + 1}: ${set.reps || 0} reps / ${set.weight || 0} kg`).join(" | ");
    return `<article class="history-card"><h3>${date} • ${escapeHtml(session.workoutName)}</h3><p>${sets}</p><p>Volume: ${volume(entry)} kg</p></article>`;
  }).join("");
}

function renderEditor() {
  const editor = document.getElementById("planEditor");
  editor.innerHTML = state.plan.map((workout) => `
    <article class="editor-card" data-workout-id="${workout.id}">
      <h3>${escapeHtml(workout.name)}</h3>
      <p class="exercise-meta">${escapeHtml(workout.focus)}</p>
      ${workout.exercises.map((exercise) => renderExerciseEditor(exercise)).join("")}
      <button class="secondary add-exercise" type="button">Adicionar exercicio</button>
    </article>
  `).join("");

  editor.querySelectorAll("input, textarea").forEach((field) => field.addEventListener("change", updatePlanFromEditor));
  editor.querySelectorAll(".remove-exercise").forEach((button) => button.addEventListener("click", removeExercise));
  editor.querySelectorAll(".add-exercise").forEach((button) => button.addEventListener("click", addExercise));
}

function renderExerciseEditor(exercise) {
  return `
    <details data-exercise-id="${exercise.id}">
      <summary>${escapeHtml(exercise.name)}</summary>
      <div class="editor-grid">
        <label class="wide">Nome<input name="name" value="${escapeAttr(exercise.name)}"></label>
        <label>Series<input name="sets" value="${escapeAttr(exercise.sets)}"></label>
        <label>Reps<input name="reps" value="${escapeAttr(exercise.reps)}"></label>
        <label>Intervalo<input name="rest" value="${escapeAttr(exercise.rest)}"></label>
        <label class="wide">Obs<textarea name="notes">${escapeHtml(exercise.notes)}</textarea></label>
      </div>
      <div class="editor-actions">
        <button class="ghost remove-exercise" type="button">Remover</button>
      </div>
    </details>
  `;
}

function updatePlanFromEditor(event) {
  const details = event.target.closest("details");
  const card = event.target.closest(".editor-card");
  const workout = state.plan.find((item) => item.id === card.dataset.workoutId);
  const exercise = workout.exercises.find((item) => item.id === details.dataset.exerciseId);
  exercise[event.target.name] = event.target.value;
  if (event.target.name === "name") {
    details.querySelector("summary").textContent = event.target.value;
  }
  save(storeKeys.plan, state.plan);
  renderWorkoutOptions();
  renderAll();
}

function removeExercise(event) {
  const details = event.target.closest("details");
  const card = event.target.closest(".editor-card");
  const workout = state.plan.find((item) => item.id === card.dataset.workoutId);
  workout.exercises = workout.exercises.filter((item) => item.id !== details.dataset.exerciseId);
  save(storeKeys.plan, state.plan);
  renderEditor();
  renderAll();
}

function addExercise(event) {
  const card = event.target.closest(".editor-card");
  const workout = state.plan.find((item) => item.id === card.dataset.workoutId);
  const created = ex("Novo exercicio", "3", "8 a 12", "60-90 seg", "");
  created.id = `novo-exercicio-${Date.now()}`;
  workout.exercises.push(created);
  save(storeKeys.plan, state.plan);
  renderEditor();
  renderAll();
}

function exportBackup() {
  const backup = {
    app: "Treino Tiago",
    version: 1,
    exportedAt: new Date().toISOString(),
    plan: state.plan,
    sessions: state.sessions,
    draft: state.draft
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `treino-tiago-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (!Array.isArray(backup.plan) || !Array.isArray(backup.sessions) || typeof backup.draft !== "object") {
      throw new Error("Formato invalido");
    }
    if (!confirm("Importar este backup? A ficha e o historico atuais serao substituidos.")) return;
    state.plan = backup.plan;
    state.sessions = backup.sessions;
    state.draft = backup.draft || {};
    state.selectedWorkout = state.plan[0]?.id || "dia-1";
    save(storeKeys.plan, state.plan);
    save(storeKeys.sessions, state.sessions);
    save(storeKeys.draft, state.draft);
    renderWorkoutOptions();
    renderAll();
    renderEditor();
    alert("Backup importado com sucesso.");
  } catch {
    alert("Nao consegui importar este arquivo. Confira se ele e um backup do Treino Tiago.");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

init();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
