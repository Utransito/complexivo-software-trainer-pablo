
const DB = window.PREGUNTAS_PDF || [];
const $ = id => document.getElementById(id);
const STORE_KEY = "simulador_actualizado_v5";

let progreso = JSON.parse(localStorage.getItem(STORE_KEY) || '{"done":0,"correct":0,"failed":[]}');
let sesion = [];
let indice = 0;
let aciertos = 0;
let modo = "study";
let respondida = false;
let erroresSesion = [];

function mezclar(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function guardar() {
  localStorage.setItem(STORE_KEY, JSON.stringify(progreso));
  actualizarEstadisticas();
}

function actualizarEstadisticas() {
  $("totalDone").textContent = progreso.done || 0;
  $("totalCorrect").textContent = progreso.correct || 0;
  $("totalFailed").textContent = (progreso.failed || []).length;
}

function mostrar(id) {
  ["home", "quiz", "result"].forEach(x => $(x).classList.toggle("hidden", x !== id));
}

[...new Set(DB.map(q => q.materia))].sort().forEach(materia => {
  const option = document.createElement("option");
  option.value = materia;
  option.textContent = materia;
  $("subject").appendChild(option);
});

function iniciar(forzarFalladas = false) {
  modo = forzarFalladas ? "failed" : $("mode").value;
  let pool = DB;
  const materia = $("subject").value;

  if (materia !== "Todas") {
    pool = pool.filter(q => q.materia === materia);
  }

  if (modo === "failed") {
    const ids = new Set(progreso.failed || []);
    pool = pool.filter(q => ids.has(q.id));

    if (!pool.length) {
      alert("Todavía no tienes preguntas falladas.");
      return;
    }
  }

  const cantidad = Math.min(parseInt($("count").value), pool.length);

  sesion = mezclar(pool).slice(0, cantidad).map(q => {
    const opciones = mezclar(q.opciones);
    return {
      ...q,
      opcionesSesion: opciones,
      respuestaSesion: opciones.indexOf(q.correcta)
    };
  });

  indice = 0;
  aciertos = 0;
  erroresSesion = [];
  mostrar("quiz");
  renderizarPregunta();
}

function renderizarPregunta() {
  respondida = false;

  $("nextBtn").classList.add("hidden");
  $("repeatBtn").classList.add("hidden");
  $("feedback").classList.add("hidden");

  const q = sesion[indice];

  $("progressText").textContent = `${indice + 1} / ${sesion.length}`;
  $("scoreText").textContent = `Aciertos: ${aciertos}`;
  $("progressFill").style.width = `${(indice / sesion.length) * 100}%`;

  $("qid").textContent = q.id;
  $("qsubject").textContent = q.materia;
  $("qpage").textContent = `${q.fuente} · pág. ${q.pagina}`;
  $("question").textContent = q.enunciado;

  $("options").innerHTML = "";

  q.opcionesSesion.forEach((texto, i) => {
    const boton = document.createElement("button");
    boton.className = "option";
    boton.textContent = `${String.fromCharCode(65 + i)}) ${texto}`;

    // Solo la fase de estudio muestra la respuesta correcta antes de responder.
    if (modo === "study" && i === q.respuestaSesion) {
      boton.classList.add("study-correct");
    }

    boton.onclick = () => responder(i);
    $("options").appendChild(boton);
  });
}

function responder(eleccion) {
  if (respondida) return;

  respondida = true;
  const q = sesion[indice];
  const correcta = eleccion === q.respuestaSesion;

  progreso.done = (progreso.done || 0) + 1;

  if (correcta) {
    aciertos++;
    progreso.correct = (progreso.correct || 0) + 1;
    progreso.failed = (progreso.failed || []).filter(id => id !== q.id);
  } else {
    erroresSesion.push(q.id);
    progreso.failed = [...new Set([...(progreso.failed || []), q.id])];
  }

  // En todos los modos se muestra la corrección después de responder.
  [...$("options").children].forEach((boton, i) => {
    boton.disabled = true;

    if (i === q.respuestaSesion) {
      boton.classList.remove("study-correct");
      boton.classList.add("correct");
    }

    if (i === eleccion && !correcta) {
      boton.classList.add("wrong");
    }
  });

  guardar();

  const feedback = $("feedback");
  feedback.classList.remove("hidden", "bad");

  if (!correcta) feedback.classList.add("bad");

  feedback.innerHTML = `
    <strong>${correcta ? "✅ RESPUESTA CORRECTA" : "❌ RESPUESTA INCORRECTA"}</strong><br><br>
    <b>Respuesta correcta:</b> ${q.correcta}<br><br>
    ${q.explicacion}
    ${!correcta && (modo === "study" || modo === "failed")
      ? "<br><br><b>Pulsa «Repetir pregunta» para volver a intentarlo antes de continuar.</b>"
      : ""}
  `;

  // Repetición solo en fase de estudio o repaso de falladas.
  if (!correcta && (modo === "study" || modo === "failed")) {
    $("repeatBtn").classList.remove("hidden");
  }

  $("nextBtn").classList.remove("hidden");
}

function repetirPregunta() {
  if (!respondida) return;

  respondida = false;
  const q = sesion[indice];

  $("feedback").classList.add("hidden");
  $("repeatBtn").classList.add("hidden");
  $("nextBtn").classList.add("hidden");

  [...$("options").children].forEach((boton, i) => {
    boton.disabled = false;
    boton.classList.remove("correct", "wrong", "selected", "study-correct");

    if (modo === "study" && i === q.respuestaSesion) {
      boton.classList.add("study-correct");
    }
  });

  progreso.done = Math.max(0, (progreso.done || 0) - 1);
  guardar();
}

function siguiente() {
  if (!respondida) return;

  indice++;
  if (indice >= sesion.length) {
    finalizar();
  } else {
    renderizarPregunta();
  }
}

function finalizar() {
  mostrar("result");

  const porcentaje = sesion.length
    ? Math.round((aciertos * 100) / sesion.length)
    : 0;

  $("resultScore").textContent = `${aciertos} / ${sesion.length} (${porcentaje}%)`;
  $("resultDetails").innerHTML = `
    <p>Falladas en esta ronda: <b>${erroresSesion.length}</b></p>
    <p>${modo === "exam"
      ? "Simulador oficial finalizado con corrección inmediata en cada pregunta."
      : "Fase de estudio finalizada."}</p>
  `;

  $("reviewBtn").style.display = erroresSesion.length ? "inline-block" : "none";
}

$("startBtn").onclick = () => iniciar(false);
$("nextBtn").onclick = siguiente;
$("repeatBtn").onclick = repetirPregunta;
$("quitBtn").onclick = () => {
  if (confirm("¿Salir del simulador?")) mostrar("home");
};
$("homeBtn").onclick = () => mostrar("home");
$("reviewBtn").onclick = () => iniciar(true);
$("resetBtn").onclick = () => {
  if (confirm("¿Borrar estadísticas y preguntas falladas?")) {
    progreso = { done: 0, correct: 0, failed: [] };
    guardar();
  }
};

actualizarEstadisticas();
