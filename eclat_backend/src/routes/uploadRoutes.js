const { Router } = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const prisma = require("../prisma");

const router = Router();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de multer con Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "eclat/profiles",
    allowed_formats: ["jpeg", "jpg", "png", "gif", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ✅ Endpoint general para subir imagen (sin guardar en BD)
// Usado por ShareDesignModal y otros componentes
router.post("/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ninguna imagen" });
    }

    const imageUrl = req.file.path;
    console.log("✅ Imagen subida a Cloudinary:", imageUrl);

    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Endpoint para subir avatar y guardarlo en usuario.foto_perfil
router.post("/:id/avatar", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ninguna imagen" });
    }

    const { id } = req.params;
    const imageUrl = req.file.path;

    // Guardar en BD campo foto_perfil
    const usuarioActualizado = await prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { foto_perfil: imageUrl },
    });

    console.log(`✅ Avatar actualizado para usuario ${id}:`, imageUrl);

    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename,
      usuario: {
        id_usuario: usuarioActualizado.id_usuario,
        foto_perfil: usuarioActualizado.foto_perfil,
      },
    });
  } catch (error) {
    console.error("❌ Error al subir avatar:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Endpoint para subir portada y guardarla en informacion_adicional
router.post("/:id/cover", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ninguna imagen" });
    }

    const { id } = req.params;
    const imageUrl = req.file.path;

    // Leer informacion_adicional actual
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: Number(id) },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    let infoActual = {};
    try {
      infoActual = usuario.informacion_adicional
        ? JSON.parse(usuario.informacion_adicional)
        : {};
      if (typeof infoActual !== "object" || Array.isArray(infoActual)) {
        infoActual = {};
      }
    } catch (e) {
      infoActual = {};
    }

    // Agregar/actualizar foto_portada
    const infoActualizada = {
      ...infoActual,
      foto_portada: imageUrl,
    };

    const usuarioActualizado = await prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { informacion_adicional: JSON.stringify(infoActualizada) },
    });

    console.log(`✅ Portada actualizada para usuario ${id}:`, imageUrl);

    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename,
      usuario: {
        id_usuario: usuarioActualizado.id_usuario,
        foto_portada: imageUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error al subir portada:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;