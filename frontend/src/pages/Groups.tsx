import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ChevronRight, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const colors = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777'];
const getColor = (name: string) => colors[name?.charCodeAt(0) % colors.length];

const avatarStyle = (name: string): React.CSSProperties => ({
  width: '44px', height: '44px', borderRadius: '12px',
  background: getColor(name), display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: 'white', fontWeight: '800',
  fontSize: '18px', flexShrink: 0
});

export default function Groups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    if (search.trim() === '') setFiltered(groups);
    else setFiltered(groups.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, groups]);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
      setFiltered(res.data);
    } catch { toast.error('Failed to load groups'); }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/groups', { name, description: desc });
      toast.success('Group created!');
      setShowCreate(false);
      setName(''); setDesc('');
      navigate(`/groups/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" style={{
        marginLeft: '240px', minHeight: '100vh',
        background: '#f8fafc', fontFamily: 'Inter, sans-serif'
      }}>
        {/* Top Bar */}
        <div style={{
          background: 'white', borderBottom: '1px solid #f1f5f9',
          padding: '10px 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50, gap: '12px'
        }}>
          <div style={{ flex: 1 }} className="topbar-spacer" />
          <div className="search-bar" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '10px', padding: '9px 16px', width: '480px'
          }}>
            <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search groups..."
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: '13px', color: '#1e293b', width: '100%',
                fontFamily: 'Inter, sans-serif'
              }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreate(true)} className="create-btn" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#16a34a', color: 'white', border: 'none',
              borderRadius: '10px', padding: '10px 18px', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 2px 8px rgba(22,163,74,0.3)', whiteSpace: 'nowrap'
            }}>
              <Plus size={15} /> Create Group
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
              Groups
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>
              All your expense groups
            </p>
          </div>

          <div style={{
            background: 'white', borderRadius: '16px',
            border: '1px solid #f1f5f9', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                Your Groups
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {filtered.length} groups
              </span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                <Users size={44} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                <p style={{ fontSize: '14px' }}>
                  {search ? 'No groups match your search' : 'No groups yet. Create one!'}
                </p>
              </div>
            ) : filtered.map(group => {
              const bal = parseFloat(String(group.my_balance));
              return (
                <div key={group.id}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'white'}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '14px 20px',
                    borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                    transition: 'background 0.15s', background: 'white'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={avatarStyle(group.name)}>
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                        {group.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {group.member_count} members
                      </div>
                      {bal !== 0 && (
                        <div style={{
                          fontSize: '11px', fontWeight: '600', marginTop: '2px',
                          color: bal > 0 ? '#16a34a' : '#ef4444'
                        }}>
                          {bal > 0 ? `You are owed ₹${bal.toFixed(2)}` : `You owe ₹${Math.abs(bal).toFixed(2)}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '15px', fontWeight: '800',
                      color: bal >= 0 ? '#16a34a' : '#ef4444'
                    }}>
                      {bal >= 0 ? '+' : ''}₹{bal.toFixed(2)}
                    </span>
                    <ChevronRight size={16} color="#cbd5e1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, padding: '16px'
        }} onClick={() => setShowCreate(false)}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 24px' }}>
              Create New Group
            </h3>
            <form onSubmit={createGroup}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                Group Name
              </label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Goa Trip, Flatmates..." required
                style={{
                  width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                  outline: 'none', boxSizing: 'border-box', marginBottom: '16px',
                  background: 'white', color: '#1e293b'
                }} />
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                Description (optional)
              </label>
              <input value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="What's this group for?"
                style={{
                  width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                  outline: 'none', boxSizing: 'border-box', marginBottom: '24px',
                  background: 'white', color: '#1e293b'
                }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{
                  flex: 1, padding: '12px', background: '#f8fafc',
                  color: '#64748b', border: '1.5px solid #e2e8f0',
                  borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>Cancel</button>
                <button type="submit" disabled={loading} style={{
                  flex: 1, padding: '12px', background: '#16a34a',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
                }}>
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; padding-top: 58px !important; width: 100% !important; }
          .search-bar { width: 100% !important; flex: 1 !important; }
          .topbar-spacer { display: none !important; }
          .create-btn { padding: 9px 14px !important; font-size: 12px !important; }
        }
      `}</style>
    </>
  );
}