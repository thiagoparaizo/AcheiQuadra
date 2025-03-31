// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importar componentes de páginas
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

// Importar componente de layout
import MainLayout from '../layouts/MainLayout';
import { AuthProvider } from '../contexts/AuthContext';

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

            {/* Adicionar mais rotas conforme necessário:
                - /profile/payments (histórico de pagamentos)
                - /profile/change-password (alterar senha)
                - /forgot-password, etc.
            */}
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
