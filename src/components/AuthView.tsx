import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Shield, Lock, LogIn, UserPlus, Mail, Key, User, Calendar, BookOpen, Users, Camera, Upload, Fingerprint } from 'lucide-react';
import { AppUser } from '../types';
import { useI18n } from '../utils/i18n';
// @ts-ignore
import logoImg from '../assets/images/votesecure_ballot_logo_1779949386444.png';
import { getBiometricProfiles, enrollBiometrics, BiometricProfile } from '../utils/biometrics';
import BiometricScanner from './BiometricScanner';

interface AuthViewProps {
  onGoogleLogin: () => void;
  onEmailLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (data: any) => Promise<void>;
  onUpdateProfile?: (data: any) => Promise<void>;
  onContinueAsGuest?: () => void;
  initialData?: Partial<AppUser>;
  viewMode?: 'auth' | 'complete-profile';
  loading?: boolean;
}

export default function AuthView({ 
  onGoogleLogin, 
  onEmailLogin, 
  onRegister, 
  onUpdateProfile,
  onContinueAsGuest,
  initialData,
  viewMode = 'auth',
  loading 
}: AuthViewProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'register' | 'complete-profile'>(

    viewMode === 'complete-profile' ? 'complete-profile' : 'login'
  );
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [studentId, setStudentId] = useState(initialData?.studentId || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [gender, setGender] = useState(initialData?.gender || '');
  const [classGroup, setClassGroup] = useState(initialData?.classGroup || '');
  const [institutionId, setInstitutionId] = useState(initialData?.institutionId || '');
  const [role, setRole] = useState<'voter' | 'manager'>(
    initialData?.role === 'manager' ? 'manager' : 'voter'
  );
  const [talkbackEnabled, setTalkbackEnabled] = useState(
    initialData?.talkbackEnabled || 
    (typeof window !== 'undefined' && localStorage.getItem('guest_talkback') === 'true') || 
    false
  );
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Biometric states
  const [biometricEnrollOn, setBiometricEnrollOn] = useState(true);
  const [showBiometricScanner, setShowBiometricScanner] = useState<boolean>(false);
  const [biometricProfiles, setBiometricProfiles] = useState<BiometricProfile[]>(() => getBiometricProfiles());
  
  const handlePhotoFile = (file: File) => {
    setPassportFile(file);
    if (fieldErrors.passportFile) {
      setFieldErrors(prev => ({ ...prev, passportFile: '' }));
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPassportPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };


  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (mode !== 'complete-profile') {
      if (!email) errors.email = 'Email is required';
      if (!password) errors.password = 'Password is required';
      else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register' || mode === 'complete-profile') {
      if (!displayName) errors.displayName = 'Full name is required';
      if (!studentId) errors.studentId = 'Student / Member ID is required';
      if (!age) errors.age = 'Age is required';
      if (!gender) errors.gender = 'Selection required';
      if (!classGroup) errors.classGroup = 'Class/Group is required';
      if (!institutionId) errors.institutionId = 'Institution ID is required';
      
      // Passport photo check - satisfied if they either uploaded file, have existing URL, or selected an auto-filled URL
      if (!passportFile && !initialData?.passportPhotoUrl && !passportPreview) {
        errors.passportFile = 'A passport-sized photograph is required for identity verification';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBiometricSuccess = async (profile?: BiometricProfile, decryptedPassword?: string) => {
    setShowBiometricScanner(false);
    if (mode === 'register') {
      setError('');
      try {
        await onRegister({
          email,
          password,
          displayName,
          studentId,
          age: Number(age),
          gender,
          classGroup,
          institutionId,
          passportFile,
          passportPhotoUrl: passportPreview.startsWith('http') ? passportPreview : undefined,
          role,
          talkbackEnabled,
        });
      } catch (err: any) {
        setError(err.message || 'Registration failed after biometric enrollment. Please try again.');
      }
      return;
    }

    if (profile && decryptedPassword) {
      setError('');
      try {
        await onEmailLogin(profile.email, decryptedPassword);
      } catch (err: any) {
        setError(err.message || 'Biometric authentication failed. Please sign in normally.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    try {
      if (mode === 'login') {
        await onEmailLogin(email, password);
      } else if (mode === 'register') {
        if (biometricEnrollOn) {
          // Open scanner first to register the physical footprint pattern
          setShowBiometricScanner(true);
          return;
        }
        await onRegister({
          email,
          password,
          displayName,
          studentId,
          age: Number(age),
          gender,
          classGroup,
          institutionId,
          passportFile,
          passportPhotoUrl: passportPreview.startsWith('http') ? passportPreview : undefined,
          role,
          talkbackEnabled,
        });
      } else if (mode === 'complete-profile' && onUpdateProfile) {
        await onUpdateProfile({
          displayName,
          studentId,
          age: Number(age),
          gender,
          classGroup,
          institutionId,
          passportFile,
          passportPhotoUrl: passportPreview.startsWith('http') ? passportPreview : undefined,
          role,
          talkbackEnabled,
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-100 rounded-[3rem] shadow-[16px_16px_32px_#cbd5e1,-16px_-16px_32px_#ffffff] border-4 border-white/60 p-8 md:p-10 flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff] mb-6 transform -rotate-3 border border-white overflow-hidden p-2">
          <img 
            src={logoImg} 
            alt="VoteSecure Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <h2 className="text-3xl font-display font-black text-slate-800 tracking-tight mb-2">
          {mode === 'login' ? t('welcomeCheckpoint') : mode === 'register' ? t('register') : t('entranceCheckpoint')}
        </h2>
        <p className="text-slate-500 font-extrabold mb-8 leading-relaxed text-[11px] text-center uppercase tracking-widest bg-slate-200/50 px-3.5 py-1 rounded-full border border-slate-300/30">
          {mode === 'login' 
            ? t('tagline') 
            : mode === 'register'
            ? t('register')
            : t('entranceCheckpoint')}
        </p>

        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {(mode === 'register' || mode === 'complete-profile') && (
            <div className="space-y-4">
              {/* Role Segment Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block ml-1">
                  I am registering as:
                </label>
                <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1.5 shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setRole('voter')}
                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                      role === 'voter' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <User className="w-4 h-4" /> Voter Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                      role === 'manager' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Shield className="w-4 h-4" /> Manager Account
                  </button>
                </div>
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder={t('fullname')}
                  required
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (fieldErrors.displayName) setFieldErrors(prev => ({ ...prev, displayName: '' }));
                  }}
                  className={`w-full pl-12 pr-4 py-4 neu-input rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600 transition-all ${
                    fieldErrors.displayName ? 'border-red-500' : 'border-slate-200/40 focus:border-indigo-600'
                  }`}
                />
                {fieldErrors.displayName && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1 block">
                    {fieldErrors.displayName}
                  </span>
                )}
              </div>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={t('studentId')}
                  required
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    if (fieldErrors.studentId) setFieldErrors(prev => ({ ...prev, studentId: '' }));
                  }}
                  className={`w-full pl-12 pr-4 py-4 neu-input rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600 transition-all ${
                    fieldErrors.studentId ? 'border-red-500' : 'border-slate-200/40 focus:border-indigo-600'
                  }`}
                />
                {fieldErrors.studentId && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1 block">
                    {fieldErrors.studentId}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number"
                    placeholder="Age"
                    required
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (fieldErrors.age) setFieldErrors(prev => ({ ...prev, age: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-3.5 neu-input rounded-xl font-black focus:outline-none focus:border-indigo-600 transition-all text-sm ${
                      fieldErrors.age ? 'border-red-500' : 'border-slate-200/40 focus:border-indigo-600'
                    }`}
                  />
                  {fieldErrors.age && (
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1 block">
                      {fieldErrors.age}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={gender}
                    onChange={(e) => {
                       setGender(e.target.value);
                       if (fieldErrors.gender) setFieldErrors(prev => ({ ...prev, gender: '' }));
                    }}
                    required
                    className={`w-full pl-10 pr-4 py-3.5 neu-input rounded-xl font-black focus:outline-none focus:border-indigo-600 transition-all text-sm appearance-none ${
                       fieldErrors.gender ? 'border-red-500' : 'border-slate-200/40 focus:border-indigo-600'
                    }`}
                  >
                    <option value="">{t('gender')}</option>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                  {fieldErrors.gender && (
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1 block">
                      {fieldErrors.gender}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder={t('classGroup')}
                  required
                  value={classGroup}
                  onChange={(e) => {
                    setClassGroup(e.target.value);
                    if (fieldErrors.classGroup) setFieldErrors(prev => ({ ...prev, classGroup: '' }));
                  }}
                  className={`w-full pl-12 pr-4 py-4 neu-input rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600 transition-all ${
                    fieldErrors.classGroup ? 'border-red-500' : 'border-slate-200/40 focus:border-indigo-600'
                  }`}
                />
                {fieldErrors.classGroup && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1 block">
                    {fieldErrors.classGroup}
                  </span>
                )}
              </div>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder={t('institutionId')}
                  required
                  value={institutionId}
                  onChange={(e) => {
                    setInstitutionId(e.target.value);
                    if (fieldErrors.institutionId) setFieldErrors(prev => ({ ...prev, institutionId: '' }));
                  }}
                  className={`w-full pl-12 pr-4 py-4 neu-input rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600 transition-all ${
                    fieldErrors.institutionId ? 'border-red-500' : 'border-slate-200/40 focus:border-indigo-600'
                  }`}
                />
                {fieldErrors.institutionId && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1 block">
                    {fieldErrors.institutionId}
                  </span>
                )}
              </div>

              {/* Passport Photo Upload Dragzone */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block ml-1 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600 animate-pulse" />
                  {t('passportPhoto')} <span className="text-red-500">*</span>
                </label>

                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const files = e.dataTransfer.files;
                    if (files && files[0]) {
                      handlePhotoFile(files[0]);
                    }
                  }}
                  className={`border-4 border-slate-200/50 rounded-[2rem] p-5 text-center transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[140px] shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] ${
                    dragActive ? 'bg-indigo-50/25 border-indigo-400' : 'bg-slate-100 hover:bg-slate-50/30'
                  }`}
                >
                  {passportPreview || initialData?.passportPhotoUrl ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white bg-slate-100 shadow-[inset_2px_2px_5px_#cbd5e1,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center group">
                        <img 
                          src={passportPreview || initialData?.passportPhotoUrl} 
                          className="w-full h-full object-cover" 
                          alt="Passport Sized Photograph"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-emerald-600">Photo Verified & Loaded</span>
                        <span className="text-[9px] text-slate-400 font-bold block">Drag or Click to replace</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 shadow-[2px_2px_5px_#cbd5e1,-2px_-2px_5px_#ffffff] flex items-center justify-center mb-2.5 border border-white text-indigo-600">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-slate-500 leading-normal font-bold">
                        <span className="font-extrabold text-indigo-600 hover:underline">Click to upload</span> or drag image here<br/>
                        <span className="text-[9px] text-slate-400">Standard passport photo format</span>
                      </div>
                    </div>
                  )}

                  <input 
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files[0]) {
                        handlePhotoFile(files[0]);
                      }
                    }}
                  />
                </div>

                {fieldErrors.passportFile && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1 block">
                    {fieldErrors.passportFile}
                  </span>
                )}
              </div>

            </div>
          )}

          {mode !== 'complete-profile' && (
            <>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email"
                  placeholder={t('emailAddress')}
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`w-full pl-12 pr-4 py-4 neu-input rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600 transition-all ${
                    fieldErrors.email ? 'border-red-500 font-black' : 'border-slate-200/40 focus:border-indigo-600'
                  }`}
                />
                {fieldErrors.email && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1 block">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className={`w-full pl-12 pr-4 py-4 neu-input rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600 transition-all ${
                    fieldErrors.password ? 'border-red-500 font-black' : 'border-slate-200/40 focus:border-indigo-600'
                  }`}
                />
                {fieldErrors.password && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1 block">
                    {fieldErrors.password}
                  </span>
                )}
              </div>
            </>
          )}

          {mode === 'register' && (
            <div className="flex items-start gap-3 p-4 bg-slate-200/50 border border-slate-300/20 rounded-2xl">
              <input 
                type="checkbox" 
                id="biometricEnrollOn"
                checked={biometricEnrollOn}
                onChange={(e) => setBiometricEnrollOn(e.target.checked)}
                className="mt-1 w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="biometricEnrollOn" className="text-[11px] font-bold text-slate-600 leading-snug cursor-pointer select-none">
                🧬 Enroll Biometrics (TouchID / FaceID)
                <span className="block text-[9px] font-semibold text-slate-400 mt-0.5">Enable secure 1-click biometric sign-in on this device</span>
              </label>
            </div>
          )}

          {(mode === 'register' || mode === 'complete-profile') && (
            <div className="flex items-start gap-3 p-4 bg-indigo-50/50 border border-indigo-200/50 rounded-2xl text-left">
              <input 
                type="checkbox" 
                id="talkbackEnabled"
                checked={talkbackEnabled}
                onChange={(e) => setTalkbackEnabled(e.target.checked)}
                className="mt-1 w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-550 cursor-pointer"
              />
              <label htmlFor="talkbackEnabled" className="text-[11px] font-extrabold text-slate-700 leading-snug cursor-pointer select-none">
                🔊 Enable Voice Assistance (Talkback)
                <span className="block text-[9px] font-semibold text-indigo-600/70 mt-0.5">Enables audio feedback, announcements, and hover narration for voters with visual impairments.</span>
              </label>
            </div>
          )}

          {mode === 'login' && biometricProfiles.length > 0 && (
            <button 
              type="button"
              onClick={() => {
                if (!email && biometricProfiles.length > 0) {
                  setEmail(biometricProfiles[0].email);
                }
                setShowBiometricScanner(true);
              }}
              className="w-full py-4 bg-white hover:bg-slate-50 border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
            >
              <Fingerprint className="w-5 h-5 text-indigo-500 animate-pulse" />
              {t('fingerprintLogin')}
            </button>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              mode === 'login' ? <LogIn className="w-5 h-5" /> : mode === 'register' ? <UserPlus className="w-5 h-5" /> : <Lock className="w-5 h-5" />
            )}
            {mode === 'login' ? t('signIn') : mode === 'register' ? t('register') : t('entranceCheckpoint')}
          </button>
        </form>

        {mode !== 'complete-profile' && (
          <>
            <div className="relative w-full my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/60"></div>
              </div>
              <div className="relative flex justify-center text-xs font-black uppercase tracking-widest text-slate-400">
                <span className="px-4 bg-slate-100">{t('orWith')}</span>
              </div>
            </div>

            <button 
              onClick={onGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black text-slate-700 hover:text-indigo-600 neu-button disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Google Account
            </button>



            {onContinueAsGuest && (
              <>
                <div className="relative w-full my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/60"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    <span className="px-4 bg-slate-100 flex items-center gap-1 font-extrabold text-[9px]">📖 {t('roleGuest')}</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={onContinueAsGuest}
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-700 hover:text-emerald-600 neu-button active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" /> {t('continueAsGuest')}
                </button>
              </>
            )}

            <p className="mt-8 text-sm font-extrabold text-slate-500">
              {mode === 'login' ? t('needAccount') : t('alreadyRegistered')}{' '}
              <button 
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="text-indigo-600 hover:underline font-black"
              >
                {mode === 'login' ? t('signUpNow') : t('signInNow')}
              </button>
            </p>
          </>
        )}

        <div className="mt-10 grid grid-cols-2 gap-4 w-full border-t border-slate-50 pt-8 opacity-60">
          <div className="flex flex-col items-center gap-1">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Encrypted</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Lock className="w-4 h-4 text-blue-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Anonymous</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showBiometricScanner && (
          <BiometricScanner
            mode={mode === 'register' ? 'enroll' : 'login'}
            enrolledProfiles={biometricProfiles}
            enrollEmail={email}
            enrollPassword={password}
            enrollDisplayName={displayName}
            onCancel={() => setShowBiometricScanner(false)}
            onSuccess={handleBiometricSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

