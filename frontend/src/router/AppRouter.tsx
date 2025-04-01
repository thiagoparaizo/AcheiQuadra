// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Páginas principais
import CourtsListingPage from '../pages/courts/CourtsListingPage';
import CourtDetailPage from '../pages/courts/CourtDetailPage';
import ArenasListingPage from '../pages/arenas/ArenasListingPage';
import ArenaDetailPage from '../pages/arenas/ArenaDetailPage';
import BookingFormPage from '../pages/booking/BookingFormPage';
import PaymentPage from '../pages/payment/PaymentPage';

// Páginas de autenticação
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Páginas de perfil de usuário
import UserProfilePage from '../pages/profile/UserProfilePage';
import UserBookingsPage from '../pages/profile/UserBookingsPage';

// Páginas administrativas
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminUserDetailPage from '../pages/admin/AdminUserDetailPage';
import AdminArenasPage from '../pages/admin/AdminArenasPage';
import AdminEditArenaPage from '../pages/admin/AdminEditArenaPage';
import AdminCreateArenaPage from '../pages/admin/AdminCreateArenaPage';
import AdminCourtsPage from '../pages/admin/AdminCourtsPage';
import AdminBookingsPage from '../pages/admin/AdminBookingsPage';
import AdminBookingDetailsPage from '../pages/admin/AdminBookingDetailsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';

// Contexto de autenticação
import { AuthProvider } from '../contexts/AuthContext';

// Componente para rota protegida que requer papel específico
interface ProtectedRouteProps {
  children: React.ReactNode;
  roles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  // Componente fictício para demonstrar o conceito
  // Em uma implementação real, você verificaria se o usuário está autenticado
  // e se seu papel está na lista de papéis permitidos
  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota padrão para página inicial */}
          <Route path="/" element={<Navigate to="/courts" replace />} />

          {/* Rotas de autenticação */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rotas com layout principal */}
          <Route element={<MainLayout />}>
            {/* Rotas de quadras */}
            <Route path="/courts" element={<CourtsListingPage />} />
            <Route path="/courts/:id" element={<CourtDetailPage />} />

            {/* Rotas de arenas */}
            <Route path="/arenas" element={<ArenasListingPage />} />
            <Route path="/arenas/:id" element={<ArenaDetailPage />} />

            {/* Rotas de reserva e pagamento */}
            <Route path="/booking/:courtId" element={<BookingFormPage />} />
            <Route path="/payment/:bookingId" element={<PaymentPage />} />

            {/* Rotas de perfil */}
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/profile/bookings" element={<UserBookingsPage />} />
          </Route>

          {/* Rotas administrativas */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            {/* Usuários */}
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:id" element={<AdminUserDetailPage />} />
            {/* Arenas */}
            <Route path="arenas" element={<AdminArenasPage />} />
            <Route path="arenas/new" element={<AdminCreateArenaPage />} />
            <Route path="arenas/:id/edit" element={<AdminEditArenaPage />} />
            <Route path="arenas/:id/courts" element={<AdminCourtsPage />} />
            {/** Quadras / Courts */}
            <Route path="courts/:id" element={<CourtDetailPage />} /> {/* TODO AJUSTAR*/}
            <Route path="arenas/:id/courts/new" element={<AdminCourtsPage />} /> {/* TODO AJUSTAR*/}
            <Route path="courts/:id/edit" element={<AdminCourtsPage />} /> {/* TODO AJUSTAR*/}
            {/* Reservas */}
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="bookings/:id" element={<AdminBookingDetailsPage />} />
            {/* Configurações */}
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Rota 404 para páginas não encontradas */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-xl mb-8">Página não encontrada</p>
                <a
                  href="/"
                  className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-dark"
                >
                  Voltar para a página inicial
                </a>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;
