import { supabase } from './supabase.js'; // Importamos la conexión

document.getElementById('registro-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // Evita que la página se recargue

  const errorMsg = document.getElementById('error-msg');
  errorMsg.style.display = 'none';

  // Obtenemos los valores que ingresó el estudiante
  const nombre = document.getElementById('nombre').value;
  const matricula = document.getElementById('matricula').value;
  const carrera = document.getElementById('carrera').value;
  const grado = document.getElementById('grado').value;
  const grupo = document.getElementById('grupo').value;

  try {
    // Insertamos los datos en la tabla 'exam_attempts'
    const { data, error } = await supabase
      .from('exam_attempts')
      .insert([
        { 
          nombre: nombre, 
          matricula: matricula, 
          carrera: carrera, 
          grado: grado, 
          grupo: grupo 
        }
      ])
      .select();

    if (error) throw error;

    
    // Si es exitoso, guardamos el ID del intento para que no se pierda si recarga
    const attemptId = data[0].id;
    sessionStorage.setItem('exam_attempt_id', attemptId);
    
    // Redirigir automáticamente a la pantalla del examen
    window.location.href = '/examen.html';

 } catch (error) {
    // ESTO ES LO NUEVO: Nos imprimirá el error completo en la consola
    console.error('ERROR COMPLETO DE SUPABASE:', error);
    
    if (error.code === '23505') { 
        errorMsg.textContent = 'Esta matrícula ya ha registrado un intento de examen.';
    } else {
        errorMsg.textContent = `Error: ${error.message || 'Error desconocido'}`;
    }
    errorMsg.style.display = 'block';
  }
});