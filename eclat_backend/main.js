require("dotenv").config();
const path = require('path')

const express = require('express');
const prisma = require("./src/prisma");
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Importar las rutas
const routes = require('./src/routes/index');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar las rutas
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo salió mal!',
    message: err.message 
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});