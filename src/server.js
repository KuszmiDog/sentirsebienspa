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

app.get('/api/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, nombre, precio FROM servicios WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al consultar servicio:', err);
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

//obtener los profesionales
app.get('/api/adminpanelinfo', async (req, res) => {
  try {
      const [rows] = await pool.query(`
        SELECT 
          t.id as ID_TURNO, 
          c.nombre as CLIENTE,
          s.nombre as SERVICIO, 
          p.nombre as PROFESIONAL_A_CARGO,
          t.fecha_inicio as HORARIO_INICIO, 
          t.fecha_finalizacion as HORARIO_FINALIZACION,
          t.estado as ESTADO
        FROM turno t 
        INNER JOIN clientes c ON t.cliente_id = c.id 
        INNER JOIN Profesional p ON t.profesional_id = p.id 
        INNER JOIN servicios s ON t.servicio_id = s.id
      `);
      res.json(rows);
  } catch (err) {
      console.error('ERROR AL CARGAR LOS DATOS DEL PANEL DE ADMINISTRADOR:', err);
      res.status(500).json({ error: 'Error en la base de datos' });
  }
});

//obtener los profesionales


//cambiar el estado de un turno especifico de "Pendiente" a "Confirmado"
app.put('/api/turnos/:id/confirmar', async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el turno existe
    const [turno] = await pool.query('SELECT * FROM turno WHERE id = ?', [id]);
    if (turno.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    // Actualizar el estado del turno a "Confirmado"
    await pool.query('UPDATE turno SET estado = "Confirmado" WHERE id = ?', [id]);

    res.json({ message: 'Turno confirmado exitosamente' });
  } catch (err) {
    console.error('Error al confirmar el turno:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});


//obtener los profesionales
app.get('/api/profesionales', async (req, res) => {
  try {
      const [rows] = await pool.query('SELECT id, nombre FROM Profesional');
      res.json(rows);
  } catch (err) {
      console.error('Error al consultar profesionales:', err);
      res.status(500).json({ error: 'Error en la base de datos' });
  }
});

app.delete('/api/eliminar-turno/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM turno WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Turno no encontrado.' });
    }
    res.json({ success: true, message: 'Turno eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar turno:', err);
    res.status(500).json({ success: false, message: 'Error en la base de datos.' });
  }
});

// Confirmar turno
app.post('/api/confirmar-turno/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID de turno requerido.' });
    }

    const [result] = await pool.query(
      'UPDATE turno SET estado = "Confirmado" WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Turno no encontrado.' });
    }

    res.json({ success: true, message: 'Turno confirmado correctamente.' });
  } catch (err) {
    console.error('Error al confirmar turno:', err);
    res.status(500).json({ success: false, message: 'Error en la base de datos.' });
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

// Agregar un nuevo servicio
app.post('/api/agregar-servicio', async (req, res) => {
  try {
    const { nombre, descripcion, tipo, precio } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !descripcion || !tipo || !precio) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    // Insertar el nuevo servicio
    await pool.query(
      'INSERT INTO servicios (nombre, descripcion, tipo, precio) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, tipo, precio]
    );

    res.json({ success: true, message: 'Servicio agregado correctamente.' });
  } catch (err) {
    console.error('Error al agregar servicio:', err);
    res.status(500).json({ success: false, message: 'Error en la base de datos.' });
  }
});

// Eliminar un servicio por ID
app.delete('/api/eliminar-servicio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Puedes agregar validaciones adicionales si lo deseas
    const [result] = await pool.query('DELETE FROM servicios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado.' });
    }
    res.json({ success: true, message: 'Servicio eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar servicio:', err);
    res.status(500).json({ success: false, message: 'Error en la base de datos.' });
  }
});

// Agregar un nuevo profesional
app.post('/api/agregar-profesional', async (req, res) => {
  try {
    const { nombre, email, telefono, fecha_registro, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !email || !telefono || !fecha_registro || !password) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    // Verificar si el email ya existe
    const [existe] = await pool.query('SELECT id FROM Profesional WHERE email = ?', [email]);
    if (existe.length > 0) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado.' });
    }

    // Insertar el nuevo profesional
    await pool.query(
      'INSERT INTO Profesional (nombre, email, telefono, fecha_registro, password) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, telefono, fecha_registro, password]
    );

    res.json({ success: true, message: 'Profesional agregado correctamente.' });
  } catch (err) {
    console.error('Error al agregar profesional:', err);
    res.status(500).json({ success: false, message: 'Error en la base de datos.' });
  }
});


