import { useEffect, useState } from 'react';
import { UserPlus, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const colors = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777'];
const getColor = (name: string) => colors[name?.charCodeAt(0) % colors.length];

export default function Friends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFriends(); }, []);

  useEffect(() => {
    if (search.trim() === '') setFiltered(friends);
    else setFiltered(friends.filter(f =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.email?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, friends]);

  const fetchFriends = async () => {
    try {
      // Get all group members across all groups = friends
      const res = await api.get('/groups');
      const memberSets = new Map();
      for (const group of res.data) {
        const grpRes = await api.get(`/groups/${group.id}`);
        for (const member of grpRes.data.members) {
          if (member.id !== user?.id) {
            memberSets.set(member.id, member);
          }
        }
      }
      const uniqueFriends = Array.from(memberSets.values());
      setFriends(uniqueFriends);
      setFiltered(uniqueFriends);
    } catch { toast.error('Failed to load friends'); }
    finally { setLoading(false); }
  };

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) return setSearchResults([]);
    try {
      const res = await api.get(`/auth/search?q=${q}`);
      setSearchResults(res.data);
    } catch {}
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
              placeholder="Search friends..."
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: '13px', color: '#1e293b', width: '100%',
                fontFamily: 'Inter, sans-serif'
              }} />
          </div>
          <div style={{ flex: 1 }} />
        </div>

        {/* Content */}
        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
              Friends
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>
              People you share expenses with
            </p>
          </div>

          {/* Search to add friends */}
          <div style={{
            background: 'white', borderRadius: '16px', padding: '20px',
            border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Find people on SplitMate
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '10px', padding: '10px 14px'
            }}>
              <Search size={15} color="#94a3b8" />
              <input value={searchQuery} onChange={e => searchUsers(e.target.value)}
                placeholder="Search by name or email to find friends..."
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: '13px', color: '#1e293b', width: '100%',
                  fontFamily: 'Inter, sans-serif'
                }} />
            </div>
            {searchResults.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                {searchResults.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px', borderRadius: '10px',
                    border: '1px solid #f1f5f9', marginBottom: '8px',
                    background: 'white'
                  }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: getColor(u.name), display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '700', fontSize: '15px', flexShrink: 0
                    }}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{u.email}</div>
                    </div>
                    <div style={{
                      fontSize: '11px', fontWeight: '600', color: '#64748b',
                      background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px'
                    }}>
                      Add to a group to connect
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friends List */}
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
                Your Friends
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {filtered.length} friends
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                <UserPlus size={44} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                <p style={{ fontSize: '14px' }}>
                  {search ? 'No friends match your search' : 'No friends yet. Add members to your groups!'}
                </p>
              </div>
            ) : filtered.map(friend => (
              <div key={friend.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '14px 20px',
                borderBottom: '1px solid #f8fafc', background: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: getColor(friend.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '800', fontSize: '18px', flexShrink: 0
                  }}>
                    {friend.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                      {friend.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {friend.email}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: '600', color: '#16a34a',
                  background: '#f0fdf4', padding: '4px 12px', borderRadius: '20px'
                }}>
                  Connected
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; padding-top: 58px !important; width: 100% !important; }
          .search-bar { width: 100% !important; flex: 1 !important; }
          .topbar-spacer { display: none !important; }
        }
      `}</style>
    </>
  );
}