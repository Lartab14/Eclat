const prisma = require("../prisma.js");

// Crear un post
async function createPost(data) {
  return await prisma.post.create({ data });
}

// Listar todos los posts
async function getAllPosts() {
  return await prisma.post.findMany({
    include: {
      usuario: true,
      diseño: {
        include: {
          archivos: true  
        }
      },
      comentarios: true,
      likes: true,
      guardados: true,
    },
  });
}

// Obtener posts aleatorios
async function getRandomPosts(limit = 16) {
  try {
    // Obtener posts públicos con diseño asociado
    const posts = await prisma.post.findMany({
      where: {
        visibilidad: {
          in: ['publico', 'destacado']
        },
        id_diseño: {
          not: null
        }
      },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            nombre_usuario: true,
            foto_perfil: true
          }
        },
        diseño: {
          include: {
            archivos: {  // 
              take: 1,
              orderBy: {
                fecha_subida: 'desc'
              }
            }
          }
        },
        likes: true
      },
      take: 100
    });
    
    // Mezclar aleatoriamente y tomar solo los que necesitamos
    return posts
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  } catch (error) {
    console.error('Error en getRandomPosts:', error);
    throw error;
  }
}

// Obtener un post por ID
async function getPostById(id_post) {
  return await prisma.post.findUnique({
    where: { id_post: Number(id_post) },
    include: {
      usuario: true,
      diseño: {
        include: {
          archivos: true  
        }
      },
      comentarios: true,
      likes: true,
      guardados: true,
    },
  });
}

// Actualizar un post
async function updatePost(id_post, data) {
  return await prisma.post.update({
    where: { id_post: Number(id_post) },
    data,
  });
}

// Eliminar un post
async function deletePost(id_post) {
  return await prisma.post.delete({
    where: { id_post: Number(id_post) },
  });
}

module.exports = {
  createPost,
  getAllPosts,
  getRandomPosts,
  getPostById,
  updatePost,
  deletePost,
};