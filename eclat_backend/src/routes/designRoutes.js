const { Router } = require("express");
const designController = require("../controllers/designController.js");

const router = Router();

// ========== RUTAS ORIGINALES (CRUD básico) ==========
// Estas rutas usan designService y están intactas

// Obtener todos los diseños
router.get("/", designController.getAllDesigns);

// Obtener todos los diseños
router.get("/random", designController.getRandomDesigns);

// Obtener un diseño por ID
router.get("/:id", designController.getDesignById);

// Crear un diseño (método original)
router.post("/", designController.createDesign);

// Actualizar un diseño (método original - sin archivo)
// router.put("/:id", designController.updateDesign);

// Actualizar un diseño CON archivo (para Workspace)
// PUT /api/designs/:id
router.put("/:id", designController.actualizarDiseñoConArchivo);

// Eliminar un diseño (método original)
router.delete("/:id", designController.deleteDesign);


// ========== NUEVAS RUTAS PARA GESTIÓN DE IMÁGENES ==========
// Estas rutas usan Prisma directamente para funcionalidad de perfil

// Crear un diseño con archivo (para perfil de usuario)
// POST /api/designs/with-file
router.post("/with-file", designController.crearDiseñoConArchivo);

// Obtener diseños de un usuario específico con filtros
// GET /api/designs/usuario/1?visibilidad=publico
router.get("/usuario/:id_usuario", designController.obtenerDiseñosUsuario);

// Eliminar un diseño con validación de permisos
// DELETE /api/designs/remove/1
router.delete("/remove/:id_diseño", designController.eliminarDiseño);

// Cambiar visibilidad de un diseño
// PATCH /api/designs/1/visibilidad
router.patch("/:id_diseño/visibilidad", designController.cambiarVisibilidad);

router.post("/with-carousel", designController.crearCarrusel);

module.exports = router;