'use client';

import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Plus,
  Scale,
  Activity,
  FileText,
  ChevronDown,
  ChevronRight,
  ScanLine,
  CheckCircle2,
} from 'lucide-react';
import {
  CAT_AVATARS,
  BODY_CONDITIONS,
  HEALTH_CONDITIONS,
  NEUTERING_OPTIONS,
  OUTDOOR_OPTIONS,
  ACTIVITY_LEVELS,
  COUNTRY_CODES,
} from '@/constants/cat-data';
import {
  isValidPhone,
  isValidEmail,
  isValidDOB,
  getDOBMaxDate,
  getDOBMinDate,
  filterNameInput,
  filterPhoneDigits,
} from '@/lib/validation';
import type { CatProfile, ProfileUser, ScanHistoryItem } from '@/types';
import { useSession } from '@/hooks/useSession';

const STORAGE_USER = 'ww_userProfile';
const STORAGE_USER_NAME = 'ww_userName';
const STORAGE_CATS = 'ww_cats';
const STORAGE_SCAN_HISTORY = 'ww_scanHistory';

const defaultUser: ProfileUser = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  countryCode: '+91',
};

const emptyCatForm: Partial<CatProfile> & { name: string; avatar: string; ageYears: number; ageMonths: number; bodyCondition: string; healthConditions: string[] } = {
  name: '',
  avatar: CAT_AVATARS[0]?.id ?? '',
  ageYears: 0,
  ageMonths: 0,
  bodyCondition: '',
  healthConditions: [],
  weightKg: undefined,
  dob: '',
  neuteringStatus: null,
  outdoorAccess: null,
  activityLevel: null,
  otherHealthDesc: '',
};

function formatDisplay(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function ageYearsDisplay(y: number): string {
  return y === 21 ? '20+' : String(y);
}

function isCatComplete(cat: CatProfile): boolean {
  const hasName = !!cat.name?.trim();
  const hasBodyCondition = !!cat.bodyCondition?.trim();
  const hasHealth = (cat.healthConditions?.length ?? 0) > 0;
  const hasOtherHealthDesc =
    !cat.healthConditions?.includes('Other (please describe)') ||
    !!cat.otherHealthDesc?.trim();
  const hasAge = ((cat.ageYears ?? 0) > 0) || ((cat.ageMonths ?? 0) > 0);
  const hasWeight = cat.weightKg != null;
  const hasDob = !!cat.dob?.trim();
  const hasNeutering = cat.neuteringStatus != null;
  const hasOutdoor = cat.outdoorAccess != null;
  const hasActivity = cat.activityLevel != null;
  return (
    hasName &&
    hasBodyCondition &&
    hasHealth &&
    hasOtherHealthDesc &&
    hasAge &&
    hasWeight &&
    hasDob &&
    hasNeutering &&
    hasOutdoor &&
    hasActivity
  );
}

/** If longer than one-sentence length, truncate middle and show last word. */
function formatOtherHealthDesc(text: string | null | undefined, maxLen = 60): string {
  const t = (text ?? '').trim();
  if (!t) return '';
  if (t.length <= maxLen) return t;
  const words = t.split(/\s+/);
  const lastWord = words[words.length - 1] ?? '';
  const take = Math.max(0, maxLen - 3 - lastWord.length);
  const start = t.slice(0, take).trim();
  return start ? `${start}... ${lastWord}` : lastWord;
}

// Sample scan history for demo: 5 reports on 3 different days
const SAMPLE_SCANS: ScanHistoryItem[] = [
  { id: 'sample-1', thumbnails: ['/logo-light.png', '/logo-light.png'], reportRating: 'A', brand: 'Sample Brand', variant: 'Adult Chicken', scannedAt: '2025-01-15' },
  { id: 'sample-2', thumbnails: ['/logo-light.png', '/logo-light.png'], reportRating: 'A-', brand: 'Sample Brand', variant: 'Senior Salmon', scannedAt: '2025-01-15' },
  { id: 'sample-3', thumbnails: ['/logo-light.png', '/logo-light.png'], reportRating: 'B+', brand: 'Other Brand', variant: 'Kitten Growth', scannedAt: '2025-01-12' },
  { id: 'sample-4', thumbnails: ['/logo-light.png', '/logo-light.png'], reportRating: 'B', brand: 'Premium Paws', variant: 'Indoor Adult', scannedAt: '2025-01-12' },
  { id: 'sample-5', thumbnails: ['/logo-light.png', '/logo-light.png'], reportRating: 'B+', brand: 'Other Brand', variant: 'Kitten Growth', scannedAt: '2025-01-08' },
];

export default function ProfilePage() {
  const { captureEmail, capturePhone, trackCTAClick } = useSession();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<ProfileUser>(defaultUser);
  const [userNameFallback, setUserNameFallback] = useState('');
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [showAddCatForm, setShowAddCatForm] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [currentCat, setCurrentCat] = useState<typeof emptyCatForm>(emptyCatForm);
  const [showHealthDropdown, setShowHealthDropdown] = useState(false);
  const healthDropdownRef = useRef<HTMLDivElement>(null);
  const [showUserEdit, setShowUserEdit] = useState(false);
  const [showScanTimeline, setShowScanTimeline] = useState(false);
  const [scanTimelinePage, setScanTimelinePage] = useState(1);
  const [userValidationErrors, setUserValidationErrors] = useState<{ phone?: string; email?: string }>({});
  const [catRequiredError, setCatRequiredError] = useState(false);
  const [weightInputStr, setWeightInputStr] = useState('');
  const [catAgeError, setCatAgeError] = useState('');
  const [catDobError, setCatDobError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [weightWarning, setWeightWarning] = useState('');
  const [catNameError, setCatNameError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_USER);
      const storedUserName = localStorage.getItem(STORAGE_USER_NAME);
      const storedCats = localStorage.getItem(STORAGE_CATS);
      const storedScans = localStorage.getItem(STORAGE_SCAN_HISTORY);

      if (storedUser) {
        const parsed = JSON.parse(storedUser) as ProfileUser;
        setUser({ ...defaultUser, ...parsed, countryCode: parsed.countryCode ?? '+91' });
      }
      if (storedUserName) setUserNameFallback(storedUserName);
      if (storedCats) setCats(JSON.parse(storedCats));
      if (storedScans) {
        setScanHistory(JSON.parse(storedScans));
      } else if (process.env.NODE_ENV === 'development') {
        // Demo: 5 reports over 3 dates so the >=3 flow and timeline can be tested
        setScanHistory(SAMPLE_SCANS);
      }
    } catch (_) {}
  }, []);

  // Use only real scan history so "No scans" and reports never show together
  const scansToShow = scanHistory;
  const hasAnyScans = scansToShow.length > 0;

  const sortedScans = useMemo(
    () => [...scansToShow].sort((a, b) => (b.scannedAt || '').localeCompare(a.scannedAt || '')),
    [scansToShow]
  );
  const topTwoScans = sortedScans.slice(0, 2);
  const hasMoreScans = sortedScans.length > 2;
  const reportCount = scansToShow.length;

  // Timeline: group by date (chronological = oldest first), one label per date
  const timelineGroups = useMemo(() => {
    const asc = [...scansToShow].sort((a, b) => (a.scannedAt || '').localeCompare(b.scannedAt || ''));
    const groups: { date: string; reports: ScanHistoryItem[] }[] = [];
    for (const scan of asc) {
      const d = scan.scannedAt || '-';
      const last = groups[groups.length - 1];
      if (last && last.date === d) {
        last.reports.push(scan);
      } else {
        groups.push({ date: d, reports: [scan] });
      }
    }
    return groups;
  }, [scansToShow]);

  const timelineScans = useMemo(
    () => timelineGroups.flatMap((g) => g.reports),
    [timelineGroups]
  );
  const SCANS_PER_PAGE = 5;
  const timelineTotalPages = Math.max(1, Math.ceil(timelineScans.length / SCANS_PER_PAGE));
  const timelinePaginatedScans = useMemo(
    () =>
      timelineScans.slice(
        (scanTimelinePage - 1) * SCANS_PER_PAGE,
        scanTimelinePage * SCANS_PER_PAGE
      ),
    [timelineScans, scanTimelinePage]
  );
  const timelinePaginatedGroups = useMemo(() => {
    const byDate: Record<string, ScanHistoryItem[]> = {};
    for (const scan of timelinePaginatedScans) {
      const d = scan.scannedAt || '-';
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(scan);
    }
    return Object.entries(byDate).map(([date, reports]) => ({ date, reports }));
  }, [timelinePaginatedScans]);

  const hasUserInfo =
    !!user.firstName?.trim() ||
    !!user.lastName?.trim() ||
    !!user.phone?.trim() ||
    !!user.email?.trim();
  const displayName = user.firstName?.trim() || userNameFallback?.trim() || 'Cat parent';
  const catDisplayName = (name: string) => (name?.trim() ? name.trim() : 'your cat');

  const saveUser = (u: ProfileUser) => {
    setUser(u);
    try {
      localStorage.setItem(STORAGE_USER, JSON.stringify(u));
    } catch (_) {}
  };

  const saveCats = (newCats: CatProfile[]) => {
    setCats(newCats);
    try {
      localStorage.setItem(STORAGE_CATS, JSON.stringify(newCats));
    } catch (_) {}
  };

  const handleSaveUser = () => {
    const errors: { phone?: string; email?: string } = {};
    if (user.phone?.trim() && !isValidPhone(user.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number.';
    }
    if (user.email?.trim() && !isValidEmail(user.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    setUserValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;
    saveUser(user);
    if (user.email?.trim()) captureEmail(user.email.trim());
    if (user.phone?.trim()) capturePhone((user.countryCode ?? '+91') + user.phone.trim());
    setShowUserEdit(false);
  };

  const handleAddCat = () => {
    const missing: string[] = [];
    if (!currentCat.name?.trim()) missing.push('name');
    if (!currentCat.bodyCondition) missing.push('body condition');
    if ((currentCat.healthConditions?.length ?? 0) === 0) missing.push('known health conditions');
    if (missing.length > 0) {
      setCatRequiredError(true);
      return;
    }
    setCatRequiredError(false);

    if (!/^[a-zA-Z\s\-']+$/.test(currentCat.name.trim())) {
      setCatNameError('Cat name cannot contain numbers or special characters.');
      return;
    }
    setCatNameError('');

    const ageY = currentCat.ageYears ?? 0;
    const ageM = currentCat.ageMonths ?? 0;
    if (ageY === 0 && ageM === 0) {
      setCatAgeError('Please enter age (at least year or month). If year is 0, month is required.');
      return;
    }
    setCatAgeError('');

    const w = currentCat.weightKg;
    if (w != null && w <= 0) {
      setWeightError('Please check if the value for you cat\'s weight is correct.');
      return;
    }
    setWeightError('');

    if (currentCat.dob && !isValidDOB(currentCat.dob)) {
      setCatDobError('Please enter valid date of birth.');
      return;
    }
    setCatDobError('');
    if (currentCat.healthConditions?.includes('Other (please describe)') && !currentCat.otherHealthDesc?.trim()) {
      alert('Please enter a description for other health conditions.');
      return;
    }

    const newCat: CatProfile = {
      id: String(Date.now()),
      name: currentCat.name.trim(),
      avatar: currentCat.avatar || (CAT_AVATARS[0]?.id ?? ''),
      ageYears: currentCat.ageYears ?? 0,
      ageMonths: currentCat.ageMonths ?? 0,
      bodyCondition: currentCat.bodyCondition || '',
      healthConditions: currentCat.healthConditions || [],
      otherHealthDesc: currentCat.otherHealthDesc,
      selected: true,
      weightKg: currentCat.weightKg ?? null,
      dob: currentCat.dob || null,
      neuteringStatus: currentCat.neuteringStatus ?? null,
      outdoorAccess: currentCat.outdoorAccess ?? null,
      activityLevel: currentCat.activityLevel ?? null,
    };

    if (editingCatId) {
      saveCats(cats.map((c) => (c.id === editingCatId ? newCat : c)));
      setEditingCatId(null);
    } else {
      saveCats([...cats, newCat]);
    }
    setCurrentCat(emptyCatForm);
    setWeightInputStr('');
    setCatAgeError('');
    setCatDobError('');
    setWeightError('');
    setWeightWarning('');
    setCatNameError('');
    setShowAddCatForm(false);
  };

  const handleEditCat = (cat: CatProfile) => {
    setEditingCatId(cat.id);
    setCatAgeError('');
    setCatDobError('');
    setWeightError('');
    setWeightWarning('');
    setCatNameError('');
    setCurrentCat({
      name: cat.name,
      avatar: cat.avatar,
      ageYears: cat.ageYears,
      ageMonths: cat.ageMonths,
      bodyCondition: cat.bodyCondition,
      healthConditions: cat.healthConditions || [],
      otherHealthDesc: cat.otherHealthDesc,
      weightKg: cat.weightKg ?? undefined,
      dob: cat.dob ?? '',
      neuteringStatus: cat.neuteringStatus ?? null,
      outdoorAccess: cat.outdoorAccess ?? null,
      activityLevel: cat.activityLevel ?? null,
    });
  };

  const cancelCatForm = () => {
    setShowAddCatForm(false);
    setEditingCatId(null);
    setCurrentCat(emptyCatForm);
    setWeightInputStr('');
    setCatAgeError('');
    setCatDobError('');
    setWeightError('');
    setWeightWarning('');
    setCatNameError('');
  };

  useEffect(() => {
    if (showAddCatForm || editingCatId) {
      setWeightInputStr(
        currentCat.weightKg != null ? String(currentCat.weightKg) : ''
      );
    }
  }, [showAddCatForm, editingCatId, currentCat.weightKg]);

  useEffect(() => {
    if (!showHealthDropdown) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const el = healthDropdownRef.current;
      if (el && !el.contains(e.target as Node)) setShowHealthDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showHealthDropdown]);

  const bodyConditionLabel = (id: string) => BODY_CONDITIONS.find((b) => b.id === id)?.label ?? '-';
  const activityLabel = (value: string | null | undefined) =>
    ACTIVITY_LEVELS.find((a) => a.value === value)?.label ?? '-';

  const renderCatForm = () => (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 font-mono text-sm space-y-4">
        <h3 className="font-serif text-lg text-gray-900">
        {editingCatId ? 'Edit cat' : cats.length > 0 ? 'Add another cat' : 'Add a cat'}
      </h3>
      {catRequiredError && (
        <p className="text-red-600 text-sm">
          Please enter required fields: name, body condition, and known health conditions.
        </p>
      )}

      <div className="flex gap-4 items-start">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 mb-2">
            <Image
              src={CAT_AVATARS.find((a) => a.id === currentCat.avatar)?.image ?? '/cats-orange1.png'}
              alt="Avatar"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div className="flex gap-1 overflow-x-auto max-w-[200px] pb-1">
            {CAT_AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setCurrentCat({ ...currentCat, avatar: a.id })}
                className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 ${
                  currentCat.avatar === a.id ? 'border-primary-500' : 'border-gray-200'
                }`}
              >
                <Image src={a.image} alt="" width={32} height={32} unoptimized />
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-gray-700 mb-1">Name <span className="text-red-600">*</span></label>
          <input
            type="text"
            value={currentCat.name}
            onChange={(e) => { setCurrentCat({ ...currentCat, name: filterNameInput(e.target.value) }); setCatNameError(''); }}
            placeholder="Your cat&apos;s name"
            className={`w-full px-3 py-2 rounded-lg border focus:border-primary-500 outline-none ${
              catNameError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {catNameError && <p className="text-red-600 text-sm mt-1">{catNameError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 mb-1">Age (years) <span className="text-red-600">*</span></label>
          <select
            value={currentCat.ageYears}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrentCat((c) => ({
                ...c,
                ageYears: val,
                ageMonths: val === 21 ? 0 : c.ageMonths,
              }));
              setCatAgeError('');
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 outline-none"
          >
            {Array.from({ length: 22 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n === 21 ? '20+' : n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Age (months) <span className="text-red-600">*</span></label>
          <select
            value={currentCat.ageMonths}
            onChange={(e) => { setCurrentCat({ ...currentCat, ageMonths: Number(e.target.value) }); setCatAgeError(''); }}
            disabled={currentCat.ageYears === 21}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 outline-none disabled:opacity-50"
          >
            {Array.from({ length: 13 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      {catAgeError && (
        <p className="text-red-600 text-sm">{catAgeError}</p>
      )}

      <div>
        <label className="flex items-center gap-2 text-gray-700 mb-1">
          <Scale className="w-4 h-4" />
          Weight (kg)
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={weightInputStr}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
            setWeightInputStr(v);
            setWeightError('');
            if (v === '') {
              setCurrentCat((c) => ({ ...c, weightKg: undefined }));
              setWeightWarning('');
            } else {
              const num = parseFloat(v);
              if (!isNaN(num)) {
                if (num <= 0) {
                  setWeightError('Please check if the value for you cat\'s weight is correct.');
                  setCurrentCat((c) => ({ ...c, weightKg: undefined }));
                } else {
                  setCurrentCat((c) => ({ ...c, weightKg: num }));
                  setWeightWarning(num > 20 ? 'This doesn\'t look right. Do you want to verify the value for weight is correct?' : '');
                }
              }
            }
          }}
          onBlur={() => {
            const v = weightInputStr.trim();
            if (v === '') {
              setCurrentCat((c) => ({ ...c, weightKg: undefined }));
              setWeightError('');
              setWeightWarning('');
              return;
            }
            const num = parseFloat(v);
            if (!isNaN(num) && num > 0) {
              setCurrentCat((c) => ({ ...c, weightKg: num }));
              setWeightInputStr(String(num));
              setWeightError('');
              setWeightWarning(num > 20 ? 'This doesn\'t look right. Do you want to verify the value for weight is correct?' : '');
            } else if (!isNaN(num) && num <= 0) {
              setWeightError('Please check if the value for you cat\'s weight is correct.');
              setWeightWarning('');
              setWeightInputStr('');
              setCurrentCat((c) => ({ ...c, weightKg: undefined }));
            }
          }}
          placeholder="-"
          className={`w-full px-3 py-2 rounded-lg border font-mono text-sm focus:outline-none [appearance:textfield] ${
            weightError ? 'border-red-500' : 'border-gray-300 focus:border-primary-500'
          }`}
        />
        {weightError && <p className="text-red-600 text-sm mt-1">{weightError}</p>}
        {weightWarning && !weightError && <p className="text-red-600 text-sm mt-1">{weightWarning}</p>}
      </div>

      <div>
        <label className="block text-gray-700 mb-2">Body condition <span className="text-red-600">*</span></label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BODY_CONDITIONS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setCurrentCat({ ...currentCat, bodyCondition: b.id })}
              className={`p-2 rounded-lg border-2 text-left transition-colors ${
                currentCat.bodyCondition === b.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <div className="w-20 h-20 relative mb-1 mx-auto">
                <Image src={b.image} alt="" width={80} height={80} className="object-contain w-full h-full" unoptimized />
              </div>
              <p className="text-xs font-medium text-gray-900">{b.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-gray-700 mb-1">
          <Calendar className="w-4 h-4" />
          DOB
        </label>
        <input
          type="date"
          value={currentCat.dob ?? ''}
          min={getDOBMinDate()}
          max={getDOBMaxDate()}
          onChange={(e) => {
            const val = e.target.value || undefined;
            setCurrentCat({ ...currentCat, dob: val });
            setCatDobError(val && !isValidDOB(val) ? 'Please enter valid date of birth.' : '');
          }}
          onBlur={() => {
            if (currentCat.dob && !isValidDOB(currentCat.dob)) {
              setCatDobError('Please enter valid date of birth.');
            } else {
              setCatDobError('');
            }
          }}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none ${
            catDobError ? 'border-red-500' : 'border-gray-300 focus:border-primary-500'
          }`}
        />
        {catDobError && <p className="text-red-600 text-sm mt-1">{catDobError}</p>}
      </div>

      <div>
        <label className="block text-gray-700 mb-2">Neutering status</label>
        <div className="flex flex-wrap gap-3">
          {NEUTERING_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="neutering"
                checked={(currentCat.neuteringStatus ?? '') === opt.value}
                onChange={() => setCurrentCat({ ...currentCat, neuteringStatus: opt.value })}
                className="text-primary-600"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-gray-700 mb-2">Does your cat have outdoor access?</label>
        <div className="flex gap-4">
          {OUTDOOR_OPTIONS.map((opt) => (
            <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="outdoor"
                checked={currentCat.outdoorAccess === opt.value}
                onChange={() => setCurrentCat({ ...currentCat, outdoorAccess: opt.value })}
                className="text-primary-600"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-gray-700 mb-2">
          <Activity className="w-4 h-4" />
          Activity level
        </label>
        <div className="flex flex-wrap gap-3">
          {ACTIVITY_LEVELS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="activity"
                checked={(currentCat.activityLevel ?? '') === opt.value}
                onChange={() => setCurrentCat({ ...currentCat, activityLevel: opt.value })}
                className="text-primary-600"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-gray-700 mb-1">Known health conditions <span className="text-red-600">*</span></label>
        <div className="relative" ref={healthDropdownRef}>
          <button
            type="button"
            onClick={() => setShowHealthDropdown(!showHealthDropdown)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-left flex items-center justify-between font-mono text-sm"
          >
            <span className="text-gray-600">
              {currentCat.healthConditions?.length
                ? `${currentCat.healthConditions.length} selected`
                : 'Select all that apply'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showHealthDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showHealthDropdown && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
              {HEALTH_CONDITIONS.map((condition) => (
                <label
                  key={condition}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={currentCat.healthConditions?.includes(condition) ?? false}
                    onChange={(e) => {
                      let next = currentCat.healthConditions ?? [];
                      if (condition === 'No known health conditions') {
                        next = e.target.checked ? ['No known health conditions'] : [];
                      } else if (e.target.checked) {
                        next = [...next.filter((c) => c !== 'No known health conditions'), condition];
                      } else {
                        next = next.filter((c) => c !== condition);
                      }
                      setCurrentCat({ ...currentCat, healthConditions: next });
                    }}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm">{condition}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {currentCat.healthConditions?.includes('Other (please describe)') && (
          <textarea
            value={currentCat.otherHealthDesc ?? ''}
            onChange={(e) => setCurrentCat({ ...currentCat, otherHealthDesc: e.target.value })}
            placeholder="Describe other known health conditions"
            rows={2}
            className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-sm focus:border-primary-500 outline-none"
          />
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleAddCat}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
          {editingCatId ? 'Save details' : cats.length > 0 ? 'Add another cat' : 'Add a cat'}
        </button>
        <button
          type="button"
          onClick={cancelCatForm}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="pt-6 sm:pt-8 pb-12 sm:pb-16 min-h-screen flex items-center justify-center">
          <div className="font-mono text-gray-500 text-xs sm:text-sm">Loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-6 sm:pt-8 pb-12 sm:pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <h1 className="text-xl sm:text-2xl font-serif text-gray-900 mb-2">Your Profile</h1>
          {!hasUserInfo && (
            <p className="text-gray-700 mb-4 sm:mb-6 font-mono text-xs sm:text-sm">
              Hi {displayName}. Add your details to access scan history and food reports, and save your cat&apos;s profiles for future scans.
            </p>
          )}

          {/* User section */}
          <section className="mb-6 sm:mb-10">
            {hasUserInfo && !showUserEdit ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 font-mono text-xs sm:text-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-gray-900">Your details</span>
                  <button
                    type="button"
                    onClick={() => setShowUserEdit(true)}
                    className="inline-flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                    aria-label="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-gray-700">
                  {(user.firstName || user.lastName) && (
                    <p>Name: {[user.firstName, user.lastName].filter(Boolean).join(' ')}</p>
                  )}
                  {user.phone && <p>Phone: {user.countryCode ?? '+91'} {user.phone}</p>}
                  {user.email && <p>Email: {user.email}</p>}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4 font-mono text-sm space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <User className="w-4 h-4" />
                      First name
                    </label>
                    <input
                      type="text"
                      value={user.firstName}
                      onChange={(e) => setUser({ ...user, firstName: filterNameInput(e.target.value) })}
                      placeholder="First name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <User className="w-4 h-4" />
                      Last name
                    </label>
                    <input
                      type="text"
                      value={user.lastName}
                      onChange={(e) => setUser({ ...user, lastName: filterNameInput(e.target.value) })}
                      placeholder="Last name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={user.countryCode ?? '+91'}
                        onChange={(e) => setUser({ ...user, countryCode: e.target.value })}
                        className="w-32 sm:w-28 px-3 py-2 rounded-lg border border-gray-300 font-mono text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                        title="Country code"
                      >
                        {COUNTRY_CODES.map(({ code, label }) => (
                          <option key={code} value={code}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={user.phone}
                        onChange={(e) => setUser({ ...user, phone: filterPhoneDigits(e.target.value, 10) })}
                        placeholder="10-digit number"
                        maxLength={10}
                        className={`flex-1 min-w-0 px-3 py-2 rounded-lg border font-mono text-sm focus:outline-none focus:ring-1 ${
                          userValidationErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                        }`}
                      />
                    </div>
                    {userValidationErrors.phone && (
                      <p className="text-red-600 text-xs mt-1">{userValidationErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      placeholder="Email"
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-sm focus:outline-none focus:ring-1 ${
                        userValidationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      }`}
                    />
                    {userValidationErrors.email && (
                      <p className="text-red-600 text-xs mt-1">{userValidationErrors.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveUser}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
                  >
                    Save
                  </button>
                  {hasUserInfo && (
                    <button
                      type="button"
                      onClick={() => { setShowUserEdit(false); setUserValidationErrors({}); }}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Cat profiles */}
          <section className="mb-6 sm:mb-10">
            <h2 className="text-lg sm:text-xl font-serif text-gray-900 mb-2">Cat profiles</h2>
            <p className="text-gray-600 font-mono text-xs sm:text-sm mb-3 sm:mb-4">
              Specific details help us give you better, more personalised insights for your cat.
            </p>

            {cats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {cats.map((cat) => (
                  <Fragment key={cat.id}>
                    <div
                      className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 font-mono text-xs sm:text-sm shadow-sm relative"
                    >
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-start gap-1 sm:gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium border ${
                            isCatComplete(cat)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-red-100/90 border-red-300 text-red-900'
                          }`}
                          aria-hidden
                        >
                          {isCatComplete(cat) ? (
                            <> <CheckCircle2 className="w-3.5 h-3.5" /> Complete </>
                          ) : (
                            'Missing details'
                          )}
                        </span>
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleEditCat(cat)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center"
                            aria-label="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/food-input?from=profile&personalize=true&preselectCat=${encodeURIComponent(cat.id)}`}
                            onClick={() => trackCTAClick('profile')}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center"
                            aria-label="Scan food for this cat"
                          >
                            <ScanLine className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                      <div className="flex gap-3 sm:gap-4 mb-2 sm:mb-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
                          <Image
                            src={CAT_AVATARS.find((a) => a.id === cat.avatar)?.image ?? '/cats-orange1.png'}
                            alt={cat.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{catDisplayName(cat.name)}</p>
                          <p className="text-gray-600">
                            Age: {ageYearsDisplay(cat.ageYears)}y{(cat.ageYears ?? 0) >= 21 ? '' : ` ${formatDisplay(cat.ageMonths)}m`}
                          </p>
                          <p className="text-gray-600">Weight: {cat.weightKg != null ? `${cat.weightKg} kg` : '-'}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-gray-600 border-t border-gray-100 pt-2 mt-2">
                        <p>DOB: {formatDisplay(cat.dob)}</p>
                        <p>
                          Neutering:{' '}
                          {cat.neuteringStatus === 'neutered'
                            ? 'Neutered'
                            : cat.neuteringStatus === 'not_neutered'
                              ? 'Not neutered'
                              : cat.neuteringStatus === 'unknown'
                                ? 'Unknown'
                                : '-'}
                        </p>
                        <p>Outdoor: {cat.outdoorAccess != null ? (cat.outdoorAccess ? 'Y' : 'N') : '-'}</p>
                        <p>Activity: {activityLabel(cat.activityLevel)}</p>
                        <p>Body: {bodyConditionLabel(cat.bodyCondition)}</p>
                        <p>
                          Health:{' '}
                          {cat.healthConditions?.length
                            ? (() => {
                                const rest = cat.healthConditions!.filter((c) => c !== 'Other (please describe)');
                                const otherPart =
                                  cat.healthConditions!.includes('Other (please describe)') && cat.otherHealthDesc
                                    ? `Other: ${formatOtherHealthDesc(cat.otherHealthDesc)}`
                                    : '';
                                const parts = rest.length ? [rest.join(', ')] : [];
                                if (otherPart) parts.push(otherPart);
                                return parts.length ? parts.join('. ') : '-';
                              })()
                            : '-'}
                        </p>
                      </div>
                    </div>
                    {editingCatId === cat.id && (
                      <div className="sm:col-span-2">
                        {renderCatForm()}
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            )}

            {!showAddCatForm && !editingCatId && (
              <div className="flex items-center gap-4">
                {cats.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentCat(emptyCatForm);
                      setEditingCatId(null);
                      setCatAgeError('');
                      setCatDobError('');
                      setWeightError('');
                      setWeightWarning('');
                      setShowAddCatForm(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary-500 text-primary-700 font-medium hover:bg-primary-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add another cat
                  </button>
                ) : (
                  <div className="flex-1 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                    <p className="text-gray-500 font-mono text-sm mb-4">Add a cat</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCatAgeError('');
                        setCatDobError('');
                        setWeightError('');
                        setWeightWarning('');
                        setCatNameError('');
                        setShowAddCatForm(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary-500 text-primary-700 font-medium hover:bg-primary-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add a cat
                    </button>
                  </div>
                )}
              </div>
            )}

            {(showAddCatForm && !editingCatId) && renderCatForm()}
          </section>

          {/* Scan history */}
          <section className="mb-10">
            <h2 className="text-xl font-serif text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Scan history
            </h2>

            {hasAnyScans ? (
              <div className="space-y-4">
                {!showScanTimeline ? (
                  <>
                    {(reportCount <= 2 ? sortedScans : topTwoScans).map((scan) => (
                      <Link
                        key={scan.id}
                        href={`/report/${scan.id}`}
                        className="block bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm font-mono text-sm hover:border-primary-400 transition-colors"
                      >
                        {scan.reportRating && (
                          <div className="bg-primary-50 border-b-2 border-primary-200 px-4 py-3 flex items-center justify-between">
                            <span className="text-gray-600 text-xs uppercase tracking-wider">Rating</span>
                            <span className="text-2xl font-bold text-primary-700 border-2 border-primary-500 rounded-lg w-12 h-12 flex items-center justify-center bg-white">
                              {scan.reportRating}
                            </span>
                          </div>
                        )}
                        <div className="p-4 flex flex-wrap items-start gap-4">
                          <div className="flex gap-2">
                            {scan.thumbnails.slice(0, 2).map((src, i) => (
                              <div
                                key={i}
                                className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"
                              >
                                <Image
                                  src={src || '/logo-light.png'}
                                  alt=""
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium">
                              {scan.brand ?? '-'} {scan.variant ? `– ${scan.variant}` : ''}
                            </p>
                            {scan.scannedAt && (
                              <p className="text-gray-500 text-xs mt-1">{scan.scannedAt}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    {reportCount <= 2 && (
                      <div className="pt-2">
                        <Link
                          href="/food-input?from=profile"
                          onClick={() => trackCTAClick('profile')}
                          className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary-600 hover:bg-primary-dark text-white font-semibold shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200"
                        >
                          Analyse new food
                        </Link>
                      </div>
                    )}
                    {hasMoreScans && (
                      <div className="flex flex-col gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setScanTimelinePage(1); setShowScanTimeline(true); }}
                          className="inline-flex items-center gap-1 text-primary-600 font-medium hover:underline text-sm w-fit"
                        >
                          View more
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <Link
                          href="/food-input?from=profile"
                          onClick={() => trackCTAClick('profile')}
                          className="inline-flex items-center justify-center w-fit px-8 py-4 rounded-full bg-primary-600 hover:bg-primary-dark text-white font-semibold shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200"
                        >
                          Analyse new food
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="relative pl-8 border-l-2 border-primary-200 space-y-6">
                      {timelinePaginatedGroups.map((group) => (
                        <div key={group.date} className="relative space-y-3">
                          <div className="absolute -left-8 top-2 w-3 h-3 rounded-full bg-primary-500 border-2 border-white shadow" />
                          <div className="font-mono text-xs text-gray-500 font-medium">{group.date}</div>
                          {group.reports.map((scan) => (
                            <Link
                              key={scan.id}
                              href={`/report/${scan.id}`}
                              className="block bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm font-mono text-sm hover:border-primary-400 transition-colors"
                            >
                              {scan.reportRating && (
                                <div className="bg-primary-50 border-b-2 border-primary-200 px-4 py-3 flex items-center justify-between">
                                  <span className="text-gray-600 text-xs uppercase tracking-wider">Rating</span>
                                  <span className="text-2xl font-bold text-primary-700 border-2 border-primary-500 rounded-lg w-12 h-12 flex items-center justify-center bg-white">
                                    {scan.reportRating}
                                  </span>
                                </div>
                              )}
                              <div className="p-4 flex flex-wrap items-start gap-4">
                                <div className="flex gap-2">
                                  {scan.thumbnails.slice(0, 2).map((src, i) => (
                                    <div
                                      key={i}
                                      className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"
                                    >
                                      <Image
                                        src={src || '/logo-light.png'}
                                        alt=""
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 font-medium">
                                    {scan.brand ?? '-'} {scan.variant ? `– ${scan.variant}` : ''}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                    {timelineTotalPages > 1 && (
                      <nav className="flex items-center justify-center gap-2 mt-4 flex-wrap" aria-label="Scan history pagination">
                        <button
                          type="button"
                          onClick={() => setScanTimelinePage((p) => Math.max(1, p - 1))}
                          disabled={scanTimelinePage <= 1}
                          className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                          aria-label="Previous page"
                        >
                          &lt;
                        </button>
                        {(() => {
                          const pages: (number | 'ellipsis')[] = [];
                          if (timelineTotalPages <= 3) {
                            for (let i = 1; i <= timelineTotalPages; i++) pages.push(i);
                          } else {
                            pages.push(1, 2, 'ellipsis', timelineTotalPages);
                          }
                          return pages.map((p, i) =>
                            p === 'ellipsis' ? (
                              <span key={`e-${i}`} className="px-2 text-gray-400 font-mono text-sm">...</span>
                            ) : (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setScanTimelinePage(p)}
                                className={`min-w-[2rem] px-2 py-1 rounded-lg font-mono text-sm ${
                                  scanTimelinePage === p
                                    ? 'bg-primary-600 text-white'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {p}
                              </button>
                            )
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => setScanTimelinePage((p) => Math.min(timelineTotalPages, p + 1))}
                          disabled={scanTimelinePage >= timelineTotalPages}
                          className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                          aria-label="Next page"
                        >
                          &gt;
                        </button>
                      </nav>
                    )}
                    <div className="flex flex-col gap-3 pt-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowScanTimeline(false)}
                        className="inline-flex items-center gap-1 text-primary-600 font-medium hover:underline text-sm w-fit"
                      >
                        Show less
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <Link
                        href="/food-input?from=profile"
                        onClick={() => trackCTAClick('profile')}
                        className="inline-flex items-center justify-center w-fit px-8 py-4 rounded-full bg-primary-600 hover:bg-primary-dark text-white font-semibold shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200"
                      >
                        Analyse new food
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500 font-mono text-sm mb-4">You are yet to check your cat&apos;s food. Start scanning now!</p>
                <Link
                  href="/food-input?from=profile"
                  onClick={() => trackCTAClick('profile')}
                  className="inline-flex items-center justify-center w-fit px-8 py-4 rounded-full bg-primary-600 hover:bg-primary-dark text-white font-semibold shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200"
                >
                  Analyse new food
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
