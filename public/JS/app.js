// CONFIGURACIÓN DE URLS (Punto 3: Rutas Relativas para Netlify)
const API_URL = '/api/dinosaurios';
const LIKES_URL = '/api/likes';

// ELEMENTOS DEL DOM
const formulario = document.getElementById('dinoForm'); // ID según Registros.html
const cuerpoTabla = document.getElementById('cuerpoTabla'); // ID según Registros.html
const btnLike = document.getElementById('btn-like');
const contadorLikes = document.getElementById('contador-likes');
const themeToggle = document.getElementById('theme-toggle');

// --- 1. GESTIÓN DE DINOSAURIOS (CRUD) ---

// Obtener y mostrar dinosaurios
async function cargarDinosaurios() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Error al obtener datos del servidor');
        const dinos = await res.json();
        renderizarTabla(dinos);
    } catch (err) {
        console.error("Error en DinoCiencia:", err);
    }
}

// Guardar nuevo dinosaurio (POST)
if (formulario) {
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nuevoDino = {
            especie: document.getElementById('especie').value,
            familia: document.getElementById('familia').value,
            locomocion: document.getElementById('locomocion').value,
            caracteristicas: document.getElementById('caracteristicas').value,
            audio: document.getElementById('audioUrl').value // Campo extra de Registros.html[cite: 4]
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoDino)
            });

            if (res.ok) {
                alert('¡Fósil registrado con éxito! 🦖');
                formulario.reset();
                cargarDinosaurios();
            }
        } catch (err) {
            console.error("Error al guardar:", err);
        }
    });
}

// Eliminar dinosaurio (DELETE)
async function eliminarDino(id) {
    if (!confirm('¿Deseas eliminar este registro paleontológico?')) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) cargarDinosaurios();
    } catch (err) {
        console.error("Error al eliminar:", err);
    }
}

// Dibujar la tabla en Registros.html
function renderizarTabla(dinos) {
    if (!cuerpoTabla) return;
    cuerpoTabla.innerHTML = '';

    dinos.forEach(dino => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${dino.especie}</td>
            <td>${dino.familia}</td>
            <td>${dino.locomocion}</td>
            <td>${dino.caracteristicas}</td>
            <td>${dino.audio ? `<a href="${dino.audio}" target="_blank">🔊 Escuchar</a>` : 'N/A'}</td>
            <td>
                <button class="btn-eliminar" onclick="eliminarDino('${dino._id}')">Borrar</button>
            </td>
        `;
        cuerpoTabla.appendChild(fila);
    });
}

// --- 2. SISTEMA DE LIKES ---

async function gestionarLikes() {
    if (!btnLike) return;

    // Obtener conteo inicial
    try {
        const res = await fetch(LIKES_URL);
        const data = await res.json();
        if (contadorLikes) contadorLikes.innerText = data.conteo;
    } catch (err) { console.log("Error inicial de likes"); }

    // Evento Click
    btnLike.addEventListener('click', async () => {
        try {
            const res = await fetch(`${LIKES_URL}/incrementar`, { method: 'POST' });
            const data = await res.json();
            if (contadorLikes) contadorLikes.innerText = data.conteo;
        } catch (err) { console.error("No se pudo dar like"); }
    });
}

// --- 3. TEMA OSCURO / CLARO ---

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// --- 4. QUIZ PALEONTOLÓGICO (index.html) ---

const btnGuardarQuiz = document.getElementById('btnGuardarQuiz');
if (btnGuardarQuiz) {
    btnGuardarQuiz.addEventListener('click', () => {
        const respuestas = document.querySelectorAll('.quiz-check:checked');
        const contador = document.getElementById('contador');
        if (contador) contador.innerText = respuestas.length;
        alert(`Has respondido ${respuestas.length} preguntas de 3.`);
    });
}

// --- 5. INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    // Cargar datos según la página
    if (cuerpoTabla) cargarDinosaurios();
    gestionarLikes();

    // Botón "Ir arriba"[cite: 1, 2, 3, 4]
    const btnArriba = document.getElementById('btn-ir-arriba');
    if (btnArriba) {
        window.addEventListener('scroll', () => {
            btnArriba.style.display = window.scrollY > 300 ? 'block' : 'none';
        });
        btnArriba.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});