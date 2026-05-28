import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'sw' | 'lg' | 'fr';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
  regionalContext: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', regionalContext: 'International' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', regionalContext: 'East Africa / EAC' },
  { code: 'lg', name: 'Oluganda', flag: '🇺🇬', regionalContext: 'Buganda / Uganda' },
  { code: 'fr', name: 'Français', flag: '🇨🇩', regionalContext: 'Central / West Africa' }
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    appTitle: "VoteSecure",
    tagline: "Secure. Transparent. Inclusive.",
    educationLicense: "VoteSecure Systems • Education License",
    
    // Auth & Onboarding
    entranceCheckpoint: "System Entrance Checkpoint",
    emailAddress: "Email Address",
    password: "Password",
    signIn: "Secure Sign In",
    register: "Register Active Voter Profile",
    fullname: "First & Last Name",
    studentId: "Student / Registration ID",
    age: "Age (Security Demographics)",
    gender: "Gender Identity",
    classGroup: "Class / Grade Group",
    institutionId: "Institutional Security ID",
    passportPhoto: "Upload Passport Identity Photo",
    dragDropPhoto: "Drag and drop or click to upload security passport",
    fingerprintLogin: "Secure Bio-Fingerprint Verification",
    orWith: "or verify identity with",
    continueAsGuest: "Continue as Guest Observer",
    needAccount: "Need an institutional account?",
    alreadyRegistered: "Already registered with the ledger?",
    signUpNow: "Register Profile",
    signInNow: "Login to Account",
    submitting: "Verifying credentials...",
    male: "Male",
    female: "Female",
    other: "Other",

    // Layout Headers
    activeElection: "Active Election",
    themeLight: "Theme: Light Mode",
    themeDark: "Theme: Dark Mode",
    logoutButton: "Secure Logout",
    roleAdmin: "🔧 Admin",
    roleManager: "🛡️ Manager",
    roleVoter: "👤 Voter",
    roleGuest: "🌐 Observer",

    // Landing screen (Checkpoint integrity)
    welcomeCheckpoint: "Democratic Integrity Checkpoint",
    welcomeUser: "Welcome, {name}!",
    institutionCheckpoint: "You have verified entry into standard checkpoint of {institution}.",
    scrollingQuotes: "Pillars of Democratic Thought",
    regulationsTitle: "Strict Regulations & Ballot Code",
    allRulesConsent: "I have read, understood, and consent unconditionally to all safety regulations above.",
    enterDashboard: "Enter Polling & Ballot Center",
    integrityPledge: "By committing, you log an interactive pledge to sustain our democratic trust.",

    // Dashboard
    noActiveBallots: "No Active Ballot Records",
    noActiveBallotsDesc: "There are currently no institutional elections registered. Contact your school administrator to configure active ballots.",
    enterVotingBooth: "Enter Online Voting Booth",
    reviewManifesto: "Review Manifesto Records",
    syncToCalendar: "Sync to Google Calendar",
    syncSuccess: "Synced to Calendar Successfully",
    syncingCalendar: "Syncing with Workspace...",
    statistics: "Live Statistics",
    totalVotes: "Total Votes Cast",
    turnout: "Voter Turnout Rate",
    registeredVoters: "Registered Ballots Available",
    closingIn: "Closing in",
    startsIn: "Starts in",
    ended: "Elections Ended",
    candidatesTitle: "Contending Candidates",
    biography: "Biography Outline",
    campaignFeed: "Campaign Manifesto Feed",
    candidateDetails: "Candidate Presentation",
    audioManifesto: "Voice Guided Manifesto (Speech Mode)",
    videoManifesto: "Campaign Video Presentation",
    
    // Voting View
    castYourBallot: "Cast Your Sovereign Ballot",
    anonymousVoteWarning: "Your vote is cryptographically decoupled from your profile to maintain absolute client anonymity.",
    submittingVote: "Recording vote securely...",
    voteCastSuccess: "Ballot Cast Successfully",
    backToDashboard: "Return to Main Dashboard",
    selectCandidate: "Please select a candidate to record your vote",
    confirmVoteTitle: "Confirm Ballot Submission",
    confirmVoteDesc: "Are you certain you wish to cast your ballot for {candidate}? This action is immutable and cannot be undone.",
    cancel: "Cancel",
    confirm: "Confirm & Log",

    // Admin Dashboard / Management
    adminRoom: "Admin Central Bureau",
    createElection: "Deploy New Election Ballot",
    noElectionsYet: "No elections deployed yet.",
    electionCreatedSuccess: "Election deployed successfully on the ledger!",
    candidateName: "Candidate Name",
    candidateBio: "Short Bio",
    addCandidate: "Add Contender",
    saveElection: "Publish to Blockchain",
    title: "Election Title",
    startDateLabel: "Voting Commencement Date",
    endDateLabel: "Voting Termination Date",
    liveTurnoutAnalytics: "Dynamic Turnout & Outcome Statistics",
    exportData: "Export Comprehensive Spreadsheet Logs",
    systemAuditTrail: "Live Activity Audit Ledger"
  },
  sw: {
    appTitle: "KuraSalama",
    tagline: "Salama. Wazi. Shirikishi.",
    educationLicense: "KuraSalama • Leseni ya Kitaaluma",
    
    // Auth & Onboarding
    entranceCheckpoint: "Kituo cha Ukaguzi wa Kuingia",
    emailAddress: "Barua Pepe",
    password: "Nenosiri",
    signIn: "Ingia Salama",
    register: "Sajili Wasifu Shirikishi wa Kipiga Kura",
    fullname: "Majina Kamili",
    studentId: "Nambari ya Mwanafunzi / Usajili",
    age: "Umri (Demografia ya Usalama)",
    gender: "Jinsia",
    classGroup: "Darasa / Kikundi",
    institutionId: "Nambari ya Usalama ya Taasisi",
    passportPhoto: "Pakia Picha ya Kitambulisho",
    dragDropPhoto: "Buruta na uondoe au bonyeza ili kupakia kitambulisho",
    fingerprintLogin: "Uthibitisho Salama wa Alama ya Kidole",
    orWith: "au thibitisha utambulisho kwa",
    continueAsGuest: "Endelea kama Mwangalizi wa Wageni",
    needAccount: "Je, unahitaji akaunti ya taasisi?",
    alreadyRegistered: "Je, umesajiliwa tayari kwenye mfumo?",
    signUpNow: "Sajili Wasifu",
    signInNow: "Ingia kwenye Akaunti",
    submitting: "Inathibitisha vitambulisho...",
    male: "Mwanamume",
    female: "Mwanamke",
    other: "Nyingine",

    // Layout Headers
    activeElection: "Uchaguzi Amilifu",
    themeLight: "Mandhari: Nuru",
    themeDark: "Mandhari: Giza",
    logoutButton: "Ondoka kwa Usalama",
    roleAdmin: "🔧 Msimamizi",
    roleManager: "🛡️ Meneja",
    roleVoter: "👤 Mpiga Kura",
    roleGuest: "🌐 Mwangalizi",

    // Landing screen (Checkpoint integrity)
    welcomeCheckpoint: "Kituo cha Uaminifu wa Kidemokrasia",
    welcomeUser: "Karibu, {name}!",
    institutionCheckpoint: "Umethibitisha kuingia kwenye kituo cha ukaguzi cha {institution}.",
    scrollingQuotes: "Misingi ya Fikra za Kidemokrasia",
    regulationsTitle: "Kanuni Kali na Sheria za Kura",
    allRulesConsent: "Nimesoma, nikaelewa, na ninakubali bila masharti kanuni zote za usalama hapo juu.",
    enterDashboard: "Ingia Kituo cha Kupiga Kura",
    integrityPledge: "Kwa kujitolea, unaandika ahadi ya kulinda uaminifu wetu wa kidemokrasia.",

    // Dashboard
    noActiveBallots: "Hakuna Uchaguzi Amilifu",
    noActiveBallotsDesc: "Kwa sasa hakuna uchaguzi wa taasisi uliosajiliwa. Wasiliana na msimamizi wa shule yako ili kusanidi kura amilifu.",
    enterVotingBooth: "Ingia Kwenye Kibanda cha Kupigia Kura",
    reviewManifesto: "Kagua Wasifu na Ilani",
    syncToCalendar: "Sawazisha na Kalenda ya Google",
    syncSuccess: "Imesawazishwa kwa Kalenda kwa Mafanikio",
    syncingCalendar: "Inasawazisha na Eneo la Kazi...",
    statistics: "Takwimu za Moja kwa Moja",
    totalVotes: "Jumla ya Kura Zilizopigwa",
    turnout: "Kiwango cha Ushiriki wa Wapiga Kura",
    registeredVoters: "Kura Zilizosajiliwa Zinazopatikana",
    closingIn: "Inafunga baada ya",
    startsIn: "Inaanza baada ya",
    ended: "Uchaguzi Umekamilika",
    candidatesTitle: "Wagombea Wanaowania",
    biography: "Maelezo ya Wasifu",
    campaignFeed: "Mlisho wa Ilani ya Kampeni",
    candidateDetails: "Uwasilishaji wa Mgombea",
    audioManifesto: "Ilani ya Sauti (Njia ya Hotuba)",
    videoManifesto: "Uwasilishaji wa Video ya Kampeni",
    
    // Voting View
    castYourBallot: "Piga Kura Yako ya Enzi",
    anonymousVoteWarning: "Kura yako imejitenga kisiri na wasifu wako ili kuhakikisha usiri kamili wa mteja.",
    submittingVote: "Inarekodi kura kwa usalama...",
    voteCastSuccess: "Kura Imepigwa kwa Mafanikio",
    backToDashboard: "Rudi kwenye Dashibodi Kuu",
    selectCandidate: "Tafadhali chagua mgombea ili kurekodi kura yako",
    confirmVoteTitle: "Thibitisha Uwasilishaji wa Kura",
    confirmVoteDesc: "Je, una uhakika unataka kupigia kura {candidate}? Hatua hii haiwezi kubadilishwa.",
    cancel: "Ghairi",
    confirm: "Thibitisha na Uandikishe",

    // Admin Dashboard / Management
    adminRoom: "Ofisi Kuu ya Msimamizi",
    createElection: "Sambaza Uchaguzi Mpya",
    noElectionsYet: "Hakuna uchaguzi uliosambazwa bado.",
    electionCreatedSuccess: "Uchaguzi umefaulu kusajiliwa kwenye daftari ya kura!",
    candidateName: "Jina la Mgombea",
    candidateBio: "Wasifu Mfupi",
    addCandidate: "Ongeza Mgombea",
    saveElection: "Chapisha kwenye Mfumo",
    title: "Kichwa cha Uchaguzi",
    startDateLabel: "Tarehe ya Kuanza Kupiga Kura",
    endDateLabel: "Tarehe ya Kumalizika Kupiga Kura",
    liveTurnoutAnalytics: "Takwimu za Moja kwa Moja za Matokeo",
    exportData: "Hamisha Kumbukumbu Kamili",
    systemAuditTrail: "Daftari la Ukaguzi wa Shughuli za Moja kwa Moja"
  },
  lg: {
    appTitle: "VoteSecure-LG",
    tagline: "Ekyesigwa. Kyereere. Kyetoloddwa.",
    educationLicense: "VoteSecure • Layisensi y'Ebyenjigiriza",
    
    // Auth & Onboarding
    entranceCheckpoint: "W'ogereera Okuyingira",
    emailAddress: "E-mayili Ennawuluzi",
    password: "Ekirayiro / Passika",
    signIn: "Yingira Mu Mirembe",
    register: "Wandiisa Wasifu w'Akulonda",
    fullname: "Amanya G'onna",
    studentId: "Namba y'Omuyizi / Wandiisa",
    age: "Emyaka (Eby'okwerinda)",
    gender: "Ekikula ky'Omuntu",
    classGroup: "Ekibiina / Ekibiina eky'Enjawulo",
    institutionId: "Namba y'Ebyokwerinda ey'Ekitendero",
    passportPhoto: "Tekako Picha y'Ekitambulisho",
    dragDropPhoto: "Kanyula oba gyerako picha y'ekitambulisho ky'okwerinda",
    fingerprintLogin: "Okubugutululwa n'Ekinkumu ky'Obulamu",
    orWith: "oba kaseera ekinkumu kyo n'okwerinda ku",
    continueAsGuest: "Genda mu maaso ng'Omugeni Omulabi",
    needAccount: "Okozesa akawunti ya ssomero?",
    alreadyRegistered: "Omaze okugenda ku bitabo?",
    signUpNow: "Wandiika Wasifu Gwo",
    signInNow: "Yingira mu Kaunti",
    submitting: "Tukakasa eby'okwerinda...",
    male: "Musajja",
    female: "Mukazi",
    other: "Kitalo",

    // Layout Headers
    activeElection: "Okulonda Okuliwo",
    themeLight: "Enfuna: Kyerere",
    themeDark: "Enfuna: Kizikiza",
    logoutButton: "Ffukula mu Mirembe",
    roleAdmin: "🔧 Omukulu",
    roleManager: "🛡️ Maneja",
    roleVoter: "👤 Mukulonde",
    roleGuest: "🌐 Mulabi-mugenyi",

    // Landing screen (Checkpoint integrity)
    welcomeCheckpoint: "W'olondolera Enkola y'Obudemokulasi",
    welcomeUser: "Kulika, {name}!",
    institutionCheckpoint: "Omazenga okukakasa okuyingira kwennyini ku {institution}.",
    scrollingQuotes: "Emisingi gy'Endowooza Y'abantu",
    regulationsTitle: "Ekiragiro Ery'okwerinda & Ebiragiro By'okulonda",
    allRulesConsent: "Nkakasiddwa nti nsomye, ntegedde, era nzikirizza ebyokwerinda byonna ebyogeddwako waggulu.",
    enterDashboard: "Yingira Ew'okulondera N'ebitabo",
    integrityPledge: "Mu kukakasa kuno, owandiika ekirayiro ky'obumu bulungi bwaffe.",

    // Dashboard
    noActiveBallots: "Tewali Kulonda Kuliwo Gw'emuli",
    noActiveBallotsDesc: "Mu kaseera kano tewali kulonda kwona ku ssomero. Kwatagana n'omukulu w'essomero okutekateeka ebirala.",
    enterVotingBooth: "Yingira mu Kasolya k'Okulonderamo",
    reviewManifesto: "Soma ebifa ku Bakubi ddaala",
    syncToCalendar: "Kwataganyisa ne Kalenda ya Google",
    syncSuccess: "Okukwatagana ku Kalenda Kuwedde",
    syncingCalendar: "Tukwasaganya n'Olubiri Lwo...",
    statistics: "Obulondole obuliwo jjuuzi",
    totalVotes: "Obululu Bonna obukubiddwa",
    turnout: "Omuwendo gw'Abakunze okulonda",
    registeredVoters: "Abawandiise bonna abapoote",
    closingIn: "Ggalawo mu kaseera",
    startsIn: "Tandika mu kaseera",
    ended: "Okulonda Kuwedde n'Okkukomekerera",
    candidatesTitle: "Abesimyewo abapoote",
    biography: "Ebyafaayo by'Omuntu",
    campaignFeed: "Ebiruubirirwa n'Ebyokulonda Bye",
    candidateDetails: "Okubalaga Omuntu Waasoma",
    audioManifesto: "Ebyogerwa ku ddaala (Nga Birambikwa)",
    videoManifesto: "Vidiyo y'okukunga Abantu",
    
    // Voting View
    castYourBallot: "Kuba Akalulu Ko ak'Obusovereinyi",
    anonymousVoteWarning: "Akalulu ko kasunguddwa gye wasimbidda wasifu yo naddala kikuume obusajja bw'obwesigwa.",
    submittingVote: "Tukunguula akalulu ko mu mazinga...",
    voteCastSuccess: "Akalulu Gwo Okukubye mu Mirembe",
    backToDashboard: "Ddayo ku Lubiri Olukulu",
    selectCandidate: "Nsaba olonde omuntu gw'oyagala okukuba akalulu",
    confirmVoteTitle: "Kakasa Okukuba Akalulu Ko",
    confirmVoteDesc: "Muli mukakafu nti mweyagadde okukuubira {candidate} akalulu? Kino tewali kukyusa nate.",
    cancel: "Ggulawo",
    confirm: "Kakasa & Tekako",

    // Admin Dashboard / Management
    adminRoom: "Aw'okusala ebirowoozo by'Omukulu",
    createElection: "Tekaho Okulonda Okupya",
    noElectionsYet: "Tewali kulonda kuwedde nate okuleetwa.",
    electionCreatedSuccess: "Okulonda okupya kutekeddwa ku mulimu gw'ebitabo!",
    candidateName: "Amanya g'Omwesimyiwo",
    candidateBio: "Ebyafaayo mubimpimpi",
    addCandidate: "Tekaho Omuvuganyi",
    saveElection: "Kifuule Kirambike ku nkola",
    title: "Kichwa ky'Okulonda",
    startDateLabel: "Olunaku lw'Okutandikako",
    endDateLabel: "Olunaku lw'Okuggalako",
    liveTurnoutAnalytics: "Obungi n'Enkolagana y'Obululu",
    exportData: "Ggyamu Ebitabo Biri Byonna",
    systemAuditTrail: "Ledger y'Ebyakolebwa Bonna"
  },
  fr: {
    appTitle: "VoteSecure-FR",
    tagline: "Sécurisé. Transparent. Inclusif.",
    educationLicense: "VoteSecure • Licence Éducationnelle",
    
    // Auth & Onboarding
    entranceCheckpoint: "Point de Contrôle de l'Entrée",
    emailAddress: "Adresse E-mail",
    password: "Mot de Passe",
    signIn: "Connexion Sécurisée",
    register: "Enregistrer un Profil d'Électeur Actif",
    fullname: "Nom Complet",
    studentId: "Numéro de Carte d'Étudiant / Enregistrement",
    age: "Âge (Données Démographiques de Sécurité)",
    gender: "Identité de Genre",
    classGroup: "Classe / Groupe de Niveau",
    institutionId: "ID d'Identité Institutionnelle",
    passportPhoto: "Charger la Photo d'Identité Passeport",
    dragDropPhoto: "Glissez-déposez ou cliquez pour charger votre passeport de sécurité",
    fingerprintLogin: "Vérification Salivatrice & Biométrique Faciale",
    orWith: "ou vérifiez votre identité avec",
    continueAsGuest: "Continuer comme Observateur Invité",
    needAccount: "Besoin d'un compte de l'établissement ?",
    alreadyRegistered: "Déjà inscrit sur le registre ?",
    signUpNow: "Créer un Profil",
    signInNow: "Se Connecter",
    submitting: "Vérification des identifiants...",
    male: "Homme",
    female: "Femme",
    other: "Autre",

    // Layout Headers
    activeElection: "Élection Active",
    themeLight: "Thème: Mode Clair",
    themeDark: "Thème: Mode Sombre",
    logoutButton: "Déconnexion Sécurisée",
    roleAdmin: "🔧 Admin",
    roleManager: "🛡️ Gestionnaire",
    roleVoter: "👤 Électeur",
    roleGuest: "🌐 Observateur",

    // Landing screen (Checkpoint integrity)
    welcomeCheckpoint: "Point de Contrôle de l'Intégrité Démocratique",
    welcomeUser: "Bienvenue, {name} !",
    institutionCheckpoint: "Vous avez validé l'entrée dans le point de contrôle standard de {institution}.",
    scrollingQuotes: "Piliers de la Pensée Démocratique",
    regulationsTitle: "Réglementations Strictes & Code de Vote",
    allRulesConsent: "J'ai lu, compris et consenti sans condition à tous les règlements de sécurité ci-dessus.",
    enterDashboard: "Entrer dans le Centre de Vote",
    integrityPledge: "En vous engageant, vous signez une promesse de soutien de notre confiance démocratique.",

    // Dashboard
    noActiveBallots: "Aucun Scrutin Actif",
    noActiveBallotsDesc: "Il n'y a actuellement aucune élection institutionnelle enregistrée. Contactez l'administrateur de l'école pour configurer les scrutins.",
    enterVotingBooth: "Entrer dans l'Isoloir en Ligne",
    reviewManifesto: "Consulter la Profession de Foi",
    syncToCalendar: "Synchroniser avec Google Calendar",
    syncSuccess: "Synchronisé avec le Calendrier avec Succès",
    syncingCalendar: "Synchronisation avec l'Espace de Travail...",
    statistics: "Statistiques en Temps Réel",
    totalVotes: "Nombre Total de Votes",
    turnout: "Taux de Participation Électorale",
    registeredVoters: "Bulletins Enregistrés Disponibles",
    closingIn: "Clôture dans",
    startsIn: "Début dans",
    ended: "Scrutins Clôturés",
    candidatesTitle: "Candidats en Lice",
    biography: "Aperçu Biographique",
    campaignFeed: "Flux de Campagne et Profession de Foi",
    candidateDetails: "Présentation des Candidats",
    audioManifesto: "Manifeste Parlé (Mode Vocal)",
    videoManifesto: "Présentation Vidéo de Campagne",
    
    // Voting View
    castYourBallot: "Déposez votre Scrutin Souverain",
    anonymousVoteWarning: "Votre vote est cryptographiquement découplé de votre profil afin d'assurer l'anonymat complet des votants.",
    submittingVote: "Enregistrement sécurisé du vote...",
    voteCastSuccess: "Bulletin Déposé avec Succès",
    backToDashboard: "Retourner au Tableau de Bord Principal",
    selectCandidate: "Veuillez sélectionner un candidat pour enregistrer votre vote",
    confirmVoteTitle: "Confirmer la Soumission du Bulletin",
    confirmVoteDesc: "Êtes-vous certain de vouloir voter pour {candidate} ? Cette action est irréversible et ne peut être annulée.",
    cancel: "Annuler",
    confirm: "Confirmer et Enregistrer",

    // Admin Dashboard / Management
    adminRoom: "Bureau Central d'Administration",
    createElection: "Déployer un Nouveau Scrutin Électoral",
    noElectionsYet: "Aucun scrutin déployé pour le moment.",
    electionCreatedSuccess: "Scrutin déployé avec succès sur le registre !",
    candidateName: "Nom du Candidat",
    candidateBio: "Biographie Courte",
    addCandidate: "Ajouter un Candidat",
    saveElection: "Publier dans le Système",
    title: "Titre de l'Élection",
    startDateLabel: "Date de Commencement",
    endDateLabel: "Date de Clôture",
    liveTurnoutAnalytics: "Statistiques et Graphiques de Participation",
    exportData: "Exporter les Journaux Particuliers",
    systemAuditTrail: "Registre Électoral de Sécurité"
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('votesecure_language');
    if (saved === 'en' || saved === 'sw' || saved === 'lg' || saved === 'fr') {
      return saved as Language;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('votesecure_language', lang);
    const html = document.documentElement;
    html.setAttribute('lang', lang);
  };

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', language);
  }, [language]);

  const t = (key: string, replacements?: Record<string, string>): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    let val = langDict[key] || TRANSLATIONS['en'][key] || key;
    
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, v);
      });
    }
    return val;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};
