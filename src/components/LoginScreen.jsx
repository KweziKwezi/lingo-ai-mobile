import { useState } from 'react';
import { authService } from '../services/api';

export default function LoginScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await authService.login(email, password);
      else { await authService.register(name, email, password); await authService.login(email, password); }
      onLogin();
    } catch (err) { setError(err.response?.data?.detail || 'An error occurred.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-icon">
          <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <h1 className="auth-title">{isLogin ? 'Welcome Back!' : 'Create Account'}</h1>
        <p className="auth-subtitle">{isLogin ? 'Login to continue learning' : 'Join Lingo AI today'}</p>

        <form onSubmit={handleSubmit}>
          {!isLogin && <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="input" required />}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required minLength={6} />
          
          {error && <div className="error-msg">{error}</div>}
          
          <button type="submit" disabled={loading} className="btn">{loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}</button>
        </form>
        
        <button onClick={() => setIsLogin(!isLogin)} className="btn-link">
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
      </div>
    </div>
  );
}