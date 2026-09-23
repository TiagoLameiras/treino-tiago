"use strict";
const C = window.Training;
const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (value, options = {}) =>
  new Intl.NumberFormat("pt-BR", options).format(value);
const dateFmt = (day, options = { day: "2-digit", month: "short" }) =>
  new Intl.DateTimeFormat("pt-BR", options).format(new Date(day + "T12:00:00"));
const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const typeNames = {
  forca: "Carga e repetições",
  tempo: "Tempo em segundos",
  cardio: "Cardio",
};
const cardioTypes = [
  "Corrida",
  "Caminhada rápida",
  "Caminhada leve",
  "Boxe",
  "Bicicleta",
  "Elíptico",
  "Escada",
  "Natação",
];
let data,
  tab = "hoje",
  pickedWorkout = "",
  month = C.localDate().slice(0, 7),
  filterDate = "",
  filterCycle = "",
  reportKey = "",
  progressView = "general",
  overviewMetric = "volume",
  reportRange = "90",
  reportMetric = "volume",
  editor = null,
  pendingCycle = null,
  pendingBackup = null,
  installEvent = null,
  undoAction = null,
  toastTimeout = null;
try {
  data = C.load(localStorage, DEFAULT_PLAN);
  localStorage.setItem(C.KEY, JSON.stringify(data));
} catch (error) {
  data = null;
  recovery(error);
}

function toast(message, undo = null) {
  clearTimeout(toastTimeout);
  undoAction = undo;
  $("toast").innerHTML =
    `<span>${esc(message)}</span>${undo ? '<button data-action="undo">Desfazer</button>' : ""}`;
  $("toast").hidden = false;
  document.querySelector(".modal-toast")?.remove();
  if ($("modal").open) {
    const notice = document.createElement("div");
    notice.className = "modal-toast";
    notice.setAttribute("role", "status");
    notice.innerHTML = $("toast").innerHTML;
    $("modal").appendChild(notice);
  }
  toastTimeout = setTimeout(
    () => {
      $("toast").hidden = true;
      document.querySelector(".modal-toast")?.remove();
      undoAction = null;
    },
    undo ? 15000 : 6000,
  );
}
function commit(change) {
  const next = C.clone(data);
  try {
    change(next);
    C.validateData(next);
    localStorage.setItem(C.KEY, JSON.stringify(next));
    data = next;
    return true;
  } catch (error) {
    toast(
      error.name === "QuotaExceededError"
        ? "Espaço insuficiente. Exporte um backup nos ajustes. A alteração não foi salva."
        : error.message,
    );
    return false;
  }
}
function recovery(error) {
  $("main").innerHTML =
    `<div class="empty panel"><h1>Vamos preservar seus dados</h1><p>Não foi possível abrir os registros: ${esc(error.message)}.</p><p>Nada foi apagado. Baixe os dados para recuperação ou importe um backup válido.</p><button class="primary" data-action="raw-backup">Baixar dados para recuperação</button><button class="secondary" data-action="import-backup">Importar backup</button></div>`;
}
function download(name, content, mime = "application/json") {
  const url = URL.createObjectURL(
    content instanceof Blob ? content : new Blob([content], { type: mime }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function openModal(title, body, footer = "") {
  $("modal").innerHTML =
    `<header class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Fechar">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-foot">${footer}</footer>` : ""}`;
  if (!$("modal").open) $("modal").showModal();
}
function go(next) {
  if (!data) return;
  tab = next;
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function render() {
  if (!data) return;
  document
    .querySelectorAll("[data-tab]")
    .forEach((b) =>
      b.setAttribute("aria-current", b.dataset.tab === tab ? "page" : "false"),
    );
  ({
    hoje: renderToday,
    historico: renderHistory,
    evolucao: renderProgress,
    fichas: renderPlans,
  })[tab]();
  if (tab === "fichas") renderArchivedWorkouts();
  tick();
}
function weekDays() {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return C.localDate(d);
  });
}
function weekStrip() {
  return `<div class="week-strip" aria-label="Esta semana">${weekDays()
    .map((day) => {
      const done = data.sessions.some((s) => s.date === day);
      return `<button class="week-day ${day === C.localDate() ? "today" : ""} ${done ? "completed" : ""}" data-action="day" data-day="${day}" aria-label="${esc(dateFmt(day, { weekday: "long", day: "numeric", month: "long" }))}${done ? ", registrado" : ""}"><span>${names[new Date(day + "T12:00:00").getDay()]}</span><strong>${Number(day.slice(-2))}</strong><i aria-hidden="true">${done ? "✓" : "·"}</i></button>`;
    })
    .join("")}</div>`;
}
function todaySummaryHTML() {
  const sessions = data.sessions.filter((s) => s.date === C.localDate());
  if (!sessions.length) return "";
  const labels = sessions.map((s) =>
    s.kind === "cardio"
      ? s.workoutName + " · " + setText(s.entries[0].sets[0], "cardio")
      : s.workoutName + (s.entries.length ? " concluído" : " registrado"),
  );
  return `<button class="panel today-summary" data-action="today-history"><span class="today-summary-title"><strong>✓ Feito hoje</strong><span>${sessions.length} ${sessions.length === 1 ? "registro" : "registros"} ↗</span></span><span class="today-summary-items">${esc(labels.slice(0, 3).join(" · "))}${labels.length > 3 ? " · +" + (labels.length - 3) : ""}</span></button>`;
}
function backupNoticeHTML() {
  if (!C.backupReminderDue(data)) return "";
  return `<aside class="panel backup-notice" aria-label="Lembrete de backup"><strong>Uma cópia do seu histórico</strong><p>${data.lastBackupAt ? "Faz pelo menos 7 dias desde a última exportação." : "Você já tem registros salvos. Que tal guardar seu primeiro backup?"} Baixe o arquivo e guarde fora do navegador.</p><div><button class="secondary" data-action="export-backup">Salvar backup</button><button class="text-button" data-action="snooze-backup">Depois</button></div><small>Depois adia este lembrete por 3 dias.</small></aside>`;
}
function renderToday() {
  const c = C.cycle(data),
    s = data.activeSession;
  const days = weekDays(),
    count = new Set(
      data.sessions
        .filter((s) => days.includes(s.date) && s.entries.length)
        .map((s) => s.date),
    ).size;
  const recent = C.activityOverview(data);
  const suggested = C.suggest(data),
    workout = c.workouts.find((w) => w.id === pickedWorkout) || suggested;
  $("main").innerHTML =
    `<div class="page-heading"><div><p class="eyebrow">${esc(dateFmt(C.localDate(), { weekday: "long", day: "numeric", month: "long" }))}</p><h1>${s ? "Seu treino, em foco." : "Vamos no seu ritmo."}</h1></div><span class="local-tag"><span></span> Neste aparelho</span></div>${weekStrip()}
    ${
      s
        ? todaySummaryHTML() + sessionHTML(s)
        : `<section class="hero panel"><div class="row"><span class="pill">${data.settings.scheduleMode === "sequencia" ? "Próximo da sequência" : "Programado para hoje"}</span><span class="muted small">${esc(c.name)}</span></div><h2>${esc(workout?.name || "Dia de descanso")}</h2><p>${esc(workout?.goal || "Um intervalo também faz parte da rotina. Se quiser treinar hoje, escolha uma ficha abaixo.")}</p><div class="hero-meta"><span>${workout?.exercises.length || 0} exercícios</span><span>${workout ? workout.exercises.reduce((n, e) => n + C.countSets(e.sets), 0) : 0} séries previstas</span></div><label class="sr-only" for="workout-choice">Escolher treino</label><select id="workout-choice"><option value="" ${!workout ? "selected" : ""}>Escolha um treino</option>${c.workouts.map((w) => `<option value="${esc(w.id)}" ${workout?.id === w.id ? "selected" : ""}>${esc(w.name)}</option>`).join("")}</select><button class="primary wide" data-action="start" data-id="${esc(workout?.id || "")}" ${!workout ? "disabled" : ""}>${workout?.exercises.length === 0 ? "Registrar descanso" : "Iniciar treino"} <span aria-hidden="true">→</span></button><button class="secondary wide cardio-button" data-action="cardio">＋ Registrar cardio</button></section>
    ${todaySummaryHTML()}<div class="summary-grid"><div class="panel stat"><span>Na semana</span><strong>${count}<small> / ${data.settings.weeklyGoal} dias</small></strong><div class="progress-track"><i style="width:${Math.min(100, (count / data.settings.weeklyGoal) * 100)}%"></i></div></div><div class="panel stat recent-stat"><span>Últimos 30 dias</span><strong>${recent.current.activeDays}<small> dias ativos</small></strong><p class="small muted">${comparisonText(recent.current.activeDays, recent.previous.activeDays, "dias", recent.previous.records)}</p><p class="small muted">${recent.current.workouts} treinos · ${recent.current.cardios} cardios</p><button class="text-button" data-tab="historico">Ver histórico ↗</button></div></div>
    ${backupNoticeHTML()}${workout ? `<section><div class="section-title"><h2>O que vem pela frente</h2><span>${workout.exercises.length} exercícios</span></div><div class="preview-list">${workout.exercises.map((e, i) => `<details class="preview-exercise"><summary><span class="exercise-number">${String(i + 1).padStart(2, "0")}</span><span><strong>${esc(e.name)}</strong><small>${esc(e.sets)} séries · ${esc(e.reps)} · ${esc(e.rest)}</small></span><span aria-hidden="true">⌄</span></summary><p>${esc(e.notes || "Sem observações.")}</p></details>`).join("") || '<p class="muted">Sem exercícios programados. Registre este dia como descanso.</p>'}</div></section>` : ""}`
    }`;
}
function previousEntry(entry, session) {
  return C.exerciseRecords(data, entry.exerciseId, entry.type)
    .filter(
      (r) => r.session.id !== session.id && r.session.date <= session.date,
    )
    .at(-1)?.entry;
}
function setText(set, type) {
  if (type === "tempo") return `${fmt(Number(set.seconds) || 0)} s`;
  if (type === "cardio")
    return `${fmt(Number(set.minutes) || 0)} min${set.distance !== "" && set.distance != null ? " · " + fmt(Number(set.distance)) + " km" : ""}`;
  return `${set.weight === "" || set.weight == null ? "—" : fmt(Number(set.weight))} kg × ${set.reps === "" || set.reps == null ? "—" : fmt(Number(set.reps))}`;
}
function setInput(entryIndex, setIndex, key, value, label, step = "1") {
  return `<label><span>${label}</span><input aria-label="${label}, série ${setIndex + 1}, ${esc(data.activeSession.entries[entryIndex].exerciseName)}" data-entry="${entryIndex}" data-set="${setIndex}" data-field="${key}" type="number" inputmode="${step === "1" ? "numeric" : "decimal"}" min="0" step="${step}" value="${esc(value ?? "")}" placeholder="—"></label>`;
}
function sessionHTML(s) {
  const total = s.entries.reduce((n, e) => n + e.sets.length, 0),
    done = s.entries.reduce(
      (n, e) => n + e.sets.filter((v) => v.done).length,
      0,
    );
  return `<section class="session-overview panel"><div class="row"><span class="pill">${s.editing ? "Editando registro" : s.runningSince ? "Em andamento" : "Pausado"}</span><span id="session-clock" class="mono"></span></div><h2>${esc(s.workoutName)}</h2><div class="row"><label>Data do treino<input id="session-date" type="date" max="${C.localDate()}" value="${s.date}"></label><button class="secondary" data-action="pause">${s.runningSince ? "Pausar" : "Continuar"}</button></div><div class="row small muted"><span id="session-progress">${done} de ${total} séries concluídas</span><button class="text-button" data-action="discard">${s.editing ? "Cancelar edição" : "Descartar"}</button></div><div class="progress-track"><i id="session-bar" style="width:${total ? (done / total) * 100 : 100}%"></i></div><button class="text-button cardio-button" data-action="cardio">＋ Registrar cardio</button></section>
    <div class="exercise-list">${s.entries.map((entry, i) => exerciseHTML(entry, i, s)).join("")}</div>
    <label class="session-note">Como foi o treino?<textarea id="session-notes" maxlength="2000" placeholder="Uma observação para a próxima sessão…">${esc(s.notes || "")}</textarea></label>
    <div class="finish-bar"><span><strong id="done-count">${done}</strong> / ${total} séries</span><button class="primary" data-action="finish">${s.editing ? "Salvar alterações" : "Finalizar treino"} ✓</button></div>`;
}
function exerciseHTML(entry, i, s) {
  const exercise = s.workout.exercises.find(
    (e) => e.id === entry.exerciseId,
  ) || {
    name: entry.exerciseName,
    sets: entry.sets.length,
    reps: "",
    rest: "",
    notes: "",
  };
  const last = previousEntry(entry, s);
  return `<article class="exercise-card panel" id="exercise-${i}"><div class="exercise-head"><span class="exercise-number">${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(entry.exerciseName)}</h3><p class="muted small">${esc(exercise.sets)} séries · ${esc(exercise.reps)}${exercise.rest ? " · " + esc(exercise.rest) : ""}</p></div></div>${exercise.notes ? `<details class="instructions"><summary>Orientações do exercício</summary><p>${esc(exercise.notes)}</p></details>` : ""}
    <div class="set-list">${entry.sets.map((set, j) => `<div class="set-row ${set.done ? "done" : ""}" data-row="${i}-${j}"><span class="set-number">${j + 1}</span><div class="set-values">${entry.type === "forca" ? setInput(i, j, "reps", set.reps, "reps") + setInput(i, j, "weight", set.weight, "kg", "0.5") : entry.type === "tempo" ? setInput(i, j, "seconds", set.seconds, "segundos") : setInput(i, j, "minutes", set.minutes, "minutos", "0.1") + setInput(i, j, "distance", set.distance, "km · opcional", "0.01")}<span class="previous">Anterior: ${last?.sets[j] ? esc(setText(last.sets[j], entry.type)) : "sem registro"}</span></div><button class="check-set" data-action="check" data-entry="${i}" data-set="${j}" aria-label="${set.done ? "Desmarcar" : "Concluir"} série ${j + 1} de ${esc(entry.exerciseName)}" aria-pressed="${Boolean(set.done)}">✓</button></div>`).join("")}</div>
    <div class="card-actions"><button class="text-button" data-action="add-set" data-entry="${i}">＋ Série</button><button class="text-button" data-action="copy-last" data-entry="${i}" ${!last ? "disabled" : ""}>Usar anterior</button><details class="series-menu"><summary aria-label="Mais opções de séries">•••</summary><div>${entry.sets.map((_, j) => `<button class="text-button" data-action="remove-set" data-entry="${i}" data-set="${j}">Remover série ${j + 1}</button>`).join("")}</div></details></div></article>`;
}
function updateProgress() {
  const s = data.activeSession;
  if (!s) return;
  const sets = s.entries.flatMap((e) => e.sets),
    done = sets.filter((v) => v.done).length;
  if ($("session-progress"))
    $("session-progress").textContent =
      `${done} de ${sets.length} séries concluídas`;
  if ($("done-count")) $("done-count").textContent = done;
  if ($("session-bar"))
    $("session-bar").style.width =
      `${sets.length ? (done / sets.length) * 100 : 100}%`;
}
function renderHistory() {
  const [year, m] = month.split("-").map(Number),
    first = new Date(year, m - 1, 1, 12),
    days = new Date(year, m, 0).getDate(),
    offset = (first.getDay() + 6) % 7;
  const sessions = data.sessions
    .filter(
      (s) =>
        (!filterDate || s.date === filterDate) &&
        (!filterCycle || s.cycleId === filterCycle),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        String(b.updatedAt).localeCompare(String(a.updatedAt)),
    );
  $("main").innerHTML =
    `<div class="page-heading"><div><p class="eyebrow">Cada treino conta</p><h1>Seu histórico</h1></div><button class="icon-button" data-action="retro" aria-label="Registrar treino em outra data">＋</button></div><section class="panel calendar"><div class="row"><button class="icon-button" data-action="month" data-delta="-1" aria-label="Mês anterior">‹</button><h2>${esc(dateFmt(month + "-01", { month: "long", year: "numeric" }))}</h2><button class="icon-button" data-action="month" data-delta="1" aria-label="Próximo mês">›</button></div><div class="calendar-grid">${["S", "T", "Q", "Q", "S", "S", "D"].map((n) => `<span class="day-label">${n}</span>`).join("")}${"<span></span>".repeat(offset)}${Array.from(
      { length: days },
      (_, i) => {
        const day = month + "-" + String(i + 1).padStart(2, "0");
        const ss = data.sessions.filter(
          (s) => s.date === day && (!filterCycle || s.cycleId === filterCycle),
        );
        return `<button class="calendar-day ${ss.length ? "has-session" : ""} ${filterDate === day ? "selected" : ""} ${day === C.localDate() ? "is-today" : ""}" data-action="filter-day" data-day="${day}" aria-label="${esc(dateFmt(day, { day: "numeric", month: "long" }))}, ${ss.length} registros" aria-pressed="${filterDate === day}">${i + 1}<i>${ss.length ? "•" : ""}</i></button>`;
      },
    ).join("")}</div></section>
    <div class="row filters"><label>Ciclo<select id="history-cycle"><option value="">Todos os registros</option><option value="cardio-avulso" ${filterCycle === "cardio-avulso" ? "selected" : ""}>Cardio avulso</option>${data.cycles.map((c) => `<option value="${esc(c.id)}" ${filterCycle === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>${filterDate ? `<button class="text-button" data-action="clear-date">${esc(dateFmt(filterDate))} ×</button>` : '<span class="muted small">Do mais recente ao mais antigo</span>'}</div><div class="section-title"><h2>${filterDate ? "Registros do dia" : "Todos os registros"}</h2><span>${sessions.length}</span></div>
    <div class="history-list">${sessions.map((s) => `<button class="history-card panel" data-action="session-detail" data-id="${esc(s.id)}"><span class="history-date"><strong>${s.date.slice(-2)}</strong><small>${esc(dateFmt(s.date, { month: "short" }))}</small></span><span class="history-info"><strong>${esc(s.workoutName)}</strong><small>${s.kind === "cardio" ? "Cardio · " + esc(setText(s.entries[0].sets[0], "cardio")) : esc(s.cycleName || "Ficha original") + " · " + s.entries.reduce((n, e) => n + e.sets.length, 0) + " séries" + (s.elapsedMs ? " · " + Math.round(s.elapsedMs / 60000) + " min" : "")}</small></span><span aria-hidden="true">↗</span></button>`).join("") || '<div class="empty panel"><span class="empty-icon">▦</span><h3>Seu caminho começa aqui</h3><p>Nenhum registro neste filtro. Você também pode registrar um treino de outro dia.</p><button class="secondary" data-action="retro">Registrar treino</button></div>'}</div>`;
}
function sessionDetail(id) {
  const s = data.sessions.find((s) => s.id === id);
  if (!s) return;
  openModal(
    s.workoutName,
    `<p class="muted">${esc(dateFmt(s.date, { day: "numeric", month: "long", year: "numeric" }))} · ${esc(s.cycleName || "Ficha original")}</p>${s.entries.map((e) => `<div class="detail-exercise"><h3>${esc(e.exerciseName)}</h3>${e.sets.map((set, i) => `<p><span class="muted">${s.kind === "cardio" ? "Duração" : "Série " + (i + 1)}</span> <strong>${esc(setText(set, e.type))}</strong></p>`).join("")}</div>`).join("") || "<p>Dia de descanso registrado.</p>"}${s.notes ? `<p class="note-box">${esc(s.notes)}</p>` : ""}`,
    `<button class="text-button danger" data-action="delete-session" data-id="${esc(id)}">Excluir</button><button class="primary" data-action="edit-session" data-id="${esc(id)}">Editar registro</button>`,
  );
}
function cardioModal(session = null) {
  const activity = session?.activity || "";
  const custom = activity && !cardioTypes.includes(activity);
  const set = session?.entries[0].sets[0];
  openModal(
    session ? "Editar cardio" : "Registrar cardio",
    `<form id="cardio-form" data-id="${esc(session?.id || "")}">
    <p class="muted small">Registre uma atividade que você já concluiu. Pode adicionar quantas fizer no dia.</p>
    <label>Tipo de cardio<select id="cardio-type" required><option value="">Escolha a atividade</option>${cardioTypes.map((name) => `<option value="${esc(name)}" ${activity === name ? "selected" : ""}>${esc(name)}</option>`).join("")}<option value="outro" ${custom ? "selected" : ""}>Outro</option></select></label>
    <label id="cardio-other-label" ${custom ? "" : "hidden"}>Qual atividade?<input id="cardio-other" maxlength="100" value="${esc(custom ? activity : "")}" ${custom ? "required" : "disabled"}></label>
    <div class="form-grid"><label>Duração (min)<input id="cardio-minutes" type="number" inputmode="decimal" min="0.1" step="any" required placeholder="Ex.: 30" value="${esc(set?.minutes ?? "")}"></label><label>Data<input id="cardio-date" type="date" required max="${C.localDate()}" value="${esc(session?.date || C.localDate())}"></label></div>
    <details class="cardio-details" ${set?.distance || session?.notes ? "open" : ""}><summary>Distância e observações (opcional)</summary>
    <label>Distância (km)<input id="cardio-distance" type="number" inputmode="decimal" min="0" step="any" placeholder="Ex.: 2,5" value="${esc(set?.distance ?? "")}"></label>
    <label>Observações<textarea id="cardio-notes" maxlength="2000" placeholder="Ex.: esteira, inclinação 3%">${esc(session?.notes || "")}</textarea></label></details></form>`,
    `<button class="secondary" data-action="close-modal">Cancelar</button><button class="primary" type="submit" form="cardio-form">${session ? "Salvar alterações" : "Salvar cardio"}</button>`,
  );
}
function saveCardioForm() {
  const form = $("cardio-form");
  if (!form.reportValidity()) return;
  const activity =
    $("cardio-type").value === "outro"
      ? $("cardio-other").value
      : $("cardio-type").value;
  if (
    commit((d) =>
      C.saveCardio(
        d,
        {
          activity,
          date: $("cardio-date").value,
          minutes: $("cardio-minutes").value,
          distance: $("cardio-distance").value,
          notes: $("cardio-notes").value,
        },
        form.dataset.id || null,
      ),
    )
  ) {
    $("modal").close();
    render();
    toast("Cardio salvo no histórico.");
  }
}
function exerciseCatalog() {
  const map = new Map();
  data.cycles.forEach((c) =>
    c.workouts.forEach((w) =>
      w.exercises.forEach((e) =>
        map.set(e.id + "|" + e.type, { id: e.id, name: e.name, type: e.type }),
      ),
    ),
  );
  data.sessions.forEach((s) =>
    s.entries.forEach((e) => {
      const key = e.exerciseId + "|" + e.type;
      if (!map.has(key))
        map.set(key, { id: e.exerciseId, name: e.exerciseName, type: e.type });
    }),
  );
  return [...map.entries()].sort((a, b) =>
    a[1].name.localeCompare(b[1].name, "pt-BR"),
  );
}
function metricValue(entry) {
  if (entry.type === "tempo")
    return entry.sets.reduce((n, s) => n + (Number(s.seconds) || 0), 0);
  if (entry.type === "cardio")
    return entry.sets.reduce(
      (n, s) =>
        n +
        (Number(s[reportMetric === "distance" ? "distance" : "minutes"]) || 0),
      0,
    );
  if (reportMetric === "weight")
    return Math.max(0, ...entry.sets.map((s) => Number(s.weight) || 0));
  if (reportMetric === "reps")
    return entry.sets.reduce((n, s) => n + (Number(s.reps) || 0), 0);
  return C.volume(entry);
}
function progressHeader() {
  return `<div class="page-heading"><div><p class="eyebrow">Um passo de cada vez</p><h1>Sua evolução</h1></div></div><div class="progress-switch" role="group" aria-label="Visão da evolução"><button data-action="progress-view" data-view="general" aria-pressed="${progressView === "general"}">Geral</button><button data-action="progress-view" data-view="exercise" aria-pressed="${progressView === "exercise"}">Por exercício</button></div>`;
}
function comparisonText(current, previous, unit, hasPrevious, percent = false) {
  if (!hasPrevious) return "Sem registros nos 30 dias anteriores";
  const difference = current - previous;
  if (Math.abs(difference) < 0.00001) return "Igual aos 30 dias anteriores";
  if (percent && previous === 0) return "Sem volume anterior para comparar";
  const value = percent
    ? Math.abs((difference / previous) * 100)
    : Math.abs(difference);
  if (value === 1 && ["dias", "treinos"].includes(unit))
    unit = unit.slice(0, -1);
  return `${difference > 0 ? "↑" : "↓"} ${fmt(value, { maximumFractionDigits: 1 })}${percent ? "%" : " " + unit} vs. 30 dias anteriores`;
}
function renderOverview() {
  const { current, previous, periods } = C.activityOverview(data);
  const metrics = {
    volume: ["Volume total", "kg × reps"],
    averageVolume: ["Volume médio por treino", "kg × reps"],
    activeDays: ["Dias ativos", "dias"],
    cardioMinutes: ["Tempo de cardio", "min"],
  };
  const [label, unit] = metrics[overviewMetric];
  const max = Math.max(...periods.map((p) => p[overviewMetric]), 1);
  const periodLabel = (p) =>
    `${dateFmt(p.start, { day: "2-digit", month: "2-digit" })} – ${dateFmt(p.end, { day: "2-digit", month: "2-digit" })}`;
  $("main").innerHTML =
    progressHeader() +
    `
    <div class="section-title"><h2>Últimos 30 dias</h2><span>${periodLabel(current)}</span></div>
    <section class="panel overview-volume"><span class="pill">Volume registrado</span><h2>${fmt(current.volume, { maximumFractionDigits: 0 })}<small> kg × reps</small></h2><p class="comparison">${comparisonText(current.volume, previous.volume, "", previous.strengthWorkouts, true)}</p>
    <div class="overview-average"><span>Média por treino de força</span><strong>${current.strengthWorkouts ? fmt(current.averageVolume, { maximumFractionDigits: 0 }) + " kg × reps" : "—"}</strong><small>${current.strengthWorkouts ? comparisonText(current.averageVolume, previous.averageVolume, "", previous.strengthWorkouts, true) : "Registre séries com carga e repetições"}</small></div>
    <details class="overview-help"><summary>Como interpretar esse número? ⌄</summary><p class="small muted">Soma de carga × repetições das séries registradas. Ex.: 20 kg × 10 repetições = 200 kg × reps. A média considera os treinos com séries de força preenchidas.</p>
    <p class="small muted">Mais volume pode vir de mais séries ou de uma ficha diferente. Use os exercícios para comparar sua evolução de força.</p></details></section>
    <div class="summary-grid overview-stats"><div class="panel stat"><span>Dias ativos</span><strong>${current.activeDays}<small> / 30 dias</small></strong><p class="small muted">${comparisonText(current.activeDays, previous.activeDays, "dias", previous.records)}</p></div>
    <div class="panel stat"><span>Treinos realizados</span><strong>${current.workouts}<small> treinos</small></strong><p class="small muted">${comparisonText(current.workouts, previous.workouts, "treinos", previous.records)}</p></div>
    <div class="panel stat cardio-summary"><span>Tempo de cardio</span><strong>${fmt(current.cardioMinutes, { maximumFractionDigits: 1 })}<small> min</small></strong><p class="small muted">${current.cardios} atividades · ${comparisonText(current.cardioMinutes, previous.cardioMinutes, "min", previous.cardios)}</p><p class="small muted">Inclui cardio avulso e registrado na ficha.</p></div></div>
    <section class="panel overview-trend"><h2>Ao longo do tempo</h2><p class="small muted">6 períodos de 30 dias, incluindo o atual.</p><label>Indicador geral<select id="overview-metric">${Object.entries(
      metrics,
    )
      .map(
        ([key, item]) =>
          `<option value="${key}" ${key === overviewMetric ? "selected" : ""}>${item[0]}</option>`,
      )
      .join("")}</select></label>
    <ol class="period-bars" aria-label="${label} por período">${periods.map((p, i) => `<li class="${i === 5 ? "current-period" : ""}"><div><span>${periodLabel(p)}${i === 5 ? " · atual" : ""}</span><strong>${p.records ? fmt(p[overviewMetric], { maximumFractionDigits: 0 }) + " " + unit : "Sem registros"}</strong></div><div class="period-track" aria-hidden="true"><i style="width:${(p[overviewMetric] / max) * 100}%"></i></div></li>`).join("")}</ol></section>
    <p class="small muted">Um dia com treino e cardio conta uma vez em dias ativos. Descansos e sessões ainda em andamento não entram. Comparações usam os registros salvos em cada período.</p>`;
}
function renderProgress() {
  if (progressView === "general") return renderOverview();
  const catalog = exerciseCatalog();
  if (!catalog.some(([key]) => key === reportKey))
    reportKey =
      catalog.find(
        ([, e]) => C.exerciseRecords(data, e.id, e.type).length,
      )?.[0] || catalog[0]?.[0];
  const e = catalog.find(([key]) => key === reportKey)?.[1];
  if (!e) {
    $("main").innerHTML =
      progressHeader() +
      '<div class="empty panel">Adicione exercícios à sua ficha para acompanhar a evolução.</div>';
    return;
  }
  const metrics =
    e.type === "forca"
      ? [
          ["volume", "Volume (kg × reps)"],
          ["weight", "Maior carga (kg)"],
          ["reps", "Repetições"],
        ]
      : e.type === "tempo"
        ? [["seconds", "Tempo total (s)"]]
        : [
            ["minutes", "Duração (min)"],
            ["distance", "Distância (km)"],
          ];
  if (!metrics.some(([k]) => k === reportMetric)) reportMetric = metrics[0][0];
  const records = C.exerciseRecords(data, e.id, e.type, reportRange),
    last = records.at(-1),
    prev = records.at(-2),
    delta =
      last && prev ? metricValue(last.entry) - metricValue(prev.entry) : null;
  const unit = {
    volume: "kg × reps",
    weight: "kg",
    reps: "reps",
    seconds: "s",
    minutes: "min",
    distance: "km",
  }[reportMetric];
  $("main").innerHTML =
    `${progressHeader()}<div class="panel report-filters"><label>Exercício<select id="report-exercise">${catalog.map(([key, item]) => `<option value="${esc(key)}" ${key === reportKey ? "selected" : ""}>${esc(item.name)} · ${typeNames[item.type]}</option>`).join("")}</select></label><div class="form-grid"><label>Período<select id="report-range">${[
      ["30", "30 dias"],
      ["90", "90 dias"],
      ["365", "1 ano"],
      ["all", "Todo o histórico"],
    ]
      .map(
        ([v, n]) =>
          `<option value="${v}" ${v === reportRange ? "selected" : ""}>${n}</option>`,
      )
      .join(
        "",
      )}</select></label><label>Indicador<select id="report-metric">${metrics.map(([v, n]) => `<option value="${v}" ${v === reportMetric ? "selected" : ""}>${n}</option>`).join("")}</select></label></div></div>
    ${
      records.length
        ? `<div class="summary-grid"><div class="panel stat"><span>${e.type === "forca" ? "Maior carga" : "Último resultado"}</span><strong>${fmt(e.type === "forca" ? C.maxWeight(records) : metricValue(last.entry))}<small> ${e.type === "forca" ? "kg" : unit}</small></strong></div><div class="panel stat"><span>Vs. sessão anterior</span><strong>${delta === null ? "—" : (delta > 0 ? "+" : "") + fmt(delta)}<small> ${delta === null ? "primeiro registro" : unit}</small></strong></div></div><section class="panel chart-panel"><div class="section-title"><h2>${esc(metrics.find(([k]) => k === reportMetric)[1])}</h2><span>${records.length} registros</span></div>${chartHTML(records, unit)}<p class="small muted">${e.type === "forca" ? "Cada ponto é uma sessão. Volume é a soma de carga × repetições; não equivale à carga máxima." : "Cada ponto é uma atividade registrada, com a duração ou distância informada."}</p></section><div class="section-title"><h2>Registros do exercício</h2></div>${records
            .slice()
            .reverse()
            .map(
              (r) =>
                `<button class="history-card panel" data-action="session-detail" data-id="${esc(r.session.id)}"><span class="history-info"><strong>${esc(dateFmt(r.session.date, { day: "numeric", month: "short", year: "numeric" }))}</strong><small>${esc(r.session.workoutName)} · ${esc(r.session.cycleName || "Ficha original")}</small></span><strong>${fmt(metricValue(r.entry))} <small>${unit}</small></strong></button>`,
            )
            .join("")}`
        : '<div class="empty panel"><span class="empty-icon">↗</span><h3>Seu próximo treino vira progresso</h3><p>Assim que você registrar este exercício, os resultados aparecem aqui. Exercícios de fichas antigas continuam disponíveis.</p></div>'
    }`;
}
function chartHTML(records, unit) {
  const values = records.map((r) => metricValue(r.entry)),
    max = Math.max(...values, 1),
    w = 600,
    h = 250,
    left = 66,
    right = 28,
    top = 22,
    bottom = 44;
  const points = values.map((v, i) => ({
    x:
      left +
      (records.length === 1
        ? (w - left - right) / 2
        : (i * (w - left - right)) / (records.length - 1)),
    y: h - bottom - (v / max) * (h - top - bottom),
  }));
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(unit)} por data. Valores detalhados na lista abaixo.">${[0, 0.5, 1].map((r) => `<line x1="${left}" y1="${h - bottom - r * (h - top - bottom)}" x2="${w - right}" y2="${h - bottom - r * (h - top - bottom)}" class="grid-line"/><text x="${left - 8}" y="${h - bottom - r * (h - top - bottom) + 4}" text-anchor="end">${fmt(max * r, { maximumFractionDigits: 1, notation: max > 9999 ? "compact" : "standard" })}</text>`).join("")}<polyline points="${points.map((p) => p.x + "," + p.y).join(" ")}" fill="none" class="chart-line"/>${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="4" class="chart-point"><title>${esc(dateFmt(records[i].session.date))}: ${fmt(values[i])} ${unit}</title></circle>`).join("")}${[...new Set([0, Math.floor((records.length - 1) / 2), records.length - 1])].map((i) => `<text x="${points[i].x}" y="${h - 12}" text-anchor="middle">${esc(dateFmt(records[i].session.date, { day: "2-digit", month: "2-digit" }))}</text>`).join("")}</svg>`;
}
function renderPlans() {
  const c = C.cycle(data);
  $("main").innerHTML =
    `<div class="page-heading"><div><p class="eyebrow">Sua rotina, do seu jeito</p><h1>Fichas de treino</h1></div></div><section class="panel import-panel"><span class="pill">Próximo ciclo</span><h2>Uma ficha nova.<br>O histórico de sempre.</h2><p>Baixe o modelo em texto, preencha e importe aqui. Se preferir o Word, salve como DOCX. Confira a prévia antes de ativar. A ficha anterior fica arquivada.</p><div class="button-stack"><a class="primary" href="modelo-treino.txt" download>↓ Baixar modelo para preencher</a><button class="secondary" data-action="import-plan">↑ Importar DOCX ou TXT</button></div><button class="text-button" data-action="export-plan">Baixar ficha atual para editar</button><p class="small muted">Use o padrão do modelo. Documentos livres e PDF não são importados.</p></section>
    <div class="section-title"><div><p class="eyebrow">Ficha ativa</p><h2>${esc(c.name)}</h2></div><button class="text-button" data-action="rename-cycle">Renomear</button></div><div class="workout-list">${c.workouts.map((w, i) => `<article class="panel workout-card"><div class="row"><div><h3>${esc(w.name)}</h3><p class="small muted">${w.exercises.length} exercícios · ${esc(w.focus || "Sua ficha")}</p></div><button class="secondary" data-action="edit-workout" data-id="${esc(w.id)}">Editar</button></div><div class="card-actions"><button class="text-button" data-action="move-workout" data-index="${i}" data-delta="-1" ${i === 0 ? "disabled" : ""} aria-label="Mover ${esc(w.name)} para cima">↑</button><button class="text-button" data-action="move-workout" data-index="${i}" data-delta="1" ${i === c.workouts.length - 1 ? "disabled" : ""} aria-label="Mover ${esc(w.name)} para baixo">↓</button><button class="text-button" data-action="duplicate-workout" data-id="${esc(w.id)}">Duplicar</button><button class="text-button" data-action="archive-workout" data-id="${esc(w.id)}" ${c.workouts.length === 1 ? "disabled" : ""}>Arquivar</button></div></article>`).join("")}</div><button class="secondary wide" data-action="new-workout">＋ Criar treino ou descanso</button>
    <section class="archived"><div class="section-title"><h2>Ciclos anteriores</h2><span>${data.cycles.length - 1}</span></div>${
      data.cycles
        .filter((v) => v.id !== c.id)
        .reverse()
        .map(
          (v) =>
            `<details class="panel archive-card"><summary><span><strong>${esc(v.name)}</strong><small>${v.workouts.length} treinos · ${data.sessions.filter((s) => s.cycleId === v.id).length} registros</small></span></summary><p class="muted small">${v.workouts.map((w) => esc(w.name)).join(" · ")}</p><button class="secondary" data-action="reuse-cycle" data-id="${esc(v.id)}">Usar como novo ciclo</button><button class="text-button" data-action="cycle-history" data-id="${esc(v.id)}">Ver histórico</button></details>`,
        )
        .join("") ||
      '<p class="muted">Quando você trocar a ficha, o ciclo anterior aparecerá aqui.</p>'
    }</section><button class="text-button" data-action="original-plan">Criar ciclo com a ficha original</button>`;
}
function renderArchivedWorkouts() {
  const archived = C.cycle(data).archivedWorkouts || [];
  if (!archived.length) return;
  $("main").insertAdjacentHTML(
    "beforeend",
    `<section class="archived"><div class="section-title"><h2>Treinos arquivados nesta ficha</h2></div>${archived.map((w) => `<div class="panel workout-card"><div class="row"><div><h3>${esc(w.name)}</h3><p class="small muted">${w.exercises.length} exercícios</p></div><button class="secondary" data-action="restore-workout" data-id="${esc(w.id)}">Restaurar</button></div></div>`).join("")}</section>`,
  );
}
function settings() {
  const st = data.settings,
    c = C.cycle(data);
  openModal(
    "Ajustes e backup",
    `<section class="settings-section"><h3>Do seu jeito</h3><label class="toggle-row"><span><strong>Timer de descanso</strong><small>Opcional para quando estiver sem o Garmin.</small></span><input id="setting-timer" type="checkbox" ${st.timer ? "checked" : ""} role="switch"></label><label>Descanso padrão em segundos<input id="setting-rest" type="number" min="5" max="900" value="${st.restSeconds}" inputmode="numeric"></label><p class="small muted">Ao concluir uma série, usa o intervalo do exercício. Mantenha o app aberto para acompanhar o alerta.</p><label>Meta de dias de treino por semana<input id="setting-goal" type="number" min="1" max="7" value="${st.weeklyGoal}" inputmode="numeric"></label></section><section class="settings-section"><h3>Organização da rotina</h3><label>Como sugerir o treino<select id="setting-mode"><option value="sequencia" ${st.scheduleMode === "sequencia" ? "selected" : ""}>Seguir a sequência das fichas</option><option value="semana" ${st.scheduleMode === "semana" ? "selected" : ""}>Definir por dia da semana</option></select></label><p class="small muted">Na sequência, o próximo treino avança quando você finaliza uma sessão. Nos dias fixos, a agenda abaixo define a sugestão.</p><div class="weekday-settings">${[1, 2, 3, 4, 5, 6, 0].map((day) => `<label>${names[day]}<select data-weekday="${day}"><option value="">Descanso</option>${c.workouts.map((w) => `<option value="${esc(w.id)}" ${st.weekdays[day] === w.id ? "selected" : ""}>${esc(w.name)}</option>`).join("")}</select></label>`).join("")}</div></section><section class="settings-section"><h3>Seus dados ficam com você</h3><p class="small muted">Tudo fica neste navegador. Exportar salva fichas, histórico e o treino em andamento. Para levar ao computador, importe o arquivo por lá. Não há sincronização automática.</p><p class="small muted" id="last-backup-status">Último backup exportado: ${data.lastBackupAt ? esc(new Date(data.lastBackupAt).toLocaleString("pt-BR")) : "ainda não exportado"}.</p><div class="button-stack"><button class="secondary" data-action="export-backup">↓ Exportar backup completo</button><button class="secondary" data-action="import-backup">↑ Restaurar backup</button><button class="text-button" data-action="recovery-backup">Baixar cópia anterior à última restauração</button></div><p class="small muted">Guarde o arquivo no iCloud Drive ou onde preferir, especialmente antes de limpar dados do navegador ou trocar de celular.</p></section><section class="settings-section"><button class="secondary wide" data-action="install">Adicionar à tela inicial</button><p class="small muted">Treino Tiago · versão 2.3 · uso local</p></section>`,
    `<button class="primary wide" data-action="save-settings">Salvar ajustes</button>`,
  );
}
function editWorkout(workout) {
  editor = C.clone(workout);
  renderEditor();
}
function captureEditor() {
  editor.name = $("editor-name").value.trim();
  editor.focus = $("editor-focus").value.trim();
  editor.goal = $("editor-goal").value.trim();
  document.querySelectorAll("[data-edit-index]").forEach((el) => {
    editor.exercises[Number(el.dataset.editIndex)][el.name] = el.value;
  });
}
function renderEditor() {
  openModal(
    "Editar treino",
    `<label>Nome<input id="editor-name" maxlength="120" value="${esc(editor.name)}"></label><div class="form-grid"><label>Foco<input id="editor-focus" maxlength="200" value="${esc(editor.focus)}"></label><label>Objetivo<input id="editor-goal" maxlength="500" value="${esc(editor.goal)}"></label></div><p class="small muted">Sem exercícios, esta ficha funciona como um dia de descanso. As mudanças valem para as próximas sessões.</p>${editor.exercises.map((e, i) => `<details class="edit-exercise" ${i === editor.exercises.length - 1 ? "open" : ""}><summary>${i + 1}. ${esc(e.name)}</summary><div class="edit-fields"><label>Nome<input name="name" data-edit-index="${i}" maxlength="180" value="${esc(e.name)}"></label><label>Registro<select name="type" data-edit-index="${i}">${C.types.map((t) => `<option value="${t}" ${e.type === t ? "selected" : ""}>${typeNames[t]}</option>`).join("")}</select></label><div class="form-grid"><label>Séries<input name="sets" data-edit-index="${i}" value="${esc(e.sets)}" placeholder="3 ou 3-4"></label><label>Meta<input name="reps" data-edit-index="${i}" value="${esc(e.reps)}" placeholder="8 a 12 reps"></label><label>Descanso<input name="rest" data-edit-index="${i}" value="${esc(e.rest)}" placeholder="90 seg"></label></div><label>Orientações<textarea name="notes" data-edit-index="${i}" maxlength="2000">${esc(e.notes)}</textarea></label><div class="card-actions"><button class="secondary" data-action="move-exercise" data-index="${i}" data-delta="-1" ${i === 0 ? "disabled" : ""} aria-label="Mover exercício para cima">↑</button><button class="secondary" data-action="move-exercise" data-index="${i}" data-delta="1" ${i === editor.exercises.length - 1 ? "disabled" : ""} aria-label="Mover exercício para baixo">↓</button><button class="text-button danger" data-action="remove-exercise" data-index="${i}">Remover da ficha</button></div></div></details>`).join("")}<button class="secondary wide" data-action="add-exercise">＋ Adicionar exercício</button>`,
    `<button class="primary wide" data-action="save-workout">Salvar ficha</button>`,
  );
}
function previewImport(c) {
  pendingCycle = c;
  openModal(
    "Confira a nova ficha",
    `<span class="pill">Novo ciclo</span><h3>${esc(c.name)}</h3><p>${c.workouts.length} treinos · ${c.workouts.reduce((n, w) => n + w.exercises.length, 0)} exercícios</p>${c.workouts.map((w) => `<details class="preview-exercise"><summary><strong>${esc(w.name)}</strong><span>${w.exercises.length} exercícios</span></summary><ul>${w.exercises.map((e) => `<li>${esc(e.name)} — ${esc(e.sets)} séries · ${esc(e.reps)} · ${typeNames[e.type]}</li>`).join("") || "<li>Descanso</li>"}</ul></details>`).join("")}<p class="note-box">A ficha atual será arquivada. Seus ${data.sessions.length} registros anteriores serão mantidos. A nova rotina começa em sequência; você pode configurar dias fixos nos ajustes.</p>`,
    `<button class="secondary" data-action="close-modal">Voltar</button><button class="primary" data-action="activate-import">Ativar novo ciclo</button>`,
  );
}
async function readPlanFile(file) {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Use um arquivo com até 5 MB, sem imagens.");
  let text;
  if (/\.docx$/i.test(file.name)) {
    const files = fflate.unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (f) => f.name === "word/document.xml" && f.originalSize < 2000000,
    });
    if (!files["word/document.xml"])
      throw new Error("Documento Word inválido ou muito grande.");
    const xml = new DOMParser().parseFromString(
      fflate.strFromU8(files["word/document.xml"]),
      "application/xml",
    );
    if (xml.querySelector("parsererror"))
      throw new Error("Não foi possível ler este documento Word.");
    text = [...xml.getElementsByTagNameNS("*", "p")]
      .map((p) =>
        [...p.getElementsByTagNameNS("*", "t")]
          .map((t) => t.textContent)
          .join(""),
      )
      .join("\n");
  } else if (/\.txt$/i.test(file.name)) text = await file.text();
  else throw new Error("Importe um DOCX ou TXT preenchido no modelo do app.");
  return C.parsePlan(text, data.cycles, data.sessions);
}
function exportPlan() {
  download(
    `ficha-${C.slug(C.cycle(data).name)}.txt`,
    C.planText(C.cycle(data)),
    "text/plain;charset=utf-8",
  );
  toast(
    "Ficha baixada. Edite o nome do ciclo e importe o TXT ou salve como DOCX no Word.",
  );
}
function restSeconds(exercise) {
  const value = exercise.rest?.match(/(\d+)(?:\s*-\s*\d+)?\s*(min|seg|s)/i);
  return value
    ? Math.min(
        900,
        Math.max(
          5,
          Number(value[1]) * (value[2].toLowerCase() === "min" ? 60 : 1),
        ),
      )
    : data.settings.restSeconds;
}
function startRest(seconds) {
  if (!data.settings.timer) return;
  commit((d) => {
    d.restEnd = Date.now() + seconds * 1000;
  });
  tick();
}
function tick() {
  if (!data) return;
  if ($("session-clock") && data.activeSession) {
    const seconds = Math.floor(C.elapsed(data.activeSession) / 1000);
    $("session-clock").textContent =
      `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }
  const on = data.settings.timer && data.restEnd;
  $("timer").hidden = !on;
  document.body.classList.toggle("has-timer", Boolean(on));
  if (!on) return;
  const remaining = Math.max(0, Math.ceil((data.restEnd - Date.now()) / 1000));
  $("timer").innerHTML =
    `<span><small>Descanso</small><strong>${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}</strong></span><button class="secondary" data-action="timer-plus">+15 s</button><button class="icon-button" data-action="timer-stop" aria-label="Encerrar descanso">×</button>`;
  if (!remaining) {
    commit((d) => {
      d.restEnd = null;
    });
    $("timer").hidden = true;
    toast("Descanso concluído. Próxima série!");
    if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
  }
}

const actions = {
  "close-modal": () => {
    $("modal").close();
  },
  settings: () => {
    if (data) settings();
  },
  undo: () => {
    const fn = undoAction;
    undoAction = null;
    $("toast").hidden = true;
    document.querySelector(".modal-toast")?.remove();
    if (fn) fn();
  },
  start: (el) => {
    const w = C.cycle(data).workouts.find((w) => w.id === el.dataset.id);
    if (!w) return;
    if (
      commit((d) => {
        d.activeSession = C.startSession(d, w);
      })
    )
      render();
  },
  pause: () => {
    if (
      commit((d) => {
        const s = d.activeSession;
        if (s.runningSince) {
          s.elapsedMs = C.elapsed(s);
          s.runningSince = null;
          d.restEnd = null;
        } else s.runningSince = Date.now();
      })
    )
      render();
  },
  discard: () => {
    if (
      !confirm(
        data.activeSession.editing
          ? "Cancelar as alterações deste registro?"
          : "Descartar o treino em andamento?",
      )
    )
      return;
    if (
      commit((d) => {
        d.activeSession = null;
        d.restEnd = null;
      })
    )
      render();
  },
  check: (el) => {
    const i = Number(el.dataset.entry),
      j = Number(el.dataset.set),
      s = data.activeSession,
      entry = s.entries[i],
      set = entry.sets[j];
    if (!set.done) {
      const error = C.validateSet(set, entry.type);
      if (error) {
        toast(error);
        return;
      }
    }
    if (
      commit((d) => {
        d.activeSession.entries[i].sets[j].done = !set.done;
      })
    ) {
      const done = data.activeSession.entries[i].sets[j].done;
      document
        .querySelector(`[data-row="${i}-${j}"]`)
        .classList.toggle("done", done);
      el.setAttribute("aria-pressed", done);
      el.setAttribute(
        "aria-label",
        `${done ? "Desmarcar" : "Concluir"} série ${j + 1} de ${entry.exerciseName}`,
      );
      updateProgress();
      if (done && data.settings.timer && !s.editing)
        startRest(
          restSeconds(
            s.workout.exercises.find((e) => e.id === entry.exerciseId) || {},
          ),
        );
    }
  },
  "add-set": (el) => {
    const i = Number(el.dataset.entry);
    if (data.activeSession.entries[i].sets.length >= 30)
      return toast("Limite de 30 séries por exercício.");
    if (commit((d) => d.activeSession.entries[i].sets.push(C.emptySet())))
      render();
  },
  "remove-set": (el) => {
    const i = Number(el.dataset.entry),
      j = Number(el.dataset.set),
      old = C.clone(data.activeSession.entries[i].sets[j]),
      id = data.activeSession.id;
    if (commit((d) => d.activeSession.entries[i].sets.splice(j, 1))) {
      render();
      toast("Série removida.", () => {
        if (
          data.activeSession?.id === id &&
          commit((d) => d.activeSession.entries[i].sets.splice(j, 0, old))
        )
          render();
      });
    }
  },
  "copy-last": (el) => {
    const i = Number(el.dataset.entry),
      entry = data.activeSession.entries[i],
      last = previousEntry(entry, data.activeSession);
    if (!last) return;
    if (
      entry.sets.some(
        (s) =>
          s.done ||
          ["reps", "weight", "seconds", "minutes", "distance"].some(
            (k) => s[k] !== "" && s[k] != null,
          ),
      ) &&
      !confirm(
        "Preencher as séries não concluídas com o resultado anterior? Valores digitados nessas séries serão substituídos.",
      )
    )
      return;
    if (
      commit((d) => {
        const sets = d.activeSession.entries[i].sets;
        sets.forEach((s, j) => {
          if (!s.done && last.sets[j])
            sets[j] = { ...C.emptySet(), ...last.sets[j], done: false };
        });
      })
    )
      render();
  },
  finish: () => {
    const s = data.activeSession,
      pending = s.entries
        .flatMap((e) => e.sets)
        .filter(
          (set) =>
            !set.done &&
            ["reps", "weight", "seconds", "minutes", "distance"].some(
              (k) => set[k] !== "" && set[k] != null,
            ),
        );
    if (
      pending.length &&
      !confirm(
        `${pending.length} séries preenchidas ainda não foram marcadas. Finalizar apenas com as séries concluídas?`,
      )
    )
      return;
    let result;
    if (
      commit((d) => {
        result = C.finish(d);
        d.restEnd = null;
      })
    ) {
      render();
      openModal(
        "Treino registrado",
        `<div class="success-mark">✓</div><h3>${esc(result.workoutName)}</h3><p>${esc(dateFmt(result.date, { day: "numeric", month: "long" }))} · ${result.entries.reduce((n, e) => n + e.sets.length, 0)} séries concluídas</p><p class="muted">Tudo salvo neste aparelho. Seu próximo treino já está preparado.</p>`,
        `<button class="primary wide" data-action="close-modal">Concluir</button>`,
      );
    }
  },
  day: (el) => {
    filterDate = el.dataset.day;
    month = filterDate.slice(0, 7);
    go("historico");
  },
  month: (el) => {
    const [y, m] = month.split("-").map(Number);
    month = C.localDate(
      new Date(y, m - 1 + Number(el.dataset.delta), 1, 12),
    ).slice(0, 7);
    renderHistory();
  },
  "filter-day": (el) => {
    filterDate = filterDate === el.dataset.day ? "" : el.dataset.day;
    renderHistory();
  },
  "clear-date": () => {
    filterDate = "";
    renderHistory();
  },
  "session-detail": (el) => sessionDetail(el.dataset.id),
  "delete-session": (el) => {
    const id = el.dataset.id,
      s = C.clone(data.sessions.find((s) => s.id === id));
    if (
      !confirm(
        "Excluir este registro do histórico? Você poderá desfazer logo após a exclusão.",
      )
    )
      return;
    if (
      commit((d) => {
        d.sessions = d.sessions.filter((s) => s.id !== id);
      })
    ) {
      $("modal").close();
      render();
      toast("Registro excluído.", () => {
        if (commit((d) => d.sessions.push(s))) render();
      });
    }
  },
  "progress-view": (el) => {
    progressView = el.dataset.view;
    renderProgress();
  },
  cardio: () => cardioModal(),
  "edit-session": (el) => {
    const cardio = data.sessions.find(
      (s) => s.id === el.dataset.id && s.kind === "cardio",
    );
    if (cardio) return cardioModal(cardio);
    if (data.activeSession)
      return toast(
        "Finalize ou descarte a sessão em andamento antes de editar outra.",
      );
    const old = data.sessions.find((s) => s.id === el.dataset.id);
    if (
      commit((d) => {
        d.activeSession = {
          ...C.clone(old),
          editing: true,
          runningSince: null,
          workout: old.workout || {
            id: old.workoutId,
            name: old.workoutName,
            focus: "",
            goal: "",
            exercises: old.entries.map((e) => ({
              id: e.exerciseId,
              name: e.exerciseName,
              type: e.type,
              sets: String(e.sets.length || 1),
              reps: "",
              rest: "",
              notes: "",
            })),
          },
        };
      })
    ) {
      $("modal").close();
      go("hoje");
    }
  },
  retro: () => {
    if (data.activeSession)
      return toast(
        "Finalize ou descarte o treino em andamento antes de registrar outro.",
      );
    openModal(
      "Registrar outro dia",
      `<label>Data<input id="retro-date" type="date" value="${filterDate || C.localDate()}" max="${C.localDate()}"></label><label>Treino<select id="retro-workout">${C.cycle(
        data,
      )
        .workouts.map(
          (w) => `<option value="${esc(w.id)}">${esc(w.name)}</option>`,
        )
        .join(
          "",
        )}</select></label><p class="small muted">Use uma ficha do ciclo ativo. Para corrigir um treino antigo, abra o registro e toque em Editar.</p>`,
      `<button class="primary wide" data-action="start-retro">Preencher treino</button>`,
    );
  },
  "start-retro": () => {
    const day = $("retro-date").value;
    if (!C.dateOK(day) || day > C.localDate())
      return toast("Escolha uma data válida, até hoje.");
    const w = C.cycle(data).workouts.find(
      (w) => w.id === $("retro-workout").value,
    );
    if (
      commit((d) => {
        d.activeSession = C.startSession(d, w, day);
        d.activeSession.runningSince = null;
        d.activeSession.editing = true;
      })
    ) {
      $("modal").close();
      go("hoje");
    }
  },
  "save-settings": () => {
    const rest = Number($("setting-rest").value),
      goal = Number($("setting-goal").value);
    if (
      !Number.isFinite(rest) ||
      rest < 5 ||
      rest > 900 ||
      !Number.isInteger(goal) ||
      goal < 1 ||
      goal > 7
    )
      return toast("Descanso: 5 a 900 segundos. Meta: 1 a 7 dias.");
    if (
      commit((d) => {
        d.settings = {
          timer: $("setting-timer").checked,
          restSeconds: rest,
          weeklyGoal: goal,
          scheduleMode: $("setting-mode").value,
          weekdays: Object.fromEntries(
            [...document.querySelectorAll("[data-weekday]")].map((el) => [
              el.dataset.weekday,
              el.value,
            ]),
          ),
        };
        if (!d.settings.timer) d.restEnd = null;
      })
    ) {
      $("modal").close();
      pickedWorkout = "";
      render();
      toast("Ajustes salvos.");
    }
  },
  "timer-plus": () => {
    commit((d) => {
      d.restEnd = Math.max(Date.now(), d.restEnd || 0) + 15000;
    });
    tick();
  },
  "timer-stop": () => {
    commit((d) => {
      d.restEnd = null;
    });
    tick();
  },
  "edit-workout": (el) =>
    editWorkout(C.cycle(data).workouts.find((w) => w.id === el.dataset.id)),
  "new-workout": () =>
    editWorkout({
      id: C.uid(),
      name: "Novo treino",
      focus: "",
      goal: "",
      exercises: [],
    }),
  "add-exercise": () => {
    captureEditor();
    editor.exercises.push({
      id: C.uid(),
      name: "Novo exercício",
      type: "forca",
      sets: "3",
      reps: "8 a 12",
      rest: "90 seg",
      notes: "",
    });
    renderEditor();
  },
  "move-exercise": (el) => {
    captureEditor();
    const i = Number(el.dataset.index),
      j = i + Number(el.dataset.delta);
    [editor.exercises[i], editor.exercises[j]] = [
      editor.exercises[j],
      editor.exercises[i],
    ];
    renderEditor();
  },
  "remove-exercise": (el) => {
    captureEditor();
    const old = C.clone(editor),
      index = Number(el.dataset.index);
    editor.exercises.splice(index, 1);
    renderEditor();
    toast("Exercício removido da edição. Histórico preservado.", () => {
      editor = old;
      renderEditor();
    });
  },
  "save-workout": () => {
    captureEditor();
    try {
      C.validatePlan([editor]);
    } catch (e) {
      return toast(e.message);
    }
    if (
      commit((d) => {
        const plan = C.cycle(d).workouts,
          i = plan.findIndex((w) => w.id === editor.id);
        if (i < 0) plan.push(C.clone(editor));
        else plan[i] = C.clone(editor);
      })
    ) {
      $("modal").close();
      render();
      toast("Ficha salva. Os registros anteriores foram preservados.");
    }
  },
  "move-workout": (el) => {
    const i = Number(el.dataset.index),
      j = i + Number(el.dataset.delta);
    if (
      commit((d) => {
        const list = C.cycle(d).workouts;
        [list[i], list[j]] = [list[j], list[i]];
      })
    )
      render();
  },
  "duplicate-workout": (el) => {
    if (
      commit((d) => {
        const list = C.cycle(d).workouts,
          w = C.clone(list.find((w) => w.id === el.dataset.id));
        w.id = C.uid();
        w.name = (w.name + " — cópia").slice(0, 120);
        list.push(w);
      })
    )
      render();
  },
  "archive-workout": (el) => {
    const id = el.dataset.id,
      w = C.clone(C.cycle(data).workouts.find((w) => w.id === id));
    if (
      !confirm(
        "Arquivar este treino? Os registros anteriores continuarão no histórico.",
      )
    )
      return;
    if (
      commit((d) => {
        const c = C.cycle(d);
        c.archivedWorkouts ||= [];
        c.archivedWorkouts.push(w);
        c.workouts = c.workouts.filter((w) => w.id !== id);
        if (d.nextWorkoutId === id) d.nextWorkoutId = c.workouts[0].id;
        for (const k in d.settings.weekdays)
          if (d.settings.weekdays[k] === id) d.settings.weekdays[k] = "";
      })
    ) {
      render();
      toast("Treino arquivado.", () => {
        if (
          commit((d) => {
            const c = C.cycle(d);
            c.workouts.push(w);
            c.archivedWorkouts = c.archivedWorkouts.filter((v) => v.id !== id);
          })
        )
          render();
      });
    }
  },
  "rename-cycle": () =>
    openModal(
      "Nome do ciclo",
      `<label>Nome<input id="cycle-name" maxlength="120" value="${esc(C.cycle(data).name)}"></label>`,
      `<button class="primary wide" data-action="save-cycle-name">Salvar nome</button>`,
    ),
  "save-cycle-name": () => {
    const name = $("cycle-name").value.trim();
    if (!name) return toast("Preencha o nome.");
    if (
      commit((d) => {
        C.cycle(d).name = name;
      })
    ) {
      $("modal").close();
      render();
    }
  },
  "restore-workout": (el) => {
    if (
      commit((d) => {
        const c = C.cycle(d),
          w = c.archivedWorkouts.find((w) => w.id === el.dataset.id);
        if (w) {
          c.workouts.push(w);
          c.archivedWorkouts = c.archivedWorkouts.filter(
            (item) => item.id !== w.id,
          );
        }
      })
    )
      render();
  },
  "import-plan": () => {
    if (data.activeSession)
      return toast(
        "Finalize ou descarte o treino em andamento antes de trocar a ficha.",
      );
    $("plan-file").click();
  },
  "activate-import": () => {
    if (!pendingCycle) return;
    if (commit((d) => C.activateCycle(d, pendingCycle))) {
      pendingCycle = null;
      pickedWorkout = "";
      $("modal").close();
      go("fichas");
      toast("Novo ciclo ativado. Histórico preservado.");
    }
  },
  "export-plan": () => exportPlan(),
  "reuse-cycle": (el) => {
    const c = C.clone(data.cycles.find((c) => c.id === el.dataset.id));
    c.id = C.uid();
    c.name = (c.name + " — novo ciclo").slice(0, 120);
    c.createdAt = new Date().toISOString();
    previewImport(c);
  },
  "original-plan": () =>
    previewImport({
      id: C.uid(),
      name: "Ficha original — novo ciclo",
      createdAt: new Date().toISOString(),
      workouts: C.normalizePlan(DEFAULT_PLAN),
    }),
  "cycle-history": (el) => {
    filterCycle = el.dataset.id;
    filterDate = "";
    go("historico");
  },
  "today-history": () => {
    filterDate = C.localDate();
    filterCycle = "";
    month = filterDate.slice(0, 7);
    go("historico");
  },
  "snooze-backup": () => {
    if (
      commit((d) => {
        d.backupReminderSnoozedUntil = new Date(
          Date.now() + 3 * 86400000,
        ).toISOString();
      })
    )
      render();
  },
  "export-backup": () => {
    const exportedAt = new Date().toISOString();
    const exportedData = C.clone(data);
    exportedData.lastBackupAt = exportedAt;
    delete exportedData.backupReminderSnoozedUntil;
    download(
      `treino-tiago-backup-${C.localDate()}.json`,
      JSON.stringify(
        {
          app: "Treino Tiago",
          version: 2,
          exportedAt,
          data: exportedData,
        },
        null,
        2,
      ),
    );
    if (
      !commit((d) => {
        d.lastBackupAt = exportedAt;
        delete d.backupReminderSnoozedUntil;
      })
    )
      return;
    if (tab === "hoje") renderToday();
    if ($("last-backup-status"))
      $("last-backup-status").textContent =
        "Último backup exportado: " +
        new Date(exportedAt).toLocaleString("pt-BR") +
        ".";
    toast("Download do backup iniciado. Guarde o arquivo em um lugar seguro.");
  },
  "import-backup": () => {
    $("backup-file").click();
  },
  "restore-backup": () => {
    if (!pendingBackup) return;
    try {
      const current = localStorage.getItem(C.KEY);
      if (current)
        localStorage.setItem("treinoTiago.beforeRestore.v2", current);
      localStorage.setItem(C.KEY, JSON.stringify(pendingBackup));
      data = pendingBackup;
      pendingBackup = null;
      pickedWorkout = "";
      $("modal").close();
      go("hoje");
      toast("Backup restaurado.");
    } catch (e) {
      toast("Não foi possível restaurar. Os dados atuais foram preservados.");
    }
  },
  "recovery-backup": () => {
    const old = localStorage.getItem("treinoTiago.beforeRestore.v2");
    if (!old) return toast("Nenhuma restauração foi feita neste aparelho.");
    download(
      "treino-tiago-antes-da-restauracao.json",
      JSON.stringify(
        { app: "Treino Tiago", version: 2, data: JSON.parse(old) },
        null,
        2,
      ),
    );
  },
  "raw-backup": () => {
    const keys = [
      C.KEY,
      "treinoTiago.plan.v1",
      "treinoTiago.sessions.v1",
      "treinoTiago.draft.v1",
    ];
    download(
      "treino-tiago-recuperacao.json",
      JSON.stringify(
        Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])),
        null,
        2,
      ),
    );
  },
  install: async () => {
    if (installEvent) {
      await installEvent.prompt();
      installEvent = null;
    } else
      toast(
        "No iPhone: Compartilhar → Adicionar à Tela de Início. No Android: menu do navegador → Instalar app.",
      );
  },
};
document.addEventListener("click", async (event) => {
  const t = event.target.closest("[data-tab]");
  if (t) {
    go(t.dataset.tab);
    return;
  }
  const el = event.target.closest("[data-action]");
  if (!el || el.disabled) return;
  try {
    await actions[el.dataset.action]?.(el);
  } catch (error) {
    toast(error.message || "Não foi possível concluir.");
  }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.dataset.field && data?.activeSession) {
    const i = Number(el.dataset.entry),
      j = Number(el.dataset.set);
    if (
      commit((d) => {
        const set = d.activeSession.entries[i].sets[j];
        set[el.dataset.field] = el.value;
        if (!d.activeSession.editing) set.done = false;
      })
    ) {
      const row = document.querySelector(`[data-row="${i}-${j}"]`),
        done = Boolean(data.activeSession.entries[i].sets[j].done),
        button = row.querySelector(".check-set");
      row.classList.toggle("done", done);
      button.setAttribute("aria-pressed", String(done));
      button.setAttribute(
        "aria-label",
        `${done ? "Desmarcar" : "Concluir"} série ${j + 1} de ${data.activeSession.entries[i].exerciseName}`,
      );
      updateProgress();
    }
  }
  if (el.id === "session-notes")
    commit((d) => {
      d.activeSession.notes = el.value;
    });
});
document.addEventListener("submit", (event) => {
  if (event.target.id !== "cardio-form") return;
  event.preventDefault();
  saveCardioForm();
});
document.addEventListener("change", (event) => {
  const el = event.target;
  if (el.id === "cardio-type") {
    const custom = el.value === "outro";
    $("cardio-other-label").hidden = !custom;
    $("cardio-other").disabled = !custom;
    $("cardio-other").required = custom;
    if (custom) $("cardio-other").focus();
  }
  if (el.id === "workout-choice") {
    pickedWorkout = el.value;
    renderToday();
  }
  if (el.id === "session-date") {
    if (C.dateOK(el.value) && el.value <= C.localDate())
      commit((d) => {
        d.activeSession.date = el.value;
      });
    else {
      el.value = data.activeSession.date;
      toast("Escolha uma data válida, até hoje.");
    }
  }
  if (el.id === "history-cycle") {
    filterCycle = el.value;
    renderHistory();
  }
  if (el.id === "overview-metric") {
    overviewMetric = el.value;
    renderProgress();
  }
  if (el.id === "report-exercise") {
    reportKey = el.value;
    renderProgress();
  }
  if (el.id === "report-range") {
    reportRange = el.value;
    renderProgress();
  }
  if (el.id === "report-metric") {
    reportMetric = el.value;
    renderProgress();
  }
});
$("plan-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    previewImport(await readPlanFile(file));
  } catch (e) {
    toast(e.message);
  }
});
$("backup-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    if (file.size > 20 * 1024 * 1024)
      throw new Error("Backup maior que 20 MB.");
    pendingBackup = C.backupData(JSON.parse(await file.text()), DEFAULT_PLAN);
    openModal(
      "Restaurar backup",
      `<p><strong>${pendingBackup.cycles.length} ciclos e ${pendingBackup.sessions.length} registros</strong> encontrados.</p><p>Este arquivo substituirá os dados deste aparelho. Uma cópia dos dados atuais ficará disponível nos ajustes para recuperação.</p><p class="muted small">Para importar apenas uma nova ficha sem substituir o histórico, use Fichas → Importar DOCX ou TXT.</p>`,
      `<button class="secondary" data-action="close-modal">Cancelar</button><button class="primary" data-action="restore-backup">Restaurar estes dados</button>`,
    );
  } catch (e) {
    toast(e.message);
  }
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installEvent = event;
});
window.addEventListener("hashchange", () => {
  if (location.hash === "#hoje") go("hoje");
});
window.addEventListener("storage", (event) => {
  if (event.key !== C.KEY || !event.newValue) return;
  try {
    const updated = C.validateData(JSON.parse(event.newValue));
    data = updated;
    if ($("modal").open) $("modal").close();
    editor = null;
    render();
    toast("Dados atualizados em outra aba deste navegador.");
  } catch {
    toast(
      "Uma atualização de outra aba não pôde ser lida. Exporte um backup antes de continuar.",
    );
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") tick();
});
if (data) render();
setInterval(tick, 1000);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {
    toast("O uso offline não pôde ser preparado. Tente novamente com conexão.");
  });
