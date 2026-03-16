import React, { useState } from 'react';
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

  // Función para manejar el login exitoso
  const handleLoginSuccess = (usuario, token) => {
    console.log('Login exitoso:', usuario);
    setIsAuthenticated(true);
    setUserData({
      id: usuario.id_usuario,
      name: usuario.name || usuario.nombre_usuario || 'Usuario',
      email: usuario.email || usuario.correo || '',
      ...usuario // Guardamos todo el objeto usuario por si acaso
    });
    setCurrentView('home');
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    setSelectedUserId(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    setCurrentView('login');
  };

  // Función para abrir el editor
  const handleOpenEditor = () => {
    setCurrentView('editor');
  };

  // Función para abrir el workspace
  const handleOpenWorkspace = (design = null) => {
    console.log('Abriendo Workspace:', design ? 'Editando diseño' : 'Nuevo diseño');
    setEditingDesign(design); // Si hay diseño, lo pasamos para editar
    setCurrentView('workspace');
  };

  // Función para volver a home
  const handleBackToHome = () => {
    setCurrentView('home');
  };

  // Función para volver al perfil desde workspace
  const handleBackToProfile = () => {
    setEditingDesign(null); // Limpiar diseño al volver
    setCurrentView('profile');
  };

  // Función para abrir el perfil propio
  const handleOpenProfile = () => {
    setCurrentView('profile');
  };

  // Función para abrir perfil público de otro usuario
  const handleOpenPublicProfile = (userId) => {
    console.log('🔍 Abriendo perfil público de usuario:', userId);
    console.log('📊 userData actual:', userData);

    // Verificar si es el mismo usuario
    if (userData && userId === userData.id) {
      console.log('👤 Es el mismo usuario, abriendo perfil personal');
      setCurrentView('profile');
    } else {
      console.log('👥 Es otro usuario, abriendo perfil público');
      setSelectedUserId(userId);
      setCurrentView('publicProfile');
    }
  };

  // Función para abrir colecciones
  const handleOpenCollections = () => {
    setCurrentView('collections');
  };

  // Función para abrir diseñadores
  const handleOpenDesigners = () => {
    setCurrentView('designers');
  };

  // Función para abrir tendencias
  const handleOpenTrends = () => {
    setCurrentView('trends');
  };

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
          onOpenWorkspace={handleOpenWorkspace}  // ← Pasamos función con soporte para edición
          userData={userData}
        />
      )}

      {currentView === 'publicProfile' && selectedUserId && (
        <PublicProfile
          userId={selectedUserId}
          onBack={handleBackToHome}
          loggedUserId={userData.id}
        />
      )}

      {currentView === 'workspace' && (
        <Workspace
          onBack={handleBackToProfile}
          userData={userData}
          draftDesign={editingDesign}  // ← Pasamos el diseño a editar (si existe)
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