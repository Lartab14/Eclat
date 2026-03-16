const savePostService = require("../services/savePostService.js");

// Guardar un post
async function savePost(req, res) {
  try {
    const saved = await savePostService.savePost(req.body);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener todos los posts guardados por un usuario
async function getSavedByUser(req, res) {
  try {
    const result = await savePostService.getSavedByUser(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Eliminar un guardado
async function unsavePost(req, res) {
  try {
    await savePostService.unsavePost(req.params.id);
    res.json({ message: "Post retirado de guardados" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  savePost,
  getSavedByUser,
  unsavePost,
};
