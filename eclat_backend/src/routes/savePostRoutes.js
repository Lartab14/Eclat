const { Router } = require("express");
const savePostController = require("../controllers/savePostController.js");

const router = Router();

// Guardar un post
router.post("/", savePostController.savePost);

// Obtener todos los guardados de un usuario
router.get("/user/:id", savePostController.getSavedByUser);

// Eliminar un guardado
router.delete("/:id", savePostController.unsavePost);

module.exports = router;
