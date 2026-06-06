import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Split {
  id: number;
  name: string;
  amount: number;
  is_settled: boolean;
}

interface Comment {
  id: number;
  name: string;
  message: string;
  created_at: string;
  user_id: number;
}

const colors = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777'];
const getColor = (name: string) => colors[name?.charCodeAt(0) % colors.length];

export default function ExpensePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<any>(null);
  const [splits, setSplits] = useState<Split[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExpense();
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    newSocket.emit('join_expense', id);
    newSocket.on('receive_message', (data: any) => {
      setComments(prev => [...prev, data]);
    });
    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchExpense = async () => {
    try {
      const res = await api.get(`/expenses/${id}`);
      setExpense(res.data);
      setSplits(res.data.splits);
      setComments(res.data.comments);
    } catch { toast.error('Failed to load expense'); }
  };

  const deleteExpense = async () => {
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted!');
      navigate(-1);
    } catch { toast.error('Failed to delete expense'); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const res = await api.post('/comments', {
        expense_id: Number(id),
        message: message.trim()
      });
      socket?.emit('send_message', { ...res.data, expenseId: id });
      setMessage('');
    } catch { toast.error('Failed to send message'); }
  };

  if (!expense) return (
    <>
      <Sidebar />
      <div className="main-content" style={{ marginLeft: '240px', padding: '32px', fontFamily: 'Inter, sans-serif' }}>
        Loading...
        <style>{`@media(max-width:768px){.main-content{margin-left:0!important;padding-top:58px!important;}}`}</style>
      </div>
    </>
  );

  const isCreator = expense.created_by === user?.id;

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
          padding: '14px 24px', position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <button onClick={() => navigate(-1)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: '13px', fontWeight: '600',
            fontFamily: 'Inter, sans-serif', padding: '6px 10px',
            borderRadius: '8px'
          }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
          >
            <ArrowLeft size={16} /> Back to expenses
          </button>

          {/* Delete button — only for creator */}
          {isCreator && (
            <button onClick={() => setShowDeleteConfirm(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#ef4444', borderRadius: '8px', padding: '7px 14px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}>
              <Trash2 size={14} /> Delete Expense
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div className="expense-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'
          }}>

            {/* Left: Expense Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Expense Header Card */}
              <div style={{
                background: 'white', borderRadius: '16px', padding: '24px',
                border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px',
                      background: getColor(expense.description),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '800', fontSize: '20px', flexShrink: 0
                    }}>
                      {expense.description?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                        {expense.description}
                      </h2>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
                        Paid by {expense.paid_by_name} · {new Date(expense.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a', flexShrink: 0 }}>
                    ₹{parseFloat(expense.amount).toFixed(2)}
                  </div>
                </div>

                {/* Split type badge */}
                <div style={{ marginTop: '16px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', color: '#16a34a',
                    background: '#f0fdf4', padding: '4px 10px', borderRadius: '20px',
                    textTransform: 'capitalize'
                  }}>
                    {expense.split_type} split
                  </span>
                </div>
              </div>

              {/* Split Details Card */}
              <div style={{
                background: 'white', borderRadius: '16px', padding: '20px',
                border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 16px' }}>
                  Split details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {splits.map(split => (
                    <div key={split.id} style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '10px 0',
                      borderBottom: '1px solid #f8fafc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: getColor(split.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0
                        }}>
                          {split.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                          {split.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                          ₹{parseFloat(String(split.amount)).toFixed(2)}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '3px 10px',
                          borderRadius: '20px',
                          background: split.is_settled ? '#f0fdf4' : '#fef2f2',
                          color: split.is_settled ? '#16a34a' : '#ef4444'
                        }}>
                          {split.is_settled ? 'Paid' : 'Owes'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Chat */}
            <div style={{
              background: 'white', borderRadius: '16px',
              border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column',
              height: '580px'
            }}>
              {/* Chat Header */}
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Group chat</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>{comments.length} messages</span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comments.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                    <p style={{ fontSize: '13px' }}>No messages yet. Start the conversation!</p>
                  </div>
                )}
                {comments.map((comment, idx) => {
                  const isMe = Number(comment.user_id) === Number(user?.id);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                      {!isMe && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: getColor(comment.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '11px', flexShrink: 0 }}>
                          {comment.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ maxWidth: '70%' }}>
                        {!isMe && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px', paddingLeft: '4px' }}>{comment.name}</p>}
                        <div style={{ padding: '10px 14px', borderRadius: '14px', borderBottomRightRadius: isMe ? '4px' : '14px', borderBottomLeftRadius: isMe ? '14px' : '4px', background: isMe ? '#16a34a' : '#f1f5f9', color: isMe ? 'white' : '#1e293b', fontSize: '13px', lineHeight: '1.5' }}>
                          {comment.message}
                        </div>
                        <p style={{ fontSize: '10px', color: '#94a3b8', margin: '3px 0 0', textAlign: isMe ? 'right' : 'left', paddingLeft: '4px' }}>
                          {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..."
                    style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', background: 'white', color: '#1e293b' }}
                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button type="submit" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#16a34a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
                    <Send size={16} color="white" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={24} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px' }}>Delete Expense?</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                This will permanently delete <strong>{expense.description}</strong> and all its splits. This cannot be undone!
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Cancel
              </button>
              <button onClick={deleteExpense} style={{ flex: 1, padding: '11px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; padding-top: 58px !important; width: 100% !important; }
          .expense-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}