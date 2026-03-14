import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SuratProvider } from './context/SuratContext';
import { FeatureKey } from './types';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SuratMasukPage from './pages/SuratMasukPage';
import SuratKeluarPage from './pages/SuratKeluarPage';
import DisposisiPage from './pages/DisposisiPage';
import BuatSuratPage from './pages/BuatSuratPage';
import LaporanPage from './pages/LaporanPage';
import PengaturanPage from './pages/PengaturanPage';
import ManajemenAkunPage from './pages/ManajemenAkunPage';
import HakAksesPage from './pages/HakAksesPage';
import ProfilPage from './pages/ProfilPage';

function ProtectedRoute({ children, feature }: { children: React.ReactNode; feature?: FeatureKey }) {
  const { isAuthenticated, hasFeatureAccess } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (feature && !hasFeatureAccess(feature)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute feature="dashboard"><Dashboard /></ProtectedRoute>} />
      <Route path="/surat-masuk" element={<ProtectedRoute feature="surat_masuk"><SuratMasukPage /></ProtectedRoute>} />
      <Route path="/surat-keluar" element={<ProtectedRoute feature="surat_keluar"><SuratKeluarPage /></ProtectedRoute>} />
      <Route path="/disposisi" element={<ProtectedRoute feature="disposisi"><DisposisiPage /></ProtectedRoute>} />
      <Route path="/buat-surat" element={<ProtectedRoute feature="buat_surat"><BuatSuratPage /></ProtectedRoute>} />
      <Route path="/laporan" element={<ProtectedRoute feature="laporan"><LaporanPage /></ProtectedRoute>} />
      <Route path="/pengaturan" element={<ProtectedRoute feature="pengaturan"><PengaturanPage /></ProtectedRoute>} />
      <Route path="/manajemen-akun" element={<ProtectedRoute feature="pengaturan"><ManajemenAkunPage /></ProtectedRoute>} />
      <Route path="/hak-akses" element={<ProtectedRoute feature="pengaturan"><HakAksesPage /></ProtectedRoute>} />
      <Route path="/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SuratProvider>
          <AppRoutes />
        </SuratProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
