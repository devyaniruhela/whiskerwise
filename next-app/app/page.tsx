import Link from 'next/link';
import Header from '@/components/layout/Header';
import AboutSection from '@/components/layout/AboutSection';
import Footer from '@/components/layout/Footer';
import { Camera, FileCheck, Search } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 lg:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8 flex flex-col items-center">
              <h1 className="font-serif text-gray-900 leading-tight text-center">
                <span className="block text-[2.56rem] sm:text-[3.2rem] lg:text-[3.84rem]">Time to get</span>
                <span className="block text-5xl sm:text-6xl lg:text-7xl mt-2 text-gradient-primary">
                  Wiser
                </span>
                <span className="block text-[2.56rem] sm:text-[3.2rem] lg:text-[3.84rem] mt-1">about your cat's food</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed text-center">
                No more confusion about what to feed your cat. Get research-backed insights and make the decision that's best for them, quickly.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mt-12">
                {[
                  { icon: Camera, title: 'Scan the pack', desc: 'You upload the photo of the cat food' },
                  { icon: FileCheck, title: 'Validate the nutrition', desc: 'We analyse the food against global nutrition standards for cats' },
                  { icon: Search, title: 'Make better decisions', desc: "Pick nutrition that's adequate for your cat's needs" }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="group bg-white rounded-2xl p-6 border-2 border-emerald-100 flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-warm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-serif text-lg mb-2 text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-8">
                <Link 
                  href="/food-input"
                  className="inline-block bg-primary-600 hover:bg-primary-dark text-white hover:text-[#f0fdf4] font-semibold px-8 py-4 rounded-full shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200 text-lg"
                >
                  Analyse Cat Food
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Wiser Section */}
        <section className="relative py-16 lg:py-24 bg-gradient-to-b from-transparent via-emerald-50/50 to-transparent">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-200 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-center mb-4 text-gray-900">
              Evidence-based nutrition insights.
            </h2>
            <p className="text-2xl sm:text-3xl font-serif text-center mb-12 text-gray-700">
              Better decisions for your cat, made easier.
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {[
                {
                  title: 'Ingredient Quality Check',
                  icon: '🔬',
                  back: 'We evaluate ingredients based on obligate carnivore requirements*',
                  note: '*Based on WSAVA & NRC guidelines\n**World Small Animal Veterinary Association (the WHO for Cats & Dogs)',
                  hasCTA: false
                },
                {
                  title: 'Global Nutrition Standards',
                  icon: '🌍',
                  back: 'Nutrition measured against Indian (IS 11968:2019), American (AAFCO) and European (FEDIAF) standards to check for nutritional adequacy',
                  note: '',
                  hasCTA: false
                },
                {
                  title: 'Personalized for Your Cat',
                  icon: '💚',
                  back: "We share insights & food recommendations tailored to your cat's unique profile.",
                  note: '',
                  hasCTA: true
                },
                {
                  title: 'Never worry about hidden red flags',
                  icon: '⚠️',
                  back: 'We highlight concerning ingredients, label malpractices, and brand transparency',
                  note: '',
                  hasCTA: false
                }
              ].map((card, i) => (
                <div 
                  key={i}
                  className="group relative h-72 [perspective:1000px]"
                >
                  <div className="relative h-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                    {/* Front */}
                    <div className="absolute inset-0 bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-soft [backface-visibility:hidden] flex flex-col items-center justify-center text-center">
                      <div className="text-6xl mb-4">{card.icon}</div>
                      <h3 className="font-serif text-lg text-gray-900">{card.title}</h3>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-emerald-50 rounded-3xl p-6 border-2 border-primary-300 shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-700 font-medium text-center mb-2">{card.back}</p>
                      {card.note && (
                        <p className="text-xs text-gray-500 font-mono text-center whitespace-pre-line mt-2">{card.note}</p>
                      )}
                      {card.hasCTA && (
                        <Link 
                          href="/food-input?personalize=true"
                          className="mt-4 flex items-center justify-center text-center bg-primary-600 hover:bg-primary-dark text-white hover:text-[#f0fdf4] font-semibold px-6 py-2 rounded-full shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft transition-all duration-200 text-sm w-full"
                        >
                          <span className="w-full text-center">Get personalised insights</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      
      {/* About Section */}
      <AboutSection />

      {/* Footer */}
      <Footer />
    </>
  );
}
