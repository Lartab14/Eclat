const prisma = require("../prisma.js");

// 👇 NUEVOS para diseños
async function createCommentDiseño(id_usuario, id_diseño, contenido) {
  return await prisma.comentario.create({
    data: {
      id_usuario: Number(id_usuario),
      id_diseño: Number(id_diseño),
      contenido,
    },
    include: {
      usuario: {
        select: { id_usuario: true, nombre_usuario: true, foto_perfil: true },
      },
    },
  });
}

async function getCommentsByDiseño(id_diseño) {
  return await prisma.comentario.findMany({
    where: { id_diseño: Number(id_diseño) },
    include: {
      usuario: {
        select: { id_usuario: true, nombre_usuario: true, foto_perfil: true },
      },
    },
    orderBy: { fecha: "desc" },
  });
}

// Originales para posts
async function createComment(data) {
  return await prisma.comentario.create({ data });
}

async function getCommentsByPost(id_post) {
  return await prisma.comentario.findMany({
    where: { id_post: Number(id_post) },
    include: { usuario: true },
  });
}

async function deleteComment(id_comentario) {
  return await prisma.comentario.delete({
    where: { id_comentario: Number(id_comentario) },
  });
}

module.exports = {
  createCommentDiseño,
  getCommentsByDiseño,
  createComment,
  getCommentsByPost,
  deleteComment,
};