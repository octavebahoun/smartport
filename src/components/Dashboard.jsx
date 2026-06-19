import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw, FileText, Users, Database, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { apiService } from '../services/api';

export default function Dashboard({ setView, onLogout }) {
  const [online, setOnline] = useState(apiService.isOnline());
  const [dossiers, setDossiers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [queueSize, setQueueSize] = useState(apiService.getQueueSize());
  const [activeTab, setActiveTab] = useState('dossiers');
  const [showModal, setShowModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);

  // Form state
  const [newDossier, setNewDossier] = useState({
    number: '',
    type: 'IMPORT',
    status: 'VALIDE',
    client: '',
    driver: '',
    license: '',
    cargo: '',
    besc: '',
    qrCode: '',
    validUntil: ''
  });

  const loadData = async () => {
    try {
      const dossiersRes = await apiService.getDossiers();
      setDossiers(dossiersRes.data);
      setFallbackMode(dossiersRes.fallback);
      
      const logsData = await apiService.getLogs();
      setLogs(logsData);
      
      setQueueSize(apiService.getQueueSize());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    const handleConnection = () => {
      setOnline(apiService.isOnline());
      loadData();
    };

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('smartport_connection_changed', handleConnection);
    window.addEventListener('smartport_queue_updated', handleSync);
    window.addEventListener('smartport_logs_synced', handleSync);

    return () => {
      window.removeEventListener('smartport_connection_changed', handleConnection);
      window.removeEventListener('smartport_queue_updated', handleSync);
      window.removeEventListener('smartport_logs_synced', handleSync);
    };
  }, []);

  const toggleOnline = () => {
    apiService.toggleOnlineStatus();
  };

  const handleSyncQueue = async () => {
    if (!online) return;
    setIsSyncing(true);
    try {
      await apiService.syncOfflineQueue();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!online) {
      alert('Impossible de créer un dossier en mode dégradé (API hors-ligne).');
      return;
    }
    try {
      const dossierToSave = {
        ...newDossier,
        qrCode: `QR_${newDossier.driver.split(' ')[0].toUpperCase()}_${newDossier.besc.split('-').pop()}`
      };
      await apiService.saveDossier(dossierToSave);
      setShowModal(false);
      setNewDossier({
        number: '', type: 'IMPORT', status: 'VALIDE', client: '', driver: '', license: '', cargo: '', besc: '', qrCode: '', validUntil: ''
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          <button onClick={() => setView('dashboard-personnel')} style={styles.backBtn} title="Retour au Hub">
            <ArrowLeft size={20} color="var(--primary)" />
          </button>
          <div style={styles.logoGroup}>
            <ShieldCheck size={28} color="var(--secondary)" />
            <h1 style={styles.navTitle}>Supervision Gateway</h1>
          </div>
        </div>

        <div style={styles.navRight}>
          <div style={{ ...styles.apiBadge, borderColor: online ? 'var(--success)' : 'var(--error)' }}>
            {online ? <Wifi size={16} color="var(--success)" /> : <WifiOff size={16} color="var(--error)" />}
            <span style={{ color: online ? 'var(--success)' : 'var(--error)' }}>
              API: {online ? 'Opérationnelle' : 'Déconnectée'}
            </span>
          </div>
          <button onClick={toggleOnline} style={styles.toggleBtn}>
            Simuler {online ? 'Coupure API' : 'Connexion API'}
          </button>
        </div>
      </header>

      {/* Connection fallbacks banner */}
      {fallbackMode && (
        <div style={styles.fallbackNotice}>
          ⚠️ Données chargées depuis le cache local (Mode dégradé). Les créations ou modifications sont désactivées.
        </div>
      )}

      {/* Dashboard Metrics */}
      <section style={styles.metricsGrid}>
        <div className="glass" style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <FileText size={22} color="var(--primary)" />
          </div>
          <div>
            <p style={styles.metricLabel}>Dossiers Actifs</p>
            <h3 style={styles.metricVal}>{dossiers.length}</h3>
          </div>
        </div>

        <div className="glass" style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Users size={22} color="var(--secondary)" />
          </div>
          <div>
            <p style={styles.metricLabel}>Opérations terrain</p>
            <h3 style={styles.metricVal}>{logs.length}</h3>
          </div>
        </div>

        <div className="glass" style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Database size={22} color="var(--warning)" />
          </div>
          <div>
            <p style={styles.metricLabel}>File Hors-ligne</p>
            <div style={styles.queueInfo}>
              <h3 style={styles.metricVal}>{queueSize}</h3>
              {queueSize > 0 && (
                <button 
                  onClick={handleSyncQueue} 
                  disabled={!online || isSyncing} 
                  style={{
                    ...styles.syncButton,
                    opacity: online ? 1 : 0.5
                  }}
                >
                  <RefreshCw size={12} style={{ animation: isSyncing ? 'spin-slow 2s linear infinite' : 'none', marginRight: 4 }} />
                  {isSyncing ? 'Sync...' : 'Sync'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main content tabs */}
      <div style={styles.tabContainer}>
        <button 
          onClick={() => setActiveTab('dossiers')} 
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'dossiers' ? '2px solid var(--primary)' : 'none', color: activeTab === 'dossiers' ? 'var(--primary)' : 'var(--text-secondary)' }}
        >
          Dossiers Logistiques
        </button>
        <button 
          onClick={() => setActiveTab('logs')} 
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'logs' ? '2px solid var(--primary)' : 'none', color: activeTab === 'logs' ? 'var(--primary)' : 'var(--text-secondary)' }}
        >
          Journaux d'Audit & Accès
        </button>
      </div>

      {/* Tab Contents */}
      <main className="glass" style={styles.contentBody}>
        {activeTab === 'dossiers' ? (
          <div>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Dossiers de Fret Logistique</h3>
              <button 
                onClick={() => setShowModal(true)} 
                disabled={!online}
                style={{
                  ...styles.addBtn,
                  opacity: online ? 1 : 0.5,
                  cursor: online ? 'pointer' : 'not-allowed'
                }}
              >
                <Plus size={16} /> Nouveau Dossier
              </button>
            </div>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Référence</th>
                    <th style={styles.th}>Client</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Chauffeur</th>
                    <th style={styles.th}>Véhicule</th>
                    <th style={styles.th}>Statut</th>
                    <th style={styles.th}>Validité</th>
                    <th style={styles.th}>QR Code Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((d, index) => (
                    <tr key={index} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 'bold' }}>{d.number}</td>
                      <td style={styles.td}>{d.client}</td>
                      <td style={styles.td}>
                        <span style={{ 
                          ...styles.badge, 
                          backgroundColor: d.type === 'IMPORT' ? 'var(--primary-glow)' : 'var(--secondary-glow)',
                          color: d.type === 'IMPORT' ? 'var(--primary)' : 'var(--secondary)'
                        }}>
                          {d.type}
                        </span>
                      </td>
                      <td style={styles.td}>{d.driver}</td>
                      <td style={styles.td}>{d.license}</td>
                      <td style={styles.td}>
                        <span style={{ 
                          ...styles.badge, 
                          backgroundColor: d.status === 'VALIDE' ? 'var(--success-glow)' : 
                                           d.status === 'LITIGE' ? 'var(--error-glow)' : 'rgba(255,255,255,0.05)',
                          color: d.status === 'VALIDE' ? 'var(--success)' : 
                                 d.status === 'LITIGE' ? 'var(--error)' : 'var(--text-secondary)'
                        }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={styles.td}>{d.validUntil}</td>
                      <td style={{ ...styles.td, color: 'var(--primary)', fontFamily: 'monospace' }}>{d.qrCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Historique des contrôles de sécurité</h3>
            </div>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Horodatage</th>
                    <th style={styles.th}>Gateway</th>
                    <th style={styles.th}>Chauffeur</th>
                    <th style={styles.th}>Immatriculation</th>
                    <th style={styles.th}>QR Payload</th>
                    <th style={styles.th}>Statut Contrôle</th>
                    <th style={styles.th}>Notes / Motif</th>
                    <th style={styles.th}>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={index} style={styles.tr}>
                      <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={styles.td}>{log.gateway}</td>
                      <td style={styles.td}>{log.driver}</td>
                      <td style={styles.td}>{log.license}</td>
                      <td style={{ ...styles.td, fontFamily: 'monospace' }}>{log.qrCode}</td>
                      <td style={styles.td}>
                        <span style={{ 
                          ...styles.badge, 
                          backgroundColor: log.status === 'AUTORISE' ? 'var(--success-glow)' : 
                                           log.status === 'PROVISOIRE' ? 'var(--warning-glow)' : 'var(--error-glow)',
                          color: log.status === 'AUTORISE' ? 'var(--success)' : 
                                 log.status === 'PROVISOIRE' ? 'var(--warning)' : 'var(--error)'
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: 'var(--text-muted)' }}>{log.reason || 'Conforme'}</td>
                      <td style={styles.td}>
                        {log.offline ? (
                          <span style={styles.offlineLabel}>Hors-ligne</span>
                        ) : (
                          <span style={styles.onlineLabel}>Sync</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modal}>
            <h2 style={styles.modalTitle}>Créer un Dossier de Fret</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Référence Dossier</label>
                  <input type="text" placeholder="ex: DOS-2026-901" required value={newDossier.number} onChange={e => setNewDossier({...newDossier, number: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Client / Chargeur</label>
                  <input type="text" placeholder="ex: Cotonou Freight SA" required value={newDossier.client} onChange={e => setNewDossier({...newDossier, client: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nom du Chauffeur</label>
                  <input type="text" placeholder="ex: Modeste Soglo" required value={newDossier.driver} onChange={e => setNewDossier({...newDossier, driver: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Plaque d'Immatriculation</label>
                  <input type="text" placeholder="ex: RN-2212-MD" required value={newDossier.license} onChange={e => setNewDossier({...newDossier, license: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Désignation Marchandise</label>
                  <input type="text" placeholder="ex: 15t Blé" required value={newDossier.cargo} onChange={e => setNewDossier({...newDossier, cargo: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Bordereau BESC</label>
                  <input type="text" placeholder="ex: BJ-COT-12345" required value={newDossier.besc} onChange={e => setNewDossier({...newDossier, besc: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Date de validité</label>
                  <input type="date" required value={newDossier.validUntil} onChange={e => setNewDossier({...newDossier, validUntil: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Flux</label>
                  <select value={newDossier.type} onChange={e => setNewDossier({...newDossier, type: e.target.value})} style={styles.formInput}>
                    <option value="IMPORT">IMPORT</option>
                    <option value="EXPORT">EXPORT</option>
                  </select>
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Annuler</button>
                <button type="submit" style={styles.submitBtn}>Créer et Générer QR</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    gap: '2rem',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  backBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'var(--transition-smooth)',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  apiBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid transparent',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 500,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  toggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: 'none',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  fallbackNotice: {
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    border: '1px solid var(--error)',
    color: 'var(--error)',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  metricCard: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  metricIcon: {
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  metricVal: {
    fontSize: '1.8rem',
    fontWeight: 700,
  },
  queueInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  syncButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--warning-glow)',
    border: '1px solid var(--warning)',
    color: 'var(--warning)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabContainer: {
    display: 'flex',
    gap: '1rem',
    borderBottom: '1px solid var(--bg-card-border)',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '12px 16px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'var(--transition-smooth)',
  },
  contentBody: {
    padding: '2rem',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  tableTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
  },
  addBtn: {
    backgroundColor: 'var(--primary)',
    color: '#000',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    borderBottom: '1px solid var(--bg-card-border)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: '0.85rem',
    padding: '12px 16px',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    transition: 'var(--transition-smooth)',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.01)',
    }
  },
  td: {
    padding: '14px 16px',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  offlineLabel: {
    backgroundColor: 'var(--warning-glow)',
    color: 'var(--warning)',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 600,
    border: '1px solid var(--warning)',
  },
  onlineLabel: {
    backgroundColor: 'var(--success-glow)',
    color: 'var(--success)',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 600,
    border: '1px solid var(--success)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    width: '90%',
    maxWidth: '600px',
    padding: '2rem',
  },
  modalTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '1rem',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    border: 'none',
    color: '#000',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
  }
};
