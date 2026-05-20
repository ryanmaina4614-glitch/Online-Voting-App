import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Plus, Trash2, Camera, X, Check, Save, Loader2, AlertCircle, GripVertical } from 'lucide-react';
import { Candidate, ElectionStatus, Election, UserRole } from '../types';
import { uploadCandidatePhoto } from '../services/firebase';
import { getCorrectedStatus } from '../utils';

interface ElectionFormProps {
  initialData?: Election;
  onSubmit: (data: Partial<Election>) => Promise<void>;
  onCancel: () => void;
  userRole?: UserRole;
  institutionId?: string;
}

export default function ElectionForm({ initialData, onSubmit, onCancel, userRole, institutionId: propInstitutionId }: ElectionFormProps) {
  const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [institutionId, setInstitutionId] = useState(initialData?.institutionId || propInstitutionId || '');
  const [startDate, setStartDate] = useState(formatDateTimeLocal(initialData?.startDate));
  const [endDate, setEndDate] = useState(formatDateTimeLocal(initialData?.endDate));
  const [status, setStatus] = useState<ElectionStatus>(initialData?.status || ElectionStatus.UPCOMING);
  const [candidates, setCandidates] = useState<Partial<Candidate>[]>(initialData?.candidates || [
    { id: '1', name: '', bio: '', votesCount: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-set status based on dates
  useEffect(() => {
    if (startDate && endDate) {
      const correctStatus = getCorrectedStatus(new Date(startDate).toISOString(), new Date(endDate).toISOString());
      setStatus(correctStatus);
    }
  }, [startDate, endDate]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) errors.title = 'Election title is required';
    if (!institutionId.trim()) errors.institutionId = 'Institution ID is required';
    if (!startDate) errors.startDate = 'Start date required';
    if (!endDate) errors.endDate = 'End date required';

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        errors.endDate = 'End date must be after the start date';
      }
    }

    if (candidates.length < 1) {
      errors.candidates = 'At least one candidate is required';
    }

    candidates.forEach((c, idx) => {
      if (!c.name?.trim()) {
        errors[`candidate_${idx}_name`] = 'Candidate name is required';
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCandidate = () => {
    setCandidates([
      ...candidates,
      { id: Date.now().toString(), name: '', bio: '', votesCount: 0 }
    ]);
  };

  const handleRemoveCandidate = (index: number) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter((_, i) => i !== index));
      // Clean up errors for removed candidate
      const newErrors = { ...fieldErrors };
      delete newErrors[`candidate_${index}_name`];
      setFieldErrors(newErrors);
    }
  };

  const handleCandidateChange = (index: number, field: keyof Candidate, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = { ...newCandidates[index], [field]: value };
    setCandidates(newCandidates);
    if (field === 'name' && value.trim() && fieldErrors[`candidate_${index}_name`]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[`candidate_${index}_name`];
        return next;
      });
    }
  };

  const handlePhotoUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const url = await uploadCandidatePhoto(file);
      const newCandidates = [...candidates];
      newCandidates[index] = { ...newCandidates[index], photoUrl: url };
      setCandidates(newCandidates);
    } catch (error) {
      console.error('Photo upload failed', error);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        imageUrl,
        institutionId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status,
        candidates: candidates as Candidate[],
      });
    } catch (error) {
      console.error('Submit failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden mb-12"
    >
      <form onSubmit={handleSubmit} className="p-8 md:p-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              {initialData ? 'Edit Election' : 'Create New Election'}
            </h2>
            <p className="text-slate-500 font-medium">Set up your election details and candidates</p>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="p-3 bg-slate-50 text-slate-600 hover:text-slate-800 rounded-2xl transition-all border border-slate-200 hover:bg-slate-100 shadow-sm"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Election Title *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: '' }));
                }}
                required
                placeholder="e.g. School Council 2024"
                className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all focus:outline-none ${
                  fieldErrors.title ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-indigo-600'
                }`}
              />
              {fieldErrors.title && (
                <span className="text-xs text-red-500 font-bold mt-1.5 ml-2 block italic">{fieldErrors.title}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell voters about this election..."
                rows={4}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">
                Institution Code / Group ID *
                {userRole === UserRole.MANAGER && (
                  <span className="ml-2 text-[10px] text-indigo-500 normal-case font-bold bg-indigo-50 px-2 py-0.5 rounded-md">Fixed for your account</span>
                )}
              </label>
              <input 
                type="text" 
                value={institutionId}
                onChange={(e) => {
                  setInstitutionId(e.target.value);
                  if (fieldErrors.institutionId) setFieldErrors(prev => ({ ...prev, institutionId: '' }));
                }}
                required
                readOnly={userRole === UserRole.MANAGER}
                placeholder="e.g. SCHOOL_A"
                className={`w-full px-6 py-4 border rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all focus:outline-none ${
                  userRole === UserRole.MANAGER ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 
                  fieldErrors.institutionId ? 'bg-slate-50 border-red-500 focus:border-red-600' : 'bg-slate-50 border-slate-200 focus:border-indigo-600'
                }`}
              />
              {fieldErrors.institutionId && (
                <span className="text-xs text-red-500 font-bold mt-1.5 ml-2 block italic">{fieldErrors.institutionId}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Cover Image URL (Optional)</label>
              <input 
                type="url" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Start Date & Time *</label>
                <input 
                  type="datetime-local" 
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (fieldErrors.startDate) setFieldErrors(prev => ({ ...prev, startDate: '' }));
                  }}
                  required
                  className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all focus:outline-none ${
                    fieldErrors.startDate ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {fieldErrors.startDate && (
                  <span className="text-xs text-red-500 font-bold mt-1.5 ml-2 block italic">{fieldErrors.startDate}</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">End Date & Time *</label>
                <input 
                  type="datetime-local" 
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (fieldErrors.endDate) setFieldErrors(prev => ({ ...prev, endDate: '' }));
                  }}
                  required
                  className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all focus:outline-none ${
                    fieldErrors.endDate ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {fieldErrors.endDate && (
                  <span className="text-xs text-red-500 font-bold mt-1.5 ml-2 block italic">{fieldErrors.endDate}</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                Status
                <span className="text-[10px] text-indigo-500 normal-case font-bold bg-indigo-50 px-2 py-0.5 rounded-md">Automated by dates</span>
              </label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as ElectionStatus)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all appearance-none"
              >
                <option value={ElectionStatus.UPCOMING}>Upcoming</option>
                <option value={ElectionStatus.ACTIVE}>Active</option>
                <option value={ElectionStatus.COMPLETED}>Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-10 text-left">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Candidates Management</h3>
              {fieldErrors.candidates && (
                <span className="text-xs text-red-500 font-bold italic mt-1 block px-2">{fieldErrors.candidates}</span>
              )}
            </div>
            <button 
              type="button" 
              onClick={handleAddCandidate}
              className="px-6 py-2.5 bg-indigo-50 hover:bg-indigo-105 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Candidate
            </button>
          </div>

          <Reorder.Group 
            axis="y" 
            values={candidates} 
            onReorder={setCandidates}
            className="space-y-6"
          >
            <AnimatePresence initial={false}>
              {candidates.map((candidate, index) => (
                <Reorder.Item 
                  key={candidate.id} 
                  value={candidate}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 bg-slate-50 rounded-3xl border border-slate-200 relative group cursor-auto"
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-indigo-400 transition-colors">
                        <GripVertical className="w-6 h-6" />
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveCandidate(index)}
                        className="p-2 bg-white text-slate-500 hover:text-red-500 rounded-xl border border-slate-200 shadow-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-6 flex-1">
                      <div className="shrink-0">
                        <div className="relative w-24 h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden group/photo">
                          {candidate.photoUrl ? (
                            <img src={candidate.photoUrl} alt="candidate" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Camera className="w-8 h-8" />
                            </div>
                          )}
                          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer">
                            {uploadingIndex === index ? (
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                              <Plus className="w-6 h-6 text-white" />
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handlePhotoUpload(index, e)}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Candidate Name</label>
                          <input 
                            type="text" 
                            value={candidate.name}
                            onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                            placeholder="Full Name"
                            className={`w-full px-4 py-2 bg-white border rounded-xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-slate-700 ${
                              fieldErrors[`candidate_${index}_name`] ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-indigo-500'
                            }`}
                          />
                          {fieldErrors[`candidate_${index}_name`] && (
                            <span className="text-[9px] text-red-500 font-bold ml-1 mt-1 block">{fieldErrors[`candidate_${index}_name`]}</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Biography / Manifesto</label>
                          <textarea 
                            value={candidate.bio}
                            onChange={(e) => handleCandidateChange(index, 'bio', e.target.value)}
                            placeholder="Tell voters about this candidate's vision and manifesto..."
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all resize-none text-slate-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>

        <div className="mt-12 pt-10 border-t border-slate-100 flex gap-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] text-xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Save className="w-6 h-6" />
            )}
            Save Election
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-600 rounded-[2rem] text-xl font-black hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
