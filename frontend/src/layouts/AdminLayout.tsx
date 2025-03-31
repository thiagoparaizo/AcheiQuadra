// src/layouts/AdminLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Building,
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Verificar se o link atual está ativo
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Barra superior */}
      <header className="bg-white shadow-sm z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo e botão de menu para mobile */}
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <Link to="/admin" className="flex items-center">
                <span className="text-primary font-bold text-xl">Admin QuadrasApp</span>
              </Link>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                  <User size={18} />
                </div>
                <span className="ml-2 hidden sm:block">{user?.first_name || 'Admin'}</span>
                <ChevronDown size={16} className="ml-1" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                  <div className="py-1">
                    <p className="px-4 py-2 text-sm text-gray-500 border-b">
                      Conectado como <span className="font-semibold">Admin</span>
                    </p>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Meu Perfil
                    </Link>
                    <Link
                      to="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Voltar ao Site
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - versão mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            ></div>

            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Fechar menu</span>
                  <X size={24} className="text-white" />
                </button>
              </div>

              <nav className="flex-1 px-2 py-4 bg-white space-y-1">{renderNavLinks()}</nav>
            </div>
          </div>
        )}

        {/* Sidebar - versão desktop */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
              <nav className="flex-1 px-2 py-4 bg-white space-y-1">{renderNavLinks()}</nav>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {!isAuthenticated ? (
            <div className="py-12 px-4 flex justify-center">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded flex items-center">
                <AlertCircle size={20} className="mr-2" />
                Por favor, faça login para acessar a área administrativa.
              </div>
            </div>
          ) : user?.role !== 'admin' ? (
            <div className="py-12 px-4 flex justify-center">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                <AlertCircle size={20} className="mr-2" />
                Você não tem permissão para acessar a área administrativa.
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );

  // Função para renderizar os links de navegação
  function renderNavLinks() {
    const navLinks = [
      {
        to: '/admin',
        icon: <LayoutDashboard size={20} />,
        label: 'Dashboard',
      },
      {
        to: '/admin/users',
        icon: <Users size={20} />,
        label: 'Usuários',
      },
      {
        to: '/admin/arenas',
        icon: <Building size={20} />,
        label: 'Arenas',
      },
      {
        to: '/admin/bookings',
        icon: <Calendar size={20} />,
        label: 'Reservas',
      },
      {
        to: '/admin/settings',
        icon: <Settings size={20} />,
        label: 'Configurações',
      },
    ];

    return navLinks.map((link) => (
      <Link
        key={link.to}
        to={link.to}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
          isActive(link.to) ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <span className="mr-3">{link.icon}</span>
        {link.label}
      </Link>
    ));
  }
};

export default AdminLayout;
