import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, Radio, Activity, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

export default function Landing({ setView, setLoginRole }) {
  const [online, setOnline] = useState(apiService.isOnline());
  const [queueSize, setQueueSize] = useState(apiService.getQueueSize());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleConnection = () => {
      setOnline(apiService.isOnline());
    };
    const handleQueue = () => {
      setQueueSize(apiService.getQueueSize());
    };

    window.addEventListener('smartport_connection_changed', handleConnection);
    window.addEventListener('smartport_queue_updated', handleQueue);
    return () => {
      window.removeEventListener('smartport_connection_changed', handleConnection);
      window.removeEventListener('smartport_queue_updated', handleQueue);
    };
  }, []);

  const toggleOnline = () => {
    const newStatus = apiService.toggleOnlineStatus();
    setOnline(newStatus);
  };

  const handleSync = async () => {
    if (!online) return;
    setIsSyncing(true);
    try {
      await apiService.syncOfflineQueue();
      setQueueSize(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <Shield size={36} color="var(--primary)" />
          <h1 style={styles.title}>SmartPort <span style={{ color: 'var(--primary)' }}>Gateway</span></h1>
        </div>
        <div style={styles.statusBadgeContainer}>
          <div style={{ ...styles.statusIndicator, backgroundColor: online ? 'var(--success)' : 'var(--error)' }} />
          <span style={styles.statusText}>
            API: {online ? 'En Ligne (Normal)' : 'Hors-Ligne (Mode Dégradé)'}
          </span>
          <button onClick={toggleOnline} style={styles.toggleBtn}>
            Simuler {online ? 'Panne' : 'Rétablissement'}
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.welcomeSection}>
          <h2 style={styles.subTitle}>Contrôle d'Accès Logistique & Humain</h2>
          <p style={styles.description}>
            Plateforme sécurisée de contrôle de fret et de validation d'accès pour le Port Autonome de Cotonou.
          </p>
        </div>

        <div style={styles.cardsGrid}>
          {/* Card 1: Admin */}
          <div onClick={() => { setLoginRole('supervisor'); setView('login'); }} className="glass-interactive" style={styles.card}>
            <div style={{ ...styles.iconWrapper, backgroundColor: 'var(--secondary-glow)' }}>
              <LayoutDashboard size={40} color="var(--secondary)" />
            </div>
            <h3 style={styles.cardTitle}>Supervision & Administration</h3>
            <p style={styles.cardDesc}>
              Gérer les dossiers de fret, enregistrer les chauffeurs, consulter les journaux d'audit et superviser les flux du port.
            </p>
            <button style={{ ...styles.cardBtn, backgroundColor: 'var(--secondary)' }}>Accéder au Dashboard</button>
          </div>

          {/* Card 2: Scanner */}
          <div onClick={() => { setLoginRole('agent'); setView('login'); }} className="glass-interactive" style={styles.card}>
            <div style={{ ...styles.iconWrapper, backgroundColor: 'var(--primary-glow)' }}>
              <Radio size={40} color="var(--primary)" />
            </div>
            <h3 style={styles.cardTitle}>Contrôle Terrain / Agent Scan</h3>
            <p style={styles.cardDesc}>
              Application mobile/PWA de scan de QR Codes aux barrières de contrôle. Supporte le mode dégradé hors-ligne.
            </p>
            <button style={{ ...styles.cardBtn, backgroundColor: 'var(--primary)', color: '#000' }}>Lancer le Scanner</button>
          </div>
        </div>

        {/* Sync Fallback Banner */}
        {queueSize > 0 && (
          <div className="glass" style={styles.syncBanner}>
            <div style={styles.syncBannerLeft}>
              <Activity size={24} color="var(--warning)" />
              <div style={{ marginLeft: 12 }}>
                <h4 style={{ color: 'var(--warning)', fontWeight: 600 }}>File d'attente hors-ligne active</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  Il y a <strong>{queueSize}</strong> scan(s) en attente de synchronisation.
                </p>
              </div>
            </div>
            <button 
              disabled={!online || isSyncing} 
              onClick={handleSync} 
              style={{ 
                ...styles.syncBtn, 
                opacity: online ? 1 : 0.5,
                cursor: online ? 'pointer' : 'not-allowed'
              }}
            >
              <RefreshCw size={16} className={isSyncing ? 'spin' : ''} style={{ marginRight: 8, animation: isSyncing ? 'spin-slow 2s linear infinite' : 'none' }} />
              {isSyncing ? 'Sync...' : online ? 'Synchroniser maintenant' : 'Hors-ligne - Synchronisation impossible'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4rem',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  statusBadgeContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--bg-card-border)',
    padding: '8px 16px',
    borderRadius: '30px',
    gap: '10px',
  },
  statusIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: '0 0 10px currentColor',
  },
  statusText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  toggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '15px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    marginLeft: '5px',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3rem',
  },
  welcomeSection: {
    textAlign: 'center',
    maxWidth: '700px',
  },
  subTitle: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  description: {
    color: 'var(--text-secondary)',
    fontSize: '1.1rem',
    lineHeight: 1.6,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2rem',
    width: '100%',
    maxWidth: '900px',
  },
  card: {
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  iconWrapper: {
    padding: '16px',
    borderRadius: '16px',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.4rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  cardDesc: {
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    fontSize: '0.95rem',
    marginBottom: '2rem',
    flexGrow: 1,
  },
  cardBtn: {
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'var(--transition-smooth)',
    color: '#fff',
  },
  syncBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '900px',
    padding: '1.5rem',
    borderLeft: '4px solid var(--warning)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  syncBannerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  syncBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--warning)',
    color: 'var(--warning)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'var(--transition-smooth)',
  }
};
