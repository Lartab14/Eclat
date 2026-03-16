const usuarioService = require("../services/userService.js");
const jwt = require("jsonwebtoken");

// REGISTRO
const crearUsuario = async (req, res) => {
  try {
    console.log("BODY REGISTRO 👉", req.body);

    const usuario = await usuarioService.crearUsuario(req.body);

    res.status(201).json({
      message: "Usuario creado correctamente",
      usuario
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      error: error.message
    });
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

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const parseInfoAdicional = (infoAdicional) => {
  try {
    if (typeof infoAdicional === 'string') {
      return JSON.parse(infoAdicional);
    }
    return infoAdicional || {};
  } catch (error) {
    console.error("Error parseando informacion_adicional:", error);
    return {};
  }
};

// LOGIN
const autenticarUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await usuarioService.autenticarUsuario(
      email,
      password
    );

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        correo: usuario.correo
      },
      process.env.JWT_SECRET || "mi_secreto_super_seguro",
      { expiresIn: "1h" }
    );

    const infoAdicional = parseInfoAdicional(usuario.informacion_adicional);

    console.log(usuario);

    res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        name: usuario.nombre_usuario,
        email: usuario.correo,
        rol: usuario.rol,
        bio: usuario.descripcion || '',
        location: infoAdicional.ubicacion || '',
        age: infoAdicional.edad || '',
        avatarImage: usuario.foto_perfil || '',
        coverImage: infoAdicional.foto_portada || '',
        verified: infoAdicional.verificado || false,
        topCreator: infoAdicional.top_creator || false,
        joinDate: new Date(usuario.fecha_creacion).toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long' 
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

    console.log("Actualizando perfil del usuario:", id);
    console.log("Datos recibidos:", req.body);

    const usuarioActualizado = await usuarioService.actualizarPerfil(id, {
      nombre_usuario: name,
      descripcion: bio,
      ubicacion: location,
      edad: age,
      foto_perfil: avatarImage,
      foto_portada: coverImage
    });

    const infoAdicional = parseInfoAdicional(usuarioActualizado.informacion_adicional);

    res.json({
      message: "Perfil actualizado correctamente",
      usuario: {
        id_usuario: usuarioActualizado.id_usuario,
        name: usuarioActualizado.nombre_usuario,
        email: usuarioActualizado.correo,
        bio: usuarioActualizado.descripcion || '',
        location: infoAdicional.ubicacion || location,
        age: infoAdicional.edad || age,
        avatarImage: usuarioActualizado.foto_perfil || avatarImage,
        coverImage: infoAdicional.foto_portada || coverImage,
        verified: infoAdicional.verificado || false,
        topCreator: infoAdicional.top_creator || false,
        joinDate: new Date(usuarioActualizado.fecha_creacion).toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long' 
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
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ 
      error: 'No se pudo actualizar el perfil',
      details: error.message 
    });
  }
};

// OBTENER USUARIOS ALEATORIOS PARA LA SECCIÓN DE DISEÑADORES
const obtenerUsuariosAleatorios = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const todosLosUsuarios = await usuarioService.obtenerUsuarios();
    console.log(`📦 Total usuarios en BD: ${todosLosUsuarios.length}`);
    
    const diseñadores = todosLosUsuarios.filter(u => u.rol === 'diseñador');
    console.log(`👥 Diseñadores encontrados: ${diseñadores.length}`);
    
    const usuariosAleatorios = diseñadores
      .sort(() => Math.random() - 0.5)
      .slice(0, parseInt(limit));
    
    const usuariosFormateados = usuariosAleatorios.map(usuario => {
      const infoAdicional = parseInfoAdicional(usuario.informacion_adicional);
      
      const seguidoresNum = Math.floor(Math.random() * 20000) + 1000;
      const proyectosNum = Math.floor(Math.random() * 150) + 20;
      const likesNum = Math.floor(Math.random() * 80000) + 5000;
      
      const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
      };

      // 🔍 LOGGING DETALLADO
      console.log(`\n================================`);
      console.log(`👤 Usuario: ${usuario.nombre_usuario}`);
      console.log(`   📸 foto_perfil RAW: "${usuario.foto_perfil}"`);
      console.log(`   🖼️  foto_portada RAW: "${infoAdicional.foto_portada}"`);
      
      // ✅ Normalizar rutas
      // const normalizarRuta = (ruta) => {
      //   if (!ruta) {
      //     console.log(`   ⚠️  Ruta vacía o null`);
      //     return null;
      //   }
        
      //   console.log(`   🔄 Normalizando: "${ruta}"`);
        
      //   // Si ya comienza con /uploads/, retornar tal cual
      //   if (ruta.startsWith('/uploads/')) {
      //     console.log(`   ✅ Ya tiene /uploads/: "${ruta}"`);
      //     return ruta;
      //   }
        
      //   // Si comienza con uploads/ (sin /), agregar el /
      //   if (ruta.startsWith('uploads/')) {
      //     const rutaNormalizada = '/' + ruta;
      //     console.log(`   ✅ Agregado /: "${rutaNormalizada}"`);
      //     return rutaNormalizada;
      //   }
        
      //   // Si es solo el nombre del archivo, agregar /uploads/
      //   const rutaNormalizada = '/uploads/' + ruta;
      //   console.log(`   ✅ Agregado /uploads/: "${rutaNormalizada}"`);
      //   return rutaNormalizada;
      // };
      
      
      return {
        id: usuario.id_usuario,
        name: usuario.nombre_usuario,
        username: '@' + usuario.nombre_usuario.toLowerCase().replace(/\s+/g, ''),
        specialty: infoAdicional.especialidad || usuario.descripcion || 'Diseño de Moda',
        location: infoAdicional.ubicacion || 'Sin ubicación',
        coverImage: infoAdicional.foto_portada,
        avatarImage: usuario.foto_perfil,
        badge: infoAdicional.destacado ? 'Destacado' : null,
        followers: formatNumber(infoAdicional.seguidores || seguidoresNum),
        projects: infoAdicional.proyectos || proyectosNum,
        likes: formatNumber(infoAdicional.total_likes || likesNum)
      };
    });
    
    console.log('\n✅ Total usuarios formateados:', usuariosFormateados.length);
    console.log('📤 Enviando respuesta al frontend...\n');
    
    res.json({
      success: true,
      usuarios: usuariosFormateados
    });
    
  } catch (error) {
    console.error("❌ Error al obtener usuarios aleatorios:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  autenticarUsuario,
  actualizarPerfil,
  obtenerUsuariosAleatorios
};