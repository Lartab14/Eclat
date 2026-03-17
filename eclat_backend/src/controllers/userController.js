const usuarioService = require("../services/userService.js");
const jwt = require("jsonwebtoken");

const parseInfoAdicional = (infoAdicional) => {
  try {
    if (typeof infoAdicional === 'string') return JSON.parse(infoAdicional);
    return infoAdicional || {};
  } catch (error) {
    return {};
  }
};

// REGISTRO
const crearUsuario = async (req, res) => {
  try {
    console.log("BODY REGISTRO 👉", req.body);
    const usuario = await usuarioService.crearUsuario(req.body);
    res.status(201).json({ message: "Usuario creado correctamente", usuario });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// OBTENER TODOS
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioService.obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// OBTENER POR ID
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await usuarioService.obtenerUsuarioPorId(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN
const autenticarUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await usuarioService.autenticarUsuario(email, password);

    if (!usuario) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: usuario.id_usuario, correo: usuario.correo },
      process.env.JWT_SECRET || "mi_secreto_super_seguro",
      { expiresIn: "24h" }
    );

    const infoAdicional = parseInfoAdicional(usuario.informacion_adicional);

    res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        name: usuario.nombre_usuario,
        nombre_usuario: usuario.nombre_usuario,
        email: usuario.correo,
        correo: usuario.correo,
        rol: usuario.rol,
        bio: usuario.descripcion || '',
        descripcion: usuario.descripcion || '',
        location: infoAdicional.ubicacion || '',
        ubicacion: infoAdicional.ubicacion || '',
        age: infoAdicional.edad || '',
        avatarImage: usuario.foto_perfil || '',
        foto_perfil: usuario.foto_perfil || '',
        coverImage: infoAdicional.foto_portada || '',
        foto_portada: infoAdicional.foto_portada || '',
        verified: infoAdicional.verificado || false,
        topCreator: infoAdicional.top_creator || false,
        joinDate: new Date(usuario.fecha_creacion).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long'
        }),
        stats: usuario.stats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// ACTUALIZAR PERFIL
const actualizarPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, location, age, avatarImage, coverImage } = req.body;

    console.log("📝 Actualizando perfil del usuario:", id);
    console.log("📦 Datos recibidos:", req.body);

    const usuarioActualizado = await usuarioService.actualizarPerfil(id, {
      nombre_usuario: name,
      descripcion: bio,
      ubicacion: location,
      edad: age,
      foto_perfil: avatarImage,
      foto_portada: coverImage
    });

    const infoAdicional = parseInfoAdicional(usuarioActualizado.informacion_adicional);

    console.log("✅ Perfil actualizado, infoAdicional:", infoAdicional);

    res.json({
      message: "Perfil actualizado correctamente",
      usuario: {
        id_usuario: usuarioActualizado.id_usuario,
        name: usuarioActualizado.nombre_usuario,
        nombre_usuario: usuarioActualizado.nombre_usuario,
        email: usuarioActualizado.correo,
        correo: usuarioActualizado.correo,
        rol: usuarioActualizado.rol,
        bio: usuarioActualizado.descripcion || '',
        descripcion: usuarioActualizado.descripcion || '',
        location: infoAdicional.ubicacion || location || '',
        ubicacion: infoAdicional.ubicacion || location || '',
        age: infoAdicional.edad || age || '',
        avatarImage: usuarioActualizado.foto_perfil || avatarImage || '',
        foto_perfil: usuarioActualizado.foto_perfil || avatarImage || '',
        coverImage: infoAdicional.foto_portada || coverImage || '',
        foto_portada: infoAdicional.foto_portada || coverImage || '',
        verified: infoAdicional.verificado || false,
        topCreator: infoAdicional.top_creator || false,
        joinDate: new Date(usuarioActualizado.fecha_creacion).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long'
        }),
        stats: {
          posts: 0,
          likes: 0,
          followers: 0,
          following: 0
        }
      }
    });
  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error);
    res.status(500).json({
      error: 'No se pudo actualizar el perfil',
      details: error.message
    });
  }
};

// OBTENER USUARIOS ALEATORIOS
const obtenerUsuariosAleatorios = async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const todosLosUsuarios = await usuarioService.obtenerUsuarios();
    const diseñadores = todosLosUsuarios.filter(u => u.rol === 'diseñador');

    const usuariosAleatorios = diseñadores
      .sort(() => Math.random() - 0.5)
      .slice(0, parseInt(limit));

    const formatNumber = (num) => {
      const n = Number(num) || 0;
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    };

    const usuariosFormateados = usuariosAleatorios.map(usuario => {
      const infoAdicional = parseInfoAdicional(usuario.informacion_adicional);

      return {
        id: usuario.id_usuario,
        id_usuario: usuario.id_usuario,
        name: usuario.nombre_usuario,
        nombre_usuario: usuario.nombre_usuario,
        username: '@' + usuario.nombre_usuario.toLowerCase().replace(/\s+/g, ''),
        specialty: infoAdicional.especialidad || usuario.descripcion || 'Diseño de Moda',
        location: infoAdicional.ubicacion || 'Sin ubicación',
        // ✅ Devolver URLs directamente — Cloudinary ya las tiene completas
        coverImage: infoAdicional.foto_portada || null,
        avatarImage: usuario.foto_perfil || null,
        foto_perfil: usuario.foto_perfil || null,
        foto_portada: infoAdicional.foto_portada || null,
        badge: infoAdicional.destacado ? 'Destacado' : null,
        // ✅ Stats reales en lugar de números aleatorios
        followers: formatNumber(0),
        projects: formatNumber(0),
        likes: formatNumber(0),
      };
    });

    res.json({ success: true, usuarios: usuariosFormateados });

  } catch (error) {
    console.error("❌ Error al obtener usuarios aleatorios:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// BUSCAR USUARIOS
const buscarUsuarios = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ usuarios: [] });

    const usuarios = await usuarioService.obtenerUsuarios();
    const resultados = usuarios
      .filter(u =>
        u.nombre_usuario.toLowerCase().includes(q.toLowerCase()) ||
        (u.correo && u.correo.toLowerCase().includes(q.toLowerCase()))
      )
      .slice(0, 10)
      .map(u => ({
        id: u.id_usuario,
        id_usuario: u.id_usuario,
        nombre_usuario: u.nombre_usuario,
        rol: u.rol,
        avatarImage: u.foto_perfil || null,
        foto_perfil: u.foto_perfil || null,
      }));

    res.json({ usuarios: resultados });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  autenticarUsuario,
  actualizarPerfil,
  obtenerUsuariosAleatorios,
  buscarUsuarios
};