import React, { useState, useEffect } from 'react';
import { QrCode, Eye, LogOut, User, Smartphone, Shield, Wifi, WifiOff, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';

export default function DashboardPersonnel({ user, setView, onLogout }) {
  const [online, setOnline] = useState(apiService.isOnline());

  useEffect(() => {
    const handleConnection = () => {
      setOnline(apiService.isOnline());
    };
    window.addEventListener('smartport_connection_changed', handleConnection);
    return () => {
      window.removeEventListener('smartport_connection_changed', handleConnection);
    };
  }, []);

  const handleToggleOnline = () => {
    apiService.toggleOnlineStatus();
  };

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <Shield size={24} color="var(--primary)" />
          <span style={styles.logoText}>SmartPort Hub</span>
        </div>
        <div style={styles.headerRight}>
          <button 
            onClick={handleToggleOnline} 
            style={{
              ...styles.apiBadge,
              borderColor: online ? 'var(--success)' : 'var(--error)',
              backgroundColor: online ? 'var(--success-glow)' : 'var(--error-glow)',
            }}
          >
            {online ? <Wifi size={14} color="var(--success)" /> : <WifiOff size={14} color="var(--error)" />}
            <span style={{ color: online ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
              {online ? 'En Ligne' : 'Mode Dégradé'}
            </span>
          </button>
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
                <span style={styles.metaValue} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
        <div style={styles.portalsGrid}>
          {/* Scanner Portal Card */}
          <div 
            className="glass glass-interactive" 
            style={{
              ...styles.portalCard,
              borderTop: '4px solid var(--primary)'
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

          {/* Supervisor Portal Card */}
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
        </div>
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
    cursor: 'pointer',
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
    ':hover': {
      backgroundColor: 'rgba(255, 23, 68, 0.2)',
    }
  },
  logoutText: {
    display: 'inline',
    '@media (max-width: 576px)': {
      display: 'none',
    }
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  portalCard: {
    padding: '2.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    cursor: 'pointer',
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
