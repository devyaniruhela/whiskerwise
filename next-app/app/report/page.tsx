'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Check, X, AlertCircle, Package, Droplets, Award, Calendar, MapPin, Phone, User } from 'lucide-react';
import type { ExtractedData } from '@/types';

export default function ReportPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  useEffect(() => {
    // Mock extracted data - in production, this will come from backend
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
        protein: 0.28,
        fat: 0.14,
        fibre: 0.03,
        ash: 0.08,
        moisture: 0.10,
        others: [{ calcium: 0.012 }, { phosphorus: 0.010 }]
      },
      taurineAdded: true,
      weight: 1500,
      price: 450,
      priceCurrency: 'INR',
      metEnergy100g: '380 kcal',
      manufaturerName: 'Sample Pet Foods Pvt Ltd',
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

          {/* Extracted Data Display */}
          <div className="space-y-6 mb-12">
            {/* Basic Information */}
            <section className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-xl font-serif text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-600" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataField label="Brand" value={extractedData.brand} />
                <DataField label="Variant" value={extractedData.variant} />
                <DataField label="Life Stage" value={extractedData.lifestage} badge />
                <DataField label="Type" value={extractedData.type} badge />
                <DataField label="Type Method" value={extractedData.typeMethod} />
                <DataField label="Adequacy" value={extractedData.adequacy} badge />
                <DataField label="Texture" value={extractedData.texture} />
                <DataField label="Weight" value={`${extractedData.weight}g`} />
              </div>
            </section>

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
                {extractedData.otherCertifications.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-2">Other Certifications:</span>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.otherCertifications.map((cert, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {extractedData.claims.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-2">Claims:</span>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.claims.map((claim, idx) => (
                        <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                          {claim}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {extractedData.intendedUse && (
                  <DataField label="Intended Use" value={extractedData.intendedUse} />
                )}
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
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    {extractedData.ingredients.map((ingredient, idx) => (
                      <li key={idx}>{ingredient}</li>
                    ))}
                  </ol>
                </div>
                {extractedData.additives && extractedData.additives.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-2">Additives:</span>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {extractedData.additives.map((additive, idx) => (
                        <li key={idx}>{additive}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
                {extractedData.guaranteedAnalysis.protein !== null && (
                  <NutrientCard label="Protein" value={extractedData.guaranteedAnalysis.protein} />
                )}
                {extractedData.guaranteedAnalysis.fat !== null && (
                  <NutrientCard label="Fat" value={extractedData.guaranteedAnalysis.fat} />
                )}
                {extractedData.guaranteedAnalysis.fibre !== null && (
                  <NutrientCard label="Fibre" value={extractedData.guaranteedAnalysis.fibre} />
                )}
                {extractedData.guaranteedAnalysis.ash !== null && (
                  <NutrientCard label="Ash" value={extractedData.guaranteedAnalysis.ash} />
                )}
                {extractedData.guaranteedAnalysis.moisture !== null && (
                  <NutrientCard label="Moisture" value={extractedData.guaranteedAnalysis.moisture} />
                )}
                {extractedData.guaranteedAnalysis.others.map((other, idx) => {
                  const [key, value] = Object.entries(other)[0];
                  return <NutrientCard key={idx} label={key} value={value} />;
                })}
              </div>
              {extractedData.metEnergy100g && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <DataField label="Metabolisable Energy (per 100g)" value={extractedData.metEnergy100g} />
                </div>
              )}
            </section>

            {/* Pricing & Packaging */}
            <section className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-xl font-serif text-gray-900 mb-4">Pricing & Packaging</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {extractedData.price && (
                  <DataField 
                    label="Price" 
                    value={`${extractedData.priceCurrency} ${extractedData.price}`} 
                  />
                )}
                <DataField label="Weight" value={`${extractedData.weight}g`} />
                {extractedData.countryOrigin && (
                  <DataField label="Country of Origin" value={extractedData.countryOrigin} icon={<MapPin className="w-4 h-4" />} />
                )}
              </div>
            </section>

            {/* Manufacturer & Dates */}
            <section className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-xl font-serif text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Manufacturer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {extractedData.manufaturerName && (
                  <DataField label="Manufacturer" value={extractedData.manufaturerName} />
                )}
                {extractedData.manufacturerContact && (
                  <DataField 
                    label="Contact" 
                    value={extractedData.manufacturerContact} 
                    icon={<Phone className="w-4 h-4" />} 
                  />
                )}
                {extractedData.dateManufacture && (
                  <DataField 
                    label="Date of Manufacture" 
                    value={new Date(extractedData.dateManufacture).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} 
                    icon={<Calendar className="w-4 h-4" />} 
                  />
                )}
                {extractedData.dateExpiry && (
                  <DataField 
                    label="Expiry Date" 
                    value={new Date(extractedData.dateExpiry).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} 
                    icon={<Calendar className="w-4 h-4" />} 
                  />
                )}
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

// Helper Components
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
  if (!value) return null;
  
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
        {label}
      </span>
      {badge ? (
        <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
          {value}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className="text-sm text-gray-900 font-medium">{value}</span>
        </div>
      )}
    </div>
  );
}

function NutrientCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1 capitalize">
        {label}
      </span>
      <span className="text-lg font-bold text-primary-700">
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}
