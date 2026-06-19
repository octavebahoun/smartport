import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wifi, WifiOff, Scan, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiService } from '../services/api';

export default function Scanner({ setView, onLogout }) {
  const [online, setOnline] = useState(apiService.isOnline());
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState('Porte Principale A');

  useEffect(() => {
    const handleConnection = () => {
      setOnline(apiService.isOnline());
    };
    window.addEventListener('smartport_connection_changed', handleConnection);
    
    // Load initial logs
    apiService.getLogs().then(logs => {
      setRecentLogs(logs.slice(0, 5));
    });

    return () => {
      window.removeEventListener('smartport_connection_changed', handleConnection);
    };
  }, []);

  const handleScan = async (codeToScan) => {
    const code = codeToScan || qrInput;
    if (!code) return;
    
    setLoading(true);
    setScanResult(null);

    try {
      const result = await apiService.validateAccessQr(code, selectedGateway);
      setScanResult(result);
      
      // Refresh logs
      const updatedLogs = await apiService.getLogs();
      setRecentLogs(updatedLogs.slice(0, 5));
    } catch (err) {
      console.error(err);
      setScanResult({
        status: 'REFUSE',
        message: 'Erreur technique lors de la validation.',
        dossier: null,
        offline: true
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setScanResult(null);
    setQrInput('');
  };

  const testCodes = [
    { name: 'Kofi (VALIDE Import)', code: 'QR_KOFI_99823' },
    { name: 'Amadou (VALIDE Export)', code: 'QR_AMADOU_11092' },
    { name: 'Chidi (LITIGE)', code: 'QR_CHIDI_55410' },
    { name: 'Yao (BROUILLON)', code: 'QR_YAO_77401' },
    { name: 'QR Code Inconnu', code: 'QR_SUSPECT_999' }
  ];

  return (
    <div style={styles.container}>
      {/* Mobile Top Bar */}
      <header style={styles.topBar}>
        <button onClick={() => setView('dashboard-personnel')} style={styles.backBtn} title="Retour au Hub">
          <ArrowLeft size={20} color="var(--primary)" />
        </button>
        <span style={styles.headerTitle}>Poste de Contrôle</span>
        <div style={{ ...styles.networkBadge, color: online ? 'var(--success)' : 'var(--warning)' }}>
          {online ? <Wifi size={18} /> : <WifiOff size={18} />}
          <span style={styles.networkText}>{online ? 'Connecté' : 'Hors-ligne (Dégradé)'}</span>
        </div>
      </header>

      {/* Main viewport */}
      <main style={styles.main}>
        {/* Offline Alert */}
        {!online && (
          <div style={styles.offlineBanner}>
            <AlertTriangle size={20} style={{ marginRight: 8 }} />
            <span>Serveur inaccessible. Fallback local actif : validation via cache et files d'attente localisées.</span>
          </div>
        )}

        <div style={styles.layout}>
          {/* Left panel: Scan simulator */}
          <div className="glass" style={styles.scanSection}>
            <div style={styles.gatewaySelector}>
              <label style={styles.label}>Poste d'Accès :</label>
              <select 
                value={selectedGateway} 
                onChange={(e) => setSelectedGateway(e.target.value)}
                style={styles.select}
              >
                <option value="Porte Principale A">Porte Principale A</option>
                <option value="Porte Est B">Porte Est B</option>
                <option value="Terminal Conteneur C">Terminal Conteneur C</option>
              </select>
            </div>

            {/* Scan animation screen */}
            <div style={styles.scannerViewport}>
              <div style={styles.scannerTarget}>
                <div style={styles.scannerLaser} />
                <Scan size={60} color="rgba(255, 255, 255, 0.2)" />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 15 }}>
                Veuillez scanner le QR Code du Chauffeur
              </p>
            </div>

            {/* Manual QR Input simulation */}
            <div style={styles.inputGroup}>
              <input 
                type="text" 
                placeholder="Simuler ou saisir un QR Code..." 
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                style={styles.input}
              />
              <button onClick={() => handleScan()} disabled={loading} style={styles.scanBtn}>
                {loading ? 'Validation...' : 'Valider'}
              </button>
            </div>

            {/* Test shortcuts */}
            <div style={styles.shortcuts}>
              <p style={styles.shortcutLabel}>Simulations rapides :</p>
              <div style={styles.shortcutGrid}>
                {testCodes.map((tc, idx) => (
                  <button key={idx} onClick={() => { setQrInput(tc.code); handleScan(tc.code); }} style={styles.shortcutBtn}>
                    {tc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Active Result or Recent Logs */}
          <div style={styles.resultSection}>
            {scanResult ? (
              /* Validation Outcome Screen */
              <div 
                className="glass" 
                style={{ 
                  ...styles.outcomeCard,
                  borderColor: scanResult.status === 'AUTORISE' ? 'var(--success)' : 
                               scanResult.status === 'PROVISOIRE' ? 'var(--warning)' : 'var(--error)'
                }}
              >
                <div style={styles.outcomeHeader}>
                  {scanResult.status === 'AUTORISE' && <CheckCircle size={48} color="var(--success)" />}
                  {scanResult.status === 'REFUSE' && <XCircle size={48} color="var(--error)" />}
                  {scanResult.status === 'PROVISOIRE' && <Clock size={48} color="var(--warning)" />}
                  
                  <h2 style={{
                    ...styles.outcomeTitle,
                    color: scanResult.status === 'AUTORISE' ? 'var(--success)' : 
                           scanResult.status === 'PROVISOIRE' ? 'var(--warning)' : 'var(--error)'
                  }}>
                    {scanResult.status}
                  </h2>
                  <p style={styles.outcomeSub}>{scanResult.message}</p>
                </div>

                {scanResult.dossier && (
                  <div style={styles.dossierDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Chauffeur</span>
                      <span style={styles.detailValue}>{scanResult.dossier.driver}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Véhicule</span>
                      <span style={styles.detailValue}>{scanResult.dossier.license}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Cargaison</span>
                      <span style={styles.detailValue}>{scanResult.dossier.cargo}</span>
                    </div>
                    {scanResult.dossier.besc !== 'À synchroniser' && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>N° BESC</span>
                        <span style={styles.detailValue}>{scanResult.dossier.besc}</span>
                      </div>
                    )}
                  </div>
                )}

                <button onClick={clearResult} style={styles.closeResultBtn}>
                  Nouveau Scan
                </button>
              </div>
            ) : (
              /* Recent logs list */
              <div className="glass" style={styles.logsCard}>
                <h3 style={styles.sectionTitle}>Derniers passages</h3>
                <div style={styles.logsList}>
                  {recentLogs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                      Aucun scan enregistré.
                    </p>
                  ) : (
                    recentLogs.map((log, idx) => (
                      <div key={idx} style={styles.logItem}>
                        <div style={styles.logLeft}>
                          <div style={{ 
                            ...styles.logStatusDot, 
                            backgroundColor: log.status === 'AUTORISE' ? 'var(--success)' : 
                                             log.status === 'PROVISOIRE' ? 'var(--warning)' : 'var(--error)'
                          }} />
                          <div>
                            <p style={styles.logDriver}>{log.driver}</p>
                            <p style={styles.logMeta}>{log.license} • {log.gateway}</p>
                          </div>
                        </div>
                        <div style={styles.logRight}>
                          <p style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</p>
                          {log.offline && (
                            <span style={styles.offlineTag}>Offline</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
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
  headerTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
  },
  networkBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--bg-card-border)',
    padding: '6px 12px',
    borderRadius: '20px',
  },
  networkText: {
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flexGrow: 1,
  },
  offlineBanner: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 234, 0, 0.1)',
    border: '1px solid var(--warning)',
    color: 'var(--warning)',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    lineHeight: 1.4,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    flexGrow: 1,
  },
  scanSection: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  gatewaySelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  select: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    outline: 'none',
  },
  scannerViewport: {
    height: '220px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  scannerTarget: {
    width: '120px',
    height: '120px',
    border: '2px dashed rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scannerLaser: {
    position: 'absolute',
    left: '0',
    width: '100%',
    height: '2px',
    backgroundColor: 'var(--primary)',
    boxShadow: '0 0 10px var(--primary)',
    animation: 'scan-line 2.5s ease-in-out infinite',
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flexGrow: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '0.9rem',
  },
  scanBtn: {
    backgroundColor: 'var(--primary)',
    border: 'none',
    color: '#000',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  shortcuts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  shortcutLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  shortcutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  shortcutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    padding: '8px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    }
  },
  resultSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  outcomeCard: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '1.5rem',
    flexGrow: 1,
    justifyContent: 'center',
    borderWidth: '2px',
  },
  outcomeHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  outcomeTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '1px',
  },
  outcomeSub: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  dossierDetails: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '8px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
  },
  detailLabel: {
    color: 'var(--text-secondary)',
  },
  detailValue: {
    fontWeight: 600,
  },
  closeResultBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    transition: 'var(--transition-smooth)',
  },
  logsCard: {
    padding: '1.5rem',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexGrow: 1,
  },
  logItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '8px',
  },
  logLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logStatusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  logDriver: {
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  logMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  logRight: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  logTime: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  offlineTag: {
    fontSize: '0.65rem',
    backgroundColor: 'var(--warning-glow)',
    color: 'var(--warning)',
    border: '1px solid var(--warning)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 600,
  }
};
