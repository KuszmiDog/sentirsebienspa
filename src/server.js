const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('../src/db'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

//API para ver los servicios
app.get('/api/servicios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM servicios');
    res.json(rows);
  } catch (err) {
    console.error('Error al consultar servicios:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// Ruta para insertar un turno en la base de datos
app.post('/api/turnos', async (req, res) => {
  try {
    const { servicio_id, fecha_inicio, fecha_finalizacion, email, estado } = req.body;

    // Validar que todos los campos estén presentes
    if (!servicio_id || !fecha_inicio || !fecha_finalizacion || !email || !estado) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar que el email exista en la tabla clientes
    const emailQuery = 'SELECT id FROM clientes WHERE email = ?';
    const [emailResult] = await pool.query(emailQuery, [email]);

    if (emailResult.length === 0) {
      return res.status(404).json({ error: 'El email proporcionado no existe en la base de datos' });
    }

    const cliente_id = emailResult[0].id;

    // Insertar el turno en la base de datos
    const query = `
      INSERT INTO turno (cliente_id, servicio_id, fecha_inicio, fecha_finalizacion, estado)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [cliente_id, servicio_id, fecha_inicio, fecha_finalizacion, estado];

    const [result] = await pool.query(query, values);
    res.status(201).json({ message: 'Turno creado exitosamente', turnoId: result.insertId });
  } catch (err) {
    console.error('Error al insertar turno:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
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
