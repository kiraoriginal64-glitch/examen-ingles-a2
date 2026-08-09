import { supabase } from './supabase.js';

// Hacemos la función global para que el botón HTML pueda llamarla
window.cargarResultados = async function() {
  const tabla = document.getElementById('tabla-resultados');
  const filtroCarrera = document.getElementById('filtro-carrera').value;
  const filtroGrupo = document.getElementById('filtro-grupo').value.trim().toLowerCase();

  // Cambiamos a colspan 7 por la nueva columna
  tabla.innerHTML = '<tr><td colspan="7" style="text-align: center;">Cargando resultados...</td></tr>';

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
      tabla.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay resultados para mostrar.</td></tr>';
      return;
    }

    // === CONFIGURACIÓN DE CALIFICACIÓN ===
    // Cambia este número por tu calificación mínima real para pasar
    const minimoAprobatorio = 60; 

    // Inyectamos los resultados en la tabla HTML
    resultados.forEach(alumno => {
      
      // === LÓGICA DE APROBADO / REPROBADO ===
      let estatusAprobacion = '';
      
      // Si aún no tiene calificación (está haciendo el examen)
      if (alumno.score === null) {
         estatusAprobacion = '<span style="color: gray;">Pendiente</span>';
      } 
      // Si su puntaje es mayor o igual al mínimo
      else if (alumno.score >= minimoAprobatorio) {
         estatusAprobacion = '<span style="color: #10B981; font-weight: bold;">Aprobado ✅</span>';
      } 
      // Si es menor
      else {
         estatusAprobacion = '<span style="color: #EF4444; font-weight: bold;">Reprobado ❌</span>';
      }

      const fila = `
        <tr>
          <td><strong>${alumno.matricula}</strong></td>
          <td>${alumno.nombre}</td>
          <td>${alumno.carrera}</td>
          <td>${alumno.grado} - ${alumno.grupo.toUpperCase()}</td>
          <td><strong>${alumno.score !== null ? alumno.score : '-'}</strong></td>
          <td>${alumno.status === 'completed' ? '✅ Finalizado' : '⏳ En progreso'}</td>
          <!-- INYECTAMOS LA NUEVA COLUMNA AQUÍ -->
          <td>${estatusAprobacion}</td>
        </tr>
      `;
      tabla.innerHTML += fila;
    });

  } catch (error) {
    console.error("Error al cargar datos:", error);
    tabla.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error al conectar con la base de datos.</td></tr>';
  }
}

// Cargar los datos automáticamente al abrir la página
document.addEventListener('DOMContentLoaded', cargarResultados);
