/* =========================================================
   LogiTrack Pro — logique applicative
   Gestion des stocks, alertes, mouvements, impressions
   + Authentification et session utilisateur
   ========================================================= */

'use strict';

/* =========================================================
   0. SESSION UTILISATEUR
   ========================================================= */

const SESSION_KEY = 'logitrack_session_v1';

/* =========================================================
   POINT D'ENTRÉE GLOBAL — Mode consultation
   Fonctionne même si le reste du script a échoué
   ========================================================= */

window.modeConsultation = function () {
  const s = {
    nom: 'Invité',
    email: '',
    fonction: 'Consultation',
    depot: 'TOUS',
    invite: true,
    connecteLe: new Date().toISOString()
  };

  try { localStorage.setItem('logitrack_session_v1', JSON.stringify(s)); } catch (e) {}

  try {
    if (typeof appliquerSession === 'function') {
      appliquerSession(s);
    } else {
      basculerVersApp(s);
    }
  } catch (err) {
    console.error('Mode consultation — bascule directe :', err);
    basculerVersApp(s);
  }

  try {
    if (typeof toast === 'function') {
      toast('Accès en lecture seule activé.', { type: 'info', titre: 'Mode consultation' });
    }
  } catch (e) {}
};

/* Bascule DOM minimale, sans dépendance au reste du script */
function basculerVersApp(s) {
  const auth = document.getElementById('authScreen');
  const app  = document.getElementById('appRoot');
  if (auth) auth.classList.add('is-hidden');
  if (app)  app.classList.remove('is-hidden');

  if (s) {
    const av = document.getElementById('userAvatar');
    const nm = document.getElementById('userName');
    const rl = document.getElementById('userRole');
    const ft = document.getElementById('footerUser');
    if (av) av.textContent = 'I';
    if (nm) nm.textContent = s.nom;
    if (rl) rl.textContent = 'Mode consultation';
    if (ft) ft.textContent = 'Session : consultation libre — non authentifiée';
  }
}

window.deconnecter = function () {
  try { localStorage.removeItem('logitrack_session_v1'); } catch (e) {}
  const auth = document.getElementById('authScreen');
  const app  = document.getElementById('appRoot');
  if (auth) auth.classList.remove('is-hidden');
  if (app)  app.classList.add('is-hidden');
  const form = document.getElementById('loginForm');
  if (form) form.reset();
  try {
    if (typeof toast === 'function') {
      toast('Session fermée. À bientôt.', { type: 'info', titre: 'Déconnexion' });
    }
  } catch (e) {}
};
let session = null;   // { nom, email, fonction, depot, invite, connecteLe }

function lireSession() {
  try {
    const brut = localStorage.getItem(SESSION_KEY);
    if (!brut) return null;
    const s = JSON.parse(brut);
    if (!s || typeof s !== 'object' || !s.nom) return null;
    return s;
  } catch (e) {
    return null;
  }
}

function ecrireSession(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
}

function effacerSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

function initiales(nom) {
  if (!nom) return '—';
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p.charAt(0))
    .join('')
    .toUpperCase();
}

function appliquerSession(s) {
  session = s;

  const auth  = document.getElementById('authScreen');
  const app   = document.getElementById('appRoot');
  const avatar = document.getElementById('userAvatar');
  const nom    = document.getElementById('userName');
  const role   = document.getElementById('userRole');
  const pied   = document.getElementById('footerUser');

  if (!s) {
    if (auth) auth.classList.remove('is-hidden');
    if (app)  app.classList.add('is-hidden');
    return;
  }

  if (auth) auth.classList.add('is-hidden');
  if (app)  app.classList.remove('is-hidden');

  const roleTexte = s.invite
    ? 'Mode consultation'
    : (s.fonction || 'Utilisateur') + (s.depot && s.depot !== 'TOUS' ? ' · ' + s.depot : '');

  if (avatar) {
    avatar.textContent = initiales(s.nom);
    avatar.classList.toggle('is-guest', !!s.invite);
  }
  if (nom)  nom.textContent  = s.nom;
  if (role) role.textContent = roleTexte;
  if (pied) {
    pied.textContent = s.invite
      ? 'Session : consultation libre — non authentifiée'
      : 'Session : ' + s.nom + ' · ' + (s.email || '—');
  }

  setTimeout(() => {
    if (typeof rendreGraphiques === 'function') rendreGraphiques();
  }, 60);
}

function connecter(nom, email, fonction, depot) {
  const s = {
    nom: nom.trim(),
    email: (email || '').trim(),
    fonction: fonction || '',
    depot: depot || 'TOUS',
    invite: false,
    connecteLe: new Date().toISOString()
  };
  ecrireSession(s);
  appliquerSession(s);
  toast('Bienvenue ' + s.nom + ' — session ouverte.', { type: 'ok', titre: 'Connexion réussie' });
}

function connecterInvite() {
  const s = {
    nom: 'Invité',
    email: '',
    fonction: 'Consultation',
    depot: 'TOUS',
    invite: true,
    connecteLe: new Date().toISOString()
  };
  ecrireSession(s);
  appliquerSession(s);
  toast('Accès en lecture seule activé.', { type: 'info', titre: 'Mode consultation' });
}

function deconnecter() {
  effacerSession();
  appliquerSession(null);

  const form = document.getElementById('loginForm');
  if (form) form.reset();

  toast('Session fermée. À bientôt.', { type: 'info', titre: 'Déconnexion' });
}

function initAuth() {
  const form = document.getElementById('loginForm');
  const btnGuest = document.getElementById('btnGuest');
  const btnLogout = document.getElementById('btnLogout');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const nom = document.getElementById('loginNom').value.trim();
      const email = document.getElementById('loginEmail').value.trim();
      const fonction = document.getElementById('loginFonction').value;
      const depot = document.getElementById('loginDepot').value;

      if (nom.length < 2) {
        toast('Merci de renseigner votre nom complet.', { type: 'err' });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast('Adresse e-mail invalide.', { type: 'err' });
        return;
      }
      connecter(nom, email, fonction, depot);
    });
  }

  if (btnGuest) btnGuest.addEventListener('click', connecterInvite);
  if (btnLogout) btnLogout.addEventListener('click', deconnecter);

  /* Reprise de session existante */
  const existante = lireSession();
  if (existante) appliquerSession(existante);
  else appliquerSession(null);
}

/* =========================================================
   1. RÉFÉRENTIELS
   ========================================================= */

const DEPOTS = [
  { code: 'D-NOR',   nom: 'Dépôt Nord',   ville: 'Lille',      capacite: 14000 },
  { code: 'D-SUD',   nom: 'Dépôt Sud',    ville: 'Marseille',  capacite: 10500 },
  { code: 'D-EST',   nom: 'Dépôt Est',    ville: 'Strasbourg', capacite:  8200 },
  { code: 'D-OUEST', nom: 'Dépôt Ouest',  ville: 'Nantes',     capacite: 11500 }
];

const CATEGORIES = [
  { code: 'EMB', nom: 'Emballage' },
  { code: 'MAN', nom: 'Manutention' },
  { code: 'SEC', nom: 'Sécurité' },
  { code: 'CON', nom: 'Consommables' },
  { code: 'PDR', nom: 'Pièces détachées' },
  { code: 'INF', nom: 'Informatique' }
];

const STATUT_LABEL = {
  ok:       'En stock',
  faible:   'Stock faible',
  rupture:  'Rupture',
  surstock: 'Surstock'
};

const OPERATEURS = ['A. Ferrand', 'M. Diallo', 'S. Bouvier', 'K. Ndiaye', 'J. Petit'];

const PALETTE_GRAPHE = [
  '#4a5b68', '#6d7f8c', '#8f9ea8', '#b0bcc4',
  '#7a8a95', '#5c6d79', '#98a5ae'
];

/* =========================================================
   2. FABRIQUE D'ARTICLES
   ========================================================= */

function A(ref, nom, categorie, depot, stock, seuil, max, unite, prix, fournisseur, emplacement, dlcJours) {
  const a = {
    ref, nom, categorie, depot,
    stock, seuil, max, unite, prix,
    fournisseur, emplacement
  };
  if (dlcJours != null) {
    const d = new Date();
    d.setDate(d.getDate() + dlcJours);
    a.dlc = d.toISOString().slice(0, 10);
  }
  return a;
}

const ARTICLES = [
  A('EMB-1001', 'Carton double cannelure 600×400×400', 'EMB', 'D-NOR',   2450,  800, 4000, 'carton',  1.35, 'Papeterie Duflot',    'A-01-02'),
  A('EMB-1002', 'Film étirable 23 µm — 500 mm',        'EMB', 'D-NOR',    180,   60,  240, 'rouleau', 8.90, 'Plastifilm Nord',     'A-02-01'),
  A('EMB-1003', 'Palette EPAL 800×1200 réparée',       'EMB', 'D-SUD',    620,  300, 1200, 'palette', 12.50,'Palettes Méditerranée','B-01-01'),
  A('EMB-1004', 'Étiquette adhésive A6 thermique',     'EMB', 'D-EST',     48,   80,  300, 'rouleau', 14.20,'LabelTech',           'C-03-04', 320),
  A('EMB-1005', 'Ruban adhésif PP 50 mm × 66 m',       'EMB', 'D-OUEST',  740,  200,  900, 'rouleau',  2.10,'Papeterie Duflot',    'D-01-03'),

  A('MAN-2001', 'Transpalette manuel 2500 kg',         'MAN', 'D-NOR',     14,    5,   30, 'unité',  289.00,'Manutex Industrie',  'A-10-01'),
  A('MAN-2002', 'Chariot roll inox 3 plateaux',        'MAN', 'D-SUD',      9,    4,   18, 'unité',  174.50,'Manutex Industrie',  'B-10-02'),
  A('MAN-2003', 'Diable pliable 150 kg',               'MAN', 'D-EST',     22,   10,   40, 'unité',   68.00,'LogiÉquip',          'C-10-01'),
  A('MAN-2004', 'Sangle d’arrimage 5 T — 8 m',         'MAN', 'D-OUEST',   36,   20,   60, 'unité',   19.90,'ArrimaPro',          'D-10-04'),
  A('MAN-2005', 'Crochet de levage 2 T certifié',      'MAN', 'D-NOR',      0,   12,   40, 'unité',   42.00,'Levage Sécurité',    'A-11-02'),

  A('SEC-3001', 'Gilet haute visibilité classe 2',     'SEC', 'D-NOR',    210,   80,  400, 'unité',    6.40,'SécuPro',            'A-20-01'),
  A('SEC-3002', 'Chaussures de sécurité S3 — 42',      'SEC', 'D-SUD',     34,   40,  120, 'paire',   54.00,'SécuPro',            'B-20-03'),
  A('SEC-3003', 'Gants anti-coupure niveau C',         'SEC', 'D-EST',    480,  150,  600, 'paire',    4.80,'ProtectMain',        'C-20-01'),
  A('SEC-3004', 'Casque de chantier ventilé',          'SEC', 'D-OUEST',   72,   30,  150, 'unité',   16.50,'SécuPro',            'D-20-02'),
  A('SEC-3005', 'Protection auditive — bouchons',      'SEC', 'D-NOR',     95,  100,  350, 'boîte',    9.20,'ProtectMain',        'A-21-03'),

  A('CON-4001', 'Huile hydraulique ISO 46 — 20 L',     'CON', 'D-NOR',     26,   12,   50, 'bidon',   72.00,'LubriSud',           'A-30-01'),
  A('CON-4002', 'Chiffon microfibre industriel',       'CON', 'D-SUD',    310,  120,  500, 'lot',      3.90,'Hygiène Pro',        'B-30-02'),
  A('CON-4003', 'Sacs poubelle 100 L renforcés',       'CON', 'D-EST',    128,  150,  450, 'rouleau',  5.60,'Hygiène Pro',        'C-30-01'),
  A('CON-4004', 'Gants nitrile non poudrés — M',       'CON', 'D-OUEST',  540,  200,  700, 'boîte',   11.30,'ProtectMain',        'D-30-03'),
  A('CON-4005', 'Essuie-tout industriel — bobine',     'CON', 'D-NOR',     88,   40,  160, 'bobine',   7.40,'Hygiène Pro',        'A-31-01'),

  A('PDR-5001', 'Roue de transpalette PU 180 mm',      'PDR', 'D-NOR',     42,   20,   80, 'unité',   38.00,'Manutex Industrie',  'A-40-02'),
  A('PDR-5002', 'Batterie traction 24 V — 210 Ah',     'PDR', 'D-SUD',      6,    4,   14, 'unité',  780.00,'ÉnergieMot',         'B-40-01'),
  A('PDR-5003', 'Contacteur de sécurité 24 V',         'PDR', 'D-EST',     31,   15,   50, 'unité',   24.60,'ÉlectroFlux',        'C-40-03'),
  A('PDR-5004', 'Courroie trapézoïdale XPZ 900',       'PDR', 'D-OUEST',   18,   18,   45, 'unité',   13.80,'ÉlectroFlux',        'D-40-01'),
  A('PDR-5005', 'Capteur de proximité inductif M18',   'PDR', 'D-NOR',      0,    8,   25, 'unité',   56.00,'ÉlectroFlux',        'A-41-04'),

  A('INF-6001', 'Terminal mobile code-barres',         'INF', 'D-NOR',     11,    6,   20, 'unité',  640.00,'Traceo Systems',     'A-50-01'),
  A('INF-6002', 'Étiqueteuse industrielle 300 dpi',    'INF', 'D-SUD',      4,    3,   10, 'unité',  890.00,'LabelTech',          'B-50-01'),
  A('INF-6003', 'Batterie terminal mobile',            'INF', 'D-EST',     19,   10,   35, 'unité',   52.00,'Traceo Systems',     'C-50-02'),
  A('INF-6004', 'Câble USB-C renforcé 2 m',            'INF', 'D-OUEST',   64,   25,   90, 'unité',    9.90,'Traceo Systems',     'D-50-03'),
  A('INF-6005', 'Support véhicule pour terminal',      'INF', 'D-NOR',     13,    8,   25, 'unité',   78.00,'Traceo Systems',     'A-51-02')
];

/* =========================================================
   3. MOUVEMENTS
   ========================================================= */

let MVT_SEQ = 0;

function M(jours, heure, type, articleRef, qte, motif, operateur) {
  const d = new Date();
  d.setDate(d.getDate() - jours);
  d.setHours(heure, (MVT_SEQ * 7) % 60, 0, 0);
  MVT_SEQ++;
  return {
    id: 'MVT-' + String(MVT_SEQ).padStart(4, '0'),
    date: d.toISOString(),
    type, articleRef, qte, motif, operateur
  };
}

let MOUVEMENTS = [
  M(0, 8,  'sortie', 'EMB-1001',  420, 'Prélèvement CMD-2318',   'A. Ferrand'),
  M(0, 9,  'entree', 'EMB-1002',  240, 'Réception CMD-2290',     'M. Diallo'),
  M(0, 11, 'sortie', 'SEC-3003',  120, 'Dotation équipe B',      'S. Bouvier'),
  M(0, 14, 'sortie', 'CON-4004',   60, 'Prélèvement CMD-2321',   'K. Ndiaye'),
  M(0, 16, 'entree', 'PDR-5003',   25, 'Réception CMD-2295',     'J. Petit'),

  M(1, 8,  'sortie', 'EMB-1003',  180, 'Expédition client SNCF', 'A. Ferrand'),
  M(1, 10, 'entree', 'MAN-2001',    6, 'Réception CMD-2286',     'M. Diallo'),
  M(1, 13, 'sortie', 'PDR-5001',   14, 'Maintenance atelier',    'S. Bouvier'),
  M(1, 15, 'sortie', 'INF-6004',   18, 'Dotation informatique',  'K. Ndiaye'),

  M(2, 7,  'entree', 'EMB-1005',  600, 'Réception CMD-2281',     'J. Petit'),
  M(2, 9,  'sortie', 'SEC-3001',   90, 'Dotation entrepôt',      'A. Ferrand'),
  M(2, 11, 'sortie', 'CON-4002',  140, 'Prélèvement CMD-2309',   'M. Diallo'),
  M(2, 14, 'entree', 'PDR-5005',   20, 'Réception CMD-2277',     'S. Bouvier'),
  M(2, 16, 'sortie', 'EMB-1004',   95, 'Prélèvement CMD-2310',   'K. Ndiaye'),

  M(3, 8,  'entree', 'SEC-3004',   80, 'Réception CMD-2272',     'J. Petit'),
  M(3, 10, 'sortie', 'MAN-2003',    9, 'Expédition agence Lyon', 'A. Ferrand'),
  M(3, 12, 'sortie', 'CON-4005',   42, 'Prélèvement CMD-2301',   'M. Diallo'),
  M(3, 15, 'entree', 'INF-6001',    8, 'Réception CMD-2268',     'S. Bouvier'),

  M(4, 9,  'sortie', 'PDR-5002',    3, 'Remplacement chariot 04','K. Ndiaye'),
  M(4, 11, 'entree', 'CON-4001',   30, 'Réception CMD-2260',     'J. Petit'),
  M(4, 13, 'sortie', 'EMB-1001',  380, 'Prélèvement CMD-2294',   'A. Ferrand'),
  M(4, 16, 'sortie', 'SEC-3005',   55, 'Dotation équipe C',      'M. Diallo'),

  M(5, 8,  'entree', 'MAN-2004',   45, 'Réception CMD-2254',     'S. Bouvier'),
  M(5, 10, 'sortie', 'INF-6003',   11, 'Dotation terminaux',     'K. Ndiaye'),
  M(5, 14, 'sortie', 'CON-4003',   96, 'Prélèvement CMD-2288',   'J. Petit'),
  M(5, 16, 'entree', 'EMB-1003',  400, 'Réception CMD-2249',     'A. Ferrand'),

  M(6, 9,  'sortie', 'EMB-1005',  220, 'Prélèvement CMD-2280',   'M. Diallo'),
  M(6, 11, 'entree', 'SEC-3003',  500, 'Réception CMD-2243',     'S. Bouvier'),
  M(6, 14, 'sortie', 'PDR-5004',    8, 'Maintenance convoyeur',  'K. Ndiaye')
];

MOUVEMENTS.sort((a, b) => new Date(b.date) - new Date(a.date));

/* =========================================================
   4. OUTILS
   ========================================================= */

const nf = new Intl.NumberFormat('fr-FR');
const ef = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0
});
const ef2 = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2
});

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function echappe(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatNombre(n) { return nf.format(Math.round(n)); }
function formatPrix(n)   { return ef.format(n); }
function formatPrix2(n)  { return ef2.format(n); }

function formatDate(iso) {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateLongue(iso) {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatHeure(iso) {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeure(iso) {
  return formatDate(iso) + ' ' + formatHeure(iso);
}

function nomCategorie(code) {
  const c = CATEGORIES.find(x => x.code === code);
  return c ? c.nom : code;
}

function nomDepot(code) {
  const d = DEPOTS.find(x => x.code === code);
  return d ? d.nom : code;
}

function nomDepotComplet(code) {
  const d = DEPOTS.find(x => x.code === code);
  return d ? d.nom + ' — ' + d.ville : code;
}

function articleParRef(ref) {
  return ARTICLES.find(a => a.ref === ref) || null;
}

function joursRestants(dateIso) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(dateIso); d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

/* =========================================================
   5. STATUTS ET ALERTES
   ========================================================= */

function statutArticle(a) {
  if (a.stock <= 0) return 'rupture';
  if (a.stock <= a.seuil) return 'faible';
  if (a.max && a.stock > a.max) return 'surstock';
  return 'ok';
}

function genererAlertes() {
  const alertes = [];

  ARTICLES.forEach(a => {
    const st = statutArticle(a);
    const depot = nomDepot(a.depot);

    if (st === 'rupture') {
      alertes.push({
        id: 'ALT-RUP-' + a.ref,
        niveau: 'critique',
        articleRef: a.ref,
        titre: 'Rupture de stock — ' + a.nom,
        message: 'Aucune unité disponible au ' + depot + '. Réapprovisionnement immédiat requis.',
        meta: a.ref + ' · seuil ' + formatNombre(a.seuil) + ' ' + a.unite
      });
    } else if (st === 'faible') {
      const critique = a.stock <= a.seuil * 0.5;
      alertes.push({
        id: 'ALT-FAI-' + a.ref,
        niveau: critique ? 'critique' : 'avertissement',
        articleRef: a.ref,
        titre: 'Stock faible — ' + a.nom,
        message: 'Il reste ' + formatNombre(a.stock) + ' ' + a.unite +
                 ' au ' + depot + ', sous le seuil de ' + formatNombre(a.seuil) + '.',
        meta: a.ref + ' · ' + a.fournisseur
      });
    } else if (st === 'surstock') {
      alertes.push({
        id: 'ALT-SUR-' + a.ref,
        niveau: 'info',
        articleRef: a.ref,
        titre: 'Surstock — ' + a.nom,
        message: 'Le niveau atteint ' + formatNombre(a.stock) + ' ' + a.unite +
                 ', au-delà du maximum de ' + formatNombre(a.max) + '.',
        meta: a.ref + ' · ' + depot
      });
    }

    if (a.dlc) {
      const j = joursRestants(a.dlc);
      if (j < 0) {
        alertes.push({
          id: 'ALT-DLC-' + a.ref,
          niveau: 'critique',
          articleRef: a.ref,
          titre: 'Lot périmé — ' + a.nom,
          message: 'La date limite était le ' + formatDate(a.dlc) + '. Retrait du stock à effectuer.',
          meta: a.ref + ' · ' + nomDepot(a.depot)
        });
      } else if (j <= 90) {
        alertes.push({
          id: 'ALT-DLC-' + a.ref,
          niveau: j <= 45 ? 'avertissement' : 'info',
          articleRef: a.ref,
          titre: 'Échéance proche — ' + a.nom,
          message: 'Date limite au ' + formatDate(a.dlc) + ', soit dans ' + j + ' jours.',
          meta: a.ref + ' · ' + nomDepot(a.depot)
        });
      }
    }
  });

  const ordre = { critique: 0, avertissement: 1, info: 2 };
  return alertes.sort((x, y) => ordre[x.niveau] - ordre[y.niveau]);
}

/* =========================================================
   6. NOTIFICATIONS
   ========================================================= */

const ICONES_TOAST = {
  ok:   'fa-circle-check',
  warn: 'fa-triangle-exclamation',
  err:  'fa-circle-xmark',
  info: 'fa-circle-info'
};

function toast(message, options) {
  const opts = options || {};
  const type = opts.type || 'info';
  const titre = opts.titre || {
    ok: 'Opération réussie', warn: 'Attention', err: 'Erreur', info: 'Information'
  }[type];

  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML =
    '<i class="fas ' + ICONES_TOAST[type] + '"></i>' +
    '<div><strong>' + echappe(titre) + '</strong><span>' + echappe(message) + '</span></div>';

  $('#toastRoot').appendChild(el);

  setTimeout(() => {
    el.style.transition = 'opacity .2s, transform .2s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(12px)';
    setTimeout(() => el.remove(), 220);
  }, 3600);
}

/* =========================================================
   7. FENÊTRES MODALES
   ========================================================= */

let modaleCourante = null;

function ouvrirModale(config) {
  fermerModale();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true" style="max-width:' + (config.largeur || 520) + 'px">' +
      '<div class="modal-head">' +
        '<div>' +
          '<h3>' + echappe(config.titre) + '</h3>' +
          (config.sousTitre ? '<p>' + echappe(config.sousTitre) + '</p>' : '') +
        '</div>' +
        '<button class="btn-icon" data-close aria-label="Fermer"><i class="fas fa-xmark"></i></button>' +
      '</div>' +
      '<div class="modal-body">' + config.corps + '</div>' +
      (config.pied ? '<div class="modal-foot">' + config.pied + '</div>' : '') +
    '</div>';

  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.closest('[data-close]')) fermerModale();
  });

  document.addEventListener('keydown', echapModale);
  $('#modalRoot').appendChild(overlay);
  modaleCourante = overlay;

  if (typeof config.apresMontage === 'function') {
    config.apresMontage(overlay);
  }
}

function echapModale(e) {
  if (e.key === 'Escape') fermerModale();
}

function fermerModale() {
  if (modaleCourante) {
    modaleCourante.remove();
    modaleCourante = null;
  }
  document.removeEventListener('keydown', echapModale);
}

/* =========================================================
   8. NAVIGATION
   ========================================================= */

const TITRES_VUES = {
  dashboard:  ['Tableau de bord', 'Vue consolidée des stocks et des flux — 4 dépôts'],
  articles:   ['Articles',        'Catalogue des références et niveaux de stock'],
  alertes:    ['Alertes',         'Seuils franchis, ruptures, surstocks et échéances'],
  mouvements: ['Mouvements',      'Entrées, sorties et traçabilité des opérations'],
  rapports:   ['Rapports',        'Éditions et documents imprimables']
};

let vueActive = 'dashboard';

function setVue(nom) {
  if (!TITRES_VUES[nom]) return;
  vueActive = nom;

  $$('.nav-item').forEach(b => {
    b.classList.toggle('is-active', b.dataset.vue === nom);
  });

  $$('.vue').forEach(v => v.classList.remove('is-active'));
  const cible = document.getElementById('vue-' + nom);
  if (cible) cible.classList.add('is-active');

  const t = TITRES_VUES[nom];
  $('#pageTitle').textContent = t[0];
  $('#pageSub').textContent = t[1];

  if (nom === 'dashboard') rendreGraphiques();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================================================
   9. INDICATEURS (KPI)
   ========================================================= */

function rendreKPIs() {
  const alertes = genererAlertes();

  const totalRefs   = ARTICLES.length;
  const totalUnites = ARTICLES.reduce((s, a) => s + a.stock, 0);
  const totalValeur = ARTICLES.reduce((s, a) => s + a.stock * a.prix, 0);

  const nbOk      = ARTICLES.filter(a => statutArticle(a) === 'ok').length;
  const nbFaible  = ARTICLES.filter(a => statutArticle(a) === 'faible').length;
  const nbRupture = ARTICLES.filter(a => statutArticle(a) === 'rupture').length;

  const nbCritiques = alertes.filter(x => x.niveau === 'critique').length;
  const nbAvert     = alertes.filter(x => x.niveau === 'avertissement').length;

  const fournisseurs = new Set(ARTICLES.map(a => a.fournisseur)).size;
  const capaciteTotale = DEPOTS.reduce((s, d) => s + d.capacite, 0);
  const occupation = capaciteTotale ? (totalUnites / capaciteTotale) * 100 : 0;

  $('#kpiRefs').textContent   = formatNombre(totalRefs);
  $('#kpiValeur').textContent = formatPrix(totalValeur);
  $('#kpiUnites').textContent = formatNombre(totalUnites);
  $('#kpiAlertes').textContent = formatNombre(alertes.length);
  $('#kpiRuptures').textContent = formatNombre(nbRupture);

  $('#kpiRefsFoot').innerHTML =
    '<b>' + CATEGORIES.length + '</b> catégories · <b>' + fournisseurs + '</b> fournisseurs';

  $('#kpiValeurFoot').innerHTML =
    'Valeur moyenne par référence : <b>' + formatPrix(totalValeur / (totalRefs || 1)) + '</b>';

  $('#kpiUnitesFoot').innerHTML =
    'Taux d’occupation global : <b>' + occupation.toFixed(1) + ' %</b>';

  $('#kpiAlertesFoot').innerHTML =
    '<span class="down">' + nbCritiques + ' critiques</span> · ' + nbAvert + ' avertissements';

  $('#kpiRupturesFoot').innerHTML =
    nbRupture === 0
      ? 'Aucune référence en rupture'
      : '<b>' + nbRupture + '</b> référence' + (nbRupture > 1 ? 's' : '') + ' concernée' + (nbRupture > 1 ? 's' : '');

  $('#badgeArticles').textContent = totalRefs;
  $('#badgeAlertes').textContent  = alertes.length;
}

/* =========================================================
   10. GRAPHIQUES
   ========================================================= */

let graphiques = { flux: null, categorie: null, depots: null };

function initGraphiquesDefauts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = "'IBM Plex Sans', -apple-system, sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#787f87';
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.boxHeight = 10;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 14;
  Chart.defaults.plugins.tooltip.backgroundColor = '#2b343b';
  Chart.defaults.plugins.tooltip.titleColor = '#f0f2f4';
  Chart.defaults.plugins.tooltip.bodyColor = '#dfe4e8';
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 3;
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.boxWidth = 8;
  Chart.defaults.plugins.tooltip.boxHeight = 8;
}

function joursDerniers(n) {
  const liste = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    liste.push(d);
  }
  return liste;
}

function sommeJour(debut, type) {
  const t0 = debut.getTime();
  const t1 = t0 + 86400000;
  return MOUVEMENTS
    .filter(m => {
      const t = new Date(m.date).getTime();
      return m.type === type && t >= t0 && t < t1;
    })
    .reduce((s, m) => s + m.qte, 0);
}

function rendreGraphiques() {
  if (typeof Chart === 'undefined') return;

  const jours = joursDerniers(7);
  const labels = jours.map(d =>
    d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  );
  const entrees = jours.map(d => sommeJour(d, 'entree'));
  const sorties = jours.map(d => sommeJour(d, 'sortie'));

  if (graphiques.flux) graphiques.flux.destroy();
  const ctxFlux = document.getElementById('chartFlux');
  if (ctxFlux) {
    graphiques.flux = new Chart(ctxFlux, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Entrées',
            data: entrees,
            backgroundColor: '#5c7284',
            hoverBackgroundColor: '#4a5f70',
            borderRadius: 2,
            maxBarThickness: 26
          },
          {
            label: 'Sorties',
            data: sorties,
            backgroundColor: '#a3917a',
            hoverBackgroundColor: '#8d7c66',
            borderRadius: 2,
            maxBarThickness: 26
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: {
            callbacks: {
              label: c => ' ' + c.dataset.label + ' : ' + formatNombre(c.parsed.y) + ' unités'
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: '#e2e4e7' },
            ticks: { color: '#787f87' }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#eef0f1', drawTicks: false },
            border: { display: false },
            ticks: {
              color: '#787f87',
              padding: 8,
              callback: v => formatNombre(v)
            }
          }
        }
      }
    });
  }

  const catLabels = [];
  const catValeurs = [];
  CATEGORIES.forEach(c => {
    const v = ARTICLES
      .filter(a => a.categorie === c.code)
      .reduce((s, a) => s + a.stock * a.prix, 0);
    if (v > 0) { catLabels.push(c.nom); catValeurs.push(Math.round(v)); }
  });

  if (graphiques.categorie) graphiques.categorie.destroy();
  const ctxCat = document.getElementById('chartCategorie');
  if (ctxCat) {
    graphiques.categorie = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catValeurs,
          backgroundColor: PALETTE_GRAPHE,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: { padding: 12, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: c => {
                const total = c.dataset.data.reduce((s, v) => s + v, 0);
                const pct = total ? (c.parsed / total * 100).toFixed(1) : '0';
                return ' ' + c.label + ' : ' + formatPrix(c.parsed) + ' (' + pct + ' %)';
              }
            }
          }
        }
      }
    });
  }

  const depLabels = DEPOTS.map(d => d.nom);
  const depTaux = DEPOTS.map(d => {
    const unites = ARTICLES.filter(a => a.depot === d.code).reduce((s, a) => s + a.stock, 0);
    return d.capacite ? Math.round(unites / d.capacite * 1000) / 10 : 0;
  });
  const depCouleurs = depTaux.map(t =>
    t >= 85 ? '#97453f' : t >= 70 ? '#9d7229' : '#4a5b68'
  );

  if (graphiques.depots) graphiques.depots.destroy();
  const ctxDep = document.getElementById('chartDepots');
  if (ctxDep) {
    graphiques.depots = new Chart(ctxDep, {
      type: 'bar',
      data: {
        labels: depLabels,
        datasets: [{
          label: 'Taux d’occupation',
          data: depTaux,
          backgroundColor: depCouleurs,
          borderRadius: 2,
          maxBarThickness: 22
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: c => ' Occupation : ' + c.parsed.x.toFixed(1) + ' %'
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#eef0f1', drawTicks: false },
            border: { display: false },
            ticks: { color: '#787f87', callback: v => v + ' %' }
          },
          y: {
            grid: { display: false },
            border: { color: '#e2e4e7' },
            ticks: { color: '#4b5259', font: { size: 11.5 } }
          }
        }
      }
    });
  }
}

/* =========================================================
   11. TABLEAU DE BORD — ALERTES ET MOUVEMENTS
   ========================================================= */

const ICONES_ALERTE = {
  critique:      'fa-circle-exclamation',
  avertissement: 'fa-triangle-exclamation',
  info:          'fa-circle-info'
};

function rendreDashAlertes() {
  const zone = $('#dashAlertes');
  if (!zone) return;

  const alertes = genererAlertes().slice(0, 5);

  if (!alertes.length) {
    zone.innerHTML = '<li class="empty" style="border:none">Aucune alerte active — tous les niveaux sont conformes.</li>';
    return;
  }

  zone.innerHTML = alertes.map(al =>
    '<li>' +
      '<span class="alert-dot ' + al.niveau + '"><i class="fas ' + ICONES_ALERTE[al.niveau] + '"></i></span>' +
      '<div class="alert-body">' +
        '<strong>' + echappe(al.titre) + '</strong>' +
        '<span>' + echappe(al.message) + '</span>' +
      '</div>' +
      '<span class="alert-meta">' + echappe(al.meta) + '</span>' +
    '</li>'
  ).join('');
}

function rendreDashMouvements() {
  const table = $('#dashMouvements');
  if (!table) return;

  const derniers = MOUVEMENTS.slice(0, 6);

  table.innerHTML =
    '<thead><tr>' +
      '<th>Date</th><th>Type</th><th>Article</th><th class="num">Qté</th><th>Opérateur</th>' +
    '</tr></thead>' +
    '<tbody>' +
      derniers.map(m => {
        const a = articleParRef(m.articleRef);
        const sens = m.type === 'entree' ? '+' : '−';
        return '<tr>' +
          '<td class="ref">' + formatDateHeure(m.date) + '</td>' +
          '<td>' + (m.type === 'entree'
            ? '<span class="pill ok">Entrée</span>'
            : '<span class="pill neutre">Sortie</span>') + '</td>' +
          '<td><span class="name">' + echappe(a ? a.nom : m.articleRef) + '</span>' +
            '<span class="sub">' + echappe(m.articleRef) + '</span></td>' +
          '<td class="num">' + sens + formatNombre(m.qte) + '</td>' +
          '<td>' + echappe(m.operateur) + '</td>' +
        '</tr>';
      }).join('') +
    '</tbody>';
}

/* =========================================================
   12. VUE ARTICLES
   ========================================================= */

let triArticles = { cle: 'ref', sens: 'asc' };

function articlesFiltres() {
  const q   = ($('#articleSearch')?.value || '').trim().toLowerCase();
  const cat = $('#filtreCategorie')?.value || '';
  const dep = $('#filtreDepot')?.value || '';
  const st  = $('#filtreStatut')?.value || '';

  let liste = ARTICLES.filter(a => {
    if (cat && a.categorie !== cat) return false;
    if (dep && a.depot !== dep) return false;
    if (st && statutArticle(a) !== st) return false;
    if (q) {
      const bloc = (a.ref + ' ' + a.nom + ' ' + a.fournisseur + ' ' + a.emplacement + ' ' + nomCategorie(a.categorie)).toLowerCase();
      if (!bloc.includes(q)) return false;
    }
    return true;
  });

  const dir = triArticles.sens === 'asc' ? 1 : -1;
  const cle = triArticles.cle;

  liste.sort((a, b) => {
    let va, vb;
    switch (cle) {
      case 'nom':        va = a.nom; vb = b.nom; break;
      case 'categorie':  va = nomCategorie(a.categorie); vb = nomCategorie(b.categorie); break;
      case 'depot':      va = a.depot; vb = b.depot; break;
      case 'stock':      va = a.stock; vb = b.stock; break;
      case 'seuil':      va = a.seuil; vb = b.seuil; break;
      case 'valeur':     va = a.stock * a.prix; vb = b.stock * b.prix; break;
      default:           va = a.ref; vb = b.ref;
    }
    if (typeof va === 'string') return va.localeCompare(vb, 'fr') * dir;
    return (va - vb) * dir;
  });

  return liste;
}

function rendreArticles() {
  const table = $('#tableArticles');
  if (!table) return;

  const liste = articlesFiltres();

  const entete = [
    ['ref', 'Référence'],
    ['nom', 'Article'],
    ['categorie', 'Catégorie'],
    ['depot', 'Dépôt'],
    ['stock', 'Stock'],
    ['seuil', 'Seuil'],
    [null, 'Statut'],
    ['valeur', 'Valeur'],
    [null, '']
  ];

  const fleche = cle =>
    triArticles.cle === cle
      ? '<i class="fas fa-caret-' + (triArticles.sens === 'asc' ? 'up' : 'down') + '" style="margin-left:4px;opacity:.6"></i>'
      : '';

  table.innerHTML =
    '<thead><tr>' +
      entete.map(([cle, libelle]) =>
        '<th' + (cle ? ' data-tri="' + cle + '" style="cursor:pointer"' : '') +
        (libelle === 'Stock' || libelle === 'Seuil' || libelle === 'Valeur' ? ' class="num"' : '') +
        '>' + libelle + fleche(cle) + '</th>'
      ).join('') +
    '</tr></thead>' +
    '<tbody>' +
      (liste.length
        ? liste.map(a => {
            const st = statutArticle(a);
            return '<tr>' +
              '<td class="ref">' + echappe(a.ref) + '</td>' +
              '<td><span class="name">' + echappe(a.nom) + '</span>' +
                '<span class="sub">' + echappe(a.emplacement) + ' · ' + echappe(a.fournisseur) + '</span></td>' +
              '<td>' + echappe(nomCategorie(a.categorie)) + '</td>' +
              '<td>' + echappe(a.depot) + '</td>' +
              '<td class="num">' + formatNombre(a.stock) + ' <span style="color:var(--ink-4)">' + echappe(a.unite) + '</span></td>' +
              '<td class="num">' + formatNombre(a.seuil) + '</td>' +
              '<td><span class="pill ' + st + '">' + STATUT_LABEL[st] + '</span></td>' +
              '<td class="num">' + formatPrix(a.stock * a.prix) + '</td>' +
              '<td class="actions">' +
                '<button class="btn-icon" title="Détail" data-action="detail" data-ref="' + a.ref + '"><i class="fas fa-eye"></i></button>' +
                '<button class="btn-icon" title="Fiche imprimable" data-action="fiche" data-ref="' + a.ref + '"><i class="fas fa-print"></i></button>' +
                '<button class="btn-icon" title="Modifier" data-action="modifier" data-ref="' + a.ref + '"><i class="fas fa-pen"></i></button>' +
                '<button class="btn-icon" title="Supprimer" data-action="supprimer" data-ref="' + a.ref + '"><i class="fas fa-trash"></i></button>' +
              '</td>' +
            '</tr>';
          }).join('')
        : '<tr><td colspan="9"><div class="empty">Aucun article ne correspond aux critères sélectionnés.</div></td></tr>') +
    '</tbody>';

  const totalValeur = liste.reduce((s, a) => s + a.stock * a.prix, 0);
  const totalUnites = liste.reduce((s, a) => s + a.stock, 0);

  $('#tableFoot').innerHTML =
    '<span><b>' + liste.length + '</b> référence' + (liste.length > 1 ? 's' : '') + ' affichée' + (liste.length > 1 ? 's' : '') +
    ' sur ' + ARTICLES.length + '</span>' +
    '<span>Unités : <b>' + formatNombre(totalUnites) + '</b> &nbsp;·&nbsp; Valeur : <b>' + formatPrix(totalValeur) + '</b></span>';
}

document.addEventListener('click', e => {
  const th = e.target.closest('[data-tri]');
  if (th) {
    const cle = th.dataset.tri;
    if (triArticles.cle === cle) {
      triArticles.sens = triArticles.sens === 'asc' ? 'desc' : 'asc';
    } else {
      triArticles.cle = cle;
      triArticles.sens = 'asc';
    }
    rendreArticles();
    return;
  }

  const btn = e.target.closest('[data-action][data-ref]');
  if (btn) {
    const ref = btn.dataset.ref;
    const action = btn.dataset.action;
    if (action === 'detail')    ouvrirDetailArticle(ref);
    if (action === 'fiche')     imprimerFicheArticle(ref);
    if (action === 'modifier')  ouvrirFormulaireArticle(articleParRef(ref));
    if (action === 'supprimer') confirmerSuppression(ref);
    return;
  }

  const goto = e.target.closest('[data-goto]');
  if (goto) {
    e.preventDefault();
    setVue(goto.dataset.goto);
  }
});

/* =========================================================
   13. DÉTAIL ET FORMULAIRE ARTICLE
   ========================================================= */

function ouvrirDetailArticle(ref) {
  const a = articleParRef(ref);
  if (!a) return;

  const st = statutArticle(a);
  const mouvements = MOUVEMENTS.filter(m => m.articleRef === ref).slice(0, 8);
  const couverture = a.stock > 0 ? Math.round(a.stock / Math.max(a.seuil, 1) * 100) : 0;

  const ligne = (label, valeur) =>
    '<div style="display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid var(--border)">' +
      '<span style="font-size:12px;color:var(--ink-3)">' + label + '</span>' +
      '<strong style="font-size:12.8px;font-weight:500;text-align:right">' + valeur + '</strong>' +
    '</div>';

  const corps =
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px">' +
      '<div>' +
        '<div style="font-size:15px;font-weight:600">' + echappe(a.nom) + '</div>' +
        '<div style="font-family:var(--mono);font-size:11.5px;color:var(--ink-4);margin-top:3px">' + echappe(a.ref) + '</div>' +
      '</div>' +
      '<span class="pill ' + st + '">' + STATUT_LABEL[st] + '</span>' +
    '</div>' +

    ligne('Catégorie', echappe(nomCategorie(a.categorie))) +
    ligne('Dépôt', echappe(nomDepotComplet(a.depot))) +
    ligne('Emplacement', '<span style="font-family:var(--mono)">' + echappe(a.emplacement) + '</span>') +
    ligne('Stock actuel', formatNombre(a.stock) + ' ' + echappe(a.unite)) +
    ligne('Seuil d’alerte', formatNombre(a.seuil) + ' ' + echappe(a.unite)) +
    (a.max ? ligne('Stock maximum', formatNombre(a.max) + ' ' + echappe(a.unite)) : '') +
    ligne('Couverture du seuil', couverture + ' %') +
    ligne('Prix unitaire', formatPrix2(a.prix)) +
    ligne('Valeur immobilisée', '<span style="font-family:var(--mono)">' + formatPrix(a.stock * a.prix) + '</span>') +
    ligne('Fournisseur', echappe(a.fournisseur)) +
    (a.dlc ? ligne('Date limite', formatDate(a.dlc) + ' (' + joursRestants(a.dlc) + ' j)') : '') +

    (mouvements.length
      ? '<h4 style="margin:20px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3)">Derniers mouvements</h4>' +
        '<table class="table compact" style="font-size:12.3px">' +
          '<thead><tr><th>Date</th><th>Type</th><th class="num">Qté</th><th>Motif</th></tr></thead>' +
          '<tbody>' + mouvements.map(m =>
            '<tr>' +
              '<td class="ref">' + formatDate(m.date) + '</td>' +
              '<td>' + (m.type === 'entree' ? 'Entrée' : 'Sortie') + '</td>' +
              '<td class="num">' + (m.type === 'entree' ? '+' : '−') + formatNombre(m.qte) + '</td>' +
              '<td style="font-size:11.5px">' + echappe(m.motif) + '</td>' +
            '</tr>').join('') + '</tbody>' +
        '</table>'
      : '');

  ouvrirModale({
    titre: 'Fiche article',
    sousTitre: 'Détail de la référence et historique récent',
    corps,
    largeur: 560,
    pied:
      '<button class="btn" data-close>Fermer</button>' +
      '<button class="btn" onclick="imprimerFicheArticle(\'' + a.ref + '\')"><i class="fas fa-print"></i> Imprimer</button>' +
      '<button class="btn btn-primary" onclick="fermerModale();ouvrirFormulaireArticle(articleParRef(\'' + a.ref + '\'))">' +
        '<i class="fas fa-pen"></i> Modifier</button>'
  });
}

function ouvrirFormulaireArticle(article) {
  const edition = !!article;
  const a = article || {
    ref: 'ART-' + String(ARTICLES.length + 1).padStart(3, '0'),
    nom: '', categorie: 'EMB', depot: 'D-NOR',
    stock: 0, seuil: 0, max: 0, unite: 'unité',
    prix: 0, fournisseur: '', emplacement: '', dlc: null
  };

  const optionsCategories = CATEGORIES.map(c =>
    '<option value="' + c.code + '"' + (c.code === a.categorie ? ' selected' : '') + '>' + c.nom + '</option>'
  ).join('');

  const optionsDepots = DEPOTS.map(d =>
    '<option value="' + d.code + '"' + (d.code === a.depot ? ' selected' : '') + '>' +
      d.nom + ' — ' + d.ville + '</option>'
  ).join('');

  const corps =
    '<form id="formArticle" class="form">' +
      '<div class="form-row">' +
        '<div class="field"><label for="fRef">Référence</label>' +
          '<input type="text" id="fRef" value="' + echappe(a.ref) + '" ' + (edition ? 'readonly style="background:var(--surface-3)"' : '') + ' required></div>' +
        '<div class="field"><label for="fUnite">Unité</label>' +
          '<input type="text" id="fUnite" value="' + echappe(a.unite) + '" placeholder="unité, carton, rouleau…" required></div>' +
      '</div>' +

      '<div class="field"><label for="fNom">Désignation</label>' +
        '<input type="text" id="fNom" value="' + echappe(a.nom) + '" placeholder="Ex. Carton double cannelure 600×400" required></div>' +

      '<div class="form-row">' +
        '<div class="field"><label for="fCategorie">Catégorie</label>' +
          '<select id="fCategorie">' + optionsCategories + '</select></div>' +
        '<div class="field"><label for="fDepot">Dépôt</label>' +
          '<select id="fDepot">' + optionsDepots + '</select></div>' +
      '</div>' +

      '<div class="form-row">' +
        '<div class="field"><label for="fStock">Stock actuel</label>' +
          '<input type="number" id="fStock" min="0" step="1" value="' + a.stock + '" required></div>' +
        '<div class="field"><label for="fSeuil">Seuil d’alerte</label>' +
          '<input type="number" id="fSeuil" min="0" step="1" value="' + a.seuil + '" required></div>' +
      '</div>' +

      '<div class="form-row">' +
        '<div class="field"><label for="fMax">Stock maximum</label>' +
          '<input type="number" id="fMax" min="0" step="1" value="' + (a.max || 0) + '"></div>' +
        '<div class="field"><label for="fPrix">Prix unitaire (€)</label>' +
          '<input type="number" id="fPrix" min="0" step="0.01" value="' + a.prix + '" required></div>' +
      '</div>' +

      '<div class="form-row">' +
        '<div class="field"><label for="fFournisseur">Fournisseur</label>' +
          '<input type="text" id="fFournisseur" value="' + echappe(a.fournisseur) + '" required></div>' +
        '<div class="field"><label for="fEmplacement">Emplacement</label>' +
          '<input type="text" id="fEmplacement" value="' + echappe(a.emplacement) + '" placeholder="A-01-02"></div>' +
      '</div>' +

      '<div class="field"><label for="fDlc">Date limite de consommation <span style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--ink-4)">(optionnel)</span></label>' +
        '<input type="date" id="fDlc" value="' + (a.dlc || '') + '"></div>' +
    '</form>';

  ouvrirModale({
    titre: edition ? 'Modifier l’article' : 'Nouvel article',
    sousTitre: edition ? 'Mise à jour de la référence ' + a.ref : 'Création d’une référence dans le catalogue',
    corps,
    largeur: 600,
    pied:
      '<button class="btn" data-close>Annuler</button>' +
      '<button class="btn btn-primary" id="btnSaveArticle"><i class="fas fa-check"></i> ' +
        (edition ? 'Enregistrer' : 'Créer l’article') + '</button>',
    apresMontage: () => {
      $('#btnSaveArticle').addEventListener('click', () => {
        const form = $('#formArticle');
        if (!form.reportValidity()) return;

        const ref = $('#fRef').value.trim().toUpperCase();

        if (!edition && ARTICLES.some(x => x.ref === ref)) {
          toast('La référence ' + ref + ' existe déjà dans le catalogue.', { type: 'err' });
          return;
        }

        const donnees = {
          ref,
          nom:         $('#fNom').value.trim(),
          categorie:   $('#fCategorie').value,
          depot:       $('#fDepot').value,
          stock:       Math.max(0, parseInt($('#fStock').value, 10) || 0),
          seuil:       Math.max(0, parseInt($('#fSeuil').value, 10) || 0),
          max:         Math.max(0, parseInt($('#fMax').value, 10) || 0),
          unite:       $('#fUnite').value.trim() || 'unité',
          prix:        Math.max(0, parseFloat($('#fPrix').value) || 0),
          fournisseur: $('#fFournisseur').value.trim(),
          emplacement: $('#fEmplacement').value.trim() || '—',
          dlc:         $('#fDlc').value || null
        };

        if (edition) {
          Object.assign(article, donnees);
          toast('Article ' + ref + ' mis à jour.', { type: 'ok' });
        } else {
          ARTICLES.push(donnees);
          toast('Article ' + ref + ' créé dans le catalogue.', { type: 'ok' });
        }

        fermerModale();
        rendreTout();
      });
    }
  });
}

function confirmerSuppression(ref) {
  const a = articleParRef(ref);
  if (!a) return;

  ouvrirModale({
    titre: 'Supprimer la référence',
    sousTitre: 'Cette action est irréversible',
    largeur: 460,
    corps:
      '<p style="font-size:13.2px;color:var(--ink-2);line-height:1.55">' +
        'Confirmez-vous la suppression de <strong>' + echappe(a.nom) + '</strong> ' +
        '(<span style="font-family:var(--mono);font-size:12px">' + echappe(a.ref) + '</span>) du catalogue ?' +
      '</p>' +
      '<p style="margin-top:10px;font-size:12.2px;color:var(--ink-3)">' +
        'Le stock actuel de ' + formatNombre(a.stock) + ' ' + echappe(a.unite) +
        ' et l’historique des mouvements associés ne seront plus visibles.' +
      '</p>',
    pied:
      '<button class="btn" data-close>Annuler</button>' +
      '<button class="btn btn-danger" id="btnConfirmSuppr"><i class="fas fa-trash"></i> Supprimer définitivement</button>',
    apresMontage: () => {
      $('#btnConfirmSuppr').addEventListener('click', () => {
        const i = ARTICLES.findIndex(x => x.ref === ref);
        if (i > -1) ARTICLES.splice(i, 1);
        fermerModale();
        rendreTout();
        toast('Référence ' + ref + ' supprimée du catalogue.', { type: 'warn' });
      });
    }
  });
}

/* =========================================================
   14. VUE ALERTES
   ========================================================= */

let filtreNiveauAlerte = '';

function rendreAlertes() {
  const zone = $('#alertesFull');
  if (!zone) return;

  const toutes = genererAlertes();
  const liste = filtreNiveauAlerte
    ? toutes.filter(a => a.niveau === filtreNiveauAlerte)
    : toutes;

  if (!liste.length) {
    zone.innerHTML = '<div class="empty" style="grid-column:1/-1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:48px 20px">' +
      'Aucune alerte ne correspond à ce filtre.</div>';
    return;
  }

  zone.innerHTML = liste.map(al => {
    const a = articleParRef(al.articleRef);
    const libelleNiveau = { critique: 'Critique', avertissement: 'Avertissement', info: 'Information' }[al.niveau];

    return '<article class="alert-card ' + al.niveau + '">' +
      '<span class="alert-dot ' + al.niveau + '"><i class="fas ' + ICONES_ALERTE[al.niveau] + '"></i></span>' +
      '<div class="alert-body">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<strong>' + echappe(al.titre) + '</strong>' +
          '<span class="tag">' + libelleNiveau + '</span>' +
        '</div>' +
        '<p>' + echappe(al.message) + '</p>' +
        '<div class="alert-actions">' +
          '<span style="font-family:var(--mono);font-size:10.8px;color:var(--ink-4)">' + echappe(al.meta) + '</span>' +
          (a ? '<button class="btn btn-sm" style="margin-left:auto" onclick="ouvrirDetailArticle(\'' + a.ref + '\')">' +
                 '<i class="fas fa-eye"></i> Voir l’article</button>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }).join('');
}

function initChipsAlertes() {
  const zone = $('#chipsAlertes');
  if (!zone) return;

  zone.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip', zone).forEach(c => c.classList.toggle('is-active', c === chip));
    filtreNiveauAlerte = chip.dataset.niveau || '';
    rendreAlertes();
  });
}

/* =========================================================
   15. VUE MOUVEMENTS
   ========================================================= */

function rendreMouvements() {
  const table = $('#tableMouvements');
  if (!table) return;

  const liste = MOUVEMENTS.slice(0, 60);

  table.innerHTML =
    '<thead><tr>' +
      '<th>Date</th><th>Type</th><th>Article</th><th class="num">Qté</th>' +
      '<th>Motif</th><th>Opérateur</th>' +
    '</tr></thead>' +
    '<tbody>' +
      (liste.length
        ? liste.map(m => {
            const a = articleParRef(m.articleRef);
            const entree = m.type === 'entree';
            return '<tr>' +
              '<td class="ref">' + formatDateHeure(m.date) + '</td>' +
              '<td>' + (entree
                ? '<span class="pill ok">Entrée</span>'
                : '<span class="pill neutre">Sortie</span>') + '</td>' +
              '<td><span class="name">' + echappe(a ? a.nom : '—') + '</span>' +
                '<span class="sub">' + echappe(m.articleRef) + '</span></td>' +
              '<td class="num">' + (entree ? '+' : '−') + formatNombre(m.qte) + '</td>' +
              '<td style="font-size:12.3px">' + echappe(m.motif) + '</td>' +
              '<td>' + echappe(m.operateur) + '</td>' +
            '</tr>';
          }).join('')
        : '<tr><td colspan="6"><div class="empty">Aucun mouvement enregistré.</div></td></tr>') +
    '</tbody>';

  const count = $('#mvtCount');
  if (count) count.textContent = MOUVEMENTS.length + ' opération' + (MOUVEMENTS.length > 1 ? 's' : '') + ' enregistrée' + (MOUVEMENTS.length > 1 ? 's' : '');
}

function initFormulaireMouvement() {
  const form = $('#formMouvement');
  if (!form) return;

  const selectArticle = $('#mvArticle');

  selectArticle.innerHTML = ARTICLES
    .map(a => '<option value="' + a.ref + '">' + a.ref + ' — ' + a.nom + '</option>')
    .join('');

  function majHint() {
    const a = articleParRef(selectArticle.value);
    const hint = $('#mvStockHint');
    if (!a || !hint) return;
    hint.innerHTML = 'Stock disponible : <strong>' + formatNombre(a.stock) + ' ' + echappe(a.unite) +
                     '</strong> · seuil ' + formatNombre(a.seuil);
  }

  selectArticle.addEventListener('change', majHint);
  majHint();

  form.addEventListener('submit', e => {
    e.preventDefault();

    if (session && session.invite) {
      toast('Le mode consultation ne permet pas d’enregistrer des mouvements.', { type: 'warn', titre: 'Accès restreint' });
      return;
    }

    const type    = $('#mvType').value;
    const ref     = selectArticle.value;
    const qte     = parseInt($('#mvQte').value, 10);
    const motif   = $('#mvMotif').value.trim();
    const operateur = $('#mvOperateur').value;

    const a = articleParRef(ref);
    if (!a) return;

    if (!Number.isFinite(qte) || qte <= 0) {
      toast('La quantité doit être un entier supérieur à zéro.', { type: 'err' });
      return;
    }

    if (type === 'sortie' && qte > a.stock) {
      toast('Stock insuffisant : ' + formatNombre(a.stock) + ' ' + a.unite + ' disponibles.', { type: 'err' });
      return;
    }

    a.stock += type === 'entree' ? qte : -qte;

    MOUVEMENTS.unshift({
      id: 'MVT-' + String(++MVT_SEQ).padStart(4, '0'),
      date: new Date().toISOString(),
      type, articleRef: ref, qte, motif, operateur
    });

    form.reset();
    $('#mvType').value = 'entree';
    majHint();
    rendreTout();

    toast(
      (type === 'entree' ? 'Entrée' : 'Sortie') + ' de ' + formatNombre(qte) + ' ' + a.unite +
      ' enregistrée pour ' + a.ref + '.',
      { type: 'ok' }
    );
  });
}

/* =========================================================
   16. IMPRESSIONS
   ========================================================= */

function enTeteImpression(titre, sousTitre) {
  const d = new Date();
  const operateur = session
    ? session.nom + (session.invite ? ' (consultation)' : '')
    : '—';
  return '<div class="print-head">' +
    '<div>' +
      '<h1>' + echappe(titre) + '</h1>' +
      '<p>' + echappe(sousTitre) + '</p>' +
    '</div>' +
    '<div class="print-brand">' +
      '<strong>LogiTrack Pro</strong><br>' +
      'Édité le ' + formatDate(d) + ' à ' + formatHeure(d) + '<br>' +
      'Opérateur : ' + echappe(operateur) +
    '</div>' +
  '</div>';
}

function blocMeta(items) {
  return '<div class="print-meta">' +
    items.map(([label, valeur]) =>
      '<div><span>' + echappe(label) + '</span><strong>' + echappe(valeur) + '</strong></div>'
    ).join('') +
  '</div>';
}

function piedImpression() {
  return '<div class="print-foot">' +
    '<span>LogiTrack Pro — Gestion des stocks et des flux logistiques</span>' +
    '<span>Document généré automatiquement — toute modification manuelle doit être visée.</span>' +
  '</div>';
}

function signatures() {
  return '<div class="print-sign">' +
    '<div>Établi par — nom, date et signature</div>' +
    '<div>Vérifié par — nom, date et signature</div>' +
  '</div>';
}

function lancerImpression(html) {
  const zone = $('#printArea');
  zone.innerHTML = '<div class="print-doc">' + html + '</div>';
  window.print();
}

window.addEventListener('afterprint', () => {
  const zone = $('#printArea');
  if (zone) zone.innerHTML = '';
});

function imprimerInventaire() {
  const totalUnites = ARTICLES.reduce((s, a) => s + a.stock, 0);
  const totalValeur = ARTICLES.reduce((s, a) => s + a.stock * a.prix, 0);

  const parCategorie = CATEGORIES.map(c => ({
    categorie: c,
    articles: ARTICLES
      .filter(a => a.categorie === c.code)
      .sort((x, y) => x.ref.localeCompare(y.ref, 'fr'))
  })).filter(g => g.articles.length);

  let html = enTeteImpression(
    'Inventaire complet des stocks',
    'État des références par catégorie, avec valorisation et niveau d’alerte'
  );

  html += blocMeta([
    ['Références',     String(ARTICLES.length)],
    ['Unités en stock', formatNombre(totalUnites)],
    ['Valeur totale',  formatPrix(totalValeur)],
    ['Dépôts',         String(DEPOTS.length)]
  ]);

  parCategorie.forEach((g, index) => {
    const sousTotalUnites = g.articles.reduce((s, a) => s + a.stock, 0);
    const sousTotalValeur = g.articles.reduce((s, a) => s + a.stock * a.prix, 0);

    html += '<h2 class="print-title"' + (index > 0 && index % 2 === 0 ? ' style="page-break-before:always"' : '') + '>' +
      echappe(g.categorie.nom) + ' — ' + g.articles.length + ' référence' + (g.articles.length > 1 ? 's' : '') +
    '</h2>';

    html += '<table><thead><tr>' +
      '<th>Référence</th><th>Désignation</th><th>Dépôt</th><th>Emplacement</th>' +
      '<th class="num">Stock</th><th class="num">Seuil</th><th class="num">Max</th>' +
      '<th class="num">P.U.</th><th class="num">Valeur</th><th>Statut</th>' +
    '</tr></thead><tbody>';

    g.articles.forEach(a => {
      const st = statutArticle(a);
      html += '<tr>' +
        '<td class="ref">' + echappe(a.ref) + '</td>' +
        '<td>' + echappe(a.nom) + '</td>' +
        '<td>' + echappe(a.depot) + '</td>' +
        '<td class="ref">' + echappe(a.emplacement) + '</td>' +
        '<td class="num">' + formatNombre(a.stock) + '</td>' +
        '<td class="num">' + formatNombre(a.seuil) + '</td>' +
        '<td class="num">' + (a.max ? formatNombre(a.max) : '—') + '</td>' +
        '<td class="num">' + formatPrix2(a.prix) + '</td>' +
        '<td class="num">' + formatPrix(a.stock * a.prix) + '</td>' +
        '<td>' + STATUT_LABEL[st] + '</td>' +
      '</tr>';
    });

    html += '</tbody><tfoot><tr>' +
      '<td colspan="4">Sous-total ' + echappe(g.categorie.nom) + '</td>' +
      '<td class="num">' + formatNombre(sousTotalUnites) + '</td>' +
      '<td colspan="3"></td>' +
      '<td class="num">' + formatPrix(sousTotalValeur) + '</td>' +
      '<td></td>' +
    '</tr></tfoot></table>';
  });

  html += '<h2 class="print-title">Synthèse générale</h2>' +
    '<table><tbody>' +
      '<tr><td>Nombre total de références</td><td class="num">' + ARTICLES.length + '</td></tr>' +
      '<tr><td>Nombre total d’unités en stock</td><td class="num">' + formatNombre(totalUnites) + '</td></tr>' +
      '<tr><td>Valeur totale immobilisée</td><td class="num">' + formatPrix(totalValeur) + '</td></tr>' +
      '<tr><td>Références en rupture</td><td class="num">' + ARTICLES.filter(a => statutArticle(a) === 'rupture').length + '</td></tr>' +
      '<tr><td>Références sous le seuil</td><td class="num">' + ARTICLES.filter(a => statutArticle(a) === 'faible').length + '</td></tr>' +
    '</tbody></table>';

  html += signatures() + piedImpression();
  lancerImpression(html);
}

function imprimerBonReappro() {
  const manquants = ARTICLES
    .filter(a => statutArticle(a) === 'faible' || statutArticle(a) === 'rupture')
    .sort((x, y) => (x.stock / Math.max(x.seuil, 1)) - (y.stock / Math.max(y.seuil, 1)));

  let html = enTeteImpression(
    'Bon de réapprovisionnement',
    'Références en rupture ou sous le seuil d’alerte — quantités suggérées'
  );

  const valeurEstimee = manquants.reduce((s, a) => {
    const qte = Math.max((a.max || a.seuil * 3) - a.stock, 1);
    return s + qte * a.prix;
  }, 0);

  html += blocMeta([
    ['Références à commander', String(manquants.length)],
    ['Fournisseurs concernés', String(new Set(manquants.map(a => a.fournisseur)).size)],
    ['Montant estimé', formatPrix(valeurEstimee)],
    ['Délai souhaité', '5 jours ouvrés']
  ]);

  if (!manquants.length) {
    html += '<h2 class="print-title">Aucun réapprovisionnement nécessaire</h2>' +
      '<p>Toutes les références du catalogue sont actuellement au-dessus de leur seuil d’alerte.</p>' +
      signatures() + piedImpression();
    return lancerImpression(html);
  }

  html += '<table><thead><tr>' +
    '<th>Référence</th><th>Désignation</th><th>Fournisseur</th><th>Dépôt</th>' +
    '<th class="num">Stock</th><th class="num">Seuil</th><th class="num">Qté à commander</th>' +
    '<th class="num">P.U.</th><th class="num">Montant</th>' +
  '</tr></thead><tbody>';

  manquants.forEach(a => {
    const qte = Math.max((a.max || a.seuil * 3) - a.stock, 1);
    html += '<tr>' +
      '<td class="ref">' + echappe(a.ref) + '</td>' +
      '<td>' + echappe(a.nom) + '</td>' +
      '<td>' + echappe(a.fournisseur) + '</td>' +
      '<td>' + echappe(a.depot) + '</td>' +
      '<td class="num">' + formatNombre(a.stock) + '</td>' +
      '<td class="num">' + formatNombre(a.seuil) + '</td>' +
      '<td class="num"><strong>' + formatNombre(qte) + '</strong> ' + echappe(a.unite) + '</td>' +
      '<td class="num">' + formatPrix2(a.prix) + '</td>' +
      '<td class="num">' + formatPrix(qte * a.prix) + '</td>' +
    '</tr>';
  });

  html += '</tbody><tfoot><tr>' +
    '<td colspan="8">Montant total estimé</td>' +
    '<td class="num">' + formatPrix(valeurEstimee) + '</td>' +
  '</tr></tfoot></table>';

  html += '<h2 class="print-title">Répartition par fournisseur</h2>' +
    '<table><thead><tr><th>Fournisseur</th><th class="num">Références</th><th class="num">Montant estimé</th></tr></thead><tbody>';

  const parFournisseur = {};
  manquants.forEach(a => {
    const qte = Math.max((a.max || a.seuil * 3) - a.stock, 1);
    if (!parFournisseur[a.fournisseur]) parFournisseur[a.fournisseur] = { refs: 0, montant: 0 };
    parFournisseur[a.fournisseur].refs++;
    parFournisseur[a.fournisseur].montant += qte * a.prix;
  });

  Object.entries(parFournisseur)
    .sort((x, y) => y[1].montant - x[1].montant)
    .forEach(([nom, v]) => {
      html += '<tr><td>' + echappe(nom) + '</td>' +
        '<td class="num">' + v.refs + '</td>' +
        '<td class="num">' + formatPrix(v.montant) + '</td></tr>';
    });

  html += '</tbody></table>';
  html += signatures() + piedImpression();
  lancerImpression(html);
}

function imprimerValorisation() {
  const totalValeur = ARTICLES.reduce((s, a) => s + a.stock * a.prix, 0);

  let html = enTeteImpression(
    'Valorisation du stock',
    'Répartition de la valeur immobilisée par catégorie et par dépôt'
  );

  html += blocMeta([
    ['Valeur totale', formatPrix(totalValeur)],
    ['Références',    String(ARTICLES.length)],
    ['Dépôts',        String(DEPOTS.length)],
    ['Catégories',    String(CATEGORIES.length)]
  ]);

  html += '<h2 class="print-title">Valorisation par catégorie</h2>' +
    '<table><thead><tr>' +
      '<th>Catégorie</th><th class="num">Références</th><th class="num">Unités</th>' +
      '<th class="num">Valeur</th><th class="num">Part</th>' +
    '</tr></thead><tbody>';

  CATEGORIES.forEach(c => {
    const lot = ARTICLES.filter(a => a.categorie === c.code);
    if (!lot.length) return;
    const unites = lot.reduce((s, a) => s + a.stock, 0);
    const valeur = lot.reduce((s, a) => s + a.stock * a.prix, 0);
    const part = totalValeur ? (valeur / totalValeur * 100).toFixed(1) : '0.0';
    html += '<tr>' +
      '<td>' + echappe(c.nom) + '</td>' +
      '<td class="num">' + lot.length + '</td>' +
      '<td class="num">' + formatNombre(unites) + '</td>' +
      '<td class="num">' + formatPrix(valeur) + '</td>' +
      '<td class="num">' + part + ' %</td>' +
    '</tr>';
  });

  html += '</tbody><tfoot><tr>' +
    '<td>Total</td>' +
    '<td class="num">' + ARTICLES.length + '</td>' +
    '<td class="num">' + formatNombre(ARTICLES.reduce((s, a) => s + a.stock, 0)) + '</td>' +
    '<td class="num">' + formatPrix(totalValeur) + '</td>' +
    '<td class="num">100 %</td>' +
  '</tr></tfoot></table>';

  html += '<h2 class="print-title" style="page-break-before:always">Valorisation par dépôt</h2>' +
    '<table><thead><tr>' +
      '<th>Dépôt</th><th>Ville</th><th class="num">Références</th><th class="num">Unités</th>' +
      '<th class="num">Capacité</th><th class="num">Occupation</th><th class="num">Valeur</th>' +
    '</tr></thead><tbody>';

  DEPOTS.forEach(d => {
    const lot = ARTICLES.filter(a => a.depot === d.code);
    const unites = lot.reduce((s, a) => s + a.stock, 0);
    const valeur = lot.reduce((s, a) => s + a.stock * a.prix, 0);
    const occ = d.capacite ? (unites / d.capacite * 100).toFixed(1) : '0.0';

    html += '<tr>' +
      '<td>' + echappe(d.nom) + '</td>' +
      '<td>' + echappe(d.ville) + '</td>' +
      '<td class="num">' + lot.length + '</td>' +
      '<td class="num">' + formatNombre(unites) + '</td>' +
      '<td class="num">' + formatNombre(d.capacite) + '</td>' +
      '<td class="num">' + occ + ' %</td>' +
      '<td class="num">' + formatPrix(valeur) + '</td>' +
    '</tr>';
  });

  html += '</tbody></table>';

  const top = ARTICLES
    .slice()
    .sort((x, y) => (y.stock * y.prix) - (x.stock * x.prix))
    .slice(0, 10);

  html += '<h2 class="print-title">Top 10 des références par valeur immobilisée</h2>' +
    '<table><thead><tr>' +
      '<th>Rang</th><th>Référence</th><th>Désignation</th><th class="num">Stock</th>' +
      '<th class="num">P.U.</th><th class="num">Valeur</th><th class="num">Part</th>' +
    '</tr></thead><tbody>';

  top.forEach((a, i) => {
    const v = a.stock * a.prix;
    const part = totalValeur ? (v / totalValeur * 100).toFixed(1) : '0.0';
    html += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td class="ref">' + echappe(a.ref) + '</td>' +
      '<td>' + echappe(a.nom) + '</td>' +
      '<td class="num">' + formatNombre(a.stock) + '</td>' +
      '<td class="num">' + formatPrix2(a.prix) + '</td>' +
      '<td class="num">' + formatPrix(v) + '</td>' +
      '<td class="num">' + part + ' %</td>' +
    '</tr>';
  });

  html += '</tbody></table>';
  html += piedImpression();
  lancerImpression(html);
}

function imprimerRegistre() {
  const liste = MOUVEMENTS.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalEntrees = liste.filter(m => m.type === 'entree').reduce((s, m) => s + m.qte, 0);
  const totalSorties = liste.filter(m => m.type === 'sortie').reduce((s, m) => s + m.qte, 0);

  let html = enTeteImpression(
    'Registre des mouvements de stock',
    'Traçabilité complète des entrées et sorties — opérateurs et documents associés'
  );

  html += blocMeta([
    ['Opérations', String(liste.length)],
    ['Unités entrées', formatNombre(totalEntrees)],
    ['Unités sorties', formatNombre(totalSorties)],
    ['Solde net', (totalEntrees - totalSorties >= 0 ? '+' : '−') + formatNombre(Math.abs(totalEntrees - totalSorties))]
  ]);

  html += '<table><thead><tr>' +
    '<th>N°</th><th>Date</th><th>Type</th><th>Référence</th><th>Désignation</th>' +
    '<th class="num">Qté</th><th>Motif / document</th><th>Opérateur</th>' +
  '</tr></thead><tbody>';

  liste.forEach(m => {
    const a = articleParRef(m.articleRef);
    html += '<tr>' +
      '<td class="ref">' + echappe(m.id) + '</td>' +
      '<td class="ref">' + formatDateHeure(m.date) + '</td>' +
      '<td>' + (m.type === 'entree' ? 'Entrée' : 'Sortie') + '</td>' +
      '<td class="ref">' + echappe(m.articleRef) + '</td>' +
      '<td>' + echappe(a ? a.nom : '—') + '</td>' +
      '<td class="num">' + (m.type === 'entree' ? '+' : '−') + formatNombre(m.qte) + '</td>' +
      '<td>' + echappe(m.motif) + '</td>' +
      '<td>' + echappe(m.operateur) + '</td>' +
    '</tr>';
  });

  html += '</tbody><tfoot><tr>' +
    '<td colspan="5">Totaux de la période</td>' +
    '<td class="num">' + (totalEntrees - totalSorties >= 0 ? '+' : '−') + formatNombre(Math.abs(totalEntrees - totalSorties)) + '</td>' +
    '<td colspan="2">' + liste.length + ' opérations</td>' +
  '</tr></tfoot></table>';

  html += signatures() + piedImpression();
  lancerImpression(html);
}

function imprimerFicheArticle(ref) {
  const a = articleParRef(ref);
  if (!a) return;

  const st = statutArticle(a);
  const mouvements = MOUVEMENTS.filter(m => m.articleRef === ref).slice(0, 20);

  let html = enTeteImpression(
    'Fiche article — ' + a.ref,
    a.nom
  );

  html += blocMeta([
    ['Statut', STATUT_LABEL[st]],
    ['Stock actuel', formatNombre(a.stock) + ' ' + a.unite],
    ['Seuil d’alerte', formatNombre(a.seuil) + ' ' + a.unite],
    ['Valeur immobilisée', formatPrix(a.stock * a.prix)]
  ]);

  html += '<h2 class="print-title">Identification</h2>' +
    '<table><tbody>' +
      '<tr><td style="width:38%">Référence</td><td class="ref">' + echappe(a.ref) + '</td></tr>' +
      '<tr><td>Désignation</td><td>' + echappe(a.nom) + '</td></tr>' +
      '<tr><td>Catégorie</td><td>' + echappe(nomCategorie(a.categorie)) + '</td></tr>' +
      '<tr><td>Dépôt de rattachement</td><td>' + echappe(nomDepotComplet(a.depot)) + '</td></tr>' +
      '<tr><td>Emplacement</td><td class="ref">' + echappe(a.emplacement) + '</td></tr>' +
      '<tr><td>Fournisseur</td><td>' + echappe(a.fournisseur) + '</td></tr>' +
    '</tbody></table>';

  html += '<h2 class="print-title">Niveaux de stock</h2>' +
    '<table><thead><tr>' +
      '<th>Stock actuel</th><th>Seuil d’alerte</th><th>Stock maximum</th>' +
      '<th>Prix unitaire</th><th>Valeur immobilisée</th><th>Couverture du seuil</th>' +
    '</tr></thead><tbody><tr>' +
      '<td class="num">' + formatNombre(a.stock) + ' ' + echappe(a.unite) + '</td>' +
      '<td class="num">' + formatNombre(a.seuil) + '</td>' +
      '<td class="num">' + (a.max ? formatNombre(a.max) : '—') + '</td>' +
      '<td class="num">' + formatPrix2(a.prix) + '</td>' +
      '<td class="num">' + formatPrix(a.stock * a.prix) + '</td>' +
      '<td class="num">' + Math.round(a.stock / Math.max(a.seuil, 1) * 100) + ' %</td>' +
    '</tr></tbody></table>';

  if (a.dlc) {
    const j = joursRestants(a.dlc);
    html += '<h2 class="print-title">Traçabilité du lot</h2>' +
      '<table><tbody>' +
        '<tr><td style="width:38%">Date limite de consommation</td><td>' + formatDate(a.dlc) + '</td></tr>' +
        '<tr><td>Jours restants</td><td>' + (j >= 0 ? j + ' jours' : 'Dépassée de ' + Math.abs(j) + ' jours') + '</td></tr>' +
      '</tbody></table>';
  }

  if (mouvements.length) {
    html += '<h2 class="print-title">Historique récent des mouvements</h2>' +
      '<table><thead><tr>' +
        '<th>N°</th><th>Date</th><th>Type</th><th class="num">Qté</th><th>Motif</th><th>Opérateur</th>' +
      '</tr></thead><tbody>';

    mouvements.forEach(m => {
      html += '<tr>' +
        '<td class="ref">' + echappe(m.id) + '</td>' +
        '<td class="ref">' + formatDateHeure(m.date) + '</td>' +
        '<td>' + (m.type === 'entree' ? 'Entrée' : 'Sortie') + '</td>' +
        '<td class="num">' + (m.type === 'entree' ? '+' : '−') + formatNombre(m.qte) + '</td>' +
        '<td>' + echappe(m.motif) + '</td>' +
        '<td>' + echappe(m.operateur) + '</td>' +
      '</tr>';
    });

    html += '</tbody></table>';
  }

  html += signatures() + piedImpression();
  lancerImpression(html);
}

/* =========================================================
   17. SYNCHRONISATION DE L'INTERFACE
   ========================================================= */

function rendreRenduGlobal() {
  rendreKPIs();
  rendreDashAlertes();
  rendreDashMouvements();
  rendreArticles();
  rendreAlertes();
  rendreMouvements();
}

function rendreTout() {
  rendreRenduGlobal();
  if (vueActive === 'dashboard') rendreGraphiques();
}

/* =========================================================
   18. INITIALISATION
   ========================================================= */

function remplirFiltres() {
  const selCat = $('#filtreCategorie');
  if (selCat) {
    CATEGORIES.forEach(c => {
      const o = document.createElement('option');
      o.value = c.code;
      o.textContent = c.nom;
      selCat.appendChild(o);
    });
  }

  const selDep = $('#filtreDepot');
  if (selDep) {
    DEPOTS.forEach(d => {
      const o = document.createElement('option');
      o.value = d.code;
      o.textContent = d.nom + ' — ' + d.ville;
      selDep.appendChild(o);
    });
  }
}

function initNavigation() {
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => setVue(btn.dataset.vue));
  });
}

function initRechercheGlobale() {
  const champ = $('#globalSearch');
  if (!champ) return;

  champ.addEventListener('input', () => {
    const val = champ.value;
    const local = $('#articleSearch');
    if (local) local.value = val;

    if (val.trim().length > 0 && vueActive !== 'articles') {
      setVue('articles');
    }
    rendreArticles();
  });
}

function initFiltresArticles() {
  ['#articleSearch', '#filtreCategorie', '#filtreDepot', '#filtreStatut'].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener('input', rendreArticles);
    if (el && el.tagName === 'SELECT') el.addEventListener('change', rendreArticles);
  });
}

function initHorloge() {
  const maj = () => {
    const d = new Date();
    const lbl = $('#todayLabel');
    if (lbl) lbl.textContent = formatDateLongue(d);
    const sync = $('#syncTime');
    if (sync) sync.textContent = formatHeure(d);
  };
  maj();
  setInterval(maj, 60000);
}

function initRaccourcisClavier() {
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, select, textarea')) return;

    if (e.key === 'g' || e.key === 'G') {
      const ordre = ['dashboard', 'articles', 'alertes', 'mouvements', 'rapports'];
      const i = ordre.indexOf(vueActive);
      setVue(ordre[(i + 1) % ordre.length]);
    }
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      imprimerInventaire();
    }
  });
}

function init() {
  initAuth();              // ← en premier
  initGraphiquesDefauts();
  remplirFiltres();
  initNavigation();
  initRechercheGlobale();
  initFiltresArticles();
  initChipsAlertes();
  initFormulaireMouvement();
  initHorloge();
  initRaccourcisClavier();

  rendreRenduGlobal();

  if (session) {
    setTimeout(() => rendreGraphiques(), 80);
  }

  setTimeout(() => {
    if (!session) return;
    const nb = genererAlertes().filter(a => a.niveau === 'critique').length;
    if (nb > 0) {
      toast(
        nb + ' alerte' + (nb > 1 ? 's' : '') + ' critique' + (nb > 1 ? 's' : '') + ' nécessite' + (nb > 1 ? 'nt' : '') + ' votre attention.',
        { type: 'warn', titre: 'Surveillance des stocks' }
      );
    }
  }, 900);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}