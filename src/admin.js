import { supabase } from './supabase.js';

// --- NUEVO: Variables globales para controlar la paginación ---
let paginaActual = 0;
const resultadosPorPagina = 50; // Límite de alumnos por pantalla (puedes cambiarlo)

window.cargarResultados = async function() {
  // 1. Buscamos específicamente el "cuerpo" de la tabla
  const tablaBody = document.getElementById('tabla-body');
  
  if (!tablaBody) {
      console.error("No se encontró el espacio para la tabla.");
      return;
  }

  // 2. Leemos los filtros con "paracaídas"
  const selectCarrera = document.getElementById('filtro-carrera');
  const filtroCarrera = selectCarrera ? selectCarrera.value : '';

  const inputGrupo = document.getElementById('filtro-grupo');
  const filtroGrupo = inputGrupo ? inputGrupo.value.trim().toLowerCase() : '';

  // --- NUEVO: Calcular qué bloque de datos pedir a Supabase ---
  const desde = paginaActual * resultadosPorPagina;
  const hasta = desde + resultadosPorPagina - 1;

  // 3. Mostramos mensaje de carga
  tablaBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Cargando resultados...</td></tr>';

  try {
    // --- NUEVO: Añadimos { count: 'exact' } y el .range() para la paginación ---
    let query = supabase
      .from('exam_attempts')
      .select('*', { count: 'exact' })
      .order('score', { ascending: false })
      .range(desde, hasta); 

    if (filtroCarrera) {
      query = query.eq('carrera', filtroCarrera);
    }
    if (filtroGrupo) {
      query = query.ilike('grupo', `%${filtroGrupo}%`);
    }

    // Extraemos la data, posibles errores y el 'count' total de alumnos en el filtro
    const { data: resultados, error, count } = await query;

    if (error) throw error;

    tablaBody.innerHTML = ''; // Limpiamos el mensaje de carga

    if (resultados.length === 0) {
      tablaBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay resultados para mostrar.</td></tr>';
      actualizarBotones(0); // Apaga botones si no hay resultados
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

    // --- NUEVO: Actualizamos los botones de paginación ---
    actualizarBotones(count);

  } catch (error) {
    console.error("Error al cargar datos:", error);
    tablaBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red; padding: 20px;">Error de conexión: ${error.message}</td></tr>`;
  }
}

// --- NUEVO: Función para cambiar de página ---
window.cambiarPagina = function(direccion) {
    paginaActual += direccion;
    cargarResultados();
}

// --- NUEVO: Función para resetear página al usar los filtros ---
window.aplicarFiltros = function() {
    paginaActual = 0; // Regresa a la página 1 al buscar una nueva carrera o grupo
    cargarResultados();
}

// --- NUEVO: Función visual para prender/apagar botones ---
function actualizarBotones(totalResultados) {
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const indicadorPagina = document.getElementById('indicador-pagina');
    
    // Si no pusiste el código HTML de los botones todavía, evitamos que marque error
    if (!btnAnterior || !btnSiguiente || !indicadorPagina) return;

    const maxPaginas = Math.ceil(totalResultados / resultadosPorPagina);
    
    // Apagar o encender botones
    btnAnterior.disabled = paginaActual === 0;
    btnSiguiente.disabled = paginaActual >= (maxPaginas - 1) || maxPaginas === 0;
    
    // Cambiar texto de la página
    if (maxPaginas > 0) {
        indicadorPagina.innerText = `Página ${paginaActual + 1} de ${maxPaginas}`;
    } else {
        indicadorPagina.innerText = `Sin resultados`;
    }
}

// Inicialización cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    cargarResultados();

    // Aseguramos que los filtros reinicien a la página 1 cuando el usuario los usa
    const selectCarrera = document.getElementById('filtro-carrera');
    if (selectCarrera) selectCarrera.addEventListener('change', window.aplicarFiltros);
    
    const inputGrupo = document.getElementById('filtro-grupo');
    if (inputGrupo) inputGrupo.addEventListener('input', window.aplicarFiltros);
});
