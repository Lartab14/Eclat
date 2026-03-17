import React, { useState, useEffect } from 'react';
import './App.css';
import InicialEclat from './InicialEclat';
import Login from './Login';
import DesignEditor from './DesignEditor';
import UserProfile from './UserProfile';
import PublicProfile from './PublicProfile';
import Colecciones from './Colecciones';
import Disenadores from './Disenadores';
import Tendencias from './Tendencias';
import Workspace from './Workspace';

import './InicialEclat.css';
import './Login.css';
import './UserProfile.css';
import './Colecciones.css';
import './Disenadores.css';
import './Tendencias.css';
import './Workspace.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingDesign, setEditingDesign] = useState(null);

  // ✅ Al cargar la app, recuperar la sesión guardada
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('userData');

    if (token && savedUser) {
      try {
        const usuario = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setUserData(usuario);
        setCurrentView('home');
      } catch (e) {
        // Si el JSON está corrupto, limpiar
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
  }, []);

  // Función para manejar el login exitoso
  const handleLoginSuccess = (usuario, token) => {
    console.log('Login exitoso:', usuario);

    const user = {
      id: usuario.id_usuario,
      id_usuario: usuario.id_usuario,
      name: usuario.name || usuario.nombre_usuario || 'Usuario',
      nombre_usuario: usuario.nombre_usuario,
      email: usuario.email || usuario.correo || '',
      correo: usuario.correo,
      ...usuario
    };

    // ✅ Persistir sesión en localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));

    setIsAuthenticated(true);
    setUserData(user);
    setCurrentView('home');
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    setSelectedUserId(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');
    setCurrentView('login');
  };

  // ✅ Función para actualizar el perfil y persistirlo
  const handleUpdateProfile = (updatedProfile) => {
    const newData = { ...userData, ...updatedProfile };
    localStorage.setItem('userData', JSON.stringify(newData));
    setUserData(newData);
  };

  // Función para abrir el editor
  const handleOpenEditor = () => {
    setCurrentView('editor');
  };

  // Función para abrir el workspace
  const handleOpenWorkspace = (design = null) => {
    console.log('Abriendo Workspace:', design ? 'Editando diseño' : 'Nuevo diseño');
    setEditingDesign(design);
    setCurrentView('workspace');
  };

  // Función para volver a home
  const handleBackToHome = () => {
    setCurrentView('home');
  };

  // Función para volver al perfil desde workspace
  const handleBackToProfile = () => {
    setEditingDesign(null);
    setCurrentView('profile');
  };

  // Función para abrir el perfil propio
  const handleOpenProfile = () => {
    setCurrentView('profile');
  };

  // Función para abrir perfil público de otro usuario
  const handleOpenPublicProfile = (userId) => {
    console.log('🔍 Abriendo perfil público de usuario:', userId);
    if (userData && userId === userData.id) {
      setCurrentView('profile');
    } else {
      setSelectedUserId(userId);
      setCurrentView('publicProfile');
    }
  };

  const handleOpenCollections = () => setCurrentView('collections');
  const handleOpenDesigners = () => setCurrentView('designers');
  const handleOpenTrends = () => setCurrentView('trends');

  return (
    <div className="App">
      {currentView === 'login' && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {currentView === 'home' && userData && (
        <InicialEclat
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          onOpenEditor={handleOpenEditor}
          onOpenProfile={handleOpenProfile}
          onOpenPublicProfile={handleOpenPublicProfile}
          onOpenCollections={handleOpenCollections}
          onOpenDesigners={handleOpenDesigners}
          onOpenTrends={handleOpenTrends}
          onOpenWorkspace={handleOpenWorkspace}
          userData={userData}
        />
      )}

      {currentView === 'editor' && (
        <DesignEditor onBack={handleBackToHome} />
      )}

      {currentView === 'profile' && userData && (
        <UserProfile
          onBack={handleBackToHome}
          onLogout={handleLogout}
          onOpenWorkspace={handleOpenWorkspace}
          onUpdateProfile={handleUpdateProfile}
          userData={userData}
        />
      )}

      {currentView === 'publicProfile' && selectedUserId && (
        <PublicProfile
          userId={selectedUserId}
          onBack={handleBackToHome}
          loggedUserId={userData?.id}
        />
      )}

      {currentView === 'workspace' && (
        <Workspace
          onBack={handleBackToProfile}
          userData={userData}
          draftDesign={editingDesign}
        />
      )}

      {currentView === 'collections' && (
        <Colecciones
          onNavigateHome={handleBackToHome}
          onOpenEditor={handleOpenEditor}
          onOpenProfile={handleOpenProfile}
          onOpenDesigners={handleOpenDesigners}
          onOpenTrends={handleOpenTrends}
        />
      )}

      {currentView === 'designers' && (
        <Disenadores
          onNavigateHome={handleBackToHome}
          onOpenEditor={handleOpenEditor}
          onOpenProfile={handleOpenProfile}
          onOpenPublicProfile={handleOpenPublicProfile}
          onOpenCollections={handleOpenCollections}
          onOpenTrends={handleOpenTrends}
        />
      )}

      {currentView === 'trends' && (
        <Tendencias
          onNavigateHome={handleBackToHome}
          onOpenEditor={handleOpenEditor}
          onOpenProfile={handleOpenProfile}
          onOpenCollections={handleOpenCollections}
          onOpenDesigners={handleOpenDesigners}
        />
      )}
    </div>
  );
}

export default App;