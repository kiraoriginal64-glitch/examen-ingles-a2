import { supabase } from './supabase.js'; // Importamos la conexión

document.getElementById('registro-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  // 1. RECOLECTAR LOS DATOS (Esta es la línea que faltaba)
  const formData = new FormData(event.target);
  const formDataObj = Object.fromEntries(formData.entries());
  formDataObj.status = 'in_progress'; // Inicializamos su estado

  try {
    // 2. Verificar si la matrícula ya existe
    const { data: existingAttempt, error: checkError } = await supabase
      .from('exam_attempts')
      .select('id, status')
      .eq('matricula', formDataObj.matricula)
      .single();

    let attemptId;

    if (existingAttempt) {
      if (existingAttempt.status === 'completed') {
        throw new Error('Esta matrícula ya finalizó su examen.');
      }
      // Si existe y no está completado, recuperamos ese ID
      attemptId = existingAttempt.id;
    } else {
      // Si no existe, creamos uno nuevo
      const { data, error } = await supabase
        .from('exam_attempts')
        .insert([formDataObj])
        .select();
      
      if (error) throw error;
      attemptId = data[0].id;
    }

    sessionStorage.setItem('exam_attempt_id', attemptId);
    window.location.href = '/examen.html';

  } catch (error) {
    // Esto mostrará el error en rojo debajo del botón
    const errorMsg = document.getElementById('error-msg') || document.querySelector('.error-message');
    if (errorMsg) {
        errorMsg.textContent = 'Error: ' + error.message;
        errorMsg.style.display = 'block';
        errorMsg.style.color = 'red';
    } else {
        alert('Error: ' + error.message);
    }
  }
});
