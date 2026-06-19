import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ArrowRight, 
  Lock, 
  Scan, 
  Activity, 
  Database, 
  Users, 
  CheckCircle2, 
  Info, 
  MapPin, 
  Phone,
  RefreshCw,
  LayoutDashboard
} from 'lucide-react';
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

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={styles.container} className="landing-container">
      {/* 1. Header & Navigation Bar */}
      <header style={styles.navbar} className="glass landing-navbar">
        <div style={styles.navLeft} className="landing-nav-left">
          <Shield size={28} color="var(--primary)" />
          <span style={styles.navLogoText} className="landing-logo-text">SmartPort <span style={{ color: 'var(--primary)' }} className="landing-logo-span">Gateway</span></span>
        </div>
        <nav style={styles.navLinks} className="nav-links-responsive">
          <button onClick={() => scrollToSection('hero')} style={styles.navLinkBtn} className="nav-link-btn">Accueil</button>
          <button onClick={() => scrollToSection('about')} style={styles.navLinkBtn} className="nav-link-btn">À propos</button>
          <button onClick={() => scrollToSection('features')} style={styles.navLinkBtn} className="nav-link-btn">Fonctionnalités</button>
          <button onClick={() => scrollToSection('roles')} style={styles.navLinkBtn} className="nav-link-btn">Espaces d'accès</button>
        </nav>
        <div style={styles.navRight} className="landing-nav-right">
          <div style={{ ...styles.apiBadge, borderColor: online ? 'var(--success)' : 'var(--error)' }} className="landing-api-badge">
            <span style={{ ...styles.statusDot, backgroundColor: online ? 'var(--success)' : 'var(--error)' }} className="landing-status-dot" />
            <span style={{ color: online ? 'var(--success)' : 'var(--error)', fontSize: '0.8rem', fontWeight: 600 }} className="landing-api-text">
              {online ? 'En ligne' : 'Mode Hors-ligne'}
            </span>
          </div>
          <button onClick={() => scrollToSection('roles')} style={styles.navActionBtn} className="nav-action-btn landing-nav-action-btn">
            Connexion <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="hero" style={styles.heroSection} className="landing-hero-section">
        <div style={styles.heroContent} className="landing-hero-content">
          <span style={styles.heroTagline}>Port Autonome de Cotonou</span>
          <h1 style={styles.heroTitle} className="landing-hero-title">
            Modernisez le contrôle et la <br />
            <span style={{ color: 'var(--primary)' }}>sécurité de vos flux de fret</span>
          </h1>
          <p style={styles.heroDescription} className="landing-hero-desc">
            SmartPort Gateway est la plateforme de référence pour la validation en temps réel des laissez-passer, la traçabilité du transit logistique et la supervision des agents de contrôle terrain.
          </p>
          <div style={styles.heroActions} className="landing-hero-actions">
            <button onClick={() => scrollToSection('roles')} style={styles.heroPrimaryBtn}>
              Accéder aux portails <ArrowRight size={16} style={{ marginLeft: 8 }} />
            </button>
            <button onClick={() => scrollToSection('about')} style={styles.heroSecondaryBtn}>
              En savoir plus
            </button>
          </div>
        </div>
        
        {/* Connection sync status if queue exists */}
        {queueSize > 0 && (
          <div className="glass landing-sync-banner" style={styles.syncCardBanner}>
            <div style={styles.syncCardBannerLeft} className="landing-sync-left">
              <Activity size={20} color="var(--warning)" style={{ animation: 'pulse 2s infinite' }} />
              <div style={{ marginLeft: 12, textAlign: 'left' }}>
                <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>
                  Scans hors-ligne en attente ({queueSize})
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Des données ont été enregistrées localement lors d'une déconnexion.
                </span>
              </div>
            </div>
            <button 
              disabled={!online || isSyncing} 
              onClick={handleSync} 
              style={{ 
                ...styles.syncActionBtn,
                opacity: online ? 1 : 0.5,
                cursor: online ? 'pointer' : 'not-allowed'
              }}
            >
              <RefreshCw size={14} style={{ marginRight: 6, animation: isSyncing ? 'spin-slow 2s linear infinite' : 'none' }} />
              {isSyncing ? 'Sync...' : online ? 'Synchroniser' : 'Reconnexion requise'}
            </button>
          </div>
        )}
      </section>

      {/* 3. À propos (About) Section */}
      <section id="about" style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTag}>Contexte & Vision</span>
          <h2 style={styles.sectionTitle}>Fluidifier et Sécuriser l'Espace Portuaire</h2>
          <p style={styles.sectionSubtitle}>
            Face à l'augmentation du trafic de fret au Port Autonome de Cotonou, SmartPort Gateway élimine les goulots d'étranglement et garantit une traçabilité totale à chaque barrière d'accès.
          </p>
        </div>

        <div style={styles.aboutGrid} className="landing-about-grid">
          <div className="glass" style={styles.aboutCard}>
            <h3 style={styles.aboutCardTitle}>Zéro interruption de service</h3>
            <p style={styles.aboutCardText}>
              Les coupures de connexion réseau ne doivent pas bloquer le port. SmartPort Gateway intègre un mécanisme résistant aux pannes permettant aux agents de continuer à travailler hors-ligne.
            </p>
          </div>
          <div className="glass" style={styles.aboutCard}>
            <h3 style={styles.aboutCardTitle}>Intégrité & Contrôle rigoureux</h3>
            <p style={styles.aboutCardText}>
              Chaque entrée ou sortie est vérifiée instantanément par rapport aux dossiers logistiques officiels (codes BESC, données transporteurs) pour écarter tout risque de fraude.
            </p>
          </div>
          <div className="glass" style={styles.aboutCard}>
            <h3 style={styles.aboutCardTitle}>Audit & Transparence</h3>
            <p style={styles.aboutCardText}>
              Toutes les actions des agents terrain sont journalisées avec précision. En cas de litige, les superviseurs disposent d'un historique complet et infalsifiable pour arbitrer rapidement.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Fonctionnalités Clés (Features) Section */}
      <section id="features" style={{ ...styles.section, backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTag}>Fonctionnalités</span>
          <h2 style={styles.sectionTitle}>Conçu pour le terrain et la supervision</h2>
          <p style={styles.sectionSubtitle}>
            Une suite d'outils performants adaptés aux contraintes réelles des opérations portuaires.
          </p>
        </div>

        <div style={styles.featuresGrid} className="landing-features-grid">
          {/* Feature 1 */}
          <div className="glass" style={styles.featureCard}>
            <div style={{ ...styles.featureIconContainer, backgroundColor: 'rgba(0, 229, 255, 0.1)' }}>
              <Scan size={24} color="var(--primary)" />
            </div>
            <h3 style={styles.featureTitle}>Scan de QR Code Mobile</h3>
            <p style={styles.featureText}>
              Validation instantanée des laissez-passer à l'aide d'une interface de caméra intégrée, optimisée pour les terminaux mobiles des agents de sécurité.
            </p>
            <ul style={styles.featureList}>
              <li><CheckCircle2 size={14} color="var(--primary)" style={{ marginRight: 8 }} /> Lecture rapide et tolérance aux scans difficiles</li>
              <li><CheckCircle2 size={14} color="var(--primary)" style={{ marginRight: 8 }} /> Extraction immédiate des données du chauffeur</li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="glass" style={styles.featureCard}>
            <div style={{ ...styles.featureIconContainer, backgroundColor: 'rgba(124, 77, 255, 0.1)' }}>
              <Database size={24} color="var(--secondary)" />
            </div>
            <h3 style={styles.featureTitle}>Résilience Offline (Tolérance aux pannes)</h3>
            <p style={styles.featureText}>
              Validation locale autonome grâce à un système de mise en cache des dossiers logistiques autorisés directement sur l'appareil de contrôle.
            </p>
            <ul style={styles.featureList}>
              <li><CheckCircle2 size={14} color="var(--secondary)" style={{ marginRight: 8 }} /> Passage transparent en mode dégradé</li>
              <li><CheckCircle2 size={14} color="var(--secondary)" style={{ marginRight: 8 }} /> File d'attente sécurisée pour la synchronisation</li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="glass" style={styles.featureCard}>
            <div style={{ ...styles.featureIconContainer, backgroundColor: 'rgba(0, 230, 118, 0.1)' }}>
              <LayoutDashboard size={24} color="var(--success)" />
            </div>
            <h3 style={styles.featureTitle}>Supervision Centrale</h3>
            <p style={styles.featureText}>
              Suivi consolidé de l'ensemble de l'activité du port avec graphiques de performance, historiques généraux et création de dossiers.
            </p>
            <ul style={styles.featureList}>
              <li><CheckCircle2 size={14} color="var(--success)" style={{ marginRight: 8 }} /> Statistiques détaillées de passage</li>
              <li><CheckCircle2 size={14} color="var(--success)" style={{ marginRight: 8 }} /> Gestion complète des dossiers logistiques</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Espaces d'accès (Roles Selection) Section */}
      <section id="roles" style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTag}>Portail d'accès</span>
          <h2 style={styles.sectionTitle}>Connectez-vous à votre espace</h2>
          <p style={styles.sectionSubtitle}>
            Sélectionnez votre profil d'utilisation pour accéder à votre espace de travail sécurisé.
          </p>
        </div>

        <div style={styles.rolesGrid} className="landing-roles-grid">
          {/* Supervisor Card */}
          <div 
            onClick={() => { setLoginRole('supervisor'); setView('login'); }} 
            className="glass-interactive" 
            style={{ ...styles.roleCard, borderTop: '4px solid var(--secondary)' }}
          >
            <div style={{ ...styles.roleIconWrapper, backgroundColor: 'var(--secondary-glow)' }}>
              <Shield size={36} color="var(--secondary)" />
            </div>
            <h3 style={styles.roleCardTitle}>Supervision Logistique</h3>
            <p style={styles.roleCardDesc}>
              Pilotez l'ensemble des flux du port, accédez aux graphiques de transit global, gérez les dossiers de fret logistique et contrôlez l'audit.
            </p>
            <div style={styles.rolePermissions}>
              <span style={styles.permissionBadge}>Tableau de bord général</span>
              <span style={styles.permissionBadge}>Création de dossiers</span>
              <span style={styles.permissionBadge}>Sécurisé par double facteur (MFA)</span>
            </div>
            <button style={{ ...styles.roleBtn, backgroundColor: 'var(--secondary)' }}>
              Accéder à l'Espace Superviseur <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </button>
          </div>

          {/* Agent Card */}
          <div 
            onClick={() => { setLoginRole('agent'); setView('login'); }} 
            className="glass-interactive" 
            style={{ ...styles.roleCard, borderTop: '4px solid var(--primary)' }}
          >
            <div style={{ ...styles.roleIconWrapper, backgroundColor: 'var(--primary-glow)' }}>
              <Scan size={36} color="var(--primary)" />
            </div>
            <h3 style={styles.roleCardTitle}>Agent Contrôle Terrain</h3>
            <p style={styles.roleCardDesc}>
              Validez les laissez-passer à la barrière, consultez vos statistiques personnelles de scan et gérez vos transactions hors-ligne.
            </p>
            <div style={styles.rolePermissions}>
              <span style={styles.permissionBadge}>Terminal de scan QR</span>
              <span style={styles.permissionBadge}>Statistiques personnelles uniquement</span>
              <span style={styles.permissionBadge}>Fonctionnement hors-ligne</span>
            </div>
            <button style={{ ...styles.roleBtn, backgroundColor: 'var(--primary)', color: '#000' }}>
              Lancer le Terminal de Scan <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Footer Section */}
      <footer style={styles.footer}>
        <div style={styles.footerMain} className="footer-main-responsive">
          <div style={styles.footerBrandCol}>
            <div style={styles.footerBrand}>
              <Shield size={24} color="var(--primary)" />
              <span style={styles.footerBrandText}>SmartPort Gateway</span>
            </div>
            <p style={styles.footerDesc}>
              Solution de régulation logistique et de contrôle d'accès intelligente pour les infrastructures portuaires de Cotonou.
            </p>
          </div>

          <div style={styles.footerLinksCol}>
            <h4 style={styles.footerColTitle}>Navigation</h4>
            <ul style={styles.footerLinksList}>
              <li><button onClick={() => scrollToSection('hero')} style={styles.footerLinkBtn} className="footer-link-btn">Accueil</button></li>
              <li><button onClick={() => scrollToSection('about')} style={styles.footerLinkBtn} className="footer-link-btn">À propos</button></li>
              <li><button onClick={() => scrollToSection('features')} style={styles.footerLinkBtn} className="footer-link-btn">Fonctionnalités</button></li>
              <li><button onClick={() => scrollToSection('roles')} style={styles.footerLinkBtn} className="footer-link-btn">Portails</button></li>
            </ul>
          </div>

          <div style={styles.footerContactCol}>
            <h4 style={styles.footerColTitle}>Contact & Localisation</h4>
            <div style={styles.contactItem}>
              <MapPin size={16} color="var(--primary)" />
              <span style={styles.contactText}>Port Autonome de Cotonou, Bénin</span>
            </div>
            <div style={styles.contactItem}>
              <Phone size={16} color="var(--primary)" />
              <span style={styles.contactText}>+229 21 31 52 90</span>
            </div>
            <div style={styles.contactItem}>
              <Info size={16} color="var(--primary)" />
              <span style={styles.contactText}>Assistance 24h/24 - 7j/7</span>
            </div>
          </div>
        </div>

        <div style={styles.footerBottom}>
          <p style={styles.footerBottomText}>
            © {new Date().getFullYear()} Port Autonome de Cotonou. Tous droits réservés.
          </p>
          <span style={styles.versionBadge}>v2.2.0-Prod</span>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    paddingTop: '80px', // to offset navbar
  },
  navbar: {
    position: 'fixed',
    top: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 30px)',
    maxWidth: '1200px',
    height: '65px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    zIndex: 1000,
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  navLogoText: {
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '-0.3px',
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  },
  navLinkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'var(--transition-smooth)',
    padding: '6px 4px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  apiBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid',
    borderRadius: '30px',
    padding: '4px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  navActionBtn: {
    backgroundColor: 'var(--primary-glow)',
    border: '1px solid var(--primary)',
    color: 'var(--primary)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition-smooth)',
  },
  heroSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '6rem 2rem 4rem 2rem',
    textAlign: 'center',
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '2.5rem',
  },
  heroContent: {
    maxWidth: '850px',
  },
  heroTagline: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--primary)',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    marginBottom: '16px',
    display: 'block',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-1px',
    marginBottom: '1.5rem',
    background: 'linear-gradient(135deg, #fff 40%, var(--text-secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroDescription: {
    color: 'var(--text-secondary)',
    fontSize: '1.15rem',
    lineHeight: 1.6,
    marginBottom: '2.5rem',
  },
  heroActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  heroPrimaryBtn: {
    backgroundColor: 'var(--primary)',
    color: '#000',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition-smooth)',
    boxShadow: '0 4px 14px rgba(0, 229, 255, 0.3)',
  },
  heroSecondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#fff',
    border: '1px solid var(--bg-card-border)',
    padding: '14px 28px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  syncCardBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    width: '100%',
    maxWidth: '750px',
    borderLeft: '4px solid var(--warning)',
    borderRadius: '12px',
    gap: '16px',
  },
  syncCardBannerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  syncActionBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--warning)',
    color: 'var(--warning)',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
    transition: 'var(--transition-smooth)',
  },
  section: {
    padding: '6rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 4rem auto',
  },
  sectionTag: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--secondary)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    display: 'block',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '1rem',
  },
  sectionSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  aboutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  aboutCard: {
    padding: '2.5rem 2rem',
    borderRadius: '16px',
    textAlign: 'left',
  },
  aboutCardTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#fff',
  },
  aboutCardText: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.6,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
  },
  featureCard: {
    padding: '2.5rem 2rem',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  featureIconContainer: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
  },
  featureText: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.5,
  },
  featureList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginTop: 'auto',
  },
  rolesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '2.5rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  roleCard: {
    padding: '3rem 2.5rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1.5rem',
  },
  roleIconWrapper: {
    padding: '14px',
    borderRadius: '12px',
  },
  roleCardTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  roleCardDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    minHeight: '70px',
  },
  rolePermissions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },
  permissionBadge: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.03)',
    width: 'fit-content',
  },
  roleBtn: {
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    marginTop: '1rem',
    transition: 'var(--transition-smooth)',
  },
  footer: {
    borderTop: '1px solid var(--bg-card-border)',
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    backdropFilter: 'blur(10px)',
    padding: '4rem 2rem 2rem 2rem',
    marginTop: 'auto',
  },
  footerMain: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.5fr',
    gap: '4rem',
    marginBottom: '3rem',
  },
  footerBrandCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  footerBrandText: {
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  footerDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    maxWidth: '320px',
  },
  footerLinksCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  footerColTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
  },
  footerLinksList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  footerLinkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    textAlign: 'left',
    transition: 'var(--transition-smooth)',
  },
  footerContactCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  contactText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  footerBottom: {
    maxWidth: '1200px',
    margin: '0 auto',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  footerBottomText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  versionBadge: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  }
};
