'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Check, Lock, Sparkles, Unlock, AlertCircle } from 'lucide-react';
import type { StepState, StepData } from '@/types';
import { useSession } from '@/hooks/useSession';
import { ANALYZE_RESULT_PREFIX, ANALYSIS_IMAGES_STORAGE_KEY } from '@/types/analysis';
import type { StoredAnalyzeResult } from '@/types/analysis';
import { getErrorMessage } from '@/lib/errorMessages';
import { normalizeWebhookExtract, normalizeN8nSuccessResponse } from '@/lib/extractNormalizer';

const EXTRACT_STORAGE_KEY = 'ww_extract';
const POLL_INTERVAL_MS = 500;
const STEP_DURATIONS_MS = [3000, 5000, 6000]; // step 0, 1, 2; step 3 waits for response
const REMAINING_STEP_DURATION_MS = 2000; // each remaining step on success

function LoadingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysis_id');
  const returnPath = searchParams.get('return') || '/food-input';
  const { trackAnalysisComplete } = useSession();
  const analysisTrackedRef = useRef(false);
  const [userName, setUserName] = useState('there');
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const resultHandledRef = useRef(false);
  /** Index of step currently in progress (0–3 before response; used for error/remaining steps) */
  const inProgressStepRef = useRef(0);

  // Load user data and images from localStorage (set by food-input before navigate)
  useEffect(() => {
    const name = localStorage.getItem('ww_userName') || 'there';
    const front = localStorage.getItem('ww_imageFront');
    const back = localStorage.getItem('ww_imageBack');
    const catsData = localStorage.getItem('ww_cats');
    const personalizingFlag = localStorage.getItem('ww_personalizing') === 'true';
    setUserName(name);
    setFrontImage(front);
    setBackImage(back);
    setIsPersonalizing(personalizingFlag);
    let parsedCatNames: string[] = [];
    const selectedNamesRaw = localStorage.getItem('ww_selectedCatNames');
    if (selectedNamesRaw) {
      try {
        parsedCatNames = JSON.parse(selectedNamesRaw);
      } catch (_) {}
    }
    if (parsedCatNames.length === 0 && catsData) {
      try {
        const cats = JSON.parse(catsData);
        parsedCatNames = (cats || []).map((c: { name?: string }) => c.name);
      } catch (_) {}
    }
    setCatNames(parsedCatNames);
  }, []);

  // Redirect if no analysis_id
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!analysisId) {
      router.replace('/food-input');
      return;
    }
  }, [analysisId, router]);

  // Step progression: one step in progress at a time. Step 0: 3s, Step 1: 5s, Step 2: 6s, Step 3: wait for response.
  useEffect(() => {
    if (!analysisId) return;
    inProgressStepRef.current = 0;
    setSteps(['in-progress', 'pending', 'pending', 'pending', 'locked']);

    const t0 = setTimeout(() => {
      if (resultHandledRef.current) return;
      inProgressStepRef.current = 1;
      setSteps((s) => ['complete', 'in-progress', s[2], s[3], s[4]] as StepState[]);
    }, STEP_DURATIONS_MS[0]);

    const t1 = setTimeout(() => {
      if (resultHandledRef.current) return;
      inProgressStepRef.current = 2;
      setSteps((s) => ['complete', 'complete', 'in-progress', s[3], s[4]] as StepState[]);
    }, STEP_DURATIONS_MS[0] + STEP_DURATIONS_MS[1]);

    const t2 = setTimeout(() => {
      if (resultHandledRef.current) return;
      inProgressStepRef.current = 3;
      setSteps((s) => ['complete', 'complete', 'complete', 'in-progress', s[4]] as StepState[]);
    }, STEP_DURATIONS_MS[0] + STEP_DURATIONS_MS[1] + STEP_DURATIONS_MS[2]);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [analysisId]);

  // Poll for analyze result
  useEffect(() => {
    if (!analysisId || resultHandledRef.current) return;
    const key = ANALYZE_RESULT_PREFIX + analysisId;
    const poll = () => {
      if (resultHandledRef.current) return;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (!raw) return;
      try {
        const result = JSON.parse(raw) as StoredAnalyzeResult;
        resultHandledRef.current = true;
        const data = result.data;
        const isNetworkError = (data as { _network?: boolean } | undefined)?._network === true;

        // #region agent log
        const dataShape = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
        fetch('http://127.0.0.1:7245/ingest/d35b102a-7877-4b1a-8e3d-b3c0eb84a7bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loading-page poll',message:'result received',data:{isArray:Array.isArray(data),hasExtract:Array.isArray(dataShape.extract),dataStatus:dataShape.status,hasErrors:Array.isArray(dataShape.errors),resultOk:result.ok},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion

        const failAtStep = inProgressStepRef.current;
        const setErrorAtCurrentStep = (msg: string) => {
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/d35b102a-7877-4b1a-8e3d-b3c0eb84a7bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loading-page setErrorAtCurrentStep',message:'called',data:{failAtStep,msg:msg.slice(0,80)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
          // #endregion
          setStepErrors((e) => {
            const n = [...e];
            n[failAtStep] = msg;
            return n;
          });
          setSteps((s) => {
            const n = [...s];
            n[failAtStep] = 'failed';
            return n as StepState[];
          });
          setErrorModalMessage(msg);
          setShowErrorModal(true);
        };

        if (!result.ok || isNetworkError) {
          setErrorAtCurrentStep('Network error. Please try again.');
          return;
        }

        // Normalize payload: n8n may send array as data, or as data.extract, or as data.data
        const dataObjLegacy = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
        const n8nArray =
          Array.isArray(data)
            ? data
            : Array.isArray(dataObjLegacy.extract)
              ? (dataObjLegacy.extract as unknown[])
              : Array.isArray(dataObjLegacy.data)
                ? (dataObjLegacy.data as unknown[])
                : null;

        // Error format: object with data.status === "error" and data.errors[] (each with error_codes)
        if (dataObjLegacy.status === 'error' && Array.isArray(dataObjLegacy.errors)) {
          const errList = dataObjLegacy.errors as Array<{ error_codes?: string[] | null }>;
          const messages: string[] = [];
          for (const e of errList) {
            if (Array.isArray(e.error_codes) && e.error_codes.length > 0) {
              messages.push(getErrorMessage(e.error_codes[0]));
            }
          }
          const errMsg = messages.length > 0 ? messages.join(' ') : 'One or both images could not be processed. Please try again.';
          setErrorAtCurrentStep(errMsg);
          return;
        }

        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/d35b102a-7877-4b1a-8e3d-b3c0eb84a7bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loading-page n8nArray',message:'computed',data:{n8nArrayIsNull:n8nArray==null,n8nArrayLen:n8nArray?.length,dataStatus:dataObjLegacy.status,hasErrors:Array.isArray(dataObjLegacy.errors)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion

        // N8n error format: [{ all_passed: false, error_codes?: string[], images?: [{ image_id, category, error_codes[] }, ...] }]
        if (n8nArray && n8nArray.length > 0) {
          const first = n8nArray[0] as {
            all_passed?: boolean;
            error_codes?: string[];
            images?: Array<{ error_codes?: string[] | null; category?: string }>;
          };
          const enteredOldErrorBlock = first.all_passed === false;
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/d35b102a-7877-4b1a-8e3d-b3c0eb84a7bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loading-page old error block',message:'check',data:{enteredOldErrorBlock,allPassed:first.all_passed,hasImages:Array.isArray(first.images)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
          if (enteredOldErrorBlock) {
            const messages: string[] = [];
            if (Array.isArray(first.error_codes) && first.error_codes.length > 0) {
              messages.push(getErrorMessage(first.error_codes[0]));
            }
            if (messages.length === 0 && Array.isArray(first.images)) {
              for (const img of first.images) {
                if (Array.isArray(img.error_codes) && img.error_codes.length > 0) {
                  messages.push(getErrorMessage(img.error_codes[0]));
                }
              }
            }
            const errMsg = messages.length > 0 ? messages.join(' ') : 'One or both images could not be processed. Please try again.';
            setErrorAtCurrentStep(errMsg);
            return;
          }
        }

        // N8n success format: [{ status: 'success', extracted_data: [ {...}, {...} ] }]
        const n8nExtract = normalizeN8nSuccessResponse(n8nArray ?? data);
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/d35b102a-7877-4b1a-8e3d-b3c0eb84a7bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loading-page after success check',message:'branch',data:{n8nExtractNotNull:!!n8nExtract},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        if (n8nExtract) {
          localStorage.setItem(EXTRACT_STORAGE_KEY, JSON.stringify(n8nExtract));
          localStorage.setItem('ww_detectedBrand', n8nExtract.brand || '');
          localStorage.setItem('ww_detectedVariant', n8nExtract.variant || '');
          const personalizing = isPersonalizing && catNames.length > 0;

          const runRemainingSteps = (fromIndex: number) => {
            if (fromIndex > 4) {
              if (!analysisTrackedRef.current) {
                analysisTrackedRef.current = true;
                trackAnalysisComplete(personalizing);
              }
              setTimeout(() => setShowModal(true), 500);
              return;
            }
            setSteps((s) => {
              const n = [...s];
              for (let i = 0; i < fromIndex; i++) n[i] = 'complete';
              n[fromIndex] = fromIndex === 4 && personalizing ? 'unlocking' : 'in-progress';
              return n as StepState[];
            });
            if (fromIndex === 4 && personalizing) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 800);
              setTimeout(() => {
                setSteps((s) => {
                  const n = [...s];
                  n[4] = 'in-progress';
                  return n as StepState[];
                });
                setTimeout(() => {
                  setSteps((s) => {
                    const n = [...s];
                    n[4] = 'complete';
                    return n as StepState[];
                  });
                  runRemainingSteps(5);
                }, REMAINING_STEP_DURATION_MS);
              }, 800);
            } else {
              setTimeout(() => {
                setSteps((s) => {
                  const n = [...s];
                  n[fromIndex] = 'complete';
                  return n as StepState[];
                });
                runRemainingSteps(fromIndex + 1);
              }, REMAINING_STEP_DURATION_MS);
            }
          };
          runRemainingSteps(inProgressStepRef.current);
          return;
        }

        // Legacy: single object with data.image_errors or data.extract
        const imageErrors = dataObjLegacy.image_errors as Array<{ image_id: string; error_code: string }> | undefined;
        if (!result.ok && imageErrors && Array.isArray(imageErrors) && imageErrors.length > 0) {
          setErrorAtCurrentStep(getErrorMessage(imageErrors[0].error_code));
          return;
        }
        const rawExtract = dataObjLegacy.extract;
        if (rawExtract && typeof rawExtract === 'object') {
          const extract = normalizeWebhookExtract(rawExtract as Record<string, unknown>);
          localStorage.setItem(EXTRACT_STORAGE_KEY, JSON.stringify(extract));
          localStorage.setItem('ww_detectedBrand', extract.brand || '');
          localStorage.setItem('ww_detectedVariant', extract.variant || '');
          const personalizing = isPersonalizing && catNames.length > 0;

          const runRemainingSteps = (fromIndex: number) => {
            if (fromIndex > 4) {
              if (!analysisTrackedRef.current) {
                analysisTrackedRef.current = true;
                trackAnalysisComplete(personalizing);
              }
              setTimeout(() => setShowModal(true), 500);
              return;
            }
            setSteps((s) => {
              const n = [...s];
              for (let i = 0; i < fromIndex; i++) n[i] = 'complete';
              n[fromIndex] = fromIndex === 4 && personalizing ? 'unlocking' : 'in-progress';
              return n as StepState[];
            });
            if (fromIndex === 4 && personalizing) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 800);
              setTimeout(() => {
                setSteps((s) => { const n = [...s]; n[4] = 'in-progress'; return n as StepState[]; });
                setTimeout(() => {
                  setSteps((s) => { const n = [...s]; n[4] = 'complete'; return n as StepState[]; });
                  runRemainingSteps(5);
                }, REMAINING_STEP_DURATION_MS);
              }, 800);
            } else {
              setTimeout(() => {
                setSteps((s) => { const n = [...s]; n[fromIndex] = 'complete'; return n as StepState[]; });
                runRemainingSteps(fromIndex + 1);
              }, REMAINING_STEP_DURATION_MS);
            }
          };
          runRemainingSteps(inProgressStepRef.current);
        }
      } catch (_) {
        // ignore parse error, keep polling
      }
    };
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    poll();
    return () => clearInterval(interval);
  }, [analysisId, isPersonalizing, catNames.length, trackAnalysisComplete]);

  const handleTryAgain = useCallback(() => {
    if (analysisId) {
      localStorage.removeItem(ANALYZE_RESULT_PREFIX + analysisId);
    }
    localStorage.removeItem(ANALYSIS_IMAGES_STORAGE_KEY);
    localStorage.removeItem('ww_imageFront');
    localStorage.removeItem('ww_imageBack');
    setShowErrorModal(false);
    router.push(returnPath);
  }, [analysisId, returnPath, router]);

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
                        <AlertCircle className="w-6 h-6 text-red-600 animate-in zoom-in duration-300" aria-hidden />
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

      {/* Error Modal */}
      {showErrorModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-soft-xl border-2 border-red-100 animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-serif mb-3 text-gray-900">Something went wrong</h2>
            <p className="text-gray-600 mb-8">{errorModalMessage}</p>
            <button
              onClick={handleTryAgain}
              className="w-full bg-primary-600 hover:bg-primary-dark text-white hover:text-[#f0fdf4] font-semibold px-8 py-4 rounded-full shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200"
            >
              Try again
            </button>
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
            <p className="text-gray-600 mb-8">Your assessment is ready.</p>
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

export default function LoadingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoadingPageContent />
    </Suspense>
  );
}
