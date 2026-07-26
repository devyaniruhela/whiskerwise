import { ConsultForm } from '@/components/consult/ConsultForm';
import { Footer } from '@/components/wiser/Footer';

export const metadata = {
  title: 'Personal consult | Whisker Wise',
  description:
    'Tell us what worries you about your cat and our team will get back to you with guidance shaped around them.',
};

/** /personal-consult - intake for the Nutrition Consult card on the home stack.
 *  The form sits on a warm, vintage parchment sheet floated on the cooler seashell
 *  body, with breathing room on all four sides (Curated Essentials PRD: consult). */
export default function PersonalConsult() {
  return (
    <main className="min-h-screen px-5 pb-24 pt-28 sm:pt-32">
      {/* parchment sheet: warmer than the seashell ground, grain + a faint inner
          keyline for the aged-form feel. Centred and narrow, so seashell shows on
          every side. */}
      <div className="mx-auto max-w-xl">
        <div
          className="grain relative overflow-hidden rounded-lg p-7 shadow-raised-lg sm:p-10"
          style={{ backgroundColor: '#FAF3E1', border: '1px solid rgba(124,86,42,0.26)' }}
        >
          {/* inner keyline, like the ruled border of a paper form */}
          <div
            className="pointer-events-none absolute inset-3 rounded-md"
            style={{ border: '1px solid rgba(124,86,42,0.18)' }}
            aria-hidden
          />

          <div className="relative">
            {/* Header lives inside ConsultForm so it disappears with the form on
                submit, leaving only the thank-you note. */}
            <ConsultForm />
          </div>
        </div>
      </div>

      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
