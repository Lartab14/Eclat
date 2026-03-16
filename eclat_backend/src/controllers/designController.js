const designService = require("../services/designService.js");
const prisma = require("../prisma.js");

module.exports = {

  // Obtener posts aleatorios para colecciones
  async getRandomDesigns(req, res) {
    try {
      const { limit = 16 } = req.query;
      const designs = await designService.getRandomDesigns(parseInt(limit));

      console.log(`\n🎨 Diseños obtenidos de BD: ${designs.length}`);

      const designsFormateados = designs.map((design) => {
        console.log(`   Diseño: ${design.titulo || 'Sin título'}`);

        return {
          id: design.id_diseño,                          // ✅ era id_design (typo)
          image: design.archivos[0]?.ruta_archivo,
          title: design.titulo || 'Sin título',
          author: '@' + design.usuario.nombre_usuario.toLowerCase().replace(/\s+/g, ''),
          category: design.visibilidad === 'destacado' ? 'Destacado' :
            (design.likes?.length > 50 ? 'Popular' : null),
          likes: design.likes?.length || 0,              // ✅ ahora viene directo del diseño
          views: Math.floor(Math.random() * 3000) + 500
        };
      });

      console.log('📤 Enviando al frontend...\n');

      res.json({
        success: true,
        designs: designsFormateados
      });
    } catch (error) {
      console.error("❌ Error al obtener posts aleatorios:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // ========== MÉTODOS ORIGINALES (CRUD básico) ==========

  async getAllDesigns(req, res) {
    try {
      const designs = await designService.getAllDesigns();
      res.json(designs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getDesignById(req, res) {
    try {
      const design = await designService.getDesignById(req.params.id);
      res.json(design);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async createDesign(req, res) {
    try {
      const newDesign = await designService.createDesign(req.body);
      res.json(newDesign);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateDesign(req, res) {
    try {
      const updated = await designService.updateDesign(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteDesign(req, res) {
    try {
      const deleted = await designService.deleteDesign(req.params.id);
      res.json(deleted);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // ========== NUEVOS MÉTODOS PARA GESTIÓN DE IMÁGENES ==========

  async crearDiseñoConArchivo(req, res) {
    try {
      const { id_usuario, titulo, descripcion, tipo_diseño, visibilidad, imagen_url } = req.body;

      console.log("📸 Creando diseño con archivo:", { id_usuario, titulo, visibilidad, imagen_url });

      if (!id_usuario) return res.status(400).json({ error: "El id_usuario es obligatorio" });
      if (!imagen_url) return res.status(400).json({ error: "La imagen es obligatoria" });

      const usuarioExiste = await prisma.usuario.findUnique({
        where: { id_usuario: Number(id_usuario) }
      });

      if (!usuarioExiste) return res.status(404).json({ error: "Usuario no encontrado" });

      const diseño = await prisma.diseño.create({
        data: {
          id_usuario: Number(id_usuario),
          titulo: titulo || "Sin título",
          descripcion: descripcion || "",
          tipo_diseño: tipo_diseño || "imagen",
          visibilidad: visibilidad || "publico",
        }
      });

      const archivo = await prisma.archivoDiseño.create({
        data: {
          id_diseño: diseño.id_diseño,
          ruta_archivo: imagen_url,
          formato: imagen_url.split('.').pop()
        }
      });

      console.log("✅ Diseño y archivo creados:", diseño.id_diseño);

      const diseñoCompleto = await prisma.diseño.findUnique({
        where: { id_diseño: diseño.id_diseño },
        include: {
          archivos: true,
          likes: true,       // ✅ incluir likes
          comentarios: true, // ✅ incluir comentarios
          usuario: {
            select: { id_usuario: true, nombre_usuario: true, foto_perfil: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        mensaje: "Diseño creado exitosamente",
        diseño: diseñoCompleto
      });

    } catch (error) {
      console.error("❌ Error al crear diseño con archivo:", error);
      res.status(500).json({ error: "Error al crear el diseño", detalle: error.message });
    }
  },

  // Obtener diseños del usuario — ✅ CAMBIO PRINCIPAL AQUÍ
  async obtenerDiseñosUsuario(req, res) {
    try {
      const { id_usuario } = req.params;
      const { visibilidad } = req.query;

      console.log("📋 Obteniendo diseños del usuario:", id_usuario, "Visibilidad:", visibilidad);

      const whereClause = { id_usuario: Number(id_usuario) };
      if (visibilidad) whereClause.visibilidad = visibilidad;

      const diseños = await prisma.diseño.findMany({
        where: whereClause,
        include: {
          archivos: true,
          likes: true,        // ✅ directo en diseño, no via posts
          comentarios: true,  // ✅ directo en diseño, no via posts
          usuario: {
            select: { id_usuario: true, nombre_usuario: true, foto_perfil: true }
          }
        },
        orderBy: { fecha_subida: 'desc' }
      });

      console.log(`✅ Se encontraron ${diseños.length} diseños`);

      const diseñosFormateados = diseños.map(diseño => ({
        id: diseño.id_diseño,
        titulo: diseño.titulo,
        descripcion: diseño.descripcion,
        imagen: diseño.archivos[0]?.ruta_archivo || '',
        status: diseño.visibilidad === 'publico' ? 'Público' : 'Privado',
        likes: diseño.likes?.length || 0,        // ✅ directo del diseño
        comments: diseño.comentarios?.length || 0, // ✅ directo del diseño
        fecha_subida: diseño.fecha_subida,
        usuario: diseño.usuario
      }));

      res.json({ success: true, diseños: diseñosFormateados });

    } catch (error) {
      console.error("❌ Error al obtener diseños:", error);
      res.status(500).json({ error: "Error al obtener diseños", detalle: error.message });
    }
  },

  async eliminarDiseño(req, res) {
    try {
      const { id_diseño } = req.params;
      const { id_usuario } = req.body;

      console.log("🗑️ Eliminando diseño:", id_diseño);

      const diseño = await prisma.diseño.findUnique({
        where: { id_diseño: Number(id_diseño) }
      });

      if (!diseño) return res.status(404).json({ error: "Diseño no encontrado" });
      if (diseño.id_usuario !== Number(id_usuario)) {
        return res.status(403).json({ error: "No tienes permiso para eliminar este diseño" });
      }

      // ✅ Eliminar likes y comentarios del diseño antes de borrarlo
      await prisma.like_post.deleteMany({ where: { id_diseño: Number(id_diseño) } });
      await prisma.comentario.deleteMany({ where: { id_diseño: Number(id_diseño) } });
      await prisma.post.deleteMany({ where: { id_diseño: Number(id_diseño) } });
      await prisma.archivoDiseño.deleteMany({ where: { id_diseño: Number(id_diseño) } });
      await prisma.diseño.delete({ where: { id_diseño: Number(id_diseño) } });

      console.log("✅ Diseño eliminado correctamente");
      res.json({ success: true, mensaje: "Diseño eliminado exitosamente" });

    } catch (error) {
      console.error("❌ Error al eliminar diseño:", error);
      res.status(500).json({ error: "Error al eliminar el diseño", detalle: error.message });
    }
  },

  async cambiarVisibilidad(req, res) {
    try {
      const { id_diseño } = req.params;
      const { visibilidad, id_usuario } = req.body;

      const diseño = await prisma.diseño.findUnique({
        where: { id_diseño: Number(id_diseño) }
      });

      if (!diseño) return res.status(404).json({ error: "Diseño no encontrado" });
      if (diseño.id_usuario !== Number(id_usuario)) {
        return res.status(403).json({ error: "No tienes permiso para modificar este diseño" });
      }

      const diseñoActualizado = await prisma.diseño.update({
        where: { id_diseño: Number(id_diseño) },
        data: { visibilidad }
      });

      res.json({ success: true, mensaje: "Visibilidad actualizada exitosamente", diseño: diseñoActualizado });

    } catch (error) {
      console.error("❌ Error al cambiar visibilidad:", error);
      res.status(500).json({ error: "Error al cambiar visibilidad", detalle: error.message });
    }
  },

  async actualizarDiseñoConArchivo(req, res) {
    try {
      const { id } = req.params;
      const { id_usuario, titulo, descripcion, imagen_url, visibilidad } = req.body;

      console.log("🔄 Actualizando diseño:", id);

      const diseñoExistente = await prisma.diseño.findUnique({
        where: { id_diseño: Number(id) },
        include: { archivos: true }
      });

      if (!diseñoExistente) {
        return res.status(404).json({ success: false, error: "Diseño no encontrado" });
      }
      if (diseñoExistente.id_usuario !== Number(id_usuario)) {
        return res.status(403).json({ success: false, error: "No tienes permiso para editar este diseño" });
      }

      const diseñoActualizado = await prisma.diseño.update({
        where: { id_diseño: Number(id) },
        data: {
          titulo: titulo || diseñoExistente.titulo,
          descripcion: descripcion || diseñoExistente.descripcion,
          visibilidad: visibilidad || diseñoExistente.visibilidad,
        }
      });

      if (imagen_url) {
        const archivoExistente = await prisma.archivoDiseño.findFirst({
          where: { id_diseño: Number(id) }
        });

        if (archivoExistente) {
          await prisma.archivoDiseño.update({
            where: { id_archivo: archivoExistente.id_archivo },
            data: { ruta_archivo: imagen_url, formato: imagen_url.split('.').pop() }
          });
        } else {
          await prisma.archivoDiseño.create({
            data: { id_diseño: Number(id), ruta_archivo: imagen_url, formato: imagen_url.split('.').pop() }
          });
        }
      }

      const diseñoCompleto = await prisma.diseño.findUnique({
        where: { id_diseño: Number(id) },
        include: {
          archivos: true,
          likes: true,        // ✅ incluir likes
          comentarios: true,  // ✅ incluir comentarios
          usuario: {
            select: { id_usuario: true, nombre_usuario: true, foto_perfil: true }
          }
        }
      });

      console.log("✅ Diseño actualizado exitosamente");
      res.json({ success: true, mensaje: "Diseño actualizado exitosamente", diseño: diseñoCompleto });

    } catch (error) {
      console.error("❌ Error al actualizar diseño:", error);
      res.status(500).json({ success: false, error: "Error al actualizar el diseño", detalle: error.message });
    }
  }
};