import { supabase } from './supabase.js';

window.cargarResultados = async function() {
  // 1. Buscamos específicamente el "cuerpo" de la tabla, para no borrar tus encabezados azules
  const tablaBody = document.getElementById('tabla-body');
  
  if (!tablaBody) {
      console.error("No se encontró el espacio para la tabla.");
      return;
  }

  // 2. Leemos los filtros con "paracaídas" (si no existen, no pasa nada)
  const selectCarrera = document.getElementById('filtro-carrera');
  const filtroCarrera = selectCarrera ? selectCarrera.value : '';

  const inputGrupo = document.getElementById('filtro-grupo');
  const filtroGrupo = inputGrupo ? inputGrupo.value.trim().toLowerCase() : '';

  // 3. Mostramos mensaje de carga
  tablaBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Cargando resultados...</td></tr>';

  try {
    let query = supabase
      .from('exam_attempts')
      .select('*')
      .order('score', { ascending: false });

    if (filtroCarrera) {
      query = query.eq('carrera', filtroCarrera);
    }
    if (filtroGrupo) {
      query = query.ilike('grupo', `%${filtroGrupo}%`);
    }

    const { data: resultados, error } = await query;

    if (error) throw error;

    tablaBody.innerHTML = ''; // Limpiamos el mensaje de carga

    if (resultados.length === 0) {
      tablaBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay resultados para mostrar.</td></tr>';
      return;
    }

    // Cambia este número por tu calificación mínima
    const minimoAprobatorio = 60;

    resultados.forEach(alumno => {
      let estatusAprobacion = '';
      if (alumno.score === null) {
         estatusAprobacion = '<span style="color: gray;">Pendiente</span>';
      } else if (alumno.score >= minimoAprobatorio) {
         estatusAprobacion = '<span style="color: #10B981; font-weight: bold;">Aprobado ✅</span>';
      } else {
         estatusAprobacion = '<span style="color: #EF4444; font-weight: bold;">Reprobado ❌</span>';
      }

      const fila = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${alumno.matricula || '-'}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alumno.nombre || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alumno.carrera || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alumno.grado || '-'} - ${alumno.grupo ? alumno.grupo.toUpperCase() : '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${alumno.score !== null ? alumno.score : '-'}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alumno.status === 'completed' ? '✅ Finalizado' : '⏳ En progreso'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${estatusAprobacion}</td>
        </tr>
      `;
      tablaBody.innerHTML += fila;
    });

  } catch (error) {
    console.error("Error al cargar datos:", error);
    // Si hay un error, ahora lo imprimirá en la pantalla para que sepamos qué es
    tablaBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red; padding: 20px;">Error de conexión: ${error.message}</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', cargarResultados);
