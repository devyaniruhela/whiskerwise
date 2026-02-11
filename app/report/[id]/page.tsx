'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Check, ArrowLeft, Package, Droplets, Calendar, MapPin, Phone, User } from 'lucide-react';
import type { ExtractedData } from '@/types';

function buildMockDataForId(id: string): ExtractedData {
  const isSample2 = id === 'sample-2';
  return {
    brand: isSample2 ? 'Other Brand' : 'Sample Brand',
    variant: isSample2 ? 'Kitten Growth' : 'Adult Chicken',
    lifestage: isSample2 ? 'kitten' : 'adult',
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
      'Taurine (1200mg/kg)',
    ],
    additives: ['Vitamin E (600 IU)', 'Vitamin A (18000 IU)', 'Zinc Sulphate'],
    guaranteedAnalysis: {
      protein: 28,
      fat: 14,
      fibre: 3,
      ash: 8,
      moisture: 10,
      others: [{ label: 'Calcium', value: '0.012%' }, { label: 'Phosphorus', value: '0.010%' }],
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
    translatedFlag: false,
  };
}

export default function ReportByIdPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const [feedback, setFeedback] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  useEffect(() => {
    if (id) {
      setExtractedData(buildMockDataForId(id));
    }
  }, [id]);

  const handleVerification = (response: string) => {
    setShowModal(true);
    setTimeout(() => router.push('/profile'), 3000);
  };

  const closeModalAndRedirect = () => {
    setShowModal(false);
    router.push('/profile');
  };

  if (!id || !extractedData) {
    return (
      <>
        <Header />
        <main className="pt-6 sm:pt-8 pb-12 sm:pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
            <p className="text-gray-500 text-sm sm:text-base">Loading report...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-6 sm:pt-8 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:underline mb-4 sm:mb-6 font-mono text-xs sm:text-sm min-h-[44px] items-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to profile
          </Link>

          <header className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-gray-900 mb-2">
              Report
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Review the details for this scan</p>
          </header>

          {/* Verification Section - at top */}
          <div className="bg-gradient-to-br from-primary-50 to-emerald-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border-2 border-primary-200 shadow-soft-lg mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-serif text-gray-900 mb-2 text-center">
              Does this information look right to you?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 text-center">
              Match it with the information on the images uploaded by you.
            </p>
            <div className="mb-4 sm:mb-6">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please share comments/feedback here"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all resize-none text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-stretch sm:items-center">
              <button
                onClick={() => handleVerification('match')}
                className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-lg min-h-[48px]"
              >
                Yes! Correct & complete
              </button>
              <button
                onClick={() => handleVerification('incorrect')}
                className="flex-1 sm:flex-none bg-white border-2 border-gray-300 text-gray-700 font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-gray-50 min-h-[48px]"
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

          <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
            <section className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-lg sm:text-xl font-serif text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-600" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataField label="Brand" value={extractedData.brand} />
                <DataField label="Variant" value={extractedData.variant} />
                <DataField label="Life Stage" value={extractedData.lifestage} badge />
                <DataField label="Type" value={extractedData.type} badge />
                <DataField label="Adequacy" value={extractedData.adequacy} badge />
                <DataField label="Texture" value={extractedData.texture} />
                <DataField label="Weight" value={extractedData.weight != null ? `${extractedData.weight}g` : null} />
              </div>
            </section>

            <section className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-lg sm:text-xl font-serif text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary-600" />
                Guaranteed Analysis
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <NutrientCard label="Protein" value={extractedData.guaranteedAnalysis.protein} />
                <NutrientCard label="Fat" value={extractedData.guaranteedAnalysis.fat} />
                <NutrientCard label="Fibre" value={extractedData.guaranteedAnalysis.fibre} />
                <NutrientCard label="Ash" value={extractedData.guaranteedAnalysis.ash} />
                <NutrientCard label="Moisture" value={extractedData.guaranteedAnalysis.moisture} />
                {extractedData.guaranteedAnalysis.others.map((other, idx) => (
                  <NutrientCardOther key={idx} label={other.label} value={other.value} />
                ))}
              </div>
            </section>

            <section className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-100 shadow-soft">
              <h2 className="text-lg sm:text-xl font-serif text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Manufacturer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataField label="Manufacturer" value={extractedData.manufacturerName} />
                <DataField label="Contact" value={extractedData.manufacturerContact} icon={<Phone className="w-4 h-4" />} />
                <DataField label="Country of Origin" value={extractedData.countryOrigin} icon={<MapPin className="w-4 h-4" />} />
                <DataField
                  label="Expiry Date"
                  value={extractedData.dateExpiry ? new Date(extractedData.dateExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModalAndRedirect}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">
                Appreciate your contribution!
              </h2>
              <p className="text-gray-600 text-sm">Redirecting you back to profile...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DataField({
  label,
  value,
  badge = false,
  icon,
}: {
  label: string;
  value: string | null;
  badge?: boolean;
  icon?: React.ReactNode;
}) {
  const display = value != null && value !== '' ? value : '—';
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">{label}</span>
      {badge ? (
        <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
          {display}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          {icon}
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
