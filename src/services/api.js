// SmartPort Gateway - API Service & Fallback Synchronizer

// API BASE URL CONFIGURATION
const LARAVEL_API_URL = import.meta.env?.VITE_LARAVEL_API_URL || window.ENV?.LARAVEL_API_URL || 'http://localhost:8000/api/v1';
const NEXTJS_API_URL = import.meta.env?.VITE_NEXTJS_API_URL || window.ENV?.NEXTJS_API_URL || 'http://localhost:3000/api/scan/v1';
const SOAP_API_URL = import.meta.env?.VITE_SOAP_API_URL || window.ENV?.SOAP_API_URL || 'https://codesoap.onrender.com';

// SOAP XML CLIENT UTILITY
export const soapClient = {
  getSoapUrl: () => {
    if (import.meta.env?.DEV) {
      return '/soap-api';
    }
    return SOAP_API_URL;
  },

  callAction: async (actionName, requestXmlPayload) => {
    const url = soapClient.getSoapUrl();
    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:smart="http://smartport.lacotonou.bj/">
   <soapenv:Header/>
   <soapenv:Body>
      ${requestXmlPayload}
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': actionName
        },
        body: envelope
      });

      const responseXmlText = await response.text();
      return {
        success: response.ok,
        status: response.status,
        xml: responseXmlText,
        parsed: soapClient.parseResponse(actionName, responseXmlText)
      };
    } catch (error) {
      console.error(`SOAP Call error for ${actionName}:`, error);
      return {
        success: false,
        error: error.message,
        xml: null,
        parsed: null
      };
    }
  },

  parseResponse: (actionName, xmlText) => {
    if (!xmlText) return null;
    
    if (xmlText.includes('<soapenv:Fault>') || xmlText.includes('<Fault>')) {
      const faultReasonMatch = xmlText.match(/<faultstring>([^<]+)<\/faultstring>/);
      return {
        fault: true,
        message: faultReasonMatch ? faultReasonMatch[1] : 'Unknown SOAP Fault'
      };
    }

    const cleanXml = xmlText.replace(/tns:|smart:|soapenv:/g, '');

    if (actionName === 'GetDossier') {
      const idMatch = cleanXml.match(/<id>([^<]+)<\/id>/);
      const statutMatch = cleanXml.match(/<statut>([^<]+)<\/statut>/);
      const typeOpMatch = cleanXml.match(/<type_operation>([^<]+)<\/type_operation>/);
      
      if (idMatch || statutMatch || typeOpMatch) {
        return {
          id: idMatch ? idMatch[1] : '',
          statut: statutMatch ? statutMatch[1] : '',
          type_operation: typeOpMatch ? typeOpMatch[1] : ''
        };
      }
    } else if (actionName === 'CreateDossier') {
      const successMatch = cleanXml.match(/<success>([^<]+)<\/success>/);
      const messageMatch = cleanXml.match(/<message>([^<]+)<\/message>/);
      
      return {
        success: successMatch ? successMatch[1] === 'true' : false,
        message: messageMatch ? messageMatch[1] : ''
      };
    }

    return null;
  },

  getDossier: async (referenceMetier) => {
    const payload = `<GetDossierRequest><reference_metier>${referenceMetier}</reference_metier></GetDossierRequest>`;
    return await soapClient.callAction('GetDossier', payload);
  },

  createDossier: async (referenceMetier, statut, typeOperation) => {
    const payload = `<CreateDossierRequest><reference_metier>${referenceMetier}</reference_metier><statut>${statut}</statut><type_operation>${typeOperation}</type_operation></CreateDossierRequest>`;
    return await soapClient.callAction('CreateDossier', payload);
  }
};


// Initial Mock Seed Data
const SEED_DOSSIERS = [
  { id: '1', number: 'DOS-2026-001', type: 'IMPORT', status: 'VALIDE', client: 'Bénin Logistique SA', driver: 'Kofi Mensah', license: 'RN 9832 MD', cargo: '20t Ciment', besc: 'BJ-COT-99823', qrCode: 'QR_KOFI_99823', validUntil: '2026-12-31' },
  { id: '2', number: 'DOS-2026-002', type: 'EXPORT', status: 'VALIDE', client: 'Sahel Transit', driver: 'Amadou Diallo', license: 'OU-8821-BF', cargo: '25t Cacao', besc: 'BF-COT-11092', qrCode: 'QR_AMADOU_11092', validUntil: '2026-12-31' },
  { id: '3', number: 'DOS-2026-003', type: 'IMPORT', status: 'LITIGE', client: 'Niger Cargo Corp', driver: 'Chidi Azeez', license: 'NIG-4492-LG', cargo: 'Machines Agricoles', besc: 'NG-COT-55410', qrCode: 'QR_CHIDI_55410', validUntil: '2026-06-18' }, // Expired/Litige
  { id: '4', number: 'DOS-2026-004', type: 'IMPORT', status: 'BROUILLON', client: 'Atlantic Shipping', driver: 'Yao Kouassi', license: 'CI-3004-AB', cargo: 'Pneumatiques', besc: 'CI-COT-77401', qrCode: 'QR_YAO_77401', validUntil: '2026-07-01' }
];

const SEED_LOGS = [
  { id: 'l1', timestamp: new Date(Date.now() - 3600000).toISOString(), qrCode: 'QR_KOFI_99823', driver: 'Kofi Mensah', license: 'RN 9832 MD', status: 'AUTORISE', gateway: 'Porte Principale A', type: 'IMPORT', offline: false },
  { id: 'l2', timestamp: new Date(Date.now() - 7200000).toISOString(), qrCode: 'QR_CHIDI_55410', driver: 'Chidi Azeez', license: 'NIG-4492-LG', status: 'REFUSE', gateway: 'Porte Est B', type: 'IMPORT', reason: 'Dossier en litige', offline: false }
];

// Initialize LocalStorage Database if not exists
const initDb = () => {
  if (!localStorage.getItem('smartport_dossiers')) {
    localStorage.setItem('smartport_dossiers', JSON.stringify(SEED_DOSSIERS));
  }
  if (!localStorage.getItem('smartport_logs')) {
    localStorage.setItem('smartport_logs', JSON.stringify(SEED_LOGS));
  }
  if (!localStorage.getItem('smartport_offline_queue')) {
    localStorage.setItem('smartport_offline_queue', JSON.stringify([]));
  }
  // Seeding default users for local session
  if (!localStorage.getItem('smartport_users')) {
    localStorage.setItem('smartport_users', JSON.stringify([
      { id: 'mock-supervisor-uuid-9981', name: 'Modeste Soglo (DSI)', email: 'supervisor@smartport.gov', password: 'supersecure123', role: 'supervisor' },
      { id: 'mock-agent-uuid-7712', name: 'Jean Kouton (Agent Terrain)', email: 'agent@smartport.gov', password: 'fieldsecure123', role: 'agent', hardwareId: 'TERM-PAC-8001' }
    ]));
  }
  // User manual switch status (defaults to system-controlled/online)
  if (localStorage.getItem('smartport_user_forced_offline') === null) {
    localStorage.setItem('smartport_user_forced_offline', 'false');
  }
  // Actual verified connection status
  if (localStorage.getItem('smartport_online_status') === null) {
    localStorage.setItem('smartport_online_status', 'true');
  }
};

initDb();

export const apiService = {
  _delay: (ms = 400) => new Promise(resolve => setTimeout(resolve, ms)),
  soapClient,

  // Check if API is currently operational
  isOnline: () => {
    const forcedOffline = localStorage.getItem('smartport_user_forced_offline') === 'true';
    if (forcedOffline) return false;
    return localStorage.getItem('smartport_online_status') === 'true';
  },

  // Toggle Forced Offline simulation
  toggleOnlineStatus: () => {
    const isForced = localStorage.getItem('smartport_user_forced_offline') === 'true';
    localStorage.setItem('smartport_user_forced_offline', String(!isForced));
    window.dispatchEvent(new Event('smartport_connection_changed'));
    return !isForced;
  },

  // Asynchronously ping API servers to detect active endpoints
  pingServers: async () => {
    if (localStorage.getItem('smartport_user_forced_offline') === 'true') {
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      
      // Let's ping the auth login endpoints (OPTIONS / GET / HEAD or simple check)
      const res = await fetch(`${LARAVEL_API_URL.replace('/api/v1', '')}/`, { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: controller.signal 
      }).catch(() => null);
      
      clearTimeout(timeoutId);
      const isOnline = !!res;
      localStorage.setItem('smartport_online_status', String(isOnline));
      window.dispatchEvent(new Event('smartport_connection_changed'));
      return isOnline;
    } catch {
      localStorage.setItem('smartport_online_status', 'false');
      window.dispatchEvent(new Event('smartport_connection_changed'));
      return false;
    }
  },

  // Authenticate user with back-office Laravel API
  login: async (email, password) => {
    await apiService.pingServers();

    // Check custom registered users first
    const users = JSON.parse(localStorage.getItem('smartport_users') || '[]');
    const matchedUser = users.find(u => u.email === email && u.password === password && u.role === 'supervisor');

    if (!apiService.isOnline()) {
      await apiService._delay(600);
      if (matchedUser) {
        return {
          mfaRequired: true,
          userId: matchedUser.id,
          user: matchedUser
        };
      }
      throw new Error('Identifiants de secours ou utilisateur enregistré incorrects (Hors-ligne).');
    }

    try {
      const res = await fetch(`${LARAVEL_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, mot_de_passe: password })
      });

      if (res.status === 202) {
        const body = await res.json();
        return { mfaRequired: true, userId: body.user_id || body.userId };
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Identifiants de connexion invalides.');
      }

      const body = await res.json();
      localStorage.setItem('smartport_supervisor_token', body.token || body.access_token);
      return { mfaRequired: false, user: body.user || matchedUser || { email, role: 'supervisor', name: 'Superviseur' } };
    } catch (err) {
      if (err.message.includes('invalides') || err.message.includes('incorrects')) throw err;
      // Network failure, trigger local match if present
      console.warn('Laravel Login failed, checking offline local database...');
      if (matchedUser) {
        return { mfaRequired: true, userId: matchedUser.id, user: matchedUser };
      }
      throw new Error('Identifiants incorrects ou réseau indisponible.');
    }
  },

  // Verify MFA token
  verifyMfa: async (userId, mfaCode) => {
    const users = JSON.parse(localStorage.getItem('smartport_users') || '[]');
    const matched = users.find(u => u.id === userId) || { email: 'supervisor@smartport.gov', role: 'supervisor', name: 'DSI Superviseur (Secours)' };

    if (!apiService.isOnline()) {
      await apiService._delay(400);
      if (mfaCode === '123456' || mfaCode.length === 6) { // Accept any 6 digit code in mock
        localStorage.setItem('smartport_supervisor_token', 'mock-offline-sanctum-token');
        return { user: matched };
      }
      throw new Error('Code de sécurité incorrect.');
    }

    try {
      const res = await fetch(`${LARAVEL_API_URL}/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ user_id: userId, code_mfa: mfaCode })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Code de sécurité incorrect.');
      }

      const body = await res.json();
      localStorage.setItem('smartport_supervisor_token', body.token || body.access_token);
      return { user: body.user || matched };
    } catch (err) {
      if (err.message.includes('incorrect')) throw err;
      if (mfaCode.length === 6) {
        localStorage.setItem('smartport_supervisor_token', 'mock-offline-sanctum-token');
        return { user: matched };
      }
      throw new Error('Erreur de communication avec le serveur (TOTP).');
    }
  },

  // Authenticate security agent terminal with Next.js API
  agentLogin: async (email, password, hardwareId) => {
    await apiService.pingServers();
    localStorage.setItem('smartport_terminal_id', hardwareId);

    // Check custom registered agents first
    const users = JSON.parse(localStorage.getItem('smartport_users') || '[]');
    const matchedAgent = users.find(u => u.email === email && u.password === password && u.role === 'agent');

    if (!apiService.isOnline()) {
      await apiService._delay(600);
      if (matchedAgent) {
        const mockAgent = { email, role: 'agent', name: matchedAgent.name, terminalId: hardwareId };
        localStorage.setItem('smartport_agent_token', 'mock-offline-agent-token');
        return { agent: mockAgent };
      }
      throw new Error('Identifiants de secours incorrects pour l\'agent (Hors-ligne).');
    }

    try {
      const res = await fetch(`${NEXTJS_API_URL}/auth/agent/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, mot_de_passe: password, identifiant_materiel: hardwareId })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Identifiants ou terminal invalides.');
      }

      const body = await res.json();
      localStorage.setItem('smartport_agent_token', body.token || body.access_token);
      return { agent: body.agent || matchedAgent || { email, role: 'agent', name: 'Agent de Sécurité Terrain' } };
    } catch (err) {
      if (err.message.includes('invalides') || err.message.includes('incorrects')) throw err;
      console.warn('Next.js Agent Login failed, checking offline local database...');
      if (matchedAgent) {
        const mockAgent = { email, role: 'agent', name: matchedAgent.name, terminalId: hardwareId };
        localStorage.setItem('smartport_agent_token', 'mock-offline-agent-token');
        return { agent: mockAgent };
      }
      throw new Error('Erreur réseau ou identifiants incorrects.');
    }
  },

  // Register a new user locally & centrally
  register: async (name, email, password, role, hardwareId = '') => {
    await apiService.pingServers();

    const users = JSON.parse(localStorage.getItem('smartport_users') || '[]');
    if (users.find(u => u.email === email)) {
      throw new Error('Un utilisateur avec cet email existe déjà.');
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name,
      email,
      password,
      role,
      hardwareId
    };

    users.push(newUser);
    localStorage.setItem('smartport_users', JSON.stringify(users));

    if (!apiService.isOnline()) {
      await apiService._delay(600);
      return { success: true, user: newUser, fallback: true };
    }

    try {
      const endpoint = role === 'supervisor' 
        ? `${LARAVEL_API_URL}/auth/register`
        : `${NEXTJS_API_URL}/auth/agent/register`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          mot_de_passe: password,
          role,
          identifiant_materiel: hardwareId
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Erreur lors de l\'enregistrement central.');
      }

      const body = await res.json();
      return { success: true, user: body.user || newUser };
    } catch (err) {
      console.warn('Registration server call failed. Registered in local session (fallback).', err);
      return { success: true, user: newUser, fallback: true };
    }
  },
  getDossiers: async () => {
    await apiService.pingServers();

    if (!apiService.isOnline()) {
      return {
        data: JSON.parse(localStorage.getItem('smartport_dossiers') || '[]'),
        fallback: true
      };
    }

    try {
      const token = localStorage.getItem('smartport_supervisor_token');
      const res = await fetch(`${LARAVEL_API_URL}/dossiers`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json' 
        }
      });

      if (!res.ok) throw new Error('Failed to retrieve from server');
      
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data || []);
      localStorage.setItem('smartport_dossiers', JSON.stringify(list));
      return { data: list, fallback: false };
    } catch (err) {
      console.warn('Retrieve dossiers API error. Using local storage.', err);
      return {
        data: JSON.parse(localStorage.getItem('smartport_dossiers') || '[]'),
        fallback: true
      };
    }
  },

  // Save new/edited dossier
  saveDossier: async (dossier) => {
    await apiService.pingServers();

    if (!apiService.isOnline()) {
      // Offline fallback: save to cache to keep user demo flow working
      const dossiers = JSON.parse(localStorage.getItem('smartport_dossiers') || '[]');
      let updated;
      if (dossier.id) {
        updated = dossiers.map(d => d.id === dossier.id ? dossier : d);
      } else {
        const newDossier = { ...dossier, id: String(Date.now()) };
        updated = [...dossiers, newDossier];
      }
      localStorage.setItem('smartport_dossiers', JSON.stringify(updated));
      return { success: true, data: dossier, fallback: true };
    }

    try {
      const token = localStorage.getItem('smartport_supervisor_token');
      const body = {
        reference_metier: dossier.number || dossier.reference_metier,
        type_operation: (dossier.type || dossier.type_operation || 'import').toLowerCase(),
        client: dossier.client,
        driver: dossier.driver,
        license: dossier.license,
        cargo: dossier.cargo,
        besc: dossier.besc,
        qrCode: dossier.qrCode,
        validUntil: dossier.validUntil
      };

      const res = await fetch(`${LARAVEL_API_URL}/dossiers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errMsg = await res.json().catch(() => ({}));
        throw new Error(errMsg.message || 'Erreur lors de la sauvegarde sur le serveur');
      }

      const resData = await res.json();
      const dossiers = JSON.parse(localStorage.getItem('smartport_dossiers') || '[]');
      const newDossier = { ...dossier, id: resData.id || String(Date.now()) };
      localStorage.setItem('smartport_dossiers', JSON.stringify([...dossiers, newDossier]));

      // Synchronize with SOAP Service (Python legacy interconnector)
      if (apiService.isOnline()) {
        try {
          const soapType = (dossier.type || dossier.type_operation || 'IMPORT').toUpperCase();
          const soapStatus = (dossier.status || 'VALIDE').toUpperCase();
          const soapRef = dossier.number || dossier.reference_metier;
          await soapClient.createDossier(soapRef, soapStatus, soapType);
        } catch (soapErr) {
          console.warn('Sync to SOAP API failed during dossier save:', soapErr);
        }
      }

      return { success: true, data: newDossier };
    } catch (err) {
      console.warn('Laravel saveDossier failed. Storing locally as mock fallback.', err);
      const dossiers = JSON.parse(localStorage.getItem('smartport_dossiers') || '[]');
      const newDossier = { ...dossier, id: String(Date.now()) };
      localStorage.setItem('smartport_dossiers', JSON.stringify([...dossiers, newDossier]));
      return { success: true, data: newDossier, fallback: true };
    }
  },

  // Verify access at terminal (Next.js scanner API)
  validateAccessQr: async (qrCode, gateway = 'Porte Principale') => {
    await apiService.pingServers();
    const timestamp = new Date().toISOString();
    const terminalId = localStorage.getItem('smartport_terminal_id') || 'TERM-PAC-8001';

    if (!apiService.isOnline()) {
      return apiService._validateAccessOffline(qrCode, gateway, timestamp);
    }

    try {
      const token = localStorage.getItem('smartport_agent_token');
      const res = await fetch(`${NEXTJS_API_URL}/controle/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          poste_id: gateway,
          jeton_scanne: qrCode,
          terminal_id: terminalId
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }

      const resData = await res.json();
      const logs = JSON.parse(localStorage.getItem('smartport_logs') || '[]');
      const newLog = {
        id: resData.scan_id || 'log_' + Date.now(),
        timestamp,
        qrCode,
        driver: resData.dossier?.driver || 'Inconnu',
        license: resData.dossier?.license || 'Inconnu',
        status: resData.status || 'AUTORISE',
        reason: resData.reason || '',
        gateway,
        type: resData.dossier?.type || 'IMPORT',
        offline: false
      };
      logs.unshift(newLog);
      localStorage.setItem('smartport_logs', JSON.stringify(logs));

      return {
        status: resData.status || 'AUTORISE',
        message: resData.message || 'Autorisation d\'accès confirmée.',
        dossier: resData.dossier || null,
        offline: false
      };

    } catch (err) {
      console.warn('NextJS API scan validation failed. Executing fallback local validation...', err);
      return apiService._validateAccessOffline(qrCode, gateway, timestamp);
    }
  },

  // Helper for offline local QR code verification and queueing
  _validateAccessOffline: (qrCode, gateway, timestamp) => {
    const dossiers = JSON.parse(localStorage.getItem('smartport_dossiers') || '[]');
    const matchedDossier = dossiers.find(d => d.qrCode === qrCode);

    let validationResult;
    if (matchedDossier) {
      if (matchedDossier.status === 'VALIDE') {
        validationResult = {
          status: 'AUTORISE',
          message: 'Accès validé localement (Mode dégradé)',
          dossier: matchedDossier,
          offline: true
        };
      } else {
        validationResult = {
          status: 'REFUSE',
          message: `Accès refusé localement : Dossier en statut ${matchedDossier.status}`,
          dossier: matchedDossier,
          offline: true
        };
      }
    } else {
      if (qrCode.startsWith('QR_')) {
        validationResult = {
          status: 'PROVISOIRE',
          message: 'QR Code reconnu mais dossier absent du cache. Accès provisoire accordé.',
          dossier: {
            number: 'INCONNU (Hors-ligne)',
            driver: 'Chauffeur Prov. (QR reconnu)',
            license: 'Plaque à vérifier',
            cargo: 'Fret à vérifier',
            besc: 'À synchroniser'
          },
          offline: true
        };
      } else {
        validationResult = {
          status: 'REFUSE',
          message: 'QR Code inconnu et invalide en mode hors-ligne.',
          dossier: null,
          offline: true
        };
      }
    }

    // Queue scan transaction locally
    const offlineQueue = JSON.parse(localStorage.getItem('smartport_offline_queue') || '[]');
    const newQueueItem = {
      id: 'off_' + Date.now(),
      timestamp,
      qrCode,
      status: validationResult.status,
      driver: validationResult.dossier?.driver || 'Inconnu',
      license: validationResult.dossier?.license || 'Inconnu',
      reason: validationResult.status === 'REFUSE' ? validationResult.message : '',
      gateway,
      type: validationResult.dossier?.type || 'IMPORT'
    };

    offlineQueue.push(newQueueItem);
    localStorage.setItem('smartport_offline_queue', JSON.stringify(offlineQueue));
    window.dispatchEvent(new Event('smartport_queue_updated'));

    // Append immediately to local logs
    const localLogs = JSON.parse(localStorage.getItem('smartport_logs') || '[]');
    localLogs.unshift({ ...newQueueItem, offline: true });
    localStorage.setItem('smartport_logs', JSON.stringify(localLogs));

    return validationResult;
  },

  // Get scan logs (Admin or Agent view)
  getLogs: async () => {
    return JSON.parse(localStorage.getItem('smartport_logs') || '[]');
  },

  // Sync Offline validation queue with Next.js API central system
  syncOfflineQueue: async () => {
    await apiService.pingServers();

    if (!apiService.isOnline()) {
      return { success: false, message: 'La resynchronisation avec le serveur a échoué. Toujours hors-ligne.' };
    }

    const queue = JSON.parse(localStorage.getItem('smartport_offline_queue') || '[]');
    if (queue.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    try {
      const token = localStorage.getItem('smartport_agent_token');
      const res = await fetch(`${NEXTJS_API_URL}/controle/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          evenements: queue.map(q => ({
            id: q.id,
            timestamp: q.timestamp,
            jeton_scanne: q.qrCode,
            poste_id: q.gateway,
            status: q.status,
            reason: q.reason
          }))
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }

      // Synced successfully! Clear queue
      localStorage.setItem('smartport_offline_queue', JSON.stringify([]));

      // Update local logs to set offline: false
      const logs = JSON.parse(localStorage.getItem('smartport_logs') || '[]');
      const updatedLogs = logs.map(log => {
        const queuedItem = queue.find(q => q.id === log.id);
        if (queuedItem) {
          return { ...log, offline: false, synced: true };
        }
        return log;
      });
      localStorage.setItem('smartport_logs', JSON.stringify(updatedLogs));

      window.dispatchEvent(new Event('smartport_queue_updated'));
      window.dispatchEvent(new Event('smartport_logs_synced'));

      return { success: true, syncedCount: queue.length };

    } catch (err) {
      console.warn('Sync failed, offline queue remains intact.', err);
      return { success: false, message: 'Erreur de communication avec le serveur lors de la synchronisation.' };
    }
  },

  // Get current size of offline queue
  getQueueSize: () => {
    const queue = JSON.parse(localStorage.getItem('smartport_offline_queue') || '[]');
    return queue.length;
  }
};

