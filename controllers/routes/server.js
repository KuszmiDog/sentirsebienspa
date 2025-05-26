const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // para servir los HTML estáticos

// Ruta de prueba
app.get('/api/saludo', (req, res) => {
  res.json({ mensaje: 'Bienvenido a Sentirse Bien API 🧖‍♀️' });
});

// Escuchar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
