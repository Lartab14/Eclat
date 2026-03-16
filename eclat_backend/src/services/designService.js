// designService.js - BACKEND (Node.js con CommonJS)
// Este archivo va en: backend/src/services/designService.js

const prisma = require("../prisma.js");

// Obtener todos los diseños
const getAllDesigns = async () => {
  try {
    return await prisma.diseño.findMany({
      include: {
        archivos: true,
        usuario: {
          select: {
            id_usuario: true,
            nombre_usuario: true,
            foto_perfil: true
          }
        }
      },
      orderBy: {
        fecha_subida: 'desc'
      }
    });
  } catch (error) {
    throw new Error(`Error al obtener diseños: ${error.message}`);
  }
};

async function getRandomDesigns(limit = 16) {
  try {
    // Obtener posts públicos con diseño asociado
    const designs = await prisma.diseño.findMany({
      where: {
        visibilidad: {
          in: ['publico', 'destacado']
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
        archivos: {
          select: {
            ruta_archivo: true,
          }
        }
      },
      take: 100
    });
    
    // Mezclar aleatoriamente y tomar solo los que necesitamos
    return designs
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  } catch (error) {
    console.error('Error en getRandomDesigns:', error);
    throw error;
  }
}

// Obtener un diseño por ID
const getDesignById = async (id) => {
  try {
    const design = await prisma.diseño.findUnique({
      where: { id_diseño: Number(id) },
      include: {
        archivos: true,
        usuario: {
          select: {
            id_usuario: true,
            nombre_usuario: true,
            foto_perfil: true
          }
        },
        posts: {
          include: {
            comentarios: true,
            likes: true
          }
        }
      }
    });

    if (!design) {
      throw new Error('Diseño no encontrado');
    }

    return design;
  } catch (error) {
    throw new Error(`Error al obtener el diseño: ${error.message}`);
  }
};

// Crear un diseño
const createDesign = async (data) => {
  try {
    const { id_usuario, titulo, descripcion, tipo_diseño, visibilidad } = data;

    if (!id_usuario) {
      throw new Error('El id_usuario es obligatorio');
    }

    const newDesign = await prisma.diseño.create({
      data: {
        id_usuario: Number(id_usuario),
        titulo: titulo || 'Sin título',
        descripcion: descripcion || '',
        tipo_diseño: tipo_diseño || 'general',
        visibilidad: visibilidad || 'publico'
      },
      include: {
        archivos: true,
        usuario: {
          select: {
            id_usuario: true,
            nombre_usuario: true,
            foto_perfil: true
          }
        }
      }
    });

    return newDesign;
  } catch (error) {
    throw new Error(`Error al crear el diseño: ${error.message}`);
  }
};

// Actualizar un diseño
const updateDesign = async (id, data) => {
  try {
    const { titulo, descripcion, tipo_diseño, visibilidad } = data;

    const updatedDesign = await prisma.diseño.update({
      where: { id_diseño: Number(id) },
      data: {
        ...(titulo && { titulo }),
        ...(descripcion && { descripcion }),
        ...(tipo_diseño && { tipo_diseño }),
        ...(visibilidad && { visibilidad })
      },
      include: {
        archivos: true,
        usuario: {
          select: {
            id_usuario: true,
            nombre_usuario: true,
            foto_perfil: true
          }
        }
      }
    });

    return updatedDesign;
  } catch (error) {
    throw new Error(`Error al actualizar el diseño: ${error.message}`);
  }
};

// Eliminar un diseño
const deleteDesign = async (id) => {
  try {
    // Primero eliminar archivos asociados
    await prisma.archivoDiseño.deleteMany({
      where: { id_diseño: Number(id) }
    });

    // Luego eliminar el diseño
    const deletedDesign = await prisma.diseño.delete({
      where: { id_diseño: Number(id) }
    });

    return {
      success: true,
      mensaje: 'Diseño eliminado correctamente',
      diseño: deletedDesign
    };
  } catch (error) {
    throw new Error(`Error al eliminar el diseño: ${error.message}`);
  }
};

module.exports = {
  getAllDesigns,
  getDesignById,
  createDesign,
  updateDesign,
  deleteDesign,
  getRandomDesigns
};