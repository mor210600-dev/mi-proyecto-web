const serverless = require('serverless-http');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ========== GESTIÓN DE CONEXIÓN A MONGOOSE ==========
let isConnected = false;

async function conectarDB() {
  if (isConnected) return;

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("La URI de MongoDB no está definida en Netlify");

    const db = await mongoose.connect(uri);
    isConnected = db.connections[0].readyState;
    console.log("¡Conexión exitosa a la base de datos! 🦖");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error.message);
  }
}

// Middleware para asegurar conexión en cada petición
app.use(async (req, res, next) => {
  await conectarDB();
  next();
});

// ========== MODELOS ==========
const Dinosaurio = mongoose.model('Dinosaurio', new mongoose.Schema({
  especie: { type: String, required: true },
  familia: { type: String, required: true },
  locomocion: { type: String, default: 'Desconocida' },
  caracteristicas: { type: String, default: '' },
  audio: { type: String, default: '' }
}, { timestamps: true }));

const Like = mongoose.model('Like', new mongoose.Schema({
  conteo: { type: Number, default: 0 }
}));

const Reporte = mongoose.model('Reporte', new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true },
  obs: { type: String, default: '' }
}, { timestamps: true }));

const Quiz = mongoose.model('Quiz', new mongoose.Schema({
  respuestas: { p1: String, p2: String, p3: String },
  fecha: { type: Date, default: Date.now }
}));

const Extincion = mongoose.model('Extincion', new mongoose.Schema({
  causa: { type: String, required: true }
}));

// ========== ENDPOINTS ==========

// Dinosaurios
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
    const dinoActualizado = await Dinosaurio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(dinoActualizado);
  } catch (err) {
    res.status(400).json({ error: "Error al actualizar" });
  }
});

app.delete('/api/dinosaurios/:id', async (req, res) => {
  try {
    await Dinosaurio.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Registro eliminado' });
  } catch (err) {
    res.status(400).json({ error: "Error al eliminar" });
  }
});

// Likes
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

// Reportes, Quiz y Extinciones (Siguen la misma lógica)
app.post('/api/reportes', async (req, res) => {
  try {
    const nuevoReporte = await new Reporte(req.body).save();
    res.status(201).json(nuevoReporte);
  } catch (err) {
    res.status(400).json({ error: "Error en reporte" });
  }
});

// ========== EXPORTACIÓN PARA NETLIFY ==========
const handler = serverless(app);
module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return await handler(event, context);
};