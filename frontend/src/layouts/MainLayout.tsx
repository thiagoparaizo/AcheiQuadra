// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogIn, MapPin, Grid, LogOut, Calendar, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MainLayout: React.FC = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-primary font-bold text-xl">QuadrasApp</span>
            </Link>

            {/* Menu de navegação - Desktop */}
            <nav className="hidden md:flex space-x-6">
              <NavLink
                to="/courts"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md ${
                    isActive ? 'text-primary font-medium' : 'text-gray-700 hover:text-primary'
                  }`
                }
              >
                <Grid size={18} className="mr-1" />
                Quadras
              </NavLink>
              <NavLink
                to="/arenas"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md ${
                    isActive ? 'text-primary font-medium' : 'text-gray-700 hover:text-primary'
                  }`
                }
              >
                <MapPin size={18} className="mr-1" />
                Arenas
              </NavLink>
            </nav>

            {/* Botões de ação - Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <User size={18} className="mr-1" />
                    <span className="max-w-[100px] truncate">{user?.first_name || 'Usuário'}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-20">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b">
                        Logado como <span className="font-semibold">{user?.email}</span>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Meu Perfil
                      </Link>
                      <Link
                        to="/profile/bookings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Calendar size={14} className="mr-2" />
                        Minhas Reservas
                      </Link>
                      {user?.role === 'arena_owner' && (
                        <Link
                          to="/arena-admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={14} className="mr-2" />
                          Gerenciar Arena
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut size={14} className="mr-2" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <LogIn size={18} className="mr-1" />
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                  >
                    Cadastre-se
                  </Link>
                </>
              )}
            </div>

            {/* Botão de menu - Mobile */}
            <button
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={toggleMenu}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-2">
              <NavLink
                to="/courts"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md ${
                    isActive ? 'text-primary font-medium' : 'text-gray-700 hover:text-primary'
                  }`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Grid size={18} className="mr-1" />
                Quadras
              </NavLink>
              <NavLink
                to="/arenas"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md ${
                    isActive ? 'text-primary font-medium' : 'text-gray-700 hover:text-primary'
                  }`
                }
                onClick={() => setMenuOpen(false)}
              >
                <MapPin size={18} className="mr-1" />
                Arenas
              </NavLink>
              <div className="border-t my-2"></div>

              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm font-medium text-gray-500">
                    Olá, {user?.first_name || 'Usuário'}
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={18} className="mr-1" />
                    Meu Perfil
                  </Link>
                  <Link
                    to="/profile/bookings"
                    className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Calendar size={18} className="mr-1" />
                    Minhas Reservas
                  </Link>
                  {user?.role === 'arena_owner' && (
                    <Link
                      to="/arena-admin"
                      className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings size={18} className="mr-1" />
                      Gerenciar Arena
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-gray-100"
                  >
                    <LogOut size={18} className="mr-1" />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LogIn size={18} className="mr-1" />
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    onClick={() => setMenuOpen(false)}
                  >
                    Cadastre-se
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-grow bg-gray-50">
        <Outlet />
      </main>

      {/* Rodapé */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo e descrição */}
            <div>
              <h3 className="text-lg font-bold mb-4">QuadrasApp</h3>
              <p className="text-gray-400">
                A plataforma ideal para encontrar e reservar quadras esportivas perto de você.
              </p>
            </div>

            {/* Links rápidos */}
            <div>
              <h3 className="text-lg font-bold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/courts" className="text-gray-400 hover:text-white">
                    Encontrar quadras
                  </Link>
                </li>
                <li>
                  <Link to="/arenas" className="text-gray-400 hover:text-white">
                    Encontrar arenas
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white">
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white">
                    Cadastrar-se
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-lg font-bold mb-4">Contato</h3>
              <p className="text-gray-400 mb-2">contato@quadrasapp.com</p>
              <p className="text-gray-400">(11) 99999-9999</p>

              {/* Redes sociais */}
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} QuadrasApp. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
