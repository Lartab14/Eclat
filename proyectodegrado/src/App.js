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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
  }, []);

  // ✅ Refrescar stats del usuario desde la BD
  const refrescarStats = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/usuarios/${userId}`);
      const data = await res.json();
      if (data.stats) {
        setUserData(prev => {
          const updated = { ...prev, stats: data.stats };
          localStorage.setItem('userData', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.error('Error refrescando stats:', e);
    }
  };

  const handleLoginSuccess = (usuario, token) => {
    const user = {
      id: usuario.id_usuario,
      id_usuario: usuario.id_usuario,
      name: usuario.name || usuario.nombre_usuario || 'Usuario',
      nombre_usuario: usuario.nombre_usuario,
      email: usuario.email || usuario.correo || '',
      correo: usuario.correo,
      ...usuario
    };
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
    setIsAuthenticated(true);
    setUserData(user);
    setCurrentView('home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    setSelectedUserId(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');
    setCurrentView('login');
  };

  const handleUpdateProfile = (updatedProfile) => {
    const newData = { ...userData, ...updatedProfile };
    localStorage.setItem('userData', JSON.stringify(newData));
    setUserData(newData);
  };

  const handleOpenEditor = () => setCurrentView('editor');

  const handleOpenWorkspace = (design = null) => {
    setEditingDesign(design);
    setCurrentView('workspace');
  };

  const handleBackToHome = () => setCurrentView('home');

  const handleBackToProfile = () => {
    setEditingDesign(null);
    setCurrentView('profile');
  };

  // ✅ Al abrir el perfil propio, refrescar stats
  const handleOpenProfile = () => {
    if (userData?.id_usuario) refrescarStats(userData.id_usuario);
    setCurrentView('profile');
  };

  const handleOpenPublicProfile = (userId) => {
    if (userData && (userId === userData.id || userId === userData.id_usuario)) {
      handleOpenProfile();
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
          loggedUserId={userData?.id_usuario || userData?.id}
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