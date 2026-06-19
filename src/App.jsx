import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import DashboardPersonnel from './components/DashboardPersonnel';

function App() {
  const [view, setView] = useState('landing');
  const [loginRole, setLoginRole] = useState('supervisor');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const supervisorToken = localStorage.getItem('smartport_supervisor_token');
    const agentToken = localStorage.getItem('smartport_agent_token');
    
    if (supervisorToken) {
      setRole('supervisor');
      setUser({ 
        id: 'usr_supervisor_saved',
        name: 'Superviseur Port', 
        email: 'supervisor@smartport.gov', 
        role: 'supervisor' 
      });
      setView('dashboard-personnel');
    } else if (agentToken) {
      const hwId = localStorage.getItem('smartport_terminal_id') || 'TERM-PAC-8001';
      setRole('agent');
      setUser({ 
        id: 'usr_agent_saved',
        name: 'Agent de Sécurité Terrain', 
        email: 'agent@smartport.gov', 
        role: 'agent',
        hardwareId: hwId 
      });
      setView('dashboard-personnel');
    }
  }, []);

  const handleLoginSuccess = (userRole, userData) => {
    setRole(userRole);
    setUser(userData);
    setView('dashboard-personnel');
  };

  const handleLogout = () => {
    localStorage.removeItem('smartport_supervisor_token');
    localStorage.removeItem('smartport_agent_token');
    localStorage.removeItem('smartport_terminal_id');
    setRole(null);
    setUser(null);
    setView('landing');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {view === 'landing' && (
        <Landing 
          setView={setView} 
          setLoginRole={setLoginRole} 
        />
      )}
      {view === 'login' && (
        <Login 
          setView={setView} 
          initialRole={loginRole} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}
      {view === 'dashboard-personnel' && (
        <DashboardPersonnel
          user={user}
          setView={setView}
          onLogout={handleLogout}
        />
      )}
      {view === 'dashboard' && role === 'supervisor' && (
        <Dashboard 
          setView={setView} 
          onLogout={handleLogout} 
        />
      )}
      {view === 'scanner' && (
        <Scanner 
          setView={setView} 
          onLogout={handleLogout} 
          user={user}
        />
      )}
    </div>
  );
}

export default App;
