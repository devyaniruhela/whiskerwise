'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Check, Lock, Sparkles, Unlock, AlertCircle } from 'lucide-react';
import { QC_ERROR_MESSAGES } from '@/constants/cat-data';
import type { StepState, StepData } from '@/types';

export default function LoadingPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('there');
  const [brand, setBrand] = useState('Your food');
  const [variant, setVariant] = useState('');
  const [catNames, setCatNames] = useState<string[]>([]);
  const [isPersonalizing, setIsPersonalizing] = useState(false);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [showFront, setShowFront] = useState(true);
  const [steps, setSteps] = useState<StepState[]>(['pending', 'pending', 'pending', 'pending', 'locked']);
  const [stepErrors, setStepErrors] = useState<(string | null)[]>([null, null, null, null, null]);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const name = localStorage.getItem('ww_userName') || 'there';
    const detectedBrand = localStorage.getItem('ww_detectedBrand') || 'Sample Brand';
    const detectedVariant = localStorage.getItem('ww_detectedVariant') || 'Adult Chicken';
    const front = localStorage.getItem('ww_imageFront');
    const back = localStorage.getItem('ww_imageBack');
    const catsData = localStorage.getItem('ww_cats');
    const personalizingFlag = localStorage.getItem('ww_personalizing') === 'true';
    
    setUserName(name);
    setBrand(detectedBrand);
    setVariant(detectedVariant);
    setFrontImage(front);
    setBackImage(back);
    setIsPersonalizing(personalizingFlag);
    
    let parsedCatNames: string[] = [];
    if (catsData) {
      const cats = JSON.parse(catsData);
      parsedCatNames = cats.map((c: any) => c.name);
      setCatNames(parsedCatNames);
    }

    // Progress simulation
    const newSteps = [...steps];
    const newErrors = [...stepErrors];
    
    // Set initial step 5 state based on personalization flag
    if (personalizingFlag && parsedCatNames.length > 0) {
      newSteps[4] = 'locked'; // Start as locked
    } else {
      newSteps[4] = 'locked'; // Keep locked if not personalizing
    }
    
    // Simulate QC pass/fail (for demo, can be replaced with actual backend response)
    const qcPass = Math.random() < 0.9; // 90% success rate for demo
    const qcErrorCode = qcPass ? null : Object.keys(QC_ERROR_MESSAGES)[Math.floor(Math.random() * Object.keys(QC_ERROR_MESSAGES).length)];
    
    // Step 1: Reading the label (3 seconds)
    newSteps[0] = 'in-progress';
    setSteps([...newSteps]);

    setTimeout(() => {
      if (qcPass) {
        newSteps[0] = 'complete';
        newSteps[1] = 'in-progress';
        setSteps([...newSteps]);
        
        // Step 2: Evaluating ingredient quality (2-4 seconds)
        setTimeout(() => {
          newSteps[1] = 'complete';
          newSteps[2] = 'in-progress';
          setSteps([...newSteps]);
          
          // Step 3: Analyzing nutritional profile (2-4 seconds)
          setTimeout(() => {
            newSteps[2] = 'complete';
            newSteps[3] = 'in-progress';
            setSteps([...newSteps]);
            
            // Step 4: Preparing insights (2-3 seconds)
            setTimeout(() => {
              newSteps[3] = 'complete';
              setSteps([...newSteps]);
              
              // Check if we should personalize
              if (personalizingFlag && parsedCatNames.length > 0) {
                // Start unlock animation
                setTimeout(() => {
                  newSteps[4] = 'unlocking';
                  setSteps([...newSteps]);
                  setShowConfetti(true); // Trigger confetti
                  
                  // After unlock animation, start loading
                  setTimeout(() => {
                    setShowConfetti(false); // Stop confetti
                    newSteps[4] = 'in-progress';
                    setSteps([...newSteps]);
                    
                    // Step 5: Personalizing (2-3 seconds)
                    setTimeout(() => {
                      newSteps[4] = 'complete';
                      setSteps([...newSteps]);
                      setTimeout(() => setShowModal(true), 500);
                    }, 2000 + Math.random() * 1000);
                  }, 800); // Unlock animation duration
                }, 300); // Small delay before unlock starts
              } else {
                // No personalization, go straight to modal
                setTimeout(() => setShowModal(true), 500);
              }
            }, 2000 + Math.random() * 1000);
          }, 2000 + Math.random() * 2000);
        }, 2000 + Math.random() * 2000);
      } else {
        // QC Failed
        newSteps[0] = 'failed';
        newErrors[0] = qcErrorCode ? QC_ERROR_MESSAGES[qcErrorCode] : 'Unknown error occurred';
        setSteps([...newSteps]);
        setStepErrors([...newErrors]);
      }
    }, 3000);
  }, []);

  const stepData: StepData[] = [
    { label: 'Reading the label', detail: "Understanding what's actually in the pack" },
    { label: 'Evaluating ingredient quality', detail: 'Separating marketing from science' },
    { label: 'Analyzing nutritional profile', detail: 'Comparing to WSAVA global standards' },
    { label: 'Preparing insights for you', detail: 'Clear answers to your nutrition questions' },
    { 
      label: (isPersonalizing && catNames.length > 0)
        ? `Personalizing for ${catNames.length === 1 
            ? catNames[0] 
            : catNames.length === 2
              ? `${catNames[0]} and ${catNames[1]}`
              : `${catNames.slice(0, -1).join(', ')}, and ${catNames[catNames.length - 1]}`
          }`
        : 'Personalizing for your cat', 
      detail: (isPersonalizing && catNames.length > 0) 
        ? 'Tailoring recommendations for their unique profile' 
        : 'Add cat details for personalized insights' 
    },
  ];

  const openImageModal = (image: string | null) => {
    if (image) {
      setModalImage(image);
      setShowImageModal(true);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Personalized Header */}
          <p className="text-xl text-gray-700 mb-8 text-center font-medium">
            Hi <span className="text-primary-700">{userName}</span>, we're analyzing the food{' '}
            {isPersonalizing && catNames.length > 0 ? (
              <>
                for <span className="text-primary-700">
                  {catNames.length === 1 
                    ? catNames[0] 
                    : catNames.length === 2
                      ? `${catNames[0]} and ${catNames[1]}`
                      : `${catNames.slice(0, -1).join(', ')}, and ${catNames[catNames.length - 1]}`
                  }
                </span>
              </>
            ) : (
              'for your cat'
            )}
          </p>

          {/* Food Preview */}
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft mb-8">
            <div className="flex flex-col items-center">
              {/* Desktop: Side by side */}
              <div className="hidden sm:flex gap-4 mb-4">
                {frontImage && (
                  <div 
                    onClick={() => openImageModal(frontImage)}
                    className="w-60 h-60 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary-500 cursor-pointer transition-all hover:scale-105 shadow-soft"
                  >
                    <img src={frontImage} alt="Front of package" className="w-full h-full object-cover" />
                  </div>
                )}
                {backImage && (
                  <div 
                    onClick={() => openImageModal(backImage)}
                    className="w-60 h-60 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary-500 cursor-pointer transition-all hover:scale-105 shadow-soft"
                  >
                    <img src={backImage} alt="Back label" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Mobile: Toggle */}
              <div className="sm:hidden w-full mb-4">
                <div className="flex gap-2 mb-3 justify-center">
                  <button
                    onClick={() => setShowFront(true)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      showFront 
                        ? 'bg-primary-600 text-white shadow-soft' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setShowFront(false)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      !showFront 
                        ? 'bg-primary-600 text-white shadow-soft' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Back
                  </button>
                </div>
                {(showFront ? frontImage : backImage) && (
                  <div 
                    onClick={() => openImageModal(showFront ? frontImage : backImage)}
                    className="w-full aspect-square rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer"
                  >
                    <img 
                      src={(showFront ? frontImage : backImage) || ''} 
                      alt={showFront ? "Front of package" : "Back label"} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
              </div>

              <p className="text-sm font-mono uppercase tracking-wider text-gray-500 text-center">
                Detected: <span className="text-gray-700 font-semibold">{brand}</span>
                {variant && <> — {variant}</>}
              </p>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="bg-white rounded-3xl p-8 lg:p-12 border-2 border-emerald-100 shadow-soft-lg relative overflow-hidden">
            {/* Graph paper texture background */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23d4e8c7' stroke-width='0.5'%3E%3Cpath d='M0 0v40M10 0v40M20 0v40M30 0v40M40 0v40'/%3E%3Cpath d='M0 0h40M0 10h40M0 20h40M0 30h40M0 40h40'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            
            <div className="relative space-y-8">
              {stepData.map((step, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex-shrink-0 relative">
                    {/* Confetti particles */}
                    {i === 4 && showConfetti && (
                      <div className="absolute inset-0 pointer-events-none">
                        {Array.from({ length: 20 }).map((_, idx) => {
                          const angle = (idx / 20) * 360;
                          const distance = 40 + Math.random() * 20;
                          const duration = 0.6 + Math.random() * 0.4;
                          const delay = Math.random() * 0.1;
                          return (
                            <div
                              key={idx}
                              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                              style={{
                                background: ['#8bc34a', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'][idx % 5],
                                animation: `confetti-burst ${duration}s ease-out ${delay}s forwards`,
                                '--angle': `${angle}deg`,
                                '--distance': `${distance}px`,
                                opacity: 0,
                              } as any}
                            />
                          );
                        })}
                      </div>
                    )}
                    
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative
                      ${steps[i] === 'pending' ? 'border-2 border-dashed border-gray-300 bg-white' : ''}
                      ${steps[i] === 'in-progress' ? 'border-2 border-dashed border-primary-500 bg-white' : ''}
                      ${steps[i] === 'complete' ? 'border-2 border-dashed border-primary-500 bg-white' : ''}
                      ${steps[i] === 'failed' ? 'border-2 border-dashed border-red-600 bg-white' : ''}
                      ${steps[i] === 'locked' ? 'border-2 border-gray-300 bg-gray-100' : ''}
                      ${steps[i] === 'unlocking' ? 'border-2 border-primary-300 bg-primary-50 animate-pulse' : ''}
                    `}>
                      {steps[i] === 'pending' && (
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      )}
                      {steps[i] === 'in-progress' && (
                        <div className="absolute inset-0">
                          <svg className="w-full h-full" viewBox="0 0 48 48" style={{ animation: 'dash 2s linear infinite' }}>
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              fill="none"
                              stroke="#6cb257"
                              strokeWidth="2"
                              strokeDasharray="6 6"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      )}
                      {steps[i] === 'complete' && (
                        <div className="w-6 h-6 rounded-full bg-primary-500 animate-in zoom-in duration-300"></div>
                      )}
                      {steps[i] === 'failed' && (
                        <div className="w-6 h-6 rounded-full bg-red-600 animate-in zoom-in duration-300"></div>
                      )}
                      {steps[i] === 'locked' && (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                      {steps[i] === 'unlocking' && (
                        <Unlock className="w-5 h-5 text-primary-600 animate-in zoom-in duration-500" />
                      )}
                    </div>
                    {i < stepData.length - 1 && (
                      <div className={`absolute left-1/2 top-12 w-0.5 h-8 -translate-x-1/2 transition-colors duration-500 ${
                        steps[i] === 'complete' ? 'bg-primary-300' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-serif text-lg text-gray-900 mb-1">{step.label}</h3>
                    <p className="text-sm text-gray-600">{step.detail}</p>
                    {steps[i] === 'failed' && stepErrors[i] && (
                      <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{stepErrors[i]}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {showImageModal && modalImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl w-full">
            <img 
              src={modalImage} 
              alt="Full size preview" 
              className="w-full h-auto rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
          onClick={() => router.push('/report')}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-soft-xl border-2 border-primary-100 animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-gradient-warm rounded-full flex items-center justify-center mx-auto mb-6 shadow-warm animate-bounce">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-serif mb-3 text-gray-900">Time to get Wiser!</h2>
            <p className="text-gray-600 mb-2">Assessment ready for</p>
            <p className="font-semibold text-lg text-primary-700 mb-8">{brand} {variant && `— ${variant}`}</p>
            <button
              onClick={() => router.push('/report')}
              className="w-full bg-primary-600 hover:bg-primary-dark text-white hover:text-[#f0fdf4] font-semibold px-8 py-4 rounded-full shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200"
            >
              Go to Report
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes dash {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translate(0, 0) scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translate(var(--distance), 0) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
