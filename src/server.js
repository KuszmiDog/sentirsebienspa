const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path'); // Importa path para manejar rutas

const app = express();
const PORT = 3000;

// Habilitar CORS
app.use(cors());

// Configuración de la base de datos
const db = mysql.createConnection({
  host: 'caboose.proxy.rlwy.net',
  user: 'root',
  password: 'JAOeqdyHCuCpLMncvXfihQOVMwIowkbz',
  database: 'sentirsebienspa',
});

// Conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos.');
});

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, '../public')));

// Ruta para la raíz
app.get('/', (req, res) => {
  res.send('Bienvenido al backend de Spa Sentirse Bien');
});

// Endpoint para obtener los servicios
app.get('/api/servicios', (req, res) => {
  const query = 'SELECT * FROM servicios';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los servicios:', err);
      res.status(500).send('Error al obtener los servicios');
      return;
    }
    res.json(results);
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});