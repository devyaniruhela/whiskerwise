'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Image from 'next/image';
import { Upload, Check, AlertCircle, Loader2, X, Plus, Cat, ChevronDown, Lightbulb, Edit2 } from 'lucide-react';
import { CAT_AVATARS, BODY_CONDITIONS, HEALTH_CONDITIONS } from '@/constants/cat-data';
import type { CatProfile, QCState } from '@/types';
import { validateImageClient } from '@/lib/imageValidation';

interface UploadZoneProps {
  label: string;
  hint: string;
  zoneKey: 'front' | 'back';
  state: QCState;
  imageSrc: string | null;
  onFileSelect: (file: File, clientError?: string) => void;
  onRemove: () => void;
  errorMsg?: string;
}

function UploadZone({ label, hint, zoneKey, state, imageSrc, onFileSelect, onRemove, errorMsg }: UploadZoneProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const clientResult = validateImageClient(file);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[QC ${zoneKey}] Client validation:`, clientResult.valid ? 'pass' : 'fail', clientResult.valid ? undefined : clientResult.error);
    }
    if (!clientResult.valid) {
      onFileSelect(file, clientResult.error);
      return;
    }
    onFileSelect(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2 flex flex-col h-full">
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      
      <div 
        className={`
          relative rounded-2xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer flex-1 flex items-center justify-center min-h-[200px]
          ${state === 'empty' ? 'border-emerald-200 bg-white hover:border-primary-500 hover:bg-emerald-50' : ''}
          ${state === 'uploading' || state === 'checking' ? 'border-emerald-300 bg-emerald-50' : ''}
          ${state === 'pass' ? 'border-primary-500 bg-primary-50 shadow-[0_0_0_4px_rgba(108,178,87,0.1)]' : ''}
          ${state === 'fail' ? 'border-red-500 bg-red-50 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]' : ''}
        `}
        onClick={() => document.getElementById(`input-${zoneKey}`)?.click()}
      >
        <input
          type="file"
          id={`input-${zoneKey}`}
          accept=".jpg,.jpeg,.png,.heic,.webp,image/jpeg,image/png,image/heic,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        
        <div className="w-full">
          {state === 'empty' && (
            <div className="flex flex-col items-center text-center">
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
              <span className="text-sm text-gray-600">Tap to upload or drag image</span>
            </div>
          )}
          
          {(state === 'uploading' || state === 'checking') && (
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
              <span className="text-sm text-gray-600">Checking...</span>
            </div>
          )}
          
          {(state === 'pass' || state === 'fail' || state === 'uploading' || state === 'checking') && imageSrc && (
            <div className="relative">
              <img src={imageSrc} alt={label} className="w-full h-32 object-cover rounded-lg" />
              {/* Remove button - smaller and at corner */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-1 right-1 w-5 h-5 bg-white hover:bg-red-50 rounded-full flex items-center justify-center border border-gray-300 hover:border-red-500 shadow-sm transition-all duration-200 z-10"
                type="button"
              >
                <X className="w-3 h-3 text-gray-600 hover:text-red-600" />
              </button>
            </div>
          )}
          
          {state === 'pass' && (
            <p className="text-sm text-primary-600 font-medium mt-3 text-center inline-flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 text-primary-600" aria-hidden /> Ready
            </p>
          )}
          
          {state === 'fail' && errorMsg && (
            <div className="mt-3">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 text-left">{errorMsg}</p>
              </div>
              <button 
                type="button"
                className="w-full px-4 py-2 text-sm bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                Upload again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FoodInputPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPersonalizedFlow = searchParams.get('personalize') === 'true';
  
  const [name, setName] = useState('');
  const [hasSpecialNeeds, setHasSpecialNeeds] = useState(false);
  const [showCatPanel, setShowCatPanel] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showInlineCatForm, setShowInlineCatForm] = useState(false);
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [personalizationError, setPersonalizationError] = useState('');
  const [currentCat, setCurrentCat] = useState<Partial<CatProfile>>({
    name: '',
    avatar: CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id,
    ageYears: 0,
    ageMonths: 0,
    bodyCondition: '',
    healthConditions: [],
    otherHealthDesc: '',
    selected: true,
  });
  
  const [frontState, setFrontState] = useState<QCState>('empty');
  const [backState, setBackState] = useState<QCState>('empty');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontError, setFrontError] = useState('');
  const [backError, setBackError] = useState('');

  // Retain user & cat details within session: load from storage when profile/input is opened
  const preselectCatId = searchParams.get('preselectCat');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedUser = localStorage.getItem('ww_userProfile');
      const storedUserName = localStorage.getItem('ww_userName');
      const storedCats = localStorage.getItem('ww_cats');
      let initialName = '';
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as { firstName?: string };
        if (parsed.firstName?.trim()) initialName = parsed.firstName.trim();
      }
      if (!initialName && storedUserName?.trim()) initialName = storedUserName.trim();
      if (initialName) setName(initialName);
      if (storedCats) {
        const parsed = JSON.parse(storedCats) as CatProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const withSelection = preselectCatId
            ? parsed.map((c) => ({ ...c, selected: c.id === preselectCatId }))
            : parsed.map((c) => ({ ...c, selected: c.selected !== false }));
          setCats(withSelection);
        }
      }
    } catch (_) {
      // ignore parse errors
    }
  }, [preselectCatId]);

  const handleFileSelect = async (zoneKey: 'front' | 'back', file: File, clientError?: string) => {
    const setState = zoneKey === 'front' ? setFrontState : setBackState;
    const setImage = zoneKey === 'front' ? setFrontImage : setBackImage;
    const setError = zoneKey === 'front' ? setFrontError : setBackError;

    if (!file?.name) {
      setState('empty');
      setImage(null);
      setError('');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      setError('');

      if (clientError) {
        setState('fail');
        setError(`Error: ${clientError}`);
        return;
      }

      setState('checking');
      const formData = new FormData();
      formData.append('image', file);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[QC ${zoneKey}] Server validation: calling /api/validate-image...`);
      }
      try {
        const res = await fetch('/api/validate-image', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (process.env.NODE_ENV === 'development') {
          console.log(`[QC ${zoneKey}] Server response:`, data.valid ? 'pass' : 'fail', data);
        }
        if (data.valid) {
          setState('pass');
          setError('');
        } else {
          setState('fail');
          setError(data.error ? `Error: ${data.error}` : 'Image validation failed.');
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[QC ${zoneKey}] Server validation error:`, err);
        }
        setState('fail');
        setError('Error: Could not validate image. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddAnotherCat = () => {
    if (!currentCat.name || !currentCat.bodyCondition || (currentCat.healthConditions || []).length === 0) {
      alert('Please complete all required fields for the current cat');
      return;
    }
    
    // Validate age - at least one must be non-zero
    if ((currentCat.ageYears || 0) === 0 && (currentCat.ageMonths || 0) === 0) {
      alert('Please specify your cat\'s age (at least months if years is 0)');
      return;
    }
    
    // Validate "Other" description
    if (currentCat.healthConditions?.includes('Other (please describe)') && !currentCat.otherHealthDesc?.trim()) {
      alert('Please describe the other health conditions');
      return;
    }
    
    const newCat: CatProfile = {
      id: Date.now().toString(),
      name: currentCat.name,
      avatar: currentCat.avatar || CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id,
      ageYears: currentCat.ageYears || 0,
      ageMonths: currentCat.ageMonths || 0,
      bodyCondition: currentCat.bodyCondition || '',
      healthConditions: currentCat.healthConditions || [],
      otherHealthDesc: currentCat.otherHealthDesc,
      selected: true,
    };
    
    const updatedCats = [...cats, newCat];
    setCats(updatedCats);
    localStorage.setItem('ww_cats', JSON.stringify(updatedCats));
    
    // Reset for next cat with new random avatar
    setExpandedCatId(null);
    setEditingCatId(null);
    setCurrentCat({
      name: '',
      avatar: CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id,
      ageYears: 0,
      ageMonths: 0,
      bodyCondition: '',
      healthConditions: [],
      otherHealthDesc: '',
      selected: true,
    });
  };

  const handleEditCat = (catId: string) => {
    if (expandedCatId === catId) {
      // Collapse if already expanded
      setExpandedCatId(null);
      setEditingCatId(null);
      setCurrentCat({
        name: '',
        avatar: CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id,
        ageYears: 0,
        ageMonths: 0,
        bodyCondition: '',
        healthConditions: [],
        otherHealthDesc: '',
        selected: true,
      });
    } else {
      // Expand and load cat data
      const cat = cats.find(c => c.id === catId);
      if (cat) {
        setExpandedCatId(catId);
        setEditingCatId(catId);
        setCurrentCat({
          name: cat.name,
          avatar: cat.avatar,
          ageYears: cat.ageYears,
          ageMonths: cat.ageMonths,
          bodyCondition: cat.bodyCondition,
          healthConditions: cat.healthConditions,
          otherHealthDesc: cat.otherHealthDesc,
          selected: cat.selected,
        });
      }
    }
  };

  const handleUpdateCat = () => {
    if (!editingCatId) return;
    
    if (!currentCat.name || !currentCat.bodyCondition || (currentCat.healthConditions || []).length === 0) {
      alert('Please complete all required fields');
      return;
    }
    
    // Validate age - at least one must be non-zero
    if ((currentCat.ageYears || 0) === 0 && (currentCat.ageMonths || 0) === 0) {
      alert('Please specify your cat\'s age (at least months if years is 0)');
      return;
    }
    
    // Validate "Other" description
    if (currentCat.healthConditions?.includes('Other (please describe)') && !currentCat.otherHealthDesc?.trim()) {
      alert('Please describe the other health conditions');
      return;
    }
    
    const updatedCats = cats.map(cat => 
      cat.id === editingCatId 
        ? {
            ...cat,
            name: currentCat.name || cat.name,
            avatar: currentCat.avatar || cat.avatar,
            ageYears: currentCat.ageYears ?? cat.ageYears,
            ageMonths: currentCat.ageMonths ?? cat.ageMonths,
            bodyCondition: currentCat.bodyCondition || cat.bodyCondition,
            healthConditions: currentCat.healthConditions || cat.healthConditions,
            otherHealthDesc: currentCat.otherHealthDesc,
            selected: currentCat.selected ?? cat.selected,
          }
        : cat
    );
    
    setCats(updatedCats);
    localStorage.setItem('ww_cats', JSON.stringify(updatedCats));
    setExpandedCatId(null);
    setEditingCatId(null);
    setCurrentCat({
      name: '',
      avatar: CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id,
      ageYears: 0,
      ageMonths: 0,
      bodyCondition: '',
      healthConditions: [],
      otherHealthDesc: '',
      selected: true,
    });
  };

  const handleSaveCat = () => {
    if (!currentCat.name || !currentCat.bodyCondition || (currentCat.healthConditions || []).length === 0) {
      alert('Please complete all required fields (name, body condition, and health conditions)');
      return;
    }
    
    // Validate age - at least one must be non-zero
    if ((currentCat.ageYears || 0) === 0 && (currentCat.ageMonths || 0) === 0) {
      alert('Please specify your cat\'s age (at least months if years is 0)');
      return;
    }
    
    // Validate "Other" description
    if (currentCat.healthConditions?.includes('Other (please describe)') && !currentCat.otherHealthDesc?.trim()) {
      alert('Please describe the other health conditions');
      return;
    }
    
    const newCat: CatProfile = {
      id: Date.now().toString(),
      name: currentCat.name,
      avatar: currentCat.avatar || CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id,
      ageYears: currentCat.ageYears || 0,
      ageMonths: currentCat.ageMonths || 0,
      bodyCondition: currentCat.bodyCondition || '',
      healthConditions: currentCat.healthConditions || [],
      otherHealthDesc: currentCat.otherHealthDesc,
      selected: true,
    };
    
    const updatedCats = [...cats, newCat];
    setCats(updatedCats);
    localStorage.setItem('ww_cats', JSON.stringify(updatedCats));
    setShowCatPanel(false);
    setShowInlineCatForm(false);
    setCurrentCat({ 
      name: '', 
      avatar: CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id, 
      ageYears: 0, 
      ageMonths: 0, 
      bodyCondition: '', 
      healthConditions: [], 
      otherHealthDesc: '',
      selected: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequiredFieldsFilled) return;
    
    // Check if personalized flow requires at least one selected cat
    const selectedCats = cats.filter(cat => cat.selected);
    if (isPersonalizedFlow && selectedCats.length === 0) {
      setPersonalizationError('Tell us about your cat so we can personalise insights & recommendations');
      return;
    }
    
    localStorage.setItem('ww_userName', name);
    localStorage.setItem('ww_detectedBrand', 'Sample Brand');
    localStorage.setItem('ww_detectedVariant', 'Adult Chicken');
    // Only set personalizing flag to true if user has selected at least one cat
    localStorage.setItem('ww_personalizing', selectedCats.length > 0 ? 'true' : 'false');
    // Persist full cat list so profile shows all cats; pass only selected names to loading
    localStorage.setItem('ww_cats', JSON.stringify(cats));
    if (selectedCats.length > 0) {
      localStorage.setItem('ww_selectedCatNames', JSON.stringify(selectedCats.map(c => c.name)));
    } else {
      localStorage.removeItem('ww_selectedCatNames');
    }
    router.push('/loading-page');
  };

  const bothImagesValid = frontState === 'pass' && backState === 'pass';
  const allRequiredFieldsFilled = name.trim() !== '' && bothImagesValid;

  return (
    <>
      <Header />
      <main className="pt-8 pb-16 relative">
        <div className="max-w-[600px] mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-serif mb-4 text-gray-900 text-center">
            Which food do you want to analyse for your cat?
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Share the pictures and we will break it down for you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8 w-full">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                What should we call you? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sam"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all font-medium"
              />
            </div>

            {/* Personalized Flow - Inline Cat Section */}
            {isPersonalizedFlow && (() => {
              const selectedCats = cats.filter((c) => c.selected);
              const selectedNames = selectedCats.map((c) => c.name);
              const personaliseTitle =
                selectedNames.length >= 1
                  ? selectedNames.length === 1
                    ? selectedNames[0]
                    : selectedNames.length === 2
                      ? `${selectedNames[0]} and ${selectedNames[1]}`
                      : `${selectedNames.slice(0, -1).join(', ')}, and ${selectedNames[selectedNames.length - 1]}`
                  : null;
              const mainTitle =
                selectedNames.length >= 1
                  ? `Personalising for ${personaliseTitle}`
                  : cats.length >= 1
                    ? 'Select cats for personalising insights'
                    : 'Tell us about your cat';
              return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif text-gray-900">{mainTitle}</h3>
                  <button
                    type="button"
                    onClick={() => router.push('/food-input')}
                    className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                  >
                    Skip personalisation
                  </button>
                </div>

                {/* Saved Cats with Checkboxes */}
                {cats.length > 0 && (
                  <div className="space-y-2">
                    {cats.map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-emerald-50 rounded-lg p-3 border-2 border-emerald-200"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={cat.selected}
                            onChange={(e) => {
                              const updatedCats = cats.map(c =>
                                c.id === cat.id ? { ...c, selected: e.target.checked } : c
                              );
                              setCats(updatedCats);
                              setPersonalizationError('');
                            }}
                            className="w-5 h-5 rounded border-2 border-emerald-300 text-primary-600 focus:ring-4 focus:ring-primary-500/20 transition-all cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleEditCat(cat.id)}
                            className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                              <Image 
                                src={CAT_AVATARS.find(a => a.id === cat.avatar)?.image || '/cats-orange1.png'} 
                                alt={cat.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{cat.name}</p>
                              <p className="text-xs text-gray-600">
                                {cat.ageYears}y {cat.ageMonths}m • {BODY_CONDITIONS.find(b => b.id === cat.bodyCondition)?.label}
                              </p>
                            </div>
                          </button>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            expandedCatId === cat.id ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Cat Button or Inline Form */}
                {!showInlineCatForm && editingCatId === null && expandedCatId === null && (
                  <button
                    type="button"
                    onClick={() => setShowInlineCatForm(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary-500 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    {cats.length === 0 ? "Add your cat's details" : 'Add another cat'}
                  </button>
                )}

                {/* Inline Cat Form - with heading just above edit section */}
                {(showInlineCatForm || editingCatId !== null) && (
                  <>
                    <h3 className="text-lg font-serif text-gray-900">
                      {editingCatId
                        ? `Update details for ${cats.find((c) => c.id === editingCatId)?.name ?? 'cat'}`
                        : 'Tell us about your cat'}
                    </h3>
                    <div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft space-y-6">
                    {/* Cat Name & Avatar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What is your cat's name? <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        {/* Avatar Circular Button */}
                        <button
                          type="button"
                          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                          className={`w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 relative group ${
                            currentCat.avatar 
                              ? 'ring-2 ring-primary-300'
                              : 'bg-gray-100 ring-2 ring-red-200'
                          }`}
                        >
                          {currentCat.avatar ? (
                            <>
                              <div className="w-full h-full rounded-full overflow-hidden absolute inset-0">
                                <Image 
                                  src={CAT_AVATARS.find(a => a.id === currentCat.avatar)?.image || '/cats-orange1.png'} 
                                  alt="Cat avatar"
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                              </div>
                              <span className="absolute left-[48px] top-[48px] w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-300 opacity-90 group-hover:opacity-100 transition-opacity duration-200" aria-hidden>
                                <Edit2 className="w-2.5 h-2.5 text-gray-600" />
                              </span>
                            </>
                          ) : (
                            <Cat className="w-7 h-7 text-gray-400" />
                          )}
                        </button>
                        
                        <input
                          type="text"
                          value={currentCat.name || ''}
                          onChange={(e) => setCurrentCat({ ...currentCat, name: e.target.value })}
                          placeholder="e.g., Whiskers"
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                        />
                      </div>
                      
                      {/* Avatar Picker Horizontal Scroll */}
                      {showAvatarPicker && (
                        <div className="mt-3 bg-emerald-50 rounded-xl border-2 border-emerald-200 p-3">
                          <div className="relative">
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-100" style={{ height: '85px' }}>
                              <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                                {CAT_AVATARS.map((avatar) => (
                                  <button
                                    key={avatar.id}
                                    type="button"
                                    onClick={() => {
                                      setCurrentCat({ ...currentCat, avatar: avatar.id });
                                      setShowAvatarPicker(false);
                                    }}
                                    className={`
                                      w-16 h-16 flex-shrink-0 rounded-full overflow-hidden transition-all duration-200
                                      ${currentCat.avatar === avatar.id 
                                        ? 'ring-4 ring-primary-500 scale-105' 
                                        : 'hover:scale-105 ring-2 ring-gray-300 hover:ring-primary-400'
                                      }
                                    `}
                                  >
                                    <Image 
                                      src={avatar.image} 
                                      alt={avatar.id}
                                      width={64}
                                      height={64}
                                      className="w-full h-full object-cover"
                                      unoptimized
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How old is your cat?
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Years</label>
                          <select
                            value={currentCat.ageYears || 0}
                            onChange={(e) => {
                              const years = parseInt(e.target.value);
                              setCurrentCat({ 
                                ...currentCat, 
                                ageYears: years,
                                ageMonths: years === 21 ? 0 : currentCat.ageMonths
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                          >
                            {Array.from({ length: 22 }, (_, i) => (
                              <option key={i} value={i}>{i === 21 ? '20+' : i}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Months {currentCat.ageYears === 0 && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            value={currentCat.ageMonths || 0}
                            onChange={(e) => setCurrentCat({ ...currentCat, ageMonths: parseInt(e.target.value) })}
                            disabled={currentCat.ageYears === 21}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(currentCat.ageYears === 0 && currentCat.ageMonths === 0) && (
                        <p className="text-xs text-red-500 mt-1">Please specify age in months if years is zero</p>
                      )}
                    </div>

                    {/* Body Condition */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        What does your cat look most like? <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {BODY_CONDITIONS.map((condition) => (
                          <button
                            key={condition.id}
                            type="button"
                            onClick={() => setCurrentCat({ ...currentCat, bodyCondition: condition.id })}
                            className={`
                              p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center
                              ${currentCat.bodyCondition === condition.id
                                ? 'border-primary-500 bg-primary-50 shadow-soft ring-2 ring-primary-200'
                                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="w-full aspect-square mb-2 bg-white rounded-lg overflow-hidden">
                              <Image 
                                src={condition.image} 
                                alt={condition.label}
                                width={150}
                                height={150}
                                className="w-full h-full object-contain"
                                unoptimized
                              />
                            </div>
                            <div className="font-medium text-gray-900 text-sm mb-1">{condition.label}</div>
                            <div className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{condition.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Health Conditions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Does your cat have a known health condition? <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-3">Select all that apply</p>
                      
                      {/* Selected conditions as chips */}
                      {currentCat.healthConditions && currentCat.healthConditions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {currentCat.healthConditions.map((condition) => (
                            <span 
                              key={condition}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm"
                            >
                              {condition}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = currentCat.healthConditions?.filter(c => c !== condition) || [];
                                  setCurrentCat({ 
                                    ...currentCat, 
                                    healthConditions: updated,
                                    otherHealthDesc: condition === 'Other (please describe)' ? '' : currentCat.otherHealthDesc
                                  });
                                }}
                                className="hover:bg-primary-200 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Checkbox options */}
                      <div className="space-y-2 max-h-60 overflow-y-auto p-3 border-2 border-gray-200 rounded-xl bg-white">
                        {HEALTH_CONDITIONS.map((condition) => (
                          <label 
                            key={condition} 
                            className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={currentCat.healthConditions?.includes(condition) || false}
                              onChange={(e) => {
                                const current = currentCat.healthConditions || [];
                                let updated: string[];
                                
                                if (condition === 'No known health conditions') {
                                  if (e.target.checked) {
                                    updated = ['No known health conditions'];
                                  } else {
                                    updated = [];
                                  }
                                } else {
                                  if (e.target.checked) {
                                    updated = [...current.filter(c => c !== 'No known health conditions'), condition];
                                  } else {
                                    updated = current.filter(c => c !== condition);
                                  }
                                }
                                
                                setCurrentCat({ 
                                  ...currentCat, 
                                  healthConditions: updated,
                                  otherHealthDesc: !updated.includes('Other (please describe)') ? '' : currentCat.otherHealthDesc
                                });
                              }}
                              className="mt-0.5 w-4 h-4 rounded border-2 border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
                            />
                            <span className="text-sm text-gray-700 flex-1">{condition}</span>
                          </label>
                        ))}
                      </div>
                      
                      {/* Other health condition text area */}
                      {currentCat.healthConditions?.includes('Other (please describe)') && (
                        <div className="mt-3">
                          <label className="block text-xs text-gray-500 mb-1">
                            Please describe <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={currentCat.otherHealthDesc || ''}
                            onChange={(e) => setCurrentCat({ ...currentCat, otherHealthDesc: e.target.value })}
                            placeholder="Please describe other health conditions..."
                            rows={3}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all resize-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInlineCatForm(false);
                          setExpandedCatId(null);
                          setEditingCatId(null);
                          setCurrentCat({
                            name: '',
                            avatar: CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id,
                            ageYears: 0,
                            ageMonths: 0,
                            bodyCondition: '',
                            healthConditions: [],
                            otherHealthDesc: '',
                            selected: true,
                          });
                        }}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingCatId) {
                            handleUpdateCat();
                          } else {
                            handleSaveCat();
                          }
                        }}
                        disabled={
                          !currentCat.name || 
                          !currentCat.bodyCondition || 
                          (currentCat.healthConditions || []).length === 0 ||
                          ((currentCat.ageYears || 0) === 0 && (currentCat.ageMonths || 0) === 0) ||
                          (currentCat.healthConditions?.includes('Other (please describe)') && !currentCat.otherHealthDesc?.trim())
                        }
                        className="px-6 py-3 bg-primary-600 hover:bg-primary-dark text-white font-semibold rounded-full shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        {editingCatId ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </div>
                  </>
                )}

                {/* Error Message */}
                {personalizationError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{personalizationError}</p>
                  </div>
                )}
              </div>
              );
            })()}

            {/* Base Flow: checkbox on one line; note (when checked) above CTA; CTA on next line */}
            {!isPersonalizedFlow && (
            <div className="flex flex-col gap-4 w-full">
              {/* Row 1: Checkbox + label only */}
              <label className="flex items-start gap-3 cursor-pointer group w-full">
                <input
                  type="checkbox"
                  checked={hasSpecialNeeds}
                  onChange={(e) => setHasSpecialNeeds(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-emerald-300 text-primary-600 focus:ring-4 focus:ring-primary-500/20 transition-all cursor-pointer shrink-0"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  My cat has special health needs or conditions
                </span>
              </label>
              {/* Row 2 (when checked): Note above CTA */}
              {hasSpecialNeeds && (
                <div className="pl-8 w-full animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p>Tell us about your cat so we can tailor the insights & recommendations to their needs.</p>
                  </div>
                </div>
              )}
              {/* Row 3: CTA always on its own line below checkbox / note */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setShowCatPanel(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 underline hover:no-underline font-medium transition-all duration-200 text-left w-full sm:w-auto"
                >
                  {cats.length > 0 ? 'Personalising' : 'Personalise for my cat'}
                </button>
              </div>
              {(() => {
                const selectedForDisplay = cats.filter(c => c.selected);
                return selectedForDisplay.length > 0 && (
                  <p className="text-sm text-gray-600 pl-0">
                    For {selectedForDisplay.length === 1
                      ? selectedForDisplay[0].name
                      : selectedForDisplay.length === 2
                        ? `${selectedForDisplay[0].name} and ${selectedForDisplay[1].name}`
                        : `${selectedForDisplay.slice(0, -1).map(c => c.name).join(', ')}, and ${selectedForDisplay[selectedForDisplay.length - 1].name}`
                    }
                  </p>
                );
              })()}
            </div>
            )}

            {/* Upload Section with Guidelines */}
            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft space-y-6">
              {/* Guidelines */}
              <div>
                <h3 className="font-serif text-base mb-3 text-gray-900">
                  Help us read the label clearly
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Find good lighting, avoid glares or shadows</li>
                  <li>• Hold steady & tap to focus on the pack</li>
                  <li>• Capture the complete text on the label</li>
                </ul>
              </div>

              {/* Upload zones */}
              <div className="grid sm:grid-cols-2 gap-6 items-start">
                <UploadZone
                  label="Front panel *"
                  hint="Capture the complete front of the pack with the brand name & variant"
                  zoneKey="front"
                  state={frontState}
                  imageSrc={frontImage}
                  onFileSelect={(file, clientError) => handleFileSelect('front', file, clientError)}
                  onRemove={() => {
                    setFrontState('empty');
                    setFrontImage(null);
                    setFrontError('');
                  }}
                  errorMsg={frontError}
                />
                <UploadZone
                  label="Back panel *"
                  hint="Get the complete ingredient list and nutrition facts"
                  zoneKey="back"
                  state={backState}
                  imageSrc={backImage}
                  onFileSelect={(file, clientError) => handleFileSelect('back', file, clientError)}
                  onRemove={() => {
                    setBackState('empty');
                    setBackImage(null);
                    setBackError('');
                  }}
                  errorMsg={backError}
                />
              </div>

              <p className="text-xs text-gray-500 text-center">
                Accepted: JPG, PNG, HEIC, WEBP (max 15MB per file)
              </p>
            </div>

            {/* Submit */}
            <div className="space-y-3">
              <div className="relative group">
                <button
                  type="submit"
                  disabled={!allRequiredFieldsFilled}
                  className="w-full bg-primary-600 hover:bg-primary-dark text-white hover:text-[#f0fdf4] font-semibold px-8 py-4 rounded-full shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-primary-600 disabled:hover:text-white"
                >
                  Analyse Food
                </button>
                {!allRequiredFieldsFilled && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {!name.trim() ? 'Please enter your name' : 'Upload and validate both label images to continue'}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
              {allRequiredFieldsFilled && (
                <p className="text-sm text-center text-gray-500">
                  Usually takes a few seconds
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Cat Input Side Panel */}
        {showCatPanel && (
          <>
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setShowCatPanel(false)}
            />
            <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-serif text-gray-900">Let's get to know your cat</h2>
                    <p className="text-sm text-gray-600 mt-1">This will help us highlight what matters most for their nutrition</p>
                  </div>
                  <button
                    onClick={() => setShowCatPanel(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Saved Cats Summary */}
                {cats.length > 0 && (
                  <div className="space-y-2">
                    {cats.map((cat) => (
                      <div
                        key={cat.id}
                        className={`bg-emerald-50 rounded-lg p-3 border-2 transition-all duration-200 ${
                          expandedCatId === cat.id 
                            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                            : 'border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={cat.selected}
                            onChange={(e) => {
                              const updatedCats = cats.map(c =>
                                c.id === cat.id ? { ...c, selected: e.target.checked } : c
                              );
                              setCats(updatedCats);
                            }}
                            className="w-5 h-5 rounded border-2 border-emerald-300 text-primary-600 focus:ring-4 focus:ring-primary-500/20 transition-all cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleEditCat(cat.id)}
                            className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                              <Image 
                                src={CAT_AVATARS.find(a => a.id === cat.avatar)?.image || '/cats-orange1.png'} 
                                alt={cat.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{cat.name}</p>
                              <p className="text-xs text-gray-600">
                                {cat.ageYears}y {cat.ageMonths}m • {BODY_CONDITIONS.find(b => b.id === cat.bodyCondition)?.label}
                              </p>
                            </div>
                          </button>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            expandedCatId === cat.id ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form is shown when: not editing OR editing a specific cat */}
                {(expandedCatId === null || editingCatId !== null) && (
                <>
                <h3 className="text-lg font-serif text-gray-900">
                  {editingCatId
                    ? `Update details for ${cats.find((c) => c.id === editingCatId)?.name ?? 'cat'}`
                    : 'Tell us about your cat'}
                </h3>
                {/* Cat Name & Avatar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What is your cat's name? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Avatar Circular Button */}
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className={`w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 relative group ${
                        currentCat.avatar 
                          ? 'ring-2 ring-primary-300'
                          : 'bg-gray-100 ring-2 ring-red-200'
                      }`}
                    >
                      {currentCat.avatar ? (
                        <>
                          <div className="w-full h-full rounded-full overflow-hidden absolute inset-0">
                            <Image 
                              src={CAT_AVATARS.find(a => a.id === currentCat.avatar)?.image || '/cats-orange1.png'} 
                              alt="Cat avatar"
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                          </div>
                          <span className="absolute left-[48px] top-[48px] w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-300 opacity-90 group-hover:opacity-100 transition-opacity duration-200" aria-hidden>
                            <Edit2 className="w-2.5 h-2.5 text-gray-600" />
                          </span>
                        </>
                      ) : (
                        <Cat className="w-7 h-7 text-gray-400" />
                      )}
                    </button>
                    
                    <input
                      type="text"
                      value={currentCat.name || ''}
                      onChange={(e) => setCurrentCat({ ...currentCat, name: e.target.value })}
                      placeholder="e.g., Whiskers"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                    />
                  </div>
                  
                  {/* Avatar Picker Horizontal Scroll */}
                  {showAvatarPicker && (
                    <div className="mt-3 bg-emerald-50 rounded-xl border-2 border-emerald-200 p-3">
                      <div className="relative">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-100" style={{ height: '85px' }}>
                          <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                            {CAT_AVATARS.map((avatar) => (
                              <button
                                key={avatar.id}
                                type="button"
                                onClick={() => {
                                  setCurrentCat({ ...currentCat, avatar: avatar.id });
                                  setShowAvatarPicker(false);
                                }}
                                className={`
                                  w-16 h-16 flex-shrink-0 rounded-full overflow-hidden transition-all duration-200
                                  ${currentCat.avatar === avatar.id 
                                    ? 'ring-4 ring-primary-500 scale-105' 
                                    : 'hover:scale-105 ring-2 ring-gray-300 hover:ring-primary-400'
                                  }
                                `}
                              >
                                <Image 
                                  src={avatar.image} 
                                  alt={avatar.id}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How old is your cat?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Years</label>
                      <select
                        value={currentCat.ageYears || 0}
                        onChange={(e) => {
                          const years = parseInt(e.target.value);
                          setCurrentCat({ 
                            ...currentCat, 
                            ageYears: years,
                            ageMonths: years === 21 ? 0 : currentCat.ageMonths
                          });
                        }}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                      >
                        {Array.from({ length: 22 }, (_, i) => (
                          <option key={i} value={i}>{i === 21 ? '20+' : i}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Months {currentCat.ageYears === 0 && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={currentCat.ageMonths || 0}
                        onChange={(e) => setCurrentCat({ ...currentCat, ageMonths: parseInt(e.target.value) })}
                        disabled={currentCat.ageYears === 21}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(currentCat.ageYears === 0 && currentCat.ageMonths === 0) && (
                    <p className="text-xs text-red-500 mt-1">Please specify age in months if years is zero</p>
                  )}
                </div>

                {/* Body Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What does your cat look most like? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {BODY_CONDITIONS.map((condition) => (
                      <button
                        key={condition.id}
                        type="button"
                        onClick={() => setCurrentCat({ ...currentCat, bodyCondition: condition.id })}
                        className={`
                          p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center
                          ${currentCat.bodyCondition === condition.id
                            ? 'border-primary-500 bg-primary-50 shadow-soft ring-2 ring-primary-200'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="w-full aspect-square mb-2 bg-white rounded-lg overflow-hidden">
                          <Image 
                            src={condition.image} 
                            alt={condition.label}
                            width={150}
                            height={150}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="font-medium text-gray-900 text-sm mb-1">{condition.label}</div>
                        <div className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{condition.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Health Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Does your cat have a known health condition? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Select all that apply</p>
                  
                  {/* Selected conditions as chips */}
                  {currentCat.healthConditions && currentCat.healthConditions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentCat.healthConditions.map((condition) => (
                        <span 
                          key={condition}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          {condition}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = currentCat.healthConditions?.filter(c => c !== condition) || [];
                              setCurrentCat({ 
                                ...currentCat, 
                                healthConditions: updated,
                                otherHealthDesc: condition === 'Other (please describe)' ? '' : currentCat.otherHealthDesc
                              });
                            }}
                            className="hover:bg-primary-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Checkbox options */}
                  <div className="space-y-2 max-h-60 overflow-y-auto p-3 border-2 border-gray-200 rounded-xl bg-white">
                    {HEALTH_CONDITIONS.map((condition) => (
                      <label 
                        key={condition} 
                        className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={currentCat.healthConditions?.includes(condition) || false}
                          onChange={(e) => {
                            const current = currentCat.healthConditions || [];
                            let updated: string[];
                            
                            if (condition === 'No known health conditions') {
                              // If selecting "No known health conditions", clear everything else
                              if (e.target.checked) {
                                updated = ['No known health conditions'];
                              } else {
                                updated = [];
                              }
                            } else {
                              // If selecting anything else, remove "No known health conditions"
                              if (e.target.checked) {
                                updated = [...current.filter(c => c !== 'No known health conditions'), condition];
                              } else {
                                updated = current.filter(c => c !== condition);
                              }
                            }
                            
                            setCurrentCat({ 
                              ...currentCat, 
                              healthConditions: updated,
                              otherHealthDesc: !updated.includes('Other (please describe)') ? '' : currentCat.otherHealthDesc
                            });
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-2 border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
                        />
                        <span className="text-sm text-gray-700 flex-1">{condition}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Other health condition text area */}
                  {currentCat.healthConditions?.includes('Other (please describe)') && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 mb-1">
                        Please describe <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={currentCat.otherHealthDesc || ''}
                        onChange={(e) => setCurrentCat({ ...currentCat, otherHealthDesc: e.target.value })}
                        placeholder="Please describe other health conditions..."
                        rows={3}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Add Another Cat - only show when not editing */}
                {!editingCatId && cats.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddAnotherCat}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary-500 hover:text-primary-700 hover:bg-primary-50 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Add another cat
                  </button>
                )}
                {!editingCatId && cats.length >= 5 && (
                  <p className="text-sm text-center text-gray-500">
                    Maximum 5 cats. Add more in your profile later.
                  </p>
                )}
                </>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-end gap-3">
                {editingCatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedCatId(null);
                      setEditingCatId(null);
                      setCurrentCat({
                        name: '',
                        avatar: CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id,
                        ageYears: 0,
                        ageMonths: 0,
                        bodyCondition: '',
                        healthConditions: [],
                        otherHealthDesc: '',
                        selected: true,
                      });
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 active:translate-y-0.5 transition-all duration-200"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const formFilled =
                      !!currentCat.name?.trim() &&
                      !!currentCat.bodyCondition &&
                      (currentCat.healthConditions || []).length > 0 &&
                      ((currentCat.ageYears || 0) > 0 || (currentCat.ageMonths || 0) > 0) &&
                      !(currentCat.healthConditions?.includes('Other (please describe)') && !currentCat.otherHealthDesc?.trim());
                    const atLeastOneSelected = cats.some((c) => c.selected);
                    if (editingCatId) {
                      handleUpdateCat();
                    } else if (formFilled) {
                      handleSaveCat();
                    } else if (cats.length > 0 && atLeastOneSelected) {
                      localStorage.setItem('ww_cats', JSON.stringify(cats));
                      setShowCatPanel(false);
                    }
                  }}
                  disabled={(() => {
                    const formFilled =
                      !!currentCat.name?.trim() &&
                      !!currentCat.bodyCondition &&
                      (currentCat.healthConditions || []).length > 0 &&
                      ((currentCat.ageYears || 0) > 0 || (currentCat.ageMonths || 0) > 0) &&
                      !(currentCat.healthConditions?.includes('Other (please describe)') && !currentCat.otherHealthDesc?.trim());
                    const atLeastOneSelected = cats.some((c) => c.selected);
                    if (editingCatId) {
                      return !formFilled;
                    }
                    if (cats.length === 0) {
                      return !formFilled;
                    }
                    return !formFilled && !atLeastOneSelected;
                  })()}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-dark text-white hover:text-[#f0fdf4] font-semibold rounded-full shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCatId ? 'Update Cat' : 'Save & Continue'}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default function FoodInputPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    }>
      <FoodInputPageContent />
    </Suspense>
  );
}
