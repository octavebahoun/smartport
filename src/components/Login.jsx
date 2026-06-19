import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Lock, Mail, Smartphone, KeyRound, Wifi, WifiOff, User } from 'lucide-react';
import { apiService } from '../services/api';

export default function Login({ setView, initialRole, onLoginSuccess }) {
  const [online, setOnline] = useState(apiService.isOnline());
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  
  // Login states
  const [loginType, setLoginType] = useState(initialRole || 'supervisor'); // 'supervisor' or 'agent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hardwareId, setHardwareId] = useState('');
  
  // Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('supervisor'); // 'supervisor' or 'agent'
  const [regHardwareId, setRegHardwareId] = useState('');

  // MFA state for supervisors
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [tempUserId, setTempUserId] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Generate a default mock hardware ID for ease of use
    if (loginType === 'agent' && !hardwareId) {
      setHardwareId('TERM-PAC-' + Math.floor(1000 + Math.random() * 9000));
    }
    if (regRole === 'agent' && !regHardwareId) {
      setRegHardwareId('TERM-PAC-' + Math.floor(1000 + Math.random() * 9000));
    }

    const handleConnection = () => {
      setOnline(apiService.isOnline());
    };
    window.addEventListener('smartport_connection_changed', handleConnection);
    return () => {
      window.removeEventListener('smartport_connection_changed', handleConnection);
    };
  }, [loginType, regRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        if (loginType === 'supervisor') {
          if (!mfaRequired) {
            // Step 1: Username & Password login
            const res = await apiService.login(email, password);
            if (res.mfaRequired) {
              setMfaRequired(true);
              setTempUserId(res.userId);
              setLoading(false);
            } else {
              // Logged in directly (if MFA was bypassed or not required)
              onLoginSuccess('supervisor', res.user);
            }
          } else {
            // Step 2: MFA verification
            const res = await apiService.verifyMfa(tempUserId, mfaCode);
            onLoginSuccess('supervisor', res.user);
          }
        } else {
          // Agent login
          const res = await apiService.agentLogin(email, password, hardwareId);
          onLoginSuccess('agent', res.agent);
        }
      } else {
        // Registration mode
        const res = await apiService.register(
          regName,
          regEmail,
          regPassword,
          regRole,
          regRole === 'agent' ? regHardwareId : ''
        );

        setSuccess('Inscription réussie ! Connexion automatique...');
        
        // Auto-login after registration
        setTimeout(async () => {
          try {
            if (regRole === 'supervisor') {
              // Mock auth token or trigger login
              localStorage.setItem('smartport_supervisor_token', 'mock-register-token-' + Date.now());
              onLoginSuccess('supervisor', res.user);
            } else {
              localStorage.setItem('smartport_agent_token', 'mock-register-token-' + Date.now());
              localStorage.setItem('smartport_terminal_id', regHardwareId);
              onLoginSuccess('agent', res.user);
            }
          } catch (err) {
            setError('Erreur lors de la connexion automatique.');
            setLoading(false);
          }
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'opération.');
      setLoading(false);
    } finally {
      if (mode === 'login') {
        setLoading(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => setView('landing')} style={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ ...styles.apiBadge, borderColor: online ? 'var(--success)' : 'var(--error)' }}>
          {online ? <Wifi size={14} color="var(--success)" /> : <WifiOff size={14} color="var(--error)" />}
          <span style={{ color: online ? 'var(--success)' : 'var(--error)' }}>
            API: {online ? 'En ligne' : 'Mode Dégradé'}
          </span>
        </div>
      </header>

      <main className="glass" style={styles.loginCard}>
        <div style={styles.cardHeader}>
          <Shield size={42} color={loginType === 'supervisor' ? 'var(--secondary)' : 'var(--primary)'} />
          <h2 style={styles.title}>Portail d'Accès Sécurisé</h2>
          <p style={styles.subtitle}>SmartPort Gateway — Port Autonome de Cotonou</p>
        </div>

        {/* Mode Toggle (Connexion / Inscription) */}
        {!mfaRequired && (
          <div style={styles.modeToggleContainer}>
            <button 
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              style={{
                ...styles.modeBtn,
                backgroundColor: mode === 'login' ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: mode === 'login' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Connexion
            </button>
            <button 
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              style={{
                ...styles.modeBtn,
                backgroundColor: mode === 'register' ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: mode === 'register' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Inscription
            </button>
          </div>
        )}

        {/* Tab Selector - ONLY FOR LOGIN MODE */}
        {mode === 'login' && !mfaRequired && (
          <div style={styles.tabContainer}>
            <button 
              type="button" 
              onClick={() => { setLoginType('supervisor'); setError(''); }} 
              style={{
                ...styles.tabBtn,
                borderBottom: loginType === 'supervisor' ? '2px solid var(--secondary)' : 'none',
                color: loginType === 'supervisor' ? 'var(--secondary)' : 'var(--text-secondary)'
              }}
            >
              Superviseur / DSI
            </button>
            <button 
              type="button" 
              onClick={() => { setLoginType('agent'); setError(''); }} 
              style={{
                ...styles.tabBtn,
                borderBottom: loginType === 'agent' ? '2px solid var(--primary)' : 'none',
                color: loginType === 'agent' ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              Agent Terrain / Scan
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorBanner}>{error}</div>}
          {success && <div style={styles.successBanner}>{success}</div>}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <>
              {!mfaRequired ? (
                <>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Adresse Email</label>
                    <div style={styles.inputWrapper}>
                      <Mail size={18} style={styles.inputIcon} />
                      <input 
                        type="email" 
                        placeholder={loginType === 'supervisor' ? 'supervisor@smartport.gov' : 'agent@smartport.gov'} 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        style={styles.input} 
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Mot de passe</label>
                    <div style={styles.inputWrapper}>
                      <Lock size={18} style={styles.inputIcon} />
                      <input 
                        type="password" 
                        placeholder="••••••••••••" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        style={styles.input} 
                      />
                    </div>
                  </div>

                  {loginType === 'agent' && (
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Identifiant Matériel (Terminal)</label>
                      <div style={styles.inputWrapper}>
                        <Smartphone size={18} style={styles.inputIcon} />
                        <input 
                          type="text" 
                          placeholder="ex: TERM-PAC-8001" 
                          required 
                          value={hardwareId} 
                          onChange={e => setHardwareId(e.target.value)} 
                          style={styles.input} 
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.mfaContainer}>
                  <div style={styles.mfaIconWrapper}>
                    <KeyRound size={32} color="var(--warning)" />
                  </div>
                  <h3 style={styles.mfaTitle}>Double Authentification (MFA)</h3>
                  <p style={styles.mfaSubtitle}>
                    Veuillez saisir le code de sécurité TOTP à 6 chiffres généré par votre application d'authentification.
                  </p>
                  
                  <div style={styles.inputGroup}>
                    <input 
                      type="text" 
                      maxLength={6} 
                      placeholder="000 000" 
                      required 
                      value={mfaCode} 
                      onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))} 
                      style={styles.mfaInput} 
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nom complet</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input 
                    type="text" 
                    placeholder="ex: Marc Gandonou" 
                    required 
                    value={regName} 
                    onChange={e => setRegName(e.target.value)} 
                    style={styles.input} 
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Adresse Email</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input 
                    type="email" 
                    placeholder="ex: m.gandonou@smartport.gov" 
                    required 
                    value={regEmail} 
                    onChange={e => setRegEmail(e.target.value)} 
                    style={styles.input} 
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Mot de passe</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input 
                    type="password" 
                    placeholder="••••••••••••" 
                    required 
                    value={regPassword} 
                    onChange={e => setRegPassword(e.target.value)} 
                    style={styles.input} 
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Rôle de l'utilisateur</label>
                <div style={styles.roleSelectContainer}>
                  <button 
                    type="button"
                    onClick={() => setRegRole('supervisor')}
                    style={{
                      ...styles.roleSelectBtn,
                      border: regRole === 'supervisor' ? '2px solid var(--secondary)' : '1px solid var(--bg-card-border)',
                      color: regRole === 'supervisor' ? 'var(--secondary)' : 'var(--text-secondary)',
                      backgroundColor: regRole === 'supervisor' ? 'var(--secondary-glow)' : 'transparent',
                    }}
                  >
                    Superviseur / DSI
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRegRole('agent')}
                    style={{
                      ...styles.roleSelectBtn,
                      border: regRole === 'agent' ? '2px solid var(--primary)' : '1px solid var(--bg-card-border)',
                      color: regRole === 'agent' ? 'var(--primary)' : 'var(--text-secondary)',
                      backgroundColor: regRole === 'agent' ? 'var(--primary-glow)' : 'transparent',
                    }}
                  >
                    Agent Scan
                  </button>
                </div>
              </div>

              {regRole === 'agent' && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Identifiant Matériel (Terminal)</label>
                  <div style={styles.inputWrapper}>
                    <Smartphone size={18} style={styles.inputIcon} />
                    <input 
                      type="text" 
                      placeholder="ex: TERM-PAC-8002" 
                      required 
                      value={regHardwareId} 
                      onChange={e => setRegHardwareId(e.target.value)} 
                      style={styles.input} 
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.submitBtn,
              backgroundColor: mode === 'register' 
                ? (regRole === 'supervisor' ? 'var(--secondary)' : 'var(--primary)')
                : (loginType === 'supervisor' ? 'var(--secondary)' : 'var(--primary)'),
              color: (mode === 'register' ? regRole : loginType) === 'supervisor' ? '#fff' : '#000'
            }}
          >
            {loading 
              ? 'Traitement...' 
              : (mode === 'register' 
                  ? 'Créer mon compte' 
                  : (mfaRequired ? 'Valider le code' : 'Se connecter')
                )
            }
          </button>
        </form>

        {mode === 'login' && (
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              💡 <strong>Comportement Fallback/Mock :</strong><br />
              Si l'API locale est éteinte, vous pouvez vous connecter avec :<br />
              • Superviseur : <code>supervisor@smartport.gov</code> / <code>supersecure123</code> (MFA: n'importe quel code)<br />
              • Agent : <code>agent@smartport.gov</code> / <code>fieldsecure123</code>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
  },
  header: {
    width: '100%',
    maxWidth: '450px',
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
  apiBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid transparent',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  loginCard: {
    width: '100%',
    maxWidth: '450px',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  cardHeader: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginTop: '10px',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  modeToggleContainer: {
    display: 'flex',
    padding: '4px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    border: '1px solid var(--bg-card-border)',
  },
  modeBtn: {
    flex: 1,
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid var(--bg-card-border)',
  },
  tabBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    transition: 'var(--transition-smooth)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    border: '1px solid var(--error)',
    color: 'var(--error)',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    border: '1px solid var(--success)',
    color: 'var(--success)',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    padding: '12px 12px 12px 40px',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '0.9rem',
    transition: 'var(--transition-smooth)',
    ':focus': {
      borderColor: 'var(--primary)',
      backgroundColor: 'rgba(255,255,255,0.08)',
    }
  },
  roleSelectContainer: {
    display: 'flex',
    gap: '10px',
  },
  roleSelectBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  mfaContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
  },
  mfaIconWrapper: {
    padding: '16px',
    borderRadius: '50%',
    backgroundColor: 'var(--warning-glow)',
    marginBottom: '8px',
  },
  mfaTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
  },
  mfaSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  mfaInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--bg-card-border)',
    color: '#fff',
    padding: '12px',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: '10px',
    width: '180px',
    margin: '10px auto 0 auto',
  },
  submitBtn: {
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    marginTop: '6px',
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    padding: '12px',
  },
  infoText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  }
};
