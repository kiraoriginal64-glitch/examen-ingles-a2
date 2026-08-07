import { supabase } from './supabase.js';

const attemptId = sessionStorage.getItem('exam_attempt_id');

if (!attemptId) {
  alert("Sesión no válida. Por favor, regístrate primero.");
  window.location.href = '/';
} else {
  console.log("Examen iniciado para el intento:", attemptId);
  cargarPreguntas();
}

// --- SISTEMA ANTI-TRAMPAS (OPTIMIZADO PARA MÓVILES) ---
let advertencias = 0;
const MAX_ADVERTENCIAS = 3;
let penalizado = false;

const registrarInfraccion = async () => {
  if (penalizado) return; // Evita que salte dos veces seguidas
  penalizado = true;
  advertencias++;
  
  // Guardamos la advertencia en tiempo real en la base de datos
  const attemptId = sessionStorage.getItem('exam_attempt_id');
  if (attemptId) {
    await supabase.from('exam_attempts').update({ anti_cheat_warnings: advertencias }).eq('id', attemptId);
  }

  if (advertencias >= MAX_ADVERTENCIAS) {
    alert("Has excedido el límite de advertencias. El examen se enviará y cerrará automáticamente.");
    document.getElementById('quiz-form').dispatchEvent(new Event('submit'));
  } else {
    alert(`¡ADVERTENCIA ${advertencias}/${MAX_ADVERTENCIAS}! Has minimizado el examen o cambiado de aplicación. Esta acción ha sido reportada al profesor.`);
    setTimeout(() => { penalizado = false; }, 2000); // Cooldown para no saturar al alumno
  }
};

// Se dispara al cambiar de pestaña, minimizar el navegador o cambiar de app en iOS/Android
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'hidden') registrarInfraccion();
});

// Se dispara si la pantalla pierde el foco (abrir notificaciones, pantalla dividida, llamadas entrantes)
window.addEventListener("blur", registrarInfraccion);

document.addEventListener('contextmenu', event => event.preventDefault());
// --------------------------------------------------------

// Lógica del temporizador
let tiempoRestante = 60 * 60; // 60 minutos
const timeDisplay = document.getElementById('time-display');

const timerInterval = setInterval(() => {
  tiempoRestante--;
  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  timeDisplay.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

  if (tiempoRestante <= 0) {
    clearInterval(timerInterval);
    alert("¡Se acabó el tiempo!");
    document.getElementById('quiz-form').submit(); // Envía automáticamente
  }
}, 1000);

// Función para descargar, MEZCLAR e imprimir las preguntas
async function cargarPreguntas() {
  const container = document.getElementById('questions-container');
  
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, category, prompt, options');

    if (error) throw error;

    // ALGORITMO PARA ALEATORIZAR (Mezcla de Fisher-Yates)
    // Esto garantiza que cada alumno vea un examen distinto
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Seleccionamos solo 40 preguntas (o el número que decidas) para este intento
    const preguntasDelExamen = questions.slice(0, 40); 

    container.innerHTML = ''; 

    preguntasDelExamen.forEach((q, index) => {
      const opcionesArray = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      
      // También mezclamos las opciones (A, B, C, D) para que no siempre sea la misma letra
      for (let i = opcionesArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opcionesArray[i], opcionesArray[j]] = [opcionesArray[j], opcionesArray[i]];
      }
      
      let opcionesHTML = '';
      opcionesArray.forEach(opcion => {
        opcionesHTML += `
          <li style="margin-bottom: 15px; background: #f9f9f9; padding: 10px; border-radius: 5px;">
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 16px;">
              <input type="radio" name="pregunta_${q.id}" value="${opcion}" required style="margin-right: 10px; transform: scale(1.5);">
              ${opcion}
            </label>
          </li>
        `;
      });

      // Estilo responsivo para celulares
      const preguntaHTML = `
        <div class="question" style="background: white; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="font-size: 18px; color: #0056b3;">${index + 1}. [${q.category}]</h3>
          <p style="font-size: 16px;">${q.prompt}</p>
          <ul class="options" style="list-style: none; padding: 0;">
            ${opcionesHTML}
          </ul>
        </div>
      `;
      
      container.innerHTML += preguntaHTML;
    });

    document.getElementById('finish-btn').style.display = 'block';

  } catch (error) {
    console.error("Error al cargar preguntas:", error);
    container.innerHTML = '<p style="color:red;">Hubo un error al cargar el examen. Por favor, recarga la página.</p>';
  }
}

// Manejar el envío y la auto-calificación del examen
document.getElementById('quiz-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // 1. Recopilamos lo que contestó el alumno
  const formData = new FormData(e.target);
  const respuestasDelAlumno = Object.fromEntries(formData.entries());
  
  try {
    // 2. Pedimos las respuestas correctas a la base de datos
    const { data: respuestasCorrectas, error: errorPreguntas } = await supabase
      .from('questions')
      .select('id, correct_answer');

    if (errorPreguntas) throw errorPreguntas;

    // 3. Comparamos y calculamos el puntaje final
    let puntaje = 0;
    const totalPreguntas = respuestasCorrectas.length;

    respuestasCorrectas.forEach(pregunta => {
      // El nombre del input en el HTML es "pregunta_ID"
      const respuestaSeleccionada = respuestasDelAlumno[`pregunta_${pregunta.id}`];
      
      if (respuestaSeleccionada === pregunta.correct_answer) {
        puntaje++;
      }
    });

    // 4. Guardamos la calificación en la tabla de exam_attempts
    const attemptId = sessionStorage.getItem('exam_attempt_id');
    const { error: errorUpdate } = await supabase
      .from('exam_attempts')
      .update({ 
        score: puntaje, 
        status: 'completed',
        completed_at: new Date()
      })
      .eq('id', attemptId);

    if (errorUpdate) throw errorUpdate;

    // 5. Le mostramos el resultado al alumno y bloqueamos el examen
    const contenedor = document.querySelector('.exam-container');
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 40px 0;">
        <h2 style="color: #28a745;">¡Examen Finalizado!</h2>
        <p style="font-size: 18px;">Tu calificación final es:</p>
        <h1 style="font-size: 48px; margin: 10px 0;">${puntaje} / ${totalPreguntas}</h1>
        <p>Tus resultados han sido enviados a tu profesor. Ya puedes cerrar esta ventana.</p>
      </div>
    `;

    // Limpiamos la sesión
    sessionStorage.removeItem('exam_attempt_id');
    document.querySelector('.timer').style.display = 'none';

  } catch (error) {
    console.error("Error al calificar:", error);
    alert("Hubo un error al enviar tu examen. No cierres la ventana y avisa a tu profesor.");
  }
});