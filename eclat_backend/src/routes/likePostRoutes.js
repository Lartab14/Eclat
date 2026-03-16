const { Router } = require("express");
const likePostController = require("../controllers/likePostController.js");

const router = Router();

// 👇 NUEVAS rutas para diseños
router.post("/design/:id_diseño/toggle", likePostController.toggleLikeDiseño);
router.get("/design/:id_diseño", likePostController.getLikesByDiseño);

// Rutas originales para posts
router.post("/", likePostController.likePost);
router.get("/post/:id", likePostController.getLikesByPost);
router.delete("/:id", likePostController.unlikePost);

module.exports = router;