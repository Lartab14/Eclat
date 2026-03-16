// designService.js - FRONTEND (React)
// Este archivo va en: frontend/src/services/designService.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Crear un nuevo diseño con archivo (para perfil de usuario)
export const crearDiseñoConArchivo = async (diseñoData) => {
  try {
    const response = await fetch(`${API_URL}/designs/with-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(diseñoData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el diseño');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en crearDiseñoConArchivo:', error);
    throw error;
  }
};

// Obtener diseños de un usuario
export const obtenerDiseñosUsuario = async (idUsuario, visibilidad = null) => {
  try {
    const url = visibilidad 
      ? `${API_URL}/designs/usuario/${idUsuario}?visibilidad=${visibilidad}`
      : `${API_URL}/designs/usuario/${idUsuario}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Error al obtener los diseños');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en obtenerDiseñosUsuario:', error);
    throw error;
  }
};

// Eliminar un diseño
export const eliminarDiseño = async (idDiseño, idUsuario) => {
  try {
    const response = await fetch(`${API_URL}/designs/remove/${idDiseño}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_usuario: idUsuario })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar el diseño');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en eliminarDiseño:', error);
    throw error;
  }
};

// Cambiar visibilidad de un diseño
export const cambiarVisibilidad = async (idDiseño, visibilidad, idUsuario) => {
  try {
    const response = await fetch(`${API_URL}/designs/${idDiseño}/visibilidad`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        visibilidad,
        id_usuario: idUsuario 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cambiar la visibilidad');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en cambiarVisibilidad:', error);
    throw error;
  }
};

// Subir imagen al servidor
export const subirImagen = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error al subir la imagen');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en subirImagen:', error);
    throw error;
  }
};

export default {
  crearDiseñoConArchivo,
  obtenerDiseñosUsuario,
  eliminarDiseño,
  cambiarVisibilidad,
  subirImagen
};