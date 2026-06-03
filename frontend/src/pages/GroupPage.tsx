import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, UserPlus, ArrowLeftRight, ChevronRight, X, Search, Users, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Member { id: number; name: string; email: string; role: string; }
interface Expense { id: number; description: string; amount: number; paid_by_name: string; created_at: string; }
interface Balance { id: number; name: string; balance: number; }
interface Settlement { id: number; paid_by_name: string; paid_to_name: string; amount: number; note: string; created_at: string; }

const colors = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777'];
const getColor = (name: string) => colors[name?.charCodeAt(0) % colors.length];

const avatarStyle = (name: string, size = 40): React.CSSProperties => ({
  width: `${size}px`, height: `${size}px`, borderRadius: '10px',
  background: getColor(name), display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: 'white', fontWeight: '800',
  fontSize: `${size * 0.4}px`, flexShrink: 0
});

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
  borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
  outline: 'none', boxSizing: 'border-box', background: 'white', color: '#1e293b'
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 500, padding: '16px'
};

const modalBox: React.CSSProperties = {
  background: 'white', borderRadius: '20px', padding: '28px',
  width: '100%', maxWidth: '480px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  maxHeight: '90vh', overflowY: 'auto'
};

export default function GroupPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<Member | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplitType, setExpSplitType] = useState('equal');
  const [expSplitMembers, setExpSplitMembers] = useState<number[]>([]);
  const [customSplits, setCustomSplits] = useState<any[]>([]);
  const [settlePaidTo, setSettlePaidTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNote, setSettleNote] = useState('');

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [grp, exp, bal, set] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/expenses/group/${id}`),
        api.get(`/groups/${id}/balances`),
        api.get(`/settlements/group/${id}`)
      ]);
      setGroup(grp.data);
      setMembers(grp.data.members);
      setExpenses(exp.data);
      const parsedBalances = bal.data.map((b: any) => ({
        ...b, id: Number(b.id), balance: parseFloat(b.balance)
      }));
      setBalances(parsedBalances);
      setSettlements(set.data);
      setExpPaidBy(String(user?.id));
      setExpSplitMembers(grp.data.members.map((m: Member) => m.id));
    } catch { toast.error('Failed to load group'); }
  };

  const handleSettleUp = () => {
    const myId = Number(user?.id);
    const myBalance = balances.find(b => Number(b.id) === myId);
    if (myBalance && myBalance.balance < 0) {
      const creditor = balances.find(b => Number(b.id) !== myId && b.balance > 0);
      if (creditor) { setSettlePaidTo(String(creditor.id)); setSettleAmount(Math.abs(myBalance.balance).toFixed(2)); }
    } else if (myBalance && myBalance.balance > 0) {
      const debtor = balances.find(b => Number(b.id) !== myId && b.balance < 0);
      if (debtor) { setSettlePaidTo(''); setSettleAmount(Math.abs(debtor.balance).toFixed(2)); }
    } else { setSettlePaidTo(''); setSettleAmount(''); }
    setShowSettle(true);
  };

  const searchUsers = async (q: string) => {
    setSearchEmail(q);
    if (q.length < 2) return setSearchResults([]);
    try {
      const res = await api.get(`/auth/search?q=${q}`);
      setSearchResults(res.data);
    } catch {}
  };

  const addMember = async (userId: number) => {
    try {
      await api.post(`/groups/${id}/members`, { user_id: userId });
      toast.success('Member added!');
      setShowAddMember(false);
      setSearchEmail(''); setSearchResults([]);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const removeMember = async (memberId: number) => {
    try {
      await api.delete(`/groups/${id}/members/${memberId}`);
      toast.success('Member removed!');
      setShowRemoveConfirm(null);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to remove member'); }
  };

  const createExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let splits: any = expSplitMembers;
      if (expSplitType !== 'equal') splits = customSplits;
      await api.post('/expenses', {
        group_id: Number(id), description: expDesc,
        amount: parseFloat(expAmount), paid_by: parseInt(expPaidBy),
        split_type: expSplitType, splits
      });
      toast.success('Expense added!');
      setShowAddExpense(false);
      setExpDesc(''); setExpAmount('');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const createSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settlements', {
        group_id: Number(id), paid_to: parseInt(settlePaidTo),
        amount: parseFloat(settleAmount), note: settleNote
      });
      toast.success('Settlement recorded!');
      setShowSettle(false);
      setSettleAmount(''); setSettleNote(''); setSettlePaidTo('');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const toggleSplitMember = (memberId: number) => {
    setExpSplitMembers(prev =>
      prev.includes(memberId) ? prev.filter(i => i !== memberId) : [...prev, memberId]
    );
  };

  const isAdmin = members.find(m => m.id === user?.id)?.role === 'admin';
  const tabs = isAdmin
    ? ['overview', 'expenses', 'balances', 'settlements', 'members']
    : ['overview', 'expenses', 'balances', 'settlements'];
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const totalSettled = settlements.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const owingBalances = balances.filter(b => b.balance < 0);
  const gettingBackBalances = balances.filter(b => b.balance > 0);

  if (!group) return (
    <>
      <Sidebar />
      <div className="main-content" style={{ marginLeft: '240px', padding: '32px', fontFamily: 'Inter, sans-serif' }}>
        Loading...
        <style>{`@media(max-width:768px){.main-content{margin-left:0!important;padding-top:58px!important;}}`}</style>
      </div>
    </>
  );

  return (
    <>
      <Sidebar />
      <div className="main-content" style={{ marginLeft: '240px', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('/')}>Groups</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>›</span>
              <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: '600' }}>{group.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{group.name}</h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{members.length} members</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => setShowAddMember(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'white', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '9px', padding: '8px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}><UserPlus size={14} /> Invite</button>
                <button onClick={handleSettleUp} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'white', color: '#16a34a', border: '1.5px solid #16a34a', borderRadius: '9px', padding: '8px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}><ArrowLeftRight size={14} /> Settle Up</button>
                <button onClick={() => setShowAddExpense(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '9px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 8px rgba(22,163,74,0.3)', whiteSpace: 'nowrap' }}><Plus size={14} /> Add Expense</button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: activeTab === tab ? '700' : '500', cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: activeTab === tab ? '#f0fdf4' : 'transparent', color: activeTab === tab ? '#16a34a' : '#64748b', textTransform: 'capitalize', transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {tab === 'members' ? '👑 Members' : tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px' }}>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              {(owingBalances.length > 0 || gettingBackBalances.length > 0) && (
                <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>💡 Current balances</div>
                  {owingBalances.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}><strong>{b.name}</strong> owes the group</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#ef4444' }}>₹{Math.abs(b.balance).toFixed(2)}</span>
                    </div>
                  ))}
                  {gettingBackBalances.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}><strong>{b.name}</strong> gets back</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#16a34a' }}>₹{Math.abs(b.balance).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Expenses', value: `₹${totalExpenses.toFixed(2)}`, color: '#1e293b' },
                  { label: 'Total Settled', value: `₹${totalSettled.toFixed(2)}`, color: '#16a34a' },
                  { label: 'Total Members', value: String(members.length), color: '#2563eb' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>{label}</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color }}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '14px' }}>Balances</div>
                  {balances.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>No balances yet</p>}
                  {balances.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: getColor(b.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '12px' }}>{b.name?.charAt(0).toUpperCase()}</div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{b.name}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: b.balance >= 0 ? '#16a34a' : '#ef4444' }}>{b.balance >= 0 ? '+' : ''}₹{Math.abs(b.balance).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '14px' }}>Recent Expenses</div>
                  {expenses.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>No expenses yet</p>}
                  {expenses.slice(0, 5).map(exp => (
                    <div key={exp.id} onClick={() => navigate(`/expenses/${exp.id}`)}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 6px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.15s' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{exp.description}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>Paid by {exp.paid_by_name}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>₹{parseFloat(String(exp.amount)).toFixed(2)}</span>
                        <ChevronRight size={13} color="#cbd5e1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              {expenses.length === 0 ? <p style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No expenses yet</p>
                : expenses.map(exp => (
                  <div key={exp.id} onClick={() => navigate(`/expenses/${exp.id}`)}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'white'}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.15s', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={avatarStyle(exp.description, 40)}>{exp.description.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{exp.description}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Paid by {exp.paid_by_name} · {new Date(exp.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>₹{parseFloat(String(exp.amount)).toFixed(2)}</span>
                      <ChevronRight size={14} color="#cbd5e1" />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* BALANCES TAB */}
          {activeTab === 'balances' && (
            <div>
              {(owingBalances.length > 0 || gettingBackBalances.length > 0) && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {owingBalances.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>{b.name} owes the group</span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444' }}>₹{Math.abs(b.balance).toFixed(2)}</span>
                    </div>
                  ))}
                  {gettingBackBalances.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>{b.name} gets back</span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a' }}>₹{Math.abs(b.balance).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Individual Balances</div>
                {balances.length === 0 && <p style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No balances yet</p>}
                {balances.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={avatarStyle(b.name, 40)}>{b.name?.charAt(0).toUpperCase()}</div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{b.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: b.balance >= 0 ? '#16a34a' : '#ef4444' }}>{b.balance >= 0 ? '+' : ''}₹{Math.abs(b.balance).toFixed(2)}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{b.balance >= 0 ? 'gets back' : 'owes'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTLEMENTS TAB */}
          {activeTab === 'settlements' && (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              {settlements.length === 0 ? <p style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No settlements yet</p>
                : settlements.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={avatarStyle(s.paid_by_name, 40)}>{s.paid_by_name?.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{s.paid_by_name} → {s.paid_to_name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.note || 'Settlement'} · {new Date(s.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#16a34a' }}>₹{parseFloat(String(s.amount)).toFixed(2)}</span>
                  </div>
                ))}
            </div>
          )}

          {/* MEMBERS TAB — Admin only */}
          {activeTab === 'members' && isAdmin && (
            <div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
                👑 You are the admin of this group. Only you can remove members.
              </div>
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#1e293b" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Manage Members ({members.length})</span>
                </div>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f8fafc', gap: '12px' }}>
                    <div style={avatarStyle(m.name, 44)}>{m.name?.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {m.name}
                        {m.role === 'admin' && (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: '20px' }}>Admin</span>
                        )}
                        {m.id === user?.id && (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '20px' }}>You</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{m.email}</div>
                    </div>
                    {/* Remove button — not for admin, not for self */}
                    {m.role !== 'admin' && m.id !== user?.id && (
                      <button onClick={() => setShowRemoveConfirm(m)} style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: '#fef2f2', color: '#ef4444',
                        border: '1px solid #fecaca', borderRadius: '8px',
                        padding: '7px 12px', fontSize: '12px', fontWeight: '600',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                      }}>
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div style={modalOverlay} onClick={() => setShowAddMember(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Add Member</h3>
              <button onClick={() => setShowAddMember(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '9px 14px', marginBottom: '12px' }}>
              <Search size={14} color="#94a3b8" />
              <input value={searchEmail} onChange={e => searchUsers(e.target.value)} placeholder="Search by name or email..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1e293b', width: '100%', fontFamily: 'Inter, sans-serif' }} />
            </div>
            {searchResults.map(u => (
              <div key={u.id} onClick={() => addMember(u.id)} onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'} onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'white'} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: getColor(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>{u.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{u.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{u.email}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>CURRENT MEMBERS</div>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: getColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '12px', flexShrink: 0 }}>{m.name.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.email}</div>
                  </div>
                  {m.role === 'admin' && <span style={{ fontSize: '10px', fontWeight: '700', color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: '20px' }}>Admin</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div style={modalOverlay} onClick={() => setShowAddExpense(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Add Expense</h3>
              <button onClick={() => setShowAddExpense(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
            </div>
            <form onSubmit={createExpense}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>Description</label>
              <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="e.g. Dinner, Taxi, Hotel..." required style={{ ...inp, marginBottom: '14px' }} />
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>Amount (₹)</label>
              <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" required style={{ ...inp, marginBottom: '14px' }} />
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>Paid by</label>
              <select value={expPaidBy} onChange={e => setExpPaidBy(e.target.value)} style={{ ...inp, marginBottom: '14px' }}>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Split type</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {['equal', 'unequal', 'percentage', 'shares'].map(type => (
                  <button key={type} type="button" onClick={() => setExpSplitType(type)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid', borderColor: expSplitType === type ? '#16a34a' : '#e2e8f0', background: expSplitType === type ? '#f0fdf4' : 'white', color: expSplitType === type ? '#16a34a' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize' }}>{type}</button>
                ))}
              </div>
              {expSplitType === 'equal' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Split between</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {members.map(m => (
                      <button key={m.id} type="button" onClick={() => toggleSplitMember(m.id)} style={{ padding: '5px 10px', borderRadius: '20px', border: '1.5px solid', borderColor: expSplitMembers.includes(m.id) ? '#16a34a' : '#e2e8f0', background: expSplitMembers.includes(m.id) ? '#f0fdf4' : 'white', color: expSplitMembers.includes(m.id) ? '#16a34a' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{m.name} ×</button>
                    ))}
                  </div>
                  {expAmount && expSplitMembers.length > 0 && <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>₹{(parseFloat(expAmount) / expSplitMembers.length).toFixed(2)} per person</p>}
                </div>
              )}
              {expSplitType !== 'equal' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Enter {expSplitType === 'unequal' ? 'amounts' : expSplitType === 'percentage' ? 'percentages' : 'shares'}</label>
                  {members.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ width: '70px', fontSize: '12px', color: '#374151', fontWeight: '500', flexShrink: 0 }}>{m.name}</span>
                      <input type="number" placeholder="0" min="0" style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', background: 'white', color: '#1e293b' }}
                        onChange={e => {
                          const existing = customSplits.filter(s => s.user_id !== m.id);
                          const val = Math.round((parseFloat(e.target.value) || 0) * 100) / 100;
                          const newSplit = expSplitType === 'unequal' ? { user_id: m.id, amount: val } : expSplitType === 'percentage' ? { user_id: m.id, percentage: val } : { user_id: m.id, shares: val };
                          setCustomSplits([...existing, newSplit]);
                        }} />
                      <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{expSplitType === 'percentage' ? '%' : expSplitType === 'shares' ? 'shares' : '₹'}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddExpense(false)} style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '11px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      {showSettle && (
        <div style={modalOverlay} onClick={() => setShowSettle(false)}>
          <div style={{ ...modalBox, maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Settle Up</h3>
              <button onClick={() => setShowSettle(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              {owingBalances.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fef2f2', borderRadius: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{b.name} owes</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#ef4444' }}>₹{Math.abs(b.balance).toFixed(2)}</span>
                </div>
              ))}
              {gettingBackBalances.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f0fdf4', borderRadius: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{b.name} gets back</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#16a34a' }}>₹{Math.abs(b.balance).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', padding: '14px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>FROM</div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getColor(user?.name || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '15px', margin: '0 auto 4px' }}>{user?.name?.charAt(0).toUpperCase()}</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1e293b' }}>{user?.name}</div>
              </div>
              <ArrowLeftRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>TO</div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: settlePaidTo ? getColor(members.find(m => String(m.id) === settlePaidTo)?.name || '') : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '15px', margin: '0 auto 4px' }}>
                  {settlePaidTo ? members.find(m => String(m.id) === settlePaidTo)?.name?.charAt(0).toUpperCase() : '?'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1e293b' }}>{settlePaidTo ? members.find(m => String(m.id) === settlePaidTo)?.name : 'Select'}</div>
              </div>
            </div>
            <form onSubmit={createSettlement}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>Pay to</label>
              <select value={settlePaidTo} onChange={e => setSettlePaidTo(e.target.value)} style={{ ...inp, marginBottom: '14px' }} required>
                <option value="">Select member</option>
                {members.filter(m => m.id !== user?.id).map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>Amount (₹)</label>
              <input type="number" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" required style={{ ...inp, marginBottom: '14px' }} />
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>Note (optional)</label>
              <input value={settleNote} onChange={e => setSettleNote(e.target.value)} placeholder="GPay, Cash, UPI..." style={{ ...inp, marginBottom: '20px' }} />
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>Record Payment</button>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Confirm Modal */}
      {showRemoveConfirm && (
        <div style={modalOverlay} onClick={() => setShowRemoveConfirm(null)}>
          <div style={{ ...modalBox, maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={24} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px' }}>Remove Member?</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Are you sure you want to remove <strong>{showRemoveConfirm.name}</strong> from this group?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowRemoveConfirm(null)} style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={() => removeMember(showRemoveConfirm.id)} style={{ flex: 1, padding: '11px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; padding-top: 58px !important; width: 100% !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .overview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}