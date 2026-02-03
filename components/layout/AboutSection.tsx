import Image from 'next/image';

export default function AboutSection() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-transparent via-emerald-50/20 to-transparent relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-primary-100 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-secondary-100 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Upper Half: About Whisker Wise */}
        <div className="mb-16 bg-white/60 backdrop-blur-sm rounded-3xl p-8 sm:p-10 border border-emerald-100/50 shadow-soft">
          <h2 className="text-3xl font-serif text-gray-900 mb-8">About Whisker Wise</h2>

          <div className="space-y-4 text-lg text-gray-700">
            <p>
              Whisker Wise started with a simple mission: help cats be more understood, and empower you to care for your cats the way you want to—making good decisions, without the confusion and worry.
            </p>
            <p>
              From one cat parent to another, we know you want to give your cat the longest, healthiest life possible. But figuring out how means navigating contradictory advice, confusing labels, and products with tall claims that all look the same.
            </p>
            <p className="font-bold italic text-gray-900">
              It shouldn&apos;t be this hard.
            </p>
            <p>
              Whisker Wise is India&apos;s first research-backed cat care platform for parents who want to do right by their cats.
            </p>
            <p>
              We translate veterinary research into clear, actionable insights across cat care. Our guidance is based on established standards—WSAVA guidelines, AAFCO standards, NRC recommendations, and peer-reviewed research—adapted for Indian cat parents.
            </p>
            <p>
              Our mission is to help you add years to your cat&apos;s life through good decisions.
            </p>
            <p className="font-bold text-gray-900 pt-2">
              Less time confused. More years together.
            </p>
          </div>
        </div>

        {/* Lower Half: About the Founder */}
        <div className="bg-gradient-to-br from-primary-50/40 via-white/60 to-emerald-50/40 backdrop-blur-sm rounded-3xl p-8 sm:p-10 border border-primary-100/50 shadow-soft">
          <h2 className="text-3xl font-serif text-gray-900 mb-8">About the founder</h2>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Founder Photo */}
            <div className="flex-shrink-0">
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary-300 shadow-soft-lg ring-4 ring-primary-50">
                <Image 
                  src="/founder.jpeg"
                  alt="Devyani - Founder of Whisker Wise"
                  width={192}
                  height={192}
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>

            {/* Founder Story */}
            <div className="flex-1 space-y-6 text-lg text-gray-700">
              <p>
                Started by Devyani, who after being rescued by her cat Chérie in 2017, wanted her cat to "eat healthy" and "stay fit" just like she wanted to. After struggling to find the "right food" for her cat, she decided studying feline nutrition herself was the fastest way to get reliable answers. And that's what she did.
              </p>

              <blockquote className="border-l-4 border-primary-600 pl-6 py-2 italic text-gray-800 space-y-4 bg-white/50 rounded-r-xl pr-4">
                <p>
                  "I am vegan for animals, and my favourite point to make is to tell people that my cat only eats 
                  animal products. Because animals need species-appropriate nutrition to thrive & cats are{' '}
                  <span className="font-bold italic">obligate carnivores</span>."
                </p>
                <p>
                  "Whisker Wise exists because our cats deserve to be understood & loved for who they are. 
                  And we deserve tools that respect our time and intelligence. I hope to bring that for every cat & their people."
                </p>
              </blockquote>
            </div>
          </div>

          {/* Tagline */}
          <div className="text-left mt-8 ml-0 md:ml-56">
            <p className="text-2xl font-serif text-gray-900">
              Curated with care. Trusted by whiskers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
