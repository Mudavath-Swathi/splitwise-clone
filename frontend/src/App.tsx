import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupPage from './pages/GroupPage';
import ExpensePage from './pages/ExpensePage';
import Groups from './pages/Groups';
import Expenses from './pages/Expenses';
import Settlements from './pages/Settlements';
import Friends from './pages/Friends';
import Balances from './pages/Balances';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div style={{ 
    display: 'flex', alignItems: 'center', 
    justifyContent: 'center', height: '100vh',
    fontFamily: 'Inter, sans-serif', color: '#16a34a',
    fontSize: '16px', fontWeight: '600'
  }}>Loading...</div>;
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
      <Route path="/groups/:id" element={<PrivateRoute><GroupPage /></PrivateRoute>} />
      <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
      <Route path="/expenses/:id" element={<PrivateRoute><ExpensePage /></PrivateRoute>} />
      <Route path="/settlements" element={<PrivateRoute><Settlements /></PrivateRoute>} />
      <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
      <Route path="/balances" element={<PrivateRoute><Balances /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Profile /></PrivateRoute>} />
    </Routes>
  );
}

export default App;