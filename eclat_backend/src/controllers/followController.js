const followService = require("../services/followService.js");

// Seguir
async function followUser(req, res) {
  try {
    const follow = await followService.followUser(req.body);
    res.json(follow);
  } catch (error) {
    // ✅ Devolver 409 Conflict para duplicados en lugar de 500
    if (
      error.message === "Ya sigues a este usuario" ||
      error.message === "Un usuario no puede seguirse a sí mismo"
    ) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// Obtener seguidores
async function getFollowers(req, res) {
  try {
    const result = await followService.getFollowers(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener a quién sigue
async function getFollowing(req, res) {
  try {
    const result = await followService.getFollowing(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Dejar de seguir
async function unfollowUser(req, res) {
  try {
    await followService.unfollowUser(req.params.id);
    res.json({ message: "Dejó de seguir correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
};
