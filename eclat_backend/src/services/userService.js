const prisma = require("../prisma.js");
const bcrypt = require("bcryptjs");
const { Prisma } = require("@prisma/client"); 

const crearUsuario = async (data) => {
  try {
    if (!data.rol) {
      throw new Error("El rol es obligatorio");
    }

    const hashedPassword = await bcrypt.hash(data.contraseña, 10);

    return await prisma.usuario.create({
      data: {
        nombre_usuario: data.nombre_usuario,
        correo: data.correo,
        contraseña: hashedPassword,
        rol: data.rol
      }
    });

  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("El correo ya está registrado");
    }

    throw error;
  }
};

const obtenerUsuarios = async () => {
  return prisma.usuario.findMany();
};

// Función helper para mapear stats correctamente
// seguidores = relación "Seguidor" = registros donde este usuario ES el seguidor = following
// seguidos   = relación "Seguido"  = registros donde este usuario ES el seguido  = followers
const mapearStats = (count) => ({
  posts: count.diseños,
  likes: count.likes,
  followers: count.seguidos,    // ✅ quienes lo siguen a él
  following: count.seguidores,  // ✅ a quienes sigue él
});

const obtenerUsuarioPorId = async (id) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: Number(id) },
    include: {
      _count: {
        select: {
          seguidores: true,
          seguidos: true,
          diseños: true,
          likes: true
        }
      }
    }
  });

  if (!usuario) return null;

  const usuarioMapeado = {
    ...usuario,
    stats: mapearStats(usuario._count),
  };

  delete usuarioMapeado._count;

  //console.log(JSON.stringify(usuarioMapeado));

  return usuarioMapeado;
};

const autenticarUsuario = async (correo, contraseña) => {
  const usuario = await prisma.usuario.findUnique({
    where: { correo },
    include: {
      _count: {
        select: {
          seguidores: true,
          seguidos: true,
          diseños: true,
          likes: true
        }
      }
    }
  });

  if (!usuario) return null;

  const passwordValida = await bcrypt.compare(contraseña, usuario.contraseña);

  if (!passwordValida) return null;

  console.log(JSON.stringify(usuario));

  const usuarioMapeado = {
    ...usuario,
    stats: mapearStats(usuario._count), // ✅ mismo helper, consistente
  };

  delete usuarioMapeado._count;

  return usuarioMapeado;
};

const actualizarPerfil = async (id, data) => {
  try {
    const { nombre_usuario, descripcion, ubicacion, edad, foto_perfil, foto_portada } = data;

    console.log("🔧 SERVICE: Actualizando perfil ID:", id);
    console.log("📦 Datos recibidos:", data);

    const usuarioActual = await prisma.usuario.findUnique({
      where: { id_usuario: Number(id) }
    });

    if (!usuarioActual) {
      throw new Error("Usuario no encontrado");
    }

    let infoActual = {};
    try {
      const parsed = JSON.parse(usuarioActual.informacion_adicional);
      
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const hasNumericKeys = Object.keys(parsed).some(key => !isNaN(key));
        
        if (hasNumericKeys) {
          console.log("⚠️ JSON corrupto detectado, reconstruyendo...");
          infoActual = {
            edad: parsed.edad || '',
            ubicacion: parsed.ubicacion || '',
            foto_portada: parsed.foto_portada || ''
          };
        } else {
          infoActual = parsed;
        }
      }
    } catch (error) {
      console.log("⚠️ Error parseando JSON, iniciando objeto vacío");
      infoActual = {};
    }

    const informacionAdicional = { ...infoActual };

    if (ubicacion !== undefined) informacionAdicional.ubicacion = ubicacion;
    if (foto_portada !== undefined) informacionAdicional.foto_portada = foto_portada;
    if (edad !== undefined) {
      informacionAdicional.edad =
        typeof edad === "string" ? edad.replace(/\D/g, "") : String(edad);
    }

    const updateData = {
      ...(nombre_usuario !== undefined && { nombre_usuario }),
      ...(descripcion !== undefined && { descripcion }),
      ...(foto_perfil !== undefined && { foto_perfil }),
      informacion_adicional: JSON.stringify(informacionAdicional)
    };

    console.log("Actualizando con:", JSON.stringify(updateData, null, 2));

    const usuarioActualizado = await prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: updateData
    });

    console.log("✅ Perfil actualizado correctamente");
    return usuarioActualizado;

  } catch (error) {
    console.error("❌ Error en actualizarPerfil:", error);
    throw new Error("No se pudo actualizar el perfil: " + error.message);
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  autenticarUsuario,
  actualizarPerfil
};