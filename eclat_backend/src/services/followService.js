const prisma = require("../prisma.js");

// Seguir a un usuario
async function followUser(data) {
  return await prisma.follow.create({ data });
}

// Obtener todos los seguidores de un usuario
async function getFollowers(id_usuario) {
  return await prisma.follow.findMany({
    where: { id_usuario_seguido: Number(id_usuario) },
    include: {
      seguidor: true,
    },
  });
}

// Obtener a quién sigue un usuario
async function getFollowing(id_usuario) {
  return await prisma.follow.findMany({
    where: { id_usuario_seguidor: Number(id_usuario) },
    include: {
      seguido: true,
    },
  });
}

// Dejar de seguir
async function unfollowUser(id_seguir) {
  return await prisma.follow.delete({
    where: { id_seguir: Number(id_seguir) },
  });
}

module.exports = {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
};
