const prisma = require("../prisma.js");

// Guardar un post
async function savePost(data) {
  return await prisma.save_post.create({ data });
}

// Obtener todos los posts guardados por un usuario
async function getSavedByUser(id_usuario) {
  return await prisma.save_post.findMany({
    where: { id_usuario: Number(id_usuario) },
    include: {
      post: true,
    },
  });
}

// Eliminar un guardado
async function unsavePost(id_guardado) {
  return await prisma.save_post.delete({
    where: { id_guardado: Number(id_guardado) },
  });
}

module.exports = {
  savePost,
  getSavedByUser,
  unsavePost,
};
