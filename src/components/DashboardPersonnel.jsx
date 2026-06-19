import React, { useState, useEffect } from 'react';
import { QrCode, Eye, LogOut, User, Smartphone, Shield, Wifi, WifiOff, ArrowRight, Activity, Wifi as WifiIcon } from 'lucide-react';
import { apiService } from '../services/api';

export default function DashboardPersonnel({ user, setView, onLogout }) {
  const [online, setOnline] = useState(apiService.isOnline());
  const [agentLogs, setAgentLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, offline: 0, authorized: 0, refused: 0 });

  useEffect(() => {
    const handleConnection = () => {
      setOnline(apiService.isOnline());
    };
    window.addEventListener('smartport_connection_changed', handleConnection);
    
    // Fetch and filter logs for agent
    if (user?.role === 'agent') {
      apiService.getLogs().then(logs => {
        const filtered = logs.filter(log => log.agentEmail === user.email);
        setAgentLogs(filtered);
        
        const total = filtered.length;
        const offline = filtered.filter(l => l.offline).length;
        const authorized = filtered.filter(l => l.status === 'AUTORISE').length;
        const refused = filtered.filter(l => l.status === 'REFUSE').length;
        setStats({ total, offline, authorized, refused });
      });
    }

    return () => {
      window.removeEventListener('smartport_connection_changed', handleConnection);
    };
  }, [user]);

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <Shield size={24} color="var(--primary)" />
          <span style={styles.logoText}>SmartPort Hub</span>
        </div>
        <div style={styles.headerRight}>
          <div 
            style={{
              ...styles.apiBadge,
              borderColor: online ? 'var(--success)' : 'var(--error)',
              backgroundColor: online ? 'var(--success-glow)' : 'var(--error-glow)',
              cursor: 'default'
            }}
          >
            {online ? <Wifi size={14} color="var(--success)" /> : <WifiOff size={14} color="var(--error)" />}
            <span style={{ color: online ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
              {online ? 'En Ligne' : 'Mode Dégradé'}
            </span>
          </div>
          <button onClick={onLogout} style={styles.logoutBtn} title="Se déconnecter">
            <LogOut size={18} />
            <span style={styles.logoutText}>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Welcome Section */}
        <section className="glass" style={styles.welcomeCard}>
          <div style={styles.avatarContainer}>
            <div style={styles.avatar}>
              <User size={36} color="#000" />
            </div>
            <div>
              <span style={styles.userRoleTag}>
                {user?.role === 'supervisor' ? 'Superviseur / DSI' : 'Agent de Sécurité Terrain'}
              </span>
              <h1 style={styles.welcomeTitle}>Bienvenue, {user?.name || 'Utilisateur'}</h1>
              <p style={styles.userEmail}>{user?.email}</p>
            </div>
          </div>

          <div style={styles.metaGrid}>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>ID Utilisateur</span>
              <span style={styles.metaValue}>{user?.id || 'usr_conv_mock'}</span>
            </div>
            {user?.role === 'agent' && (
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Terminal Matériel</span>
                <span style={{ ...styles.metaValue, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smartphone size={14} color="var(--primary)" />
                  {user?.hardwareId || 'TERM-PAC-8001'}
                </span>
              </div>
            )}
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Statut Session</span>
              <span style={{ ...styles.metaValue, color: online ? 'var(--success)' : 'var(--warning)' }}>
                {online ? 'Session Synchrone' : 'Session Locale Hors-Ligne'}
              </span>
            </div>
          </div>
        </section>

        {/* Action Title */}
        <div style={styles.sectionTitleArea}>
          <h2 style={styles.sectionTitle}>Que souhaitez-vous faire aujourd'hui ?</h2>
          <p style={styles.sectionSubtitle}>Sélectionnez un portail d'atterrissage pour commencer</p>
        </div>

        {/* Portals Grid */}
        <div style={{
          ...styles.portalsGrid,
          gridTemplateColumns: user?.role === 'supervisor' ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr'
        }}>
          {/* Scanner Portal Card */}
          <div 
            className="glass glass-interactive" 
            style={{
              ...styles.portalCard,
              borderTop: '4px solid var(--primary)',
              maxWidth: user?.role === 'supervisor' ? 'none' : '500px',
              margin: user?.role === 'supervisor' ? '0' : '0 auto'
            }}
            onClick={() => setView('scanner')}
          >
            <div style={{ ...styles.iconContainer, backgroundColor: 'var(--primary-glow)' }}>
              <QrCode size={32} color="var(--primary)" />
            </div>
            <h3 style={styles.portalTitle}>Scanner & Contrôler</h3>
            <p style={styles.portalDesc}>
              Scanner les QR codes des chauffeurs, vérifier la validité des documents (BESC/Dossiers) et enregistrer les passages.
            </p>
            <div style={{ ...styles.portalAction, color: 'var(--primary)' }}>
              <span>Ouvrir le Scanner</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Supervisor Portal Card (Only visible to supervisor) */}
          {user?.role === 'supervisor' && (
            <div 
              className="glass glass-interactive" 
              style={{
                ...styles.portalCard,
                borderTop: '4px solid var(--secondary)'
              }}
              onClick={() => setView('dashboard')}
            >
              <div style={{ ...styles.iconContainer, backgroundColor: 'var(--secondary-glow)' }}>
                <Eye size={32} color="var(--secondary)" />
              </div>
              <h3 style={styles.portalTitle}>Superviser & Analyser</h3>
              <p style={styles.portalDesc}>
                Consulter les dossiers de transit, valider les BESC en litige, visualiser l'historique des contrôles et exporter les rapports.
              </p>
              <div style={{ ...styles.portalAction, color: 'var(--secondary)' }}>
                <span>Ouvrir la Supervision</span>
                <ArrowRight size={16} />
              </div>
            </div>
          )}
        </div>

        {/* Agent Personal Statistics Dashboard */}
        {user?.role === 'agent' && (
          <section className="glass" style={styles.agentDashboard}>
            <div style={styles.agentDashboardHeader}>
              <Activity size={20} color="var(--primary)" />
              <h3 style={styles.agentDashboardTitle}>Mon Tableau de Bord (Statistiques de Contrôle)</h3>
            </div>
            <p style={styles.agentDashboardDesc}>
              Voici un aperçu de vos activités de scan récentes. Vous n'avez pas accès aux statistiques globales du port ni à la progression des autres terminaux.
            </p>

            {/* Metrics Row */}
            <div style={styles.agentMetricsGrid}>
              <div style={styles.metricBox}>
                <span style={styles.metricLabel}>Total Scans</span>
                <span style={styles.metricVal}>{stats.total}</span>
              </div>
              <div style={styles.metricBox}>
                <span style={styles.metricLabel}>Scans Hors-Ligne</span>
                <span style={{ ...styles.metricVal, color: stats.offline > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                  {stats.offline}
                </span>
              </div>
              <div style={styles.metricBox}>
                <span style={styles.metricLabel}>Validations Autorisées</span>
                <span style={{ ...styles.metricVal, color: 'var(--success)' }}>{stats.authorized}</span>
              </div>
              <div style={styles.metricBox}>
                <span style={styles.metricLabel}>Passages Refusés</span>
                <span style={{ ...styles.metricVal, color: 'var(--error)' }}>{stats.refused}</span>
              </div>
            </div>

            {/* Recent Scans Table */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={styles.tableTitle}>Mes 5 derniers scans</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Heure</th>
                      <th style={styles.th}>Chauffeur</th>
                      <th style={styles.th}>Plaque</th>
                      <th style={styles.th}>Statut</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={styles.tdEmpty}>Aucun scan enregistré aujourd'hui.</td>
                      </tr>
                    ) : (
                      agentLogs.slice(0, 5).map(log => (
                        <tr key={log.id}>
                          <td style={styles.td}>
                            {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td style={styles.td}>{log.driver}</td>
                          <td style={styles.td}>{log.license}</td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: log.status === 'AUTORISE' ? 'var(--success-glow)' : 'var(--error-glow)',
                              color: log.status === 'AUTORISE' ? 'var(--success)' : 'var(--error)',
                              border: `1px solid ${log.status === 'AUTORISE' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 23, 68, 0.2)'}`
                            }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={styles.td}>{log.type}</td>
                          <td style={styles.td}>
                            {log.offline ? (
                              <span style={{ color: 'var(--warning)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <WifiOff size={12} /> Hors-ligne
                              </span>
                            ) : (
                              <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Wifi size={12} /> Synchrone
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer info box */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          SmartPort Gateway v2.1.0 • Port Autonome de Cotonou • Système de Tolérance aux Pannes
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-dark)',
  },
  header: {
    padding: '1.25rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--bg-card-border)',
    background: 'rgba(11, 15, 25, 0.8)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
    background: 'linear-gradient(90deg, #fff, var(--text-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  apiBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    transition: 'var(--transition-smooth)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 23, 68, 0.1)',
    border: '1px solid rgba(255, 23, 68, 0.2)',
    color: 'var(--error)',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  logoutText: {
    display: 'inline',
  },
  main: {
    flex: 1,
    maxWidth: '1000px',
    width: '100%',
    margin: '0 auto',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  welcomeCard: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  avatarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
  },
  userRoleTag: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--primary)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    margin: '4px 0',
  },
  userEmail: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--bg-card-border)',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: 500,
  },
  metaValue: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  sectionTitleArea: {
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: '8px',
  },
  sectionSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  portalsGrid: {
    display: 'grid',
    gap: '2rem',
  },
  portalCard: {
    padding: '2.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    cursor: 'pointer',
    width: '100%',
  },
  iconContainer: {
    width: '60px',
    height: '60px',
    borderRadius: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '8px',
  },
  portalTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
  },
  portalDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    flex: 1,
  },
  portalAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    marginTop: '12px',
  },
  agentDashboard: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    borderTop: '4px solid var(--primary)',
  },
  agentDashboardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  agentDashboardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  agentDashboardDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  agentMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
  },
  metricBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '8px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  tableTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--bg-card-border)',
    fontWeight: 600,
  },
  td: {
    padding: '12px',
    fontSize: '0.85rem',
    borderBottom: '1px solid var(--bg-card-border)',
  },
  tdEmpty: {
    textAlign: 'center',
    padding: '24px',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  footer: {
    padding: '2rem',
    textAlign: 'center',
    borderTop: '1px solid var(--bg-card-border)',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  }
};
