const { Router } = require("express");
const postController = require("../controllers/postController.js");

const router = Router();

router.post("/", postController.createPost);
router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.put("/:id", postController.updatePost);
router.delete("/:id", postController.deletePost);

module.exports = router;