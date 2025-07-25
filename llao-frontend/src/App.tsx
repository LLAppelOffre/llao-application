import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import VisualisationPage from './pages/VisualisationPage';
import MesAOPage from './pages/MesAOPage';
import RapportPage from './pages/RapportPage';
import SelectionAOPertinentsPage from './pages/SelectionAOPertinentsPage';
import RepondreAOPage from './pages/RepondreAOPage';
import MainTabs from './components/MainTabs';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import AccountMenu from './components/AccountMenu';
import { AuthProvider, useAuth } from './context/AuthContext';

interface AppProps {
  // mode: 'light' | 'dark'; // Removed as per edit hint
  // setMode: (mode: 'light' | 'dark') => void; // Removed as per edit hint
}

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Suppression des imports MUI et de la logique ThemeProvider/mode clair-sombre
// const ThemeSwitch: React.FC<{ mode: 'light' | 'dark'; setMode: (mode: 'light' | 'dark') => void }> = ({ mode, setMode }) => (
//   <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 2000 }}>
//     <IconButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color="inherit">
//       {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
//     </IconButton>
//   </div>
// );

const AppContent: React.FC<AppProps> = ({ /* mode, setMode */ }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  return (
    <div>
      {/* <ThemeSwitch mode={mode} setMode={setMode} /> */}
      {isAuthenticated && <MainTabs collapsed={collapsed} setCollapsed={setCollapsed} />}
      <div
        className="app-main-content"
        style={{ marginLeft: isAuthenticated ? (collapsed ? 48 : 180) : 0, transition: 'margin-left 0.2s' }}
      >
        {isAuthenticated && <AccountMenu />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Routes>
                  <Route path="visualisation/*" element={<VisualisationPage />} />
                  <Route path="mes-ao/*" element={<MesAOPage />} />
                  <Route path="rapport" element={<RapportPage />} />
                  <Route path="selection-ao-pertinents/*" element={<SelectionAOPertinentsPage />} />
                  <Route path="repondre-ao" element={<RepondreAOPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC<AppProps> = (props) => (
  <AuthProvider>
    <AppContent {...props} />
  </AuthProvider>
);

export default App; 