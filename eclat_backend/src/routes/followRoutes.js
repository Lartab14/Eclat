const { Router } = require("express");
const followController = require("../controllers/followController.js");

const router = Router();

// Crear follow
router.post("/", followController.followUser);

// Ver seguidores de un usuario
router.get("/followers/:id", followController.getFollowers);

// Ver a quién sigue un usuario
router.get("/following/:id", followController.getFollowing);

// Dejar de seguir
router.delete("/:id", followController.unfollowUser);

module.exports = router;
