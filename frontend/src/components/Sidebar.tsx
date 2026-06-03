import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, UserCircle, Receipt,
  Scale, CreditCard, Settings, LogOut, Menu, X
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Groups', path: '/groups', icon: Users },
  { label: 'Friends', path: '/friends', icon: UserCircle },
  { label: 'Expenses', path: '/expenses', icon: Receipt },
  { label: 'Balances', path: '/balances', icon: Scale },
  { label: 'Settlements', path: '/settlements', icon: CreditCard },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            borderRadius: '10px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,163,74,0.3)'
          }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '18px' }}>S</span>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
            SplitMate
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {navItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 14px', borderRadius: '12px', marginBottom: '2px',
                textDecoration: 'none', transition: 'all 0.15s',
                background: isActive ? '#f0fdf4' : 'transparent',
                color: isActive ? '#16a34a' : '#64748b',
                fontWeight: isActive ? '600' : '500',
                fontSize: '14px', fontFamily: 'Inter, sans-serif'
              }}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {label}
              {isActive && (
                <div style={{
                  marginLeft: 'auto', width: '6px', height: '6px',
                  borderRadius: '50%', background: '#16a34a'
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px', borderRadius: '12px', marginBottom: '8px',
          background: '#f8fafc'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '700', fontSize: '15px'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              fontSize: '13px', fontWeight: '600', color: '#1e293b',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              fontFamily: 'Inter, sans-serif'
            }}>
              {user?.name}
            </div>
            <div style={{
              fontSize: '11px', color: '#94a3b8',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              fontFamily: 'Inter, sans-serif'
            }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          color: '#94a3b8', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: '13px', fontWeight: '500',
          padding: '8px 12px', width: '100%', borderRadius: '8px',
          fontFamily: 'Inter, sans-serif', transition: 'all 0.15s'
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
            (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
          }}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'white', borderBottom: '1px solid #f1f5f9',
        padding: '14px 16px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }} className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            borderRadius: '8px', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>S</span>
          </div>
          <span style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>SplitMate</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
          display: 'flex', alignItems: 'center', padding: '4px'
        }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150
        }} />
      )}

      {/* Mobile Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: '260px',
        background: 'white', zIndex: 300,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
      }} className="mobile-drawer">
        <NavContent />
      </div>

      {/* Desktop Sidebar */}
      <div style={{
        width: '240px', height: '100vh', background: 'white',
        borderRight: '1px solid #f1f5f9', display: 'flex',
        flexDirection: 'column', position: 'fixed', left: 0, top: 0,
        zIndex: 100, boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
      }} className="desktop-sidebar">
        <NavContent />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-topbar { display: none !important; }
          .mobile-drawer { display: none !important; }
        }
      `}</style>
    </>
  );
}