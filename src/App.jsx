import { useState, useEffect } from 'react';
import { authService, api } from './services/api';
import LoginScreen from './components/LoginScreen';
import MainApp from './components/MainApp';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch user profile to check if admin
      api.get('/me').then(res => {
        // CHANGE THIS EMAIL TO YOUR ACTUAL ADMIN EMAIL
        setIsAdmin(res.data.email === 'Cyberglitch501@gmail.com'); 
      }).catch(() => setIsAdmin(false));
    }
  }, [isAuthenticated]);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => { 
    authService.logout(); 
    setIsAuthenticated(false); 
    setIsAdmin(false);
  };

  return (
    <div className="app-root">
      {isAuthenticated ? <MainApp onLogout={handleLogout} isAdmin={isAdmin} /> : <LoginScreen onLogin={handleLogin} />}
    </div>
  );
}

export default App;