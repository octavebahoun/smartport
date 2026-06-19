import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, Radio, Activity, RefreshCw, BookOpen, FileText, Server, Users, Key } from 'lucide-react';
import { apiService } from '../services/api';

export default function Landing({ setView, setLoginRole }) {
  const [online, setOnline] = useState(apiService.isOnline());
  const [queueSize, setQueueSize] = useState(apiService.getQueueSize());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState('tech'); // 'tech' or 'user'

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
        </div>
      </header>

      <main style={styles.main}>
        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <span style={styles.tagline}>Port Autonome de Cotonou</span>
          <h2 style={styles.subTitle}>Contrôle d'Accès Logistique & Humain</h2>
          <p style={styles.description}>
            Plateforme hautement sécurisée de validation de dossiers de fret et de contrôle de passage de véhicules lourds.
          </p>
        </div>

        {/* Portals Grid */}
        <div style={styles.cardsGrid}>
          {/* Card 1: Admin */}
          <div onClick={() => { setLoginRole('supervisor'); setView('login'); }} className="glass-interactive" style={styles.card}>
            <div style={{ ...styles.iconWrapper, backgroundColor: 'var(--secondary-glow)' }}>
              <LayoutDashboard size={40} color="var(--secondary)" />
            </div>
            <h3 style={styles.cardTitle}>Supervision & Administration</h3>
            <p style={styles.cardDesc}>
              Gérer les dossiers de fret, valider les codes BESC, analyser les statistiques de passage et administrer les terminaux de contrôle.
            </p>
            <button style={{ ...styles.cardBtn, backgroundColor: 'var(--secondary)' }}>Accéder à l'Espace Superviseur</button>
          </div>

          {/* Card 2: Scanner */}
          <div onClick={() => { setLoginRole('agent'); setView('login'); }} className="glass-interactive" style={styles.card}>
            <div style={{ ...styles.iconWrapper, backgroundColor: 'var(--primary-glow)' }}>
              <Radio size={40} color="var(--primary)" />
            </div>
            <h3 style={styles.cardTitle}>Contrôle Terrain / Agent Scan</h3>
            <p style={styles.cardDesc}>
              Valider les laissez-passer par scan de QR code, enregistrer les entrées/sorties de fret aux barrières et gérer la file d'attente hors-ligne.
            </p>
            <button style={{ ...styles.cardBtn, backgroundColor: 'var(--primary)', color: '#000' }}>Lancer le Terminal de Scan</button>
          </div>
        </div>

        {/* Sync Fallback Banner */}
        {queueSize > 0 && (
          <div className="glass" style={styles.syncBanner}>
            <div style={styles.syncBannerLeft}>
              <Activity size={24} color="var(--warning)'" />
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

        {/* Documentation Section */}
        <section style={styles.docSection}>
          <div style={styles.docHeader}>
            <h3 style={styles.docSectionTitle}>Documentation Projet & Spécifications</h3>
            <p style={styles.docSectionSubtitle}>
              Découvrez le fonctionnement global de SmartPort Gateway et la répartition des habilitations.
            </p>
          </div>

          <div style={styles.docTabs}>
            <button 
              onClick={() => setActiveDocTab('tech')}
              style={{ 
                ...styles.docTabBtn, 
                borderColor: activeDocTab === 'tech' ? 'var(--secondary)' : 'transparent',
                backgroundColor: activeDocTab === 'tech' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                color: activeDocTab === 'tech' ? 'var(--secondary)' : 'var(--text-secondary)'
              }}
            >
              <BookOpen size={18} style={{ marginRight: 8 }} />
              1. Spécifications Techniques & APIs
            </button>
            <button 
              onClick={() => setActiveDocTab('user')}
              style={{ 
                ...styles.docTabBtn, 
                borderColor: activeDocTab === 'user' ? 'var(--primary)' : 'transparent',
                backgroundColor: activeDocTab === 'user' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                color: activeDocTab === 'user' ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              <FileText size={18} style={{ marginRight: 8 }} />
              2. Guide d'Utilisation & Habilitations
            </button>
          </div>

          <div className="glass" style={styles.docContentArea}>
            {activeDocTab === 'tech' ? (
              <div style={styles.docLayout}>
                <div style={styles.docCol}>
                  <h4 style={{ ...styles.docTitle, color: 'var(--secondary)' }}>
                    <Server size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Architecture Tri-Protocoles
                  </h4>
                  <p style={styles.docText}>
                    SmartPort Gateway intègre trois types d'APIs pour garantir la traçabilité complète des marchandises transitant par le Port Autonome de Cotonou :
                  </p>
                  <ul style={styles.docList}>
                    <li>
                      <strong>API REST Laravel (Dossiers) :</strong> Gère l'administration centrale, la validation des BESC et l'authentification sécurisée des superviseurs.
                    </li>
                    <li>
                      <strong>API Next.js (Contrôle Scan) :</strong> Destinée aux barrières physiques pour valider instantanément les QR Codes des chauffeurs avec une faible latence.
                    </li>
                    <li>
                      <strong>Service SOAP Python (PAC Legacy) :</strong> Interconnexion bidirectionnelle avec l'ancien système logistique portuaire pour garantir la compatibilité des données historiques.
                    </li>
                  </ul>
                </div>
                <div style={styles.docCol}>
                  <h4 style={{ ...styles.docTitle, color: 'var(--secondary)' }}>
                    <Activity size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Mécanisme de Résilience (Offline First)
                  </h4>
                  <p style={styles.docText}>
                    Le port devant fonctionner sans interruption, l'application est dotée d'une tolérance aux pannes réseau :
                  </p>
                  <ul style={styles.docList}>
                    <li>
                      <strong>Détection de Panne :</strong> En cas de perte de connexion avec les serveurs d'API, le système bascule automatiquement et de manière transparente en mode dégradé (Hors-Ligne).
                    </li>
                    <li>
                      <strong>Validation Locale :</strong> L'agent de contrôle terrain peut continuer à scanner les laissez-passer grâce au cache des dossiers stocké dans le navigateur.
                    </li>
                    <li>
                      <strong>File de Synchronisation :</strong> Les transactions validées hors-ligne sont temporisées localement. Dès que le signal réseau est rétabli, un bouton de synchronisation manuelle apparaît sur la page d'accueil pour répercuter les données sur les serveurs centraux.
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div style={styles.docLayout}>
                <div style={styles.docCol}>
                  <h4 style={{ ...styles.docTitle, color: 'var(--primary)' }}>
                    <Key size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Accès à l'Application
                  </h4>
                  <p style={styles.docText}>
                    L'authentification et l'inscription s'effectuent selon le profil requis. Pour accéder aux formulaires de connexion :
                  </p>
                  <ul style={styles.docList}>
                    <li>
                      Sélectionnez la carte correspondante ci-dessus (Supervision ou Contrôle Terrain).
                    </li>
                    <li>
                      Sur l'écran d'authentification, vous pouvez vous connecter avec vos identifiants existants ou basculer sur l'onglet <strong>Créer un compte</strong> pour vous inscrire.
                    </li>
                    <li>
                      Les superviseurs doivent valider une étape de sécurité supplémentaire par double facteur (MFA) pour accéder à l'administration centrale.
                    </li>
                  </ul>
                </div>
                <div style={styles.docCol}>
                  <h4 style={{ ...styles.docTitle, color: 'var(--primary)' }}>
                    <Users size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Habilitations Strictes par Rôle
                  </h4>
                  <p style={styles.docText}>
                    Une fois connecté, l'espace de travail est rigoureusement compartimenté :
                  </p>
                  <ul style={styles.docList}>
                    <li>
                      <strong>Le Superviseur :</strong> Dispose du tableau de bord complet (statistiques, graphiques de performance des flux logistiques), de l'historique global de tous les agents et de la gestion des dossiers de transit.
                    </li>
                    <li>
                      <strong>L'Agent de Sécurité Terrain :</strong> N'a aucunement accès au dashboard de supervision ni à la progression et l'historique des autres utilisateurs. Son interface se limite au terminal de scan et à un dashboard personnel présentant uniquement ses propres statistiques de contrôle et son historique de scan local.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

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
    marginBottom: '3rem',
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
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3rem',
  },
  welcomeSection: {
    textAlign: 'center',
    maxWidth: '800px',
  },
  tagline: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--primary)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    display: 'block',
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
  },
  docSection: {
    width: '100%',
    maxWidth: '900px',
    marginTop: '1rem',
  },
  docHeader: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  docSectionTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  docSectionSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  docTabs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem',
  },
  docTabBtn: {
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-smooth)',
  },
  docContentArea: {
    padding: '2.5rem 2rem',
  },
  docLayout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '2.5rem',
  },
  docCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  docTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  docText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  docList: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    paddingLeft: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  footer: {
    padding: '2rem',
    textAlign: 'center',
    borderTop: '1px solid var(--bg-card-border)',
    marginTop: '3rem',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  }
};
