import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const colors = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777'];
const getColor = (name: string) => colors[name?.charCodeAt(0) % colors.length];

export default function Balances() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groupBalances, setGroupBalances] = useState<any[]>([]);
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwe, setTotalOwe] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const groupsRes = await api.get('/groups');
      const balanceData = [];

      for (const group of groupsRes.data) {
        const balRes = await api.get(`/groups/${group.id}/balances`);
        const myBalance = balRes.data.find((b: any) => b.id === user?.id);
        if (myBalance && myBalance.balance !== 0) {
          balanceData.push({
            group_id: group.id,
            group_name: group.name,
            balance: myBalance.balance,
            members: balRes.data
          });
        }
      }

      setGroupBalances(balanceData);

      // Calculate totals
      const owed = balanceData.filter(b => b.balance > 0).reduce((s, b) => s + b.balance, 0);
      const owe = balanceData.filter(b => b.balance < 0).reduce((s, b) => s + Math.abs(b.balance), 0);
      setTotalOwed(owed);
      setTotalOwe(owe);

      // Also get overall balance from API
      const myBalRes = await api.get('/expenses/my-balances');
      setTotalOwed(parseFloat(myBalRes.data.total_owed_to_me || '0'));
      setTotalOwe(parseFloat(myBalRes.data.total_i_owe || '0'));

    } catch { toast.error('Failed to load balances'); }
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
          padding: '10px 24px', position: 'sticky', top: 0, zIndex: 50
        }}>
          <div style={{ height: '44px', display: 'flex', alignItems: 'center' }}>
            <Scale size={18} color="#16a34a" />
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginLeft: '8px' }}>Balances</span>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Balances</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>Your balance summary across all groups</p>
          </div>

          {/* Summary Cards */}
          <div className="bal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '28px' }}>
            <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>Total owed to you</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a' }}>₹{totalOwed.toFixed(2)}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>People owe you this</div>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>You owe</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444' }}>₹{totalOwe.toFixed(2)}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>You owe this to others</div>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>Net balance</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: totalOwed - totalOwe >= 0 ? '#16a34a' : '#ef4444' }}>
                ₹{Math.abs(totalOwed - totalOwe).toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                {totalOwed - totalOwe >= 0 ? 'Overall you are owed' : 'Overall you owe'}
              </div>
            </div>
          </div>

          {/* Group Balances */}
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
          ) : groupBalances.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <Scale size={44} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              <p style={{ fontSize: '14px' }}>You are all settled up! 🎉</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupBalances.map(gb => (
                <div key={gb.group_id}
                  onClick={() => navigate(`/groups/${gb.group_id}`)}
                  style={{
                    background: 'white', borderRadius: '14px',
                    border: '1px solid #f1f5f9', padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer', transition: 'box-shadow 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: getColor(gb.group_name), display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '800', fontSize: '18px'
                      }}>
                        {gb.group_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{gb.group_name}</div>
                        <div style={{ fontSize: '12px', color: gb.balance > 0 ? '#16a34a' : '#ef4444', fontWeight: '600', marginTop: '2px' }}>
                          {gb.balance > 0 ? `You are owed ₹${gb.balance.toFixed(2)}` : `You owe ₹${Math.abs(gb.balance).toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: gb.balance > 0 ? '#16a34a' : '#ef4444' }}>
                        {gb.balance > 0 ? '+' : ''}₹{gb.balance.toFixed(2)}
                      </span>
                      <ChevronRight size={16} color="#cbd5e1" />
                    </div>
                  </div>

                  {/* Mini balance breakdown */}
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f8fafc' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.04em' }}>
                      GROUP MEMBERS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {gb.members.map((m: any) => (
                        <div key={m.id} style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          background: '#f8fafc', borderRadius: '20px', padding: '4px 10px'
                        }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: getColor(m.name), display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '9px'
                          }}>
                            {m.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{m.name}</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: m.balance >= 0 ? '#16a34a' : '#ef4444' }}>
                            {m.balance >= 0 ? '+' : ''}₹{Math.abs(m.balance).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; padding-top: 58px !important; width: 100% !important; }
          .bal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}