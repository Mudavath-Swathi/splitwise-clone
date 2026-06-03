import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.user, res.data.token);
      toast.success('Account created!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '40px',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: '#16a34a',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 6px 20px rgba(22,163,74,0.3)'
          }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: '800' }}>S</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px' }}>
            Create account
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Join SplitMate and split expenses easily
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '13px',
              fontWeight: '600', color: '#374151', marginBottom: '6px'
            }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Enter your full name"
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #e2e8f0', borderRadius: '12px',
                fontSize: '14px', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
                background: 'white', color: '#1e293b',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '13px',
              fontWeight: '600', color: '#374151', marginBottom: '6px'
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #e2e8f0', borderRadius: '12px',
                fontSize: '14px', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
                background: 'white', color: '#1e293b',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontSize: '13px',
              fontWeight: '600', color: '#374151', marginBottom: '6px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Min. 6 characters"
              minLength={6}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #e2e8f0', borderRadius: '12px',
                fontSize: '14px', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
                background: 'white', color: '#1e293b',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#86efac' : '#16a34a',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', color: '#64748b',
          marginTop: '20px', fontSize: '14px'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: '#16a34a', fontWeight: '700', textDecoration: 'none'
          }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}