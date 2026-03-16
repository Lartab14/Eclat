import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Sparkles } from 'lucide-react';
import './Login.css';
import LogoEclat from './img/LogoEclat.png';

// Configuración de la URL base del API
const API_URL = process.env.REACT_APP_API_URL;
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Login({ onLoginSuccess }) {
    const [activeTab, setActiveTab] = useState('login');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        rol: 'espectador',
        rememberMe: false,
        acceptTerms: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(''); // Limpiar errores al escribir
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/usuarios/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            console.log("Datos de login recibidos:", data);

            // Guardar token en localStorage
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userId', data.usuario.id_usuario);
            }

            // Llamar a onLoginSuccess con el usuario completo y el token
            if (onLoginSuccess) {
                console.log(data.usuario);
                onLoginSuccess(data.usuario, data.token);
            }

        } catch (err) {
            setError(err.message);
            console.error('Error en login:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.acceptTerms) {
            setError('Debes aceptar los términos y condiciones');
            return;
        }

        if (!formData.name || formData.name.trim() === '') {
            setError('Por favor ingresa tu nombre completo');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre_usuario: formData.name.trim(),
                    correo: formData.email,
                    contraseña: formData.password,
                    rol: formData.rol
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al crear la cuenta');
            }

            console.log("Usuario registrado:", data);

            // Después de registrarse, hacer login automático
            try {
                const loginResponse = await fetch(`${API_URL}/usuarios/auth`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    })
                });

                const loginData = await loginResponse.json();

                if (loginResponse.ok) {
                    // Guardar token
                    if (loginData.token) {
                        localStorage.setItem('authToken', loginData.token);
                        localStorage.setItem('userId', loginData.usuario.id_usuario);
                    }

                    // Llamar a onLoginSuccess con los datos completos
                    if (onLoginSuccess) {
                        onLoginSuccess(loginData.usuario, loginData.token);
                    }
                } else {
                    // Si el login automático falla, mostrar mensaje de éxito pero pedir login manual
                    setError('Cuenta creada exitosamente. Por favor inicia sesión.');
                    setActiveTab('login');
                }
            } catch (loginErr) {
                console.error('Error en login automático:', loginErr);
                setError('Cuenta creada exitosamente. Por favor inicia sesión.');
                setActiveTab('login');
            }

        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor');
            console.error('Error en registro:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Redirigir a la ruta de OAuth de Google en tu backend
        window.location.href = `${API_URL}/auth/google`;
    };

    const handleGitHubLogin = () => {
        // Redirigir a la ruta de OAuth de GitHub en tu backend
        window.location.href = `${API_URL}/auth/github`;
    };

    return (
        <div className="login-container">
            <div className="login-card">

                {/* Header */}
                <div className="login-header">
                    <div className="login-logo">
                        <img src={LogoEclat} alt="Éclat" />
                    </div>
                    <h1 className="login-title">Bienvenido a Éclat</h1>
                    <p className="login-subtitle">
                        La plataforma para diseñadores emergentes
                    </p>
                </div>

                {/* Tabs */}
                <div className="login-tabs">
                    <button
                        className={`tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('login');
                            setError('');
                        }}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        className={`tab ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('register');
                            setError('');
                        }}
                    >
                        Registrarse
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {/* LOGIN */}
                {activeTab === 'login' && (
                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">
                                <Mail size={18} /> Correo electrónico
                            </label>
                            <input
                                className="form-input"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="tu@ejemplo.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Lock size={18} /> Contraseña
                            </label>

                            <div className="password-input-wrapper">
                                <input
                                    className="form-input"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                />
                                <span>Recordarme</span>
                            </label>
                        </div>

                        <button 
                            className="submit-button" 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Cargando...' : 'Iniciar sesión'}
                        </button>

                        <div className="forgot-password">
                            <a href="#" className="link">¿Olvidaste tu contraseña?</a>
                        </div>
                    </form>
                )}

                {/* REGISTER */}
                {activeTab === 'register' && (
                    <form className="login-form" onSubmit={handleRegister}>

                        <div className="form-group">
                            <label className="form-label">
                                <User size={18} /> Nombre completo
                            </label>
                            <input
                                className="form-input"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Ej: María García"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Mail size={18} /> Correo electrónico
                            </label>
                            <input
                                className="form-input"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="tu@ejemplo.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Lock size={18} /> Contraseña
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    className="form-input"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Sparkles size={18} /> Tipo de cuenta
                            </label>
                            <select
                                name="rol"
                                value={formData.rol}
                                onChange={handleInputChange}
                                className="form-input"
                                disabled={isLoading}
                            >
                                <option value="espectador">Espectador - Explorar diseños</option>
                                <option value="diseñador">Diseñador - Crear y compartir</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label terms">
                                <input
                                    type="checkbox"
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                />
                                <span>
                                    Acepto los{' '}
                                    <a href="#" className="link">términos y condiciones</a> y la{' '}
                                    <a href="#" className="link">política de privacidad</a>
                                </span>
                            </label>
                        </div>

                        <button 
                            className="submit-button" 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                        </button>
                    </form>
                )}

                {/* Divider - Opcional para OAuth */}
                {/* 
                <div className="divider">
                    <span>O continúa con</span>
                </div>

                <div className="social-login">
                    <button 
                        className="social-button google"
                        onClick={handleGoogleLogin}
                        type="button"
                        disabled={isLoading}
                    >
                        <img src="/google-icon.svg" alt="Google" />
                        Google
                    </button>
                    <button 
                        className="social-button github"
                        onClick={handleGitHubLogin}
                        type="button"
                        disabled={isLoading}
                    >
                        <img src="/github-icon.svg" alt="GitHub" />
                        GitHub
                    </button>
                </div>
                */}

            </div>
        </div>
    );
}