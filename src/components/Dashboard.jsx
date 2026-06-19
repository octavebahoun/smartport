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

  // SOAP testing tool states
  const [soapRef, setSoapRef] = useState('SOAP_TEST_123');
  const [soapStatus, setSoapStatus] = useState('VALIDE');
  const [soapType, setSoapType] = useState('IMPORT');
  const [soapLoading, setSoapLoading] = useState(false);
  const [soapResult, setSoapResult] = useState(null);

  const handleSoapGet = async () => {
    setSoapLoading(true);
    setSoapResult(null);
    try {
      const res = await apiService.soapClient.getDossier(soapRef);
      setSoapResult({
        action: 'GetDossier',
        endpoint: apiService.soapClient.getSoapUrl(),
        ...res
      });
    } catch (err) {
      setSoapResult({
        action: 'GetDossier',
        endpoint: apiService.soapClient.getSoapUrl(),
        success: false,
        error: err.message
      });
    } finally {
      setSoapLoading(false);
    }
  };

  const handleSoapCreate = async () => {
    setSoapLoading(true);
    setSoapResult(null);
    try {
      const res = await apiService.soapClient.createDossier(soapRef, soapStatus, soapType);
      setSoapResult({
        action: 'CreateDossier',
        endpoint: apiService.soapClient.getSoapUrl(),
        ...res
      });
    } catch (err) {
      setSoapResult({
        action: 'CreateDossier',
        endpoint: apiService.soapClient.getSoapUrl(),
        success: false,
        error: err.message
      });
    } finally {
      setSoapLoading(false);
    }
  };

  const getSentRequestXml = () => {
    if (!soapResult) return '';
    const payload = soapResult.action === 'GetDossier'
      ? `<GetDossierRequest>\n         <reference_metier>${soapRef}</reference_metier>\n      </GetDossierRequest>`
      : `<CreateDossierRequest>\n         <reference_metier>${soapRef}</reference_metier>\n         <statut>${soapStatus}</statut>\n         <type_operation>${soapType}</type_operation>\n      </CreateDossierRequest>`;
      
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:smart="http://smartport.lacotonou.bj/">
   <soapenv:Header/>
   <soapenv:Body>
      ${payload}
   </soapenv:Body>
</soapenv:Envelope>`;
  };

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
        <button 
          onClick={() => setActiveTab('soap')} 
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'soap' ? '2px solid var(--primary)' : 'none', color: activeTab === 'soap' ? 'var(--primary)' : 'var(--text-secondary)' }}
        >
          Intégration SOAP (PAC Legacy)
        </button>
      </div>

      {/* Tab Contents */}
      <main className="glass" style={styles.contentBody}>
        {activeTab === 'dossiers' && (
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
        )}
        {activeTab === 'logs' && (
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

        {activeTab === 'soap' && (
          <div style={styles.soapTab}>
            <div style={styles.soapHeader}>
              <h3 style={styles.tableTitle}>Port PAC Legacy - Terminal de Test Connecteur SOAP</h3>
              <p style={styles.soapSub}>
                Ce module interagit directement avec le serveur d'intégration SOAP du Port Autonome de Cotonou configuré à l'adresse :{' '}
                <code style={styles.codeBadge}>{apiService.soapClient.getSoapUrl()}</code>
              </p>
            </div>

            <div style={styles.soapGrid}>
              {/* Formulaire de test SOAP */}
              <div style={styles.soapFormCard}>
                <h4 style={styles.soapPanelTitle}>Paramètres de la requête</h4>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Référence Métier (Dossier)</label>
                  <div style={styles.inputWithSuggestions}>
                    <input 
                      type="text" 
                      value={soapRef} 
                      onChange={e => setSoapRef(e.target.value)} 
                      style={styles.formInput} 
                      placeholder="ex: SOAP_TEST_123"
                    />
                    {dossiers.length > 0 && (
                      <div style={styles.suggestionsContainer}>
                        <span style={styles.suggestionLabel}>Raccourcis :</span>
                        {dossiers.slice(0, 3).map((d, i) => (
                          <button 
                            key={i} 
                            type="button" 
                            onClick={() => setSoapRef(d.number || d.reference_metier)}
                            style={styles.suggestionBtn}
                          >
                            {d.number || d.reference_metier}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup} className="flex-1">
                    <label style={styles.formLabel}>Statut (pour CreateDossier)</label>
                    <select 
                      value={soapStatus} 
                      onChange={e => setSoapStatus(e.target.value)} 
                      style={styles.formInput}
                    >
                      <option value="VALIDE">VALIDE</option>
                      <option value="LITIGE">LITIGE</option>
                      <option value="BROUILLON">BROUILLON</option>
                      <option value="VALIDE_EXTERNE">VALIDE_EXTERNE</option>
                    </select>
                  </div>

                  <div style={styles.formGroup} className="flex-1">
                    <label style={styles.formLabel}>Type d'Opération (pour CreateDossier)</label>
                    <select 
                      value={soapType} 
                      onChange={e => setSoapType(e.target.value)} 
                      style={styles.formInput}
                    >
                      <option value="IMPORT">IMPORT</option>
                      <option value="EXPORT">EXPORT</option>
                    </select>
                  </div>
                </div>

                <div style={styles.soapActions}>
                  <button 
                    type="button" 
                    onClick={handleSoapGet} 
                    disabled={soapLoading} 
                    style={styles.soapBtnGet}
                  >
                    {soapLoading ? 'Appel en cours...' : 'Consulter (GetDossier)'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSoapCreate} 
                    disabled={soapLoading} 
                    style={styles.soapBtnCreate}
                  >
                    {soapLoading ? 'Appel en cours...' : 'Créer / Mettre à jour (CreateDossier)'}
                  </button>
                </div>
              </div>

              {/* Inspecteur SOAP */}
              <div style={styles.soapInspectorCard}>
                <h4 style={styles.soapPanelTitle}>Inspecteur SOAP & Trame XML</h4>
                
                {!soapResult && !soapLoading && (
                  <div style={styles.emptyInspector}>
                    <Database size={40} color="var(--text-muted)" />
                    <p style={{ marginTop: '10px' }}>Lancez une opération SOAP pour visualiser les enveloppes XML de requêtes et de réponses en temps réel.</p>
                  </div>
                )}

                {soapLoading && (
                  <div style={styles.emptyInspector}>
                    <RefreshCw size={40} color="var(--primary)" style={{ animation: 'spin-slow 2s linear infinite' }} />
                    <p style={{ marginTop: '10px' }}>Envoi de la trame XML en cours...</p>
                  </div>
                )}

                {soapResult && (
                  <div style={styles.resultContainer}>
                    <div style={{
                      ...styles.resultStatusBar,
                      backgroundColor: soapResult.success ? 'var(--success-glow)' : 'var(--error-glow)',
                      borderColor: soapResult.success ? 'var(--success)' : 'var(--error)',
                    }}>
                      <span style={{ fontWeight: 'bold', color: soapResult.success ? 'var(--success)' : 'var(--error)' }}>
                        {soapResult.success ? 'SUCCÈS' : 'ÉCHEC'} (HTTP {soapResult.status || 'ERR'})
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Action: {soapResult.action}
                      </span>
                    </div>

                    <div style={styles.inspectorSection}>
                      <span style={styles.sectionLabel}>Données analysées (JSON) :</span>
                      <pre style={styles.jsonBlock}>
                        {JSON.stringify(soapResult.parsed || { error: soapResult.error || 'Aucune donnée retournée' }, null, 2)}
                      </pre>
                    </div>

                    <div style={styles.inspectorSection}>
                      <span style={styles.sectionLabel}>Enveloppe de la requête XML envoyée :</span>
                      <pre style={styles.xmlBlock}>{getSentRequestXml()}</pre>
                    </div>

                    {soapResult.xml && (
                      <div style={styles.inspectorSection}>
                        <span style={styles.sectionLabel}>Enveloppe de la réponse XML reçue :</span>
                        <pre style={styles.xmlBlock}>{soapResult.xml}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
  },
  soapTab: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  soapHeader: {
    borderBottom: '1px solid var(--bg-card-border)',
    paddingBottom: '1rem',
  },
  soapSub: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  codeBadge: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'var(--primary)',
  },
  soapGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '1.5rem',
  },
  soapFormCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  soapPanelTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '0.5rem',
  },
  soapInspectorCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
  },
  emptyInspector: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    padding: '2rem',
  },
  resultContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1,
  },
  resultStatusBar: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sectionLabel: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  jsonBlock: {
    margin: 0,
    padding: '10px',
    borderRadius: '6px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'var(--primary)',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    overflowX: 'auto',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  xmlBlock: {
    margin: 0,
    padding: '10px',
    borderRadius: '6px',
    backgroundColor: '#0a0d14',
    color: '#a9b1d6',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    overflowX: 'auto',
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
  },
  inputWithSuggestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  suggestionsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
    marginTop: '2px',
  },
  suggestionLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  suggestionBtn: {
    fontSize: '0.7rem',
    padding: '2px 8px',
    borderRadius: '10px',
    border: '1px solid var(--bg-card-border)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'var(--primary)',
    cursor: 'pointer',
  },
  soapActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '0.5rem',
  },
  soapBtnGet: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  soapBtnCreate: {
    flex: 1,
    backgroundColor: 'var(--primary)',
    border: 'none',
    color: '#000',
    padding: '10px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
  }
};
