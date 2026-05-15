import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Camera, X, Check, Save, Loader2, AlertCircle } from 'lucide-react';
import { Candidate, ElectionStatus, Election } from '../types';
import { uploadCandidatePhoto } from '../services/firebase';

interface ElectionFormProps {
  initialData?: Election;
  onSubmit: (data: Partial<Election>) => Promise<void>;
  onCancel: () => void;
}

export default function ElectionForm({ initialData, onSubmit, onCancel }: ElectionFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startDate, setStartDate] = useState(initialData?.startDate.split('T')[0] || '');
  const [endDate, setEndDate] = useState(initialData?.endDate.split('T')[0] || '');
  const [status, setStatus] = useState<ElectionStatus>(initialData?.status || ElectionStatus.UPCOMING);
  const [candidates, setCandidates] = useState<Partial<Candidate>[]>(initialData?.candidates || [
    { id: '1', name: '', bio: '', votesCount: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleAddCandidate = () => {
    setCandidates([
      ...candidates,
      { id: Date.now().toString(), name: '', bio: '', votesCount: 0 }
    ]);
  };

  const handleRemoveCandidate = (index: number) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const handleCandidateChange = (index: number, field: keyof Candidate, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = { ...newCandidates[index], [field]: value };
    setCandidates(newCandidates);
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
      alert('Failed to upload photo');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      alert('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status,
        candidates: candidates as Candidate[],
      });
    } catch (error) {
      console.error('Submit failed', error);
      alert('Failed to save election');
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
            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
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
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. School Council 2024"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all"
              />
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
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Start Date *</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">End Date *</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
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
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Candidates Management</h3>
            <button 
              type="button" 
              onClick={handleAddCandidate}
              className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Candidate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {candidates.map((candidate, index) => (
                <motion.div 
                  key={candidate.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 bg-slate-50 rounded-3xl border border-slate-200 relative group"
                >
                  <button 
                    type="button"
                    onClick={() => handleRemoveCandidate(index)}
                    className="absolute -top-3 -right-3 p-2 bg-white text-slate-400 hover:text-red-500 rounded-full border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex gap-6">
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
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Biography / Manifesto</label>
                        <textarea 
                          value={candidate.bio}
                          onChange={(e) => handleCandidateChange(index, 'bio', e.target.value)}
                          placeholder="Tell voters about this candidate's vision and manifesto..."
                          rows={4}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all resize-none text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
