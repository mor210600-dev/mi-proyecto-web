require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ========== CONEXIÓN A MONGOOSE ==========
async function conectarDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("La URI de MongoDB no está definida en .env");

    await mongoose.connect(uri);
    console.log("¡Conexión exitosa a la base de datos! 🦖");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error.message);
    process.exit(1);
  }
}
conectarDB();

// ========== MODELOS ==========

// Dinosaurios
const dinosaurioSchema = new mongoose.Schema({
  especie: { type: String, required: true },
  familia: { type: String, required: true },
  locomocion: { type: String, default: 'Desconocida' },
  caracteristicas: { type: String, default: '' },
  audio: { type: String, default: '' }
}, { timestamps: true });
const Dinosaurio = mongoose.model('Dinosaurio', dinosaurioSchema);

// Likes
const Like = mongoose.model('Like', new mongoose.Schema({
  conteo: { type: Number, default: 0 }
}));

// Reportes
const Reporte = mongoose.model('Reporte', new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true },
  obs: { type: String, default: '' }
}, { timestamps: true }));

// Quiz
const Quiz = mongoose.model('Quiz', new mongoose.Schema({
  respuestas: { p1: String, p2: String, p3: String },
  fecha: { type: Date, default: Date.now }
}));

// Extinciones
const Extincion = mongoose.model('Extincion', new mongoose.Schema({
  causa: { type: String, required: true }
}));

// ========== ENDPOINTS ==========

// --- DINOSAURIOS ---
app.get('/api/dinosaurios', async (req, res) => {
  try {
    const listaDinos = await Dinosaurio.find();
    res.json(listaDinos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener datos" });
  }
});

app.post('/api/dinosaurios', async (req, res) => {
  try {
    const nuevoDino = new Dinosaurio(req.body);
    const guardado = await nuevoDino.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: "Error al guardar dinosaurio" });
  }
});

app.put('/api/dinosaurios/:id', async (req, res) => {
  try {
    const dinoActualizado = await Dinosaurio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!dinoActualizado) return res.status(404).json({ error: 'No encontrado' });
    res.json(dinoActualizado);
  } catch (err) {
    res.status(400).json({ error: "Error al actualizar" });
  }
});

app.delete('/api/dinosaurios/:id', async (req, res) => {
  try {
    const eliminado = await Dinosaurio.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'No encontrado' });
    res.json({ mensaje: 'Registro eliminado' });
  } catch (err) {
    res.status(400).json({ error: "Error al eliminar" });
  }
});

// --- LIKES ---
app.get('/api/likes', async (req, res) => {
  try {
    let registro = await Like.findOne() || await Like.create({ conteo: 0 });
    res.json({ conteo: registro.conteo });
  } catch (err) {
    res.status(500).json({ error: "Error en likes" });
  }
});

app.post('/api/likes/incrementar', async (req, res) => {
  try {
    const registro = await Like.findOneAndUpdate({}, { $inc: { conteo: 1 } }, { new: true, upsert: true });
    res.json({ conteo: registro.conteo });
  } catch (err) {
    res.status(500).json({ error: "Error al incrementar" });
  }
});

// --- REPORTES ---
app.post('/api/reportes', async (req, res) => {
  try {
    const nuevoReporte = await new Reporte(req.body).save();
    res.status(201).json({ mensaje: "Reporte guardado", data: nuevoReporte });
  } catch (err) {
    res.status(400).json({ error: "Error en reporte" });
  }
});

// --- QUIZ ---
app.post('/api/quiz', async (req, res) => {
  try {
    const nuevoQuiz = new Quiz({ respuestas: req.body });
    await nuevoQuiz.save();
    res.status(201).json({ mensaje: "Quiz guardado" });
  } catch (err) {
    res.status(400).json({ error: "Error en quiz" });
  }
});

// --- EXTINCIONES ---
app.get('/api/extinciones', async (req, res) => {
  try {
    const lista = await Extincion.find();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener extinciones" });
  }
});

app.post('/api/extinciones', async (req, res) => {
  try {
    const nuevaExtincion = await new Extincion(req.body).save();
    res.status(201).json(nuevaExtincion);
  } catch (err) {
    res.status(400).json({ error: "Error al guardar extinción" });
  }
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});