require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
//const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ========== CONEXIÓN A MONGOOSE ==========
async function conectarDB() {
  try {
    const uri = process.env.MONGODB_URI;
    //const uri = "mongodb://Jasmin:Jasmin2026@ac-zjcfqjo-shard-00-00.0cu5jr8.mongodb.net:27017,ac-zjcfqjo-shard-00-01.0cu5jr8.mongodb.net:27017,ac-zjcfqjo-shard-00-02.0cu5jr8.mongodb.net:27017/?ssl=true&replicaSet=atlas-9lx936-shard-0&authSource=admin&appName=Cluster0";

    await mongoose.connect(uri);
    console.log("¡Conexión exitosa a la base de datos de Dinosaurios! 🦖");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1);
  }
}
conectarDB();

// ========== MODELO ==========
const dinosaurioSchema = new mongoose.Schema({
  especie: { type: String, required: true },
  familia: { type: String, required: true },
  locomocion: { type: String, default: 'Desconocida' },
  caracteristicas: { type: String, default: '' },
  audio: { type: String, default: '' }
}, { timestamps: true });

const Dinosaurio = mongoose.model('Dinosaurio', dinosaurioSchema);

// ========== ENDPOINTS (USANDO MONGOOSE) ==========

// GET - Obtener todos desde la DB
app.get('/api/dinosaurios', async (req, res) => {
  try {
    const listaDinos = await Dinosaurio.find();
    res.json(listaDinos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener datos" });
  }
});

// POST - Crear en la DB
app.post('/api/dinosaurios', async (req, res) => {
  try {
    const nuevoDino = new Dinosaurio(req.body);
    const guardado = await nuevoDino.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: "Error al guardar" });
  }
});

// GET - Por ID (Mongoose usa _id)
app.get('/api/dinosaurios/:id', async (req, res) => {
  try {
    const dino = await Dinosaurio.findById(req.params.id);
    if (!dino) return res.status(404).json({ error: 'No encontrado' });
    res.json(dino);
  } catch (err) {
    res.status(400).json({ error: "ID inválido" });
  }
});

// PUT - Actualizar un dinosaurio existente en la DB
app.put('/api/dinosaurios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const datosActualizados = req.body;

    // { new: true } hace que Mongoose devuelva el documento ya modificado
    // runValidators asegura que se respeten las reglas del Schema al editar
    const dinoActualizado = await Dinosaurio.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true, runValidators: true }
    );

    if (!dinoActualizado) {
      return res.status(404).json({ error: 'Dinosaurio no encontrado en la base de datos' });
    }

    res.json(dinoActualizado);
  } catch (error) {
    console.error("Error al actualizar:", error);
    res.status(400).json({ error: "Error al actualizar el registro. Verifica el ID o los datos." });
  }
});

// DELETE - Eliminar de la DB
app.delete('/api/dinosaurios/:id', async (req, res) => {
  try {
    const eliminado = await Dinosaurio.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'No encontrado' });
    res.json({ mensaje: 'Registro eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ error: "Error al eliminar" });
  }
});

// ========== MODELO PARA LIKES ==========
const likeSchema = new mongoose.Schema({
  conteo: { type: Number, default: 0 }
});
const Like = mongoose.model('Like', likeSchema);

// ========== ENDPOINTS DE LIKES ==========

// Obtener el total de likes
app.get('/api/likes', async (req, res) => {
  try {
    let registroLikes = await Like.findOne();
    if (!registroLikes) {
      registroLikes = await Like.create({ conteo: 0 });
    }
    res.json({ conteo: registroLikes.conteo });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener likes" });
  }
});

// Incrementar likes (POST)
app.post('/api/likes/incrementar', async (req, res) => {
  try {
    const registro = await Like.findOneAndUpdate({}, { $inc: { conteo: 1 } }, { new: true, upsert: true });
    res.json({ conteo: registro.conteo });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar likes" });
  }
});

// --- ESTO VA EN EL BACKEND (ej. api.js o server.js) ---

// MODELO PARA REPORTES
const reporteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true },
  obs: { type: String, default: '' }
}, { timestamps: true });

const Reporte = mongoose.model('Reporte', reporteSchema);

// ENDPOINT PARA RECIBIR EL FORMULARIO
app.post('/api/reportes', async (req, res) => {
  try {
    const nuevoReporte = new Reporte(req.body);
    const guardado = await nuevoReporte.save();
    res.status(201).json({ mensaje: "Reporte guardado con éxito", data: guardado });
  } catch (err) {
    res.status(400).json({ error: "No se pudo guardar el reporte" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Endpoints disponibles:');
  console.log('  GET    /api/dinosaurios');
  console.log('  POST   /api/reportes');
  console.log('  POST   /api/dinosaurios');
  console.log('  PUT    /api/dinosaurios/:id');
  console.log('  DELETE /api/dinosaurios/:id');
});