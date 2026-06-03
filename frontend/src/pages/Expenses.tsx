import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ChevronRight, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const colors = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777'];
const getColor = (name: string) => colors[name?.charCodeAt(0) % colors.length];

export default function Expenses() {
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (search.trim() === '') setFiltered(allExpenses);
    else setFiltered(allExpenses.filter(e =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.group_name?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, allExpenses]);

  const fetchAll = async () => {
    try {
      const res = await api.get('/groups');
      const promises = res.data.map((g: any) =>
        api.get(`/expenses/group/${g.id}`).then(r =>
          r.data.map((e: any) => ({ ...e, group_name: g.name }))
        )
      );
      const results = await Promise.all(promises);
      const flat = results.flat().sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAllExpenses(flat);
      setFiltered(flat);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
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
              placeholder="Search expenses..."
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
              Expenses
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>
              All expenses across your groups
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
                All Expenses
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {filtered.length} expenses
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                <Receipt size={44} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                <p style={{ fontSize: '14px' }}>
                  {search ? 'No expenses match your search' : 'No expenses yet. Add one from a group!'}
                </p>
              </div>
            ) : filtered.map(exp => (
              <div key={exp.id}
                onClick={() => navigate(`/expenses/${exp.id}`)}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'white'}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '14px 20px',
                  borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                  transition: 'background 0.15s', background: 'white'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: getColor(exp.description),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '800', fontSize: '17px', flexShrink: 0
                  }}>
                    {exp.description?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                      {exp.description}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {exp.group_name} · Paid by {exp.paid_by_name} · {new Date(exp.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                    ₹{parseFloat(exp.amount).toFixed(2)}
                  </span>
                  <ChevronRight size={15} color="#cbd5e1" />
                </div>
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