const likePostService = require("../services/likePostService.js");

// 👇 NUEVOS para diseños
async function toggleLikeDiseño(req, res) {
  try {
    const { id_usuario } = req.body;
    const { id_diseño } = req.params;

    if (!id_usuario || !id_diseño) {
      return res.status(400).json({ error: "Faltan id_usuario o id_diseño" });
    }

    const result = await likePostService.toggleLikeDiseño(id_usuario, id_diseño);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getLikesByDiseño(req, res) {
  try {
    const { id_diseño } = req.params;
    const { id_usuario } = req.query;
    const result = await likePostService.getLikesByDiseño(id_diseño, id_usuario);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Originales para posts
async function likePost(req, res) {
  try {
    const like = await likePostService.likePost(req.body);
    res.json(like);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getLikesByPost(req, res) {
  try {
    const likes = await likePostService.getLikesByPost(req.params.id);
    res.json(likes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function unlikePost(req, res) {
  try {
    await likePostService.unlikePost(req.params.id);
    res.json({ message: "Like eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  toggleLikeDiseño,
  getLikesByDiseño,
  likePost,
  getLikesByPost,
  unlikePost,
};