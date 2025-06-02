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
    const { servicio_id, fecha_inicio, fecha_finalizacion, email, estado, profesional_id } = req.body;

    // Validar que todos los campos estén presentes
    if (!servicio_id || !fecha_inicio || !fecha_finalizacion || !email || !estado || !profesional_id) {
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
      INSERT INTO turno (cliente_id, servicio_id, profesional_id, fecha_inicio, fecha_finalizacion, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [cliente_id, servicio_id, profesional_id, fecha_inicio, fecha_finalizacion, estado];

    const [result] = await pool.query(query, values);
    res.status(201).json({ message: 'Turno creado exitosamente', turnoId: result.insertId });
  } catch (err) {
    console.error('Error al insertar turno:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

app.get('/api/profesionales', async (req, res) => {
  try {
      const [rows] = await pool.query('SELECT id, nombre FROM Profesional');
      res.json(rows);
  } catch (err) {
      console.error('Error al consultar profesionales:', err);
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




//creacion de cuenta de usuario (usando solo nombre, email y telefono)
app.post('/api/crear-cuenta', async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;
    if (!nombre || !email || !telefono) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    // Verificar si el email o el teléfono ya existen
    const [existe] = await pool.query(
      'SELECT id FROM clientes WHERE email = ? OR telefono = ?',
      [email, telefono]
    );
    if (existe.length > 0) {
      return res.status(400).json({ success: false, message: 'El email o el teléfono ya están registrados.' });
    }

    // Insertar el nuevo cliente
    await pool.query(
      'INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)',
      [nombre, email, telefono]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error al crear cuenta:', err);
    res.status(500).json({ success: false, message: 'Error en la base de datos.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que el email y la contraseña estén presentes
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios.' });
    }

    // Verificar si el profesional existe
    const [profesional] = await pool.query('SELECT * FROM Profesional WHERE email = ?', [email]);
    if (profesional.length === 0) {
      return res.status(404).json({ success: false, message: 'Profesional no encontrado.' });
    }

    // Verificar la contraseña (esto es solo un ejemplo, no usar contraseñas en texto plano en producción)
    if (profesional[0].password !== password) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    // Obtener los turnos asociados al profesional, incluyendo servicio y cliente
    const [turnos] = await pool.query(
      `SELECT 
          t.id,
          t.fecha_inicio AS fecha,
          DATE_FORMAT(t.fecha_inicio, "%H:%i") AS hora,
          s.nombre AS servicio,
          c.nombre AS cliente
        FROM turno t
        JOIN servicios s ON t.servicio_id = s.id
        JOIN clientes c ON t.cliente_id = c.id
        WHERE t.profesional_id = ?`,
      [profesional[0].id]
    );

    res.json({ success: true, turnos });
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ success: false, message: 'Error en la base de datos.' });
  }
});
