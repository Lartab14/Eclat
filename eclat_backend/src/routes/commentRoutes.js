const { Router } = require("express");
const commentController = require("../controllers/commentController.js");

const router = Router();

// 👇 NUEVAS rutas para diseños
router.post("/design/:id_diseño", commentController.createCommentDiseño);
router.get("/design/:id_diseño", commentController.getCommentsByDiseño);

// Originales
router.post("/", commentController.createComment);
router.get("/post/:id", commentController.getCommentsByPost);
router.delete("/:id", commentController.deleteComment);

module.exports = router;