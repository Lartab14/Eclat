const postService = require("../services/postService.js");

// Crear
async function createPost(req, res) {
  try {
    const post = await postService.createPost(req.body);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Listar
async function getAllPosts(req, res) {
  try {
    const posts = await postService.getAllPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}



// Obtener por ID
async function getPostById(req, res) {
  try {
    const post = await postService.getPostById(req.params.id);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Actualizar
async function updatePost(req, res) {
  try {
    const post = await postService.updatePost(req.params.id, req.body);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Eliminar
async function deletePost(req, res) {
  try {
    const post = await postService.deletePost(req.params.id);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};