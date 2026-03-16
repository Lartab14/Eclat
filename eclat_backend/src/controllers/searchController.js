// searchController.js
// Controlador para búsqueda de usuarios por nombre
const usuarioService = require('../services/userService.js');

/**
 * GET /api/usuarios/buscar?q=texto
 * Busca usuarios cuyo nombre_usuario contenga el texto buscado.
 * Devuelve máximo 10 resultados, excluyendo contraseñas.
 */
const buscarUsuarios = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 1) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro de búsqueda "q" es requerido'
            });
        }

        const query = q.trim().toLowerCase();

        // Obtener todos los usuarios y filtrar en memoria
        // (si el volumen crece, reemplazar por una query SQL con ILIKE/LIKE)
        const todos = await usuarioService.obtenerUsuarios();

        const coincidencias = todos
            .filter((u) =>
                u.nombre_usuario?.toLowerCase().includes(query) ||
                u.correo?.toLowerCase().includes(query)
            )
            .slice(0, 10)
            .map((u) => {
                // Normalizar ruta del avatar
                const normalizarRuta = (ruta) => {
                    if (!ruta) return null;
                    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
                    if (ruta.startsWith('/uploads/')) return ruta;
                    if (ruta.startsWith('uploads/')) return '/' + ruta;
                    return '/uploads/' + ruta;
                };

                return {
                    id: u.id_usuario,
                    name: u.nombre_usuario,
                    email: u.correo,
                    rol: u.rol || 'diseñador',
                    avatarImage: normalizarRuta(u.foto_perfil),
                };
            });

        res.json({
            success: true,
            usuarios: coincidencias,
            total: coincidencias.length
        });

    } catch (error) {
        console.error('❌ Error al buscar usuarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al buscar usuarios'
        });
    }
};

module.exports = { buscarUsuarios };