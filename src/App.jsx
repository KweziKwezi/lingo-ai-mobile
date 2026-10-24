import { useState, useEffect } from 'react';
import { authService } from './services/api';
import LoginScreen from './components/LoginScreen';
import MainApp from './components/MainApp';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => { authService.logout(); setIsAuthenticated(false); };

  return (
    <div className="app-root">
      {isAuthenticated ? <MainApp onLogout={handleLogout} /> : <LoginScreen onLogin={handleLogin} />}
    </div>
  );
}

export default App;