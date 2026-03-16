const { Router } = require("express");
const { buscarUsuarios } = require('../controllers/searchController.js');

const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  autenticarUsuario,
  actualizarPerfil,
  obtenerUsuariosAleatorios
} = require("../controllers/userController.js");

const router = Router();

// CRUD básico de usuarios
router.get("/", obtenerUsuarios);
router.post("/", crearUsuario);
router.get("/aleatorios", obtenerUsuariosAleatorios); 
router.get("/buscar", buscarUsuarios);                
router.get("/:id", obtenerUsuarioPorId);

// Autenticación
router.post('/auth', autenticarUsuario);

// Actualización de perfil
router.put('/perfil/:id', actualizarPerfil);

module.exports = router;