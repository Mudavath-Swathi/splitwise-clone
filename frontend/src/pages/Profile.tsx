import { useEffect, useState } from 'react';
import { User, Mail, Calendar } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const colors = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777'];
const getColor = (name: string) => colors[name?.charCodeAt(0) % colors.length];

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ groups: 0 });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, groupsRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/groups')
      ]);
      setProfile(profileRes.data);
      setStats({ groups: groupsRes.data.length });
    } catch { toast.error('Failed to load profile'); }
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" style={{
        marginLeft: '240px', height: '100vh', overflow: 'hidden',
        background: '#f8fafc', fontFamily: 'Inter, sans-serif',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Top Bar */}
        <div style={{
          background: 'white', borderBottom: '1px solid #f1f5f9',
          padding: '10px 24px', flexShrink: 0
        }}>
          <div style={{ height: '44px', display: 'flex', alignItems: 'center' }}>
            <User size={18} color="#16a34a" />
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginLeft: '8px' }}>
              Profile & Settings
            </span>
          </div>
        </div>

        {/* Content - fits in screen */}
        <div style={{ padding: '20px 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Profile Card */}
          <div style={{
            background: 'white', borderRadius: '16px', padding: '20px',
            border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            {/* Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: getColor(user?.name || ''),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '800', fontSize: '22px', flexShrink: 0
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 2px' }}>
                  {user?.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>SplitMate Member</p>
              </div>
            </div>

            {/* Info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={14} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em' }}>FULL NAME</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginTop: '1px' }}>{user?.name}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={14} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em' }}>EMAIL</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginTop: '1px' }}>{user?.email}</div>
                </div>
              </div>

              {profile?.created_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={14} color="#7c3aed" />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em' }}>MEMBER SINCE</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginTop: '1px' }}>
                      {new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{
              background: 'white', borderRadius: '14px', padding: '16px',
              border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a' }}>{stats.groups}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Groups joined</div>
            </div>
            <div style={{
              background: 'white', borderRadius: '14px', padding: '16px',
              border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb' }}>∞</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Expenses tracked</div>
            </div>
          </div>

          {/* App Info */}
          <div style={{
            background: 'white', borderRadius: '14px', padding: '16px',
            border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>
              APP INFO
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>App name</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>SplitMate</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Version</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Currency</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>₹ Indian Rupee</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            padding-top: 58px !important;
            height: auto !important;
            overflow: auto !important;
          }
        }
      `}</style>
    </>
  );
}