const prisma = require("../prisma.js");

// Toggle like en diseño (dar o quitar)
async function toggleLikeDiseño(id_usuario, id_diseño) {
  const existente = await prisma.like_post.findFirst({
    where: {
      id_usuario: Number(id_usuario),
      id_diseño: Number(id_diseño),
    },
  });

  if (existente) {
    await prisma.like_post.delete({ where: { id_like: existente.id_like } });
    return { liked: false };
  } else {
    await prisma.like_post.create({
      data: {
        id_usuario: Number(id_usuario),
        id_diseño: Number(id_diseño),
      },
    });
    return { liked: true };
  }
}

// Obtener likes de un diseño
async function getLikesByDiseño(id_diseño, id_usuario_actual) {
  const likes = await prisma.like_post.findMany({
    where: { id_diseño: Number(id_diseño) },
  });

  const yaLiked = id_usuario_actual
    ? likes.some((l) => l.id_usuario === Number(id_usuario_actual))
    : false;

  return { total: likes.length, liked: yaLiked };
}

// Funciones originales para posts (no tocar)
async function likePost(data) {
  return await prisma.like_post.create({ data });
}

async function getLikesByPost(id_post) {
  return await prisma.like_post.findMany({
    where: { id_post: Number(id_post) },
    include: { usuario: true },
  });
}

async function unlikePost(id_like) {
  return await prisma.like_post.delete({
    where: { id_like: Number(id_like) },
  });
}

module.exports = {
  toggleLikeDiseño,
  getLikesByDiseño,
  likePost,
  getLikesByPost,
  unlikePost,
};