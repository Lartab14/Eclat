const commentService = require("../services/commentService.js");

//para diseños
async function createCommentDiseño(req, res) {
  try {
    const { id_usuario, contenido } = req.body;
    const { id_diseño } = req.params;

    if (!id_usuario || !contenido || !id_diseño) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const comentario = await commentService.createCommentDiseño(
      id_usuario,
      id_diseño,
      contenido
    );
    res.status(201).json({ success: true, comentario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getCommentsByDiseño(req, res) {
  try {
    const comentarios = await commentService.getCommentsByDiseño(
      req.params.id_diseño
    );
    res.json({ success: true, comentarios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Originales
async function createComment(req, res) {
  try {
    const comentario = await commentService.createComment(req.body);
    res.json(comentario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getCommentsByPost(req, res) {
  try {
    const comentarios = await commentService.getCommentsByPost(req.params.id);
    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteComment(req, res) {
  try {
    await commentService.deleteComment(req.params.id);
    res.json({ message: "Comentario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createCommentDiseño,
  getCommentsByDiseño,
  createComment,
  getCommentsByPost,
  deleteComment,
};