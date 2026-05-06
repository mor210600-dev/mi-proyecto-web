/* ==========================================================================
   CONFIGURACIÓN GLOBAL Y ESTADO
   ========================================================================== */
const API_URL = 'http://localhost:3000/api/dinosaurios';
const LIKES_API_URL = 'http://localhost:3000/api/likes';
const EXTINCIONES_API_URL = 'http://localhost:3000/api/extinciones'; // Nueva constante para orden

let dinosaurios = [];
let modoEdicion = false;
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("🦖 Sistemas listos: MongoDB, Galería y Navegación cargados.");

    inicializarTema();
    inicializarLikes();
    inicializarCRUD();
    inicializarComponentesVisuales();
    configurarEnlacesExternos();

    // Inicializar funciones específicas de formulario.html
    inicializarReportes();
    inicializarListadoExtincion(); // Corregido: punto y coma añadido
    inicializarQuiz();
});

/* ==========================================================================
   1. REPORTES, LISTA Y QUIZ (formulario.html)
   ========================================================================== */

function inicializarReportes() {
    const formReporte = document.getElementById('miFormulario');
    const mensajeExito = document.getElementById('mensaje-exito');

    if (formReporte) {
        formReporte.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                nombre: document.getElementById('nombre').value,
                correo: document.getElementById('correo').value,
                obs: document.getElementById('obs').value
            };

            try {
                const response = await fetch('http://localhost:3000/api/reportes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    mensajeExito.textContent = "¡Reporte guardado con éxito! 🦖";
                    mensajeExito.style.color = "green";
                    formReporte.reset();
                } else {
                    throw new Error("Error al guardar el reporte");
                }
            } catch (error) {
                mensajeExito.textContent = "Error de conexión con el servidor.";
                mensajeExito.style.color = "red";
                console.error(error);
            }
        });
    }
}

async function inicializarListadoExtincion() {
    const btnAgregar = document.getElementById('btnAgregar');
    const inputEspecie = document.getElementById('inputEspecie');
    const listaUl = document.getElementById('listaEspecies');

    if (btnAgregar) {
        btnAgregar.onclick = async () => {
            const causa = inputEspecie.value.trim();
            if (!causa) return;

            try {
                // Enviar a la base de datos
                const response = await fetch('http://localhost:3000/api/extinciones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ causa: causa })
                });

                if (response.ok) {
                    // Si el servidor responde bien, lo agregamos a la vista
                    const nuevoItem = document.createElement('li');
                    nuevoItem.textContent = causa;
                    listaUl.appendChild(nuevoItem);
                    inputEspecie.value = "";
                }
            } catch (error) {
                console.error("Error al guardar en la DB:", error);
            }
        };
    }
}
function inicializarQuiz() {
    const btnGuardar = document.getElementById('btnGuardarQuiz');
    const contadorLabel = document.getElementById('contador');
    const checks = document.querySelectorAll('.quiz-check');

    // --- Lógica para el Conteo en Tiempo Real ---
    if (checks.length > 0 && contadorLabel) {
        checks.forEach(input => {
            input.addEventListener('change', () => {
                // Cuenta cuántos grupos (p1, p2, p3) tienen al menos una opción seleccionada
                const respondidas = document.querySelectorAll('input[type="radio"]:checked').length;
                contadorLabel.textContent = respondidas;
            });
        });
    }

    // --- Lógica para Guardar en la Base de Datos ---
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            const p1 = document.querySelector('input[name="p1"]:checked')?.value;
            const p2 = document.querySelector('input[name="p2"]:checked')?.value;
            const p3 = document.querySelector('input[name="p3"]:checked')?.value;

            if (!p1 || !p2 || !p3) {
                alert("Por favor, responde todas las preguntas antes de guardar.");
                return;
            }

            // Estructura de datos según el esquema del backend
            const datosQuiz = { p1, p2, p3 };

            try {
                const response = await fetch('http://localhost:3000/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosQuiz)
                });

                if (response.ok) {
                    alert("¡Tus respuestas han sido guardadas permanentemente! 🦖");
                    // Opcional: resetear contador y radios
                } else {
                    const errorData = await response.json();
                    console.error("Error del servidor:", errorData);
                    throw new Error("Error al guardar");
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                alert("No se pudo conectar con el servidor.");
            }
        });
    }
}

/* ==========================================================================
   2. UTILIDADES Y NAVEGACIÓN
   ========================================================================== */

function configurarEnlacesExternos() {
    const enlaces = document.querySelectorAll('a');
    enlaces.forEach(enlace => {
        if (enlace.hostname !== window.location.hostname && enlace.href.includes('http')) {
            enlace.addEventListener('click', (e) => {
                const destino = enlace.getAttribute('href');
                if (!confirm(`¿Estás seguro de que deseas abandonar la Expedición Paleontológica para ir a: ${destino}?`)) {
                    e.preventDefault();
                }
            });
        }
    });
}

function inicializarTema() {
    const toggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }
}

/* ==========================================================================
   3. LIKES Y CRUD (CONEXIÓN API)
   ========================================================================== */

async function inicializarLikes() {
    const btnLike = document.getElementById('btn-like');
    const contadorLikesLabel = document.getElementById('contador-likes');

    try {
        const res = await fetch(LIKES_API_URL);
        if (res.ok) {
            const data = await res.json();
            if (contadorLikesLabel) contadorLikesLabel.textContent = data.conteo;
        }
    } catch (error) { console.error("Error likes:", error); }

    if (btnLike) {
        btnLike.onclick = async () => {
            try {
                const res = await fetch(`${LIKES_API_URL}/incrementar`, { method: 'POST' });
                const data = await res.json();
                if (contadorLikesLabel) contadorLikesLabel.textContent = data.conteo;
            } catch (error) { console.error(error); }
        };
    }
}

function inicializarCRUD() {
    const formulario = document.getElementById('dinoForm');
    const cuerpoTabla = document.getElementById('cuerpoTabla');

    if (cuerpoTabla) window.obtenerDinosaurios();

    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dinoData = {
                especie: document.getElementById('especie').value.trim(),
                familia: document.getElementById('familia').value.trim(),
                locomocion: document.getElementById('locomocion').value,
                caracteristicas: document.getElementById('caracteristicas').value.trim(),
                audio: document.getElementById('audioUrl').value.trim()
            };

            try {
                let url = API_URL + (modoEdicion ? `/${editandoId}` : '');
                const res = await fetch(url, {
                    method: modoEdicion ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dinoData)
                });

                if (res.ok) {
                    alert(modoEdicion ? 'Actualizado' : 'Registrado');
                    window.cancelarEdicion();
                    window.obtenerDinosaurios();
                }
            } catch (err) { alert("Error al sincronizar con MongoDB."); }
        });
    }
}

window.obtenerDinosaurios = async () => {
    try {
        const respuesta = await fetch(API_URL);
        dinosaurios = await respuesta.json();
        renderizarTabla();
    } catch (error) { console.error(error); }
};

function renderizarTabla() {
    const tabla = document.getElementById('cuerpoTabla');
    if (!tabla) return;

    tabla.innerHTML = dinosaurios.map(d => `
        <tr>
            <td>${d.especie}</td>
            <td>${d.familia}</td>
            <td>${d.locomocion}</td>
            <td>${d.caracteristicas}</td>
            <!-- Nueva celda para Sonido -->
            <td>
                ${d.audio ? `<a href="${d.audio}" target="_blank">🔊 Escuchar</a>` : 'No disponible'}
            </td>
            <!-- Nueva celda para Acciones -->
            <td>
                <button onclick="prepararEdicion('${d._id}')">✏️</button>
                <button onclick="eliminarDinosaurio('${d._id}', '${d.especie}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

window.prepararEdicion = (id) => {
    const dino = dinosaurios.find(d => d._id === id);
    if (!dino) return;

    modoEdicion = true;
    editandoId = id;

    // Verificar existencia antes de asignar (Seguridad)
    const campos = ['especie', 'familia', 'locomocion', 'caracteristicas', 'audioUrl'];
    campos.forEach(campo => {
        const el = document.getElementById(campo);
        if (el) el.value = dino[campo === 'audioUrl' ? 'audio' : campo] || '';
    });

    const titulo = document.getElementById('formTitulo');
    if (titulo) titulo.textContent = 'Editando Fósil';

    // Scroll suave al formulario
    document.getElementById('dinoForm')?.scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicion = () => {
    modoEdicion = false;
    editandoId = null;
    const form = document.getElementById('dinoForm');
    if (form) form.reset();

    const titulo = document.getElementById('formTitulo');
    if (titulo) titulo.textContent = 'Nuevo Registro de Fósil';
};

window.eliminarDinosaurio = async (id, nombre) => {
    if (!confirm(`¿Seguro que deseas eliminar el registro de: ${nombre}?`)) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) window.obtenerDinosaurios();
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
};

/* ==========================================================================
   4. COMPONENTES VISUALES
   ========================================================================== */

function inicializarComponentesVisuales() {
    // Botón Volver Arriba
    const btnUp = document.getElementById("btn-ir-arriba");
    if (btnUp) {
        window.addEventListener('scroll', () => {
            btnUp.style.display = (window.scrollY > 300) ? "block" : "none";
        });
        btnUp.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Galería de Imágenes
    const principal = document.getElementById('imagen-principal');
    const miniaturas = document.querySelectorAll('.miniatura');
    if (principal && miniaturas.length > 0) {
        miniaturas.forEach(min => {
            min.onclick = function () {
                principal.src = this.src;
                principal.alt = this.alt;
                miniaturas.forEach(m => m.classList.remove('activa'));
                this.classList.add('activa');
            };
        });
    }

    // Carrusel
    const slides = document.getElementById('carruselSlides');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    if (slides && btnPrev && btnNext) {
        let index = 0;
        const items = document.querySelectorAll('.carrusel-item');
        const totalSlides = items.length;

        const mover = (step) => {
            index = (index + step + totalSlides) % totalSlides;
            slides.style.transform = `translateX(${-index * 100}%)`;
        };

        btnNext.onclick = () => mover(1);
        btnPrev.onclick = () => mover(-1);
    }
}
