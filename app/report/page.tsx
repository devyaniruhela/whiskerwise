'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Check, X, AlertCircle, Droplets, Award, Calendar, MapPin, Phone, User, RotateCw } from 'lucide-react';
import type { ExtractedData } from '@/types';

const IMAGE_FRONT_KEY = 'ww_imageFront';
const IMAGE_BACK_KEY = 'ww_imageBack';

export default function ReportPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [mobileShowFront, setMobileShowFront] = useState(true);

  const openOverlay = useCallback((src: string) => setOverlayImage(src), []);
  const closeOverlay = useCallback(() => setOverlayImage(null), []);

  useEffect(() => {
    const front = localStorage.getItem(IMAGE_FRONT_KEY);
    const back = localStorage.getItem(IMAGE_BACK_KEY);
    if (front) setFrontImage(front);
    if (back) setBackImage(back);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('ww_extract');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ExtractedData;
        setExtractedData(parsed);
        return;
      } catch (_) {
        // fall through to mock
      }
    }
    const mockData: ExtractedData = {
      brand: localStorage.getItem('ww_detectedBrand') || 'Sample Brand',
      variant: localStorage.getItem('ww_detectedVariant') || 'Adult Chicken',
      lifestage: 'adult',
      type: 'dry',
      typeMethod: 'moisture',
      adequacy: 'complete',
      texture: 'Dry kibble',
      aafcoCertified: true,
      otherCertifications: ['FEDIAF Approved', 'BIS Certified'],
      claims: ['High Protein', 'No Artificial Preservatives', 'Omega-3 Enriched'],
      intendedUse: null,
      ingredients: [
        'Chicken (40%)',
        'Rice',
        'Corn',
        'Chicken Fat',
        'Fish Oil',
        'Vitamins and Minerals',
        'Taurine (1200mg/kg)'
      ],
      additives: ['Vitamin E (600 IU)', 'Vitamin A (18000 IU)', 'Zinc Sulphate'],
      guaranteedAnalysis: {
        protein: 28,
        fat: 14,
        fibre: 3,
        ash: 8,
        moisture: 10,
        others: [{ label: 'Calcium', value: '0.012%' }, { label: 'Phosphorus', value: '0.010%' }]
      },
      taurineAdded: true,
      weight: 1500,
      price: 450,
      priceCurrency: 'INR',
      metEnergy100g: '380 kcal',
      manufacturerName: 'Sample Pet Foods Pvt Ltd',
      manufacturerContact: '+91-1234567890',
      countryOrigin: 'India',
      dateManufacture: '2025-10-15',
      dateExpiry: '2026-10-15',
      translatedFlag: false
    };
    setExtractedData(mockData);
  }, []);

  const handleVerification = (response: string) => {
    // In production, send verification response to backend
    console.log('Verification response:', response, 'Feedback:', feedback);
    setShowModal(true);

    setTimeout(() => {
      router.push('/food-input');
    }, 3000);
  };

  const closeModalAndRedirect = () => {
    setShowModal(false);
    router.push('/food-input');
  };

  if (!extractedData) {
    return (
      <>
        <Header />
        <main className="pt-8 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
            <p className="text-gray-500">Loading extracted data...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-2">
              Extracted Information
            </h1>
            <p className="text-gray-600">Review the details we extracted from your images</p>
          </header>

          {/* Verification Section - at top */}
          <div className="bg-gradient-to-br from-primary-50 to-emerald-50 rounded-3xl p-8 border-2 border-primary-200 shadow-soft-lg mb-8">
            <h2 className="text-2xl font-serif text-gray-900 mb-2 text-center">
              Does this information look right to you?
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Match it with the information on the images uploaded by you.
            </p>

            {/* Feedback Text Area */}
            <div className="mb-6">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please share comments/feedback here"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all resize-none text-sm"
              />
            </div>

            {/* Verification CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => handleVerification('match')}
                className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-full shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200"
              >
                Yes! Correct & complete
              </button>
              <button
                onClick={() => handleVerification('incorrect')}
                className="flex-1 sm:flex-none bg-white border-2 border-gray-300 text-gray-700 font-semibold px-8 py-4 rounded-full hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
              >
                No, one/more fields wrong or missing
              </button>
              <button
                onClick={() => handleVerification('unable')}
                className="text-primary-600 hover:text-primary-700 font-medium underline text-sm transition-colors"
              >
                Can&apos;t check right now
              </button>
            </div>
          </div>

          {/* Uploaded images + basic details (below user validation) */}
          <section className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft mb-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
              {/* Images: desktop = side by side; mobile = single with turn icon */}
              <div className="flex flex-col md:flex-row gap-4 md:min-w-0 md:flex-1">
                {/* Desktop: two images side by side */}
                <div className="hidden md:flex md:flex-1 gap-4">
                  {frontImage && (
                    <div
                      className="flex-1 min-w-0 rounded-xl overflow-hidden border-2 border-emerald-100 bg-gray-50 cursor-pointer hover:border-primary-300 transition-colors"
                      onDoubleClick={() => openOverlay(frontImage)}
                      title="Double-click to enlarge"
                    >
                      <img src={frontImage} alt="Front of package" className="w-full h-full min-h-[200px] object-contain" />
                    </div>
                  )}
                  {backImage && (
                    <div
                      className="flex-1 min-w-0 rounded-xl overflow-hidden border-2 border-emerald-100 bg-gray-50 cursor-pointer hover:border-primary-300 transition-colors"
                      onDoubleClick={() => openOverlay(backImage)}
                      title="Double-click to enlarge"
                    >
                      <img src={backImage} alt="Back label" className="w-full h-full min-h-[200px] object-contain" />
                    </div>
                  )}
                  {!frontImage && !backImage && (
                    <div className="flex-1 min-h-[200px] rounded-xl border-2 border-dashed border-emerald-200 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                      No uploaded images
                    </div>
                  )}
                </div>
                {/* Mobile: single image + turn icon */}
                <div className="md:hidden relative w-full aspect-[4/3] max-h-[280px] rounded-xl overflow-hidden border-2 border-emerald-100 bg-gray-50">
                  {frontImage && backImage && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/90 shadow-md border border-gray-200 text-gray-700 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileShowFront((prev) => !prev);
                      }}
                      aria-label={mobileShowFront ? 'Show back panel' : 'Show front panel'}
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                  )}
                  {(mobileShowFront ? frontImage : backImage) ? (
                    <button
                      type="button"
                      className="absolute inset-0 w-full h-full flex items-center justify-center"
                      onClick={() => openOverlay(mobileShowFront ? frontImage! : backImage!)}
                      aria-label="Enlarge image"
                    >
                      <img
                        src={(mobileShowFront ? frontImage : backImage) || ''}
                        alt={mobileShowFront ? 'Front of package' : 'Back label'}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                      No uploaded images
                    </div>
                  )}
                </div>
              </div>
              {/* Basic details beside images (no "Basic Information" header) */}
              <div className="md:w-72 flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3 content-start">
                <DataField label="Brand" value={extractedData.brand} />
                <DataField label="Variant" value={extractedData.variant} />
                <DataField label="Life Stage" value={extractedData.lifestage} badge />
                <DataField label="Type" value={extractedData.type} badge />
                <DataField label="Type Method" value={extractedData.typeMethod} />
                <DataField label="Adequacy" value={extractedData.adequacy} badge />
                <DataField label="Texture" value={extractedData.texture} />
                <DataField label="Weight" value={extractedData.weight != null ? `${extractedData.weight}g` : null} />
              </div>
            </div>
          </section>

          {/* Image overlay (double-click desktop / tap mobile) */}
          {overlayImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={closeOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="Enlarged image"
            >
              <img
                src={overlayImage}
                alt="Enlarged"
                className="max-w-full max-h-full w-auto h-auto object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Extracted Data Display */}
          <div className="space-y-6 mb-12">
            {/* Certifications & Claims */}
            <section className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-xl font-serif text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600" />
                Certifications & Claims
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">AAFCO Certified:</span>
                  {extractedData.aafcoCertified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Check className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      <X className="w-3 h-3" /> No
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">Other Certifications:</span>
                  {extractedData.otherCertifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {extractedData.otherCertifications.map((cert, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {cert}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">Claims:</span>
                  {extractedData.claims.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {extractedData.claims.map((claim, idx) => (
                        <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                          {claim}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
                <DataField label="Intended Use" value={extractedData.intendedUse} />
              </div>
            </section>

            {/* Ingredients & Additives */}
            <section className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-xl font-serif text-gray-900 mb-4 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary-600" />
                Ingredients & Additives
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">Ingredients:</span>
                  {extractedData.ingredients.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                      {extractedData.ingredients.map((ingredient, idx) => (
                        <li key={idx}>{ingredient}</li>
                      ))}
                    </ol>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">Additives:</span>
                  {extractedData.additives && extractedData.additives.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {extractedData.additives.map((additive, idx) => (
                        <li key={idx}>{additive}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm font-medium text-gray-700">Taurine Added:</span>
                  {extractedData.taurineAdded === null ? (
                    <span className="text-xs text-gray-500">Not specified</span>
                  ) : extractedData.taurineAdded ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Check className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      <X className="w-3 h-3" /> No
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Guaranteed Analysis */}
            <section className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-xl font-serif text-gray-900 mb-4">Guaranteed Analysis</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NutrientCard label="Protein" value={extractedData.guaranteedAnalysis.protein} />
                <NutrientCard label="Fat" value={extractedData.guaranteedAnalysis.fat} />
                <NutrientCard label="Fibre" value={extractedData.guaranteedAnalysis.fibre} />
                <NutrientCard label="Ash" value={extractedData.guaranteedAnalysis.ash} />
                <NutrientCard label="Moisture" value={extractedData.guaranteedAnalysis.moisture} />
                {extractedData.guaranteedAnalysis.others.map((other, idx) => (
                  <NutrientCardOther key={idx} label={other.label} value={other.value} />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <DataField label="Metabolised energy" value={extractedData.metEnergy100g} />
              </div>
            </section>

            {/* Pricing & Packaging */}
            <section className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-xl font-serif text-gray-900 mb-4">Pricing & Packaging</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataField 
                  label="Price" 
                  value={extractedData.price != null ? `${extractedData.priceCurrency} ${extractedData.price}` : null} 
                />
                <DataField label="Weight" value={extractedData.weight != null ? `${extractedData.weight}g` : null} />
                <DataField label="Country of Origin" value={extractedData.countryOrigin} icon={<MapPin className="w-4 h-4" />} />
              </div>
            </section>

            {/* Manufacturer & Dates */}
            <section className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-xl font-serif text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Manufacturer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataField label="Manufacturer" value={extractedData.manufacturerName} />
                <DataField 
                  label="Contact" 
                  value={extractedData.manufacturerContact} 
                  icon={<Phone className="w-4 h-4" />} 
                />
                <DataField 
                  label="Date of Manufacture" 
                  value={extractedData.dateManufacture ? new Date(extractedData.dateManufacture).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null} 
                  icon={<Calendar className="w-4 h-4" />} 
                />
                <DataField 
                  label="Expiry Date" 
                  value={extractedData.dateExpiry ? new Date(extractedData.dateExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null} 
                  icon={<Calendar className="w-4 h-4" />} 
                />
              </div>
              {extractedData.translatedFlag && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Text was translated from another language
                  </span>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Thank You Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModalAndRedirect}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">
                Appreciate your contribution!
              </h2>
              <p className="text-gray-600 text-sm">
                Redirecting you back...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper Components — always show field; use "—" when value is null/empty
function DataField({ 
  label, 
  value, 
  badge = false, 
  icon 
}: { 
  label: string; 
  value: string | null; 
  badge?: boolean; 
  icon?: React.ReactNode;
}) {
  const display = value != null && value !== '' ? value : '—';
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
        {label}
      </span>
      {badge ? (
        <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
          {display}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className={`text-sm font-medium ${display === '—' ? 'text-gray-400' : 'text-gray-900'}`}>{display}</span>
        </div>
      )}
    </div>
  );
}

function NutrientCard({ label, value }: { label: string; value: number | null }) {
  const display = value != null ? (value % 1 === 0 ? `${value}%` : `${value.toFixed(1)}%`) : '—';
  return (
    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1 capitalize">
        {label}
      </span>
      <span className={`text-lg font-bold ${value != null ? 'text-primary-700' : 'text-gray-400'}`}>
        {display}
      </span>
    </div>
  );
}

function NutrientCardOther({ label, value }: { label: string; value: string }) {
  const display = value != null && value !== '' ? value : '—';
  return (
    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1 capitalize">
        {label}
      </span>
      <span className={`text-lg font-bold ${display === '—' ? 'text-gray-400' : 'text-primary-700'}`}>{display}</span>
    </div>
  );
}
