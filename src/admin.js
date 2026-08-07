import { supabase } from './supabase.js';

// Hacemos la función global para que el botón HTML pueda llamarla
window.cargarResultados = async function() {
  const tabla = document.getElementById('tabla-resultados');
  const filtroCarrera = document.getElementById('filtro-carrera').value;
  const filtroGrupo = document.getElementById('filtro-grupo').value.trim().toLowerCase();

  tabla.innerHTML = '<tr><td colspan="6" style="text-align: center;">Cargando resultados...</td></tr>';

  try {
    // Iniciamos la consulta a Supabase
    let query = supabase
      .from('exam_attempts')
      .select('*')
      .order('score', { ascending: false }); // Ordenados por mejor calificación

    // Aplicamos los filtros si el usuario seleccionó alguno
    if (filtroCarrera) {
      query = query.eq('carrera', filtroCarrera);
    }
    if (filtroGrupo) {
      query = query.ilike('grupo', `%${filtroGrupo}%`);
    }

    const { data: resultados, error } = await query;

    if (error) throw error;

    tabla.innerHTML = ''; // Limpiamos

    if (resultados.length === 0) {
      tabla.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay resultados para mostrar.</td></tr>';
      return;
    }

    // Inyectamos los resultados en la tabla HTML
    resultados.forEach(alumno => {
      const fila = `
        <tr>
          <td><strong>${alumno.matricula}</strong></td>
          <td>${alumno.nombre}</td>
          <td>${alumno.carrera}</td>
          <td>${alumno.grado} - ${alumno.grupo.toUpperCase()}</td>
          <td><strong>${alumno.score !== null ? alumno.score : '-'}</strong></td>
          <td>${alumno.status === 'completed' ? '✅ Finalizado' : '⏳ En progreso'}</td>
        </tr>
      `;
      tabla.innerHTML += fila;
    });

  } catch (error) {
    console.error("Error al cargar datos:", error);
    tabla.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error al conectar con la base de datos.</td></tr>';
  }
}

// Cargar los datos automáticamente al abrir la página
document.addEventListener('DOMContentLoaded', cargarResultados);