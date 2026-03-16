const { Router } = require("express");
const designRoutes = require("./designRoutes.js");
const userRoutes = require("./userRoutes.js");
const uploadRoutes = require("./uploadRoutes.js"); 
const archivoDisenoRoutes = require("./archivoDisenoRoutes.js"); 
const postRoutes = require("./postRoutes.js");
const followRoutes = require("./followRoutes.js");
const savePostRoutes = require("./savePostRoutes.js");
const commentRoutes = require("./commentRoutes.js");
const likePostRoutes = require("./likePostRoutes.js");

const router = Router();

router.use("/designs", designRoutes);
router.use("/usuarios", userRoutes);
router.use("/upload", uploadRoutes); 
router.use("/archivos", archivoDisenoRoutes);
router.use("/posts", postRoutes);
router.use("/follows", followRoutes);
router.use("/saved", savePostRoutes);
router.use("/comments", commentRoutes);
router.use("/likes", likePostRoutes);

module.exports = router;