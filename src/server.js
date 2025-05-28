const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db'); // Asegúrate de que la ruta sea correcta
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS
app.use(cors());

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint para obtener los servicios
app.get('/api/servicios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM servicios');
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener los servicios:', err);
    res.status(500).send('Error al obtener los servicios');
  }
});

// Verificación de conexión (opcional)
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a la base de datos.');
    connection.release();
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err);
  }
})();

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
