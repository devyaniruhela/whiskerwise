import Link from 'next/link';
import { Camera, ScanSearch, BadgeCheck } from 'lucide-react';

const STEPS = [
  { icon: Camera, title: 'Photograph', text: 'Front and back of any cat-food pack.' },
  { icon: ScanSearch, title: 'We read the label', text: 'Every ingredient and number, checked against IS-11968, FEDIAF & AAFCO.' },
  { icon: BadgeCheck, title: 'Buy or skip', text: 'A clear verdict with reasons — personalised to your cats.' },
];

export default function Landing() {
  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <p className="mb-4 rounded-full border border-primary-200 bg-primary-50 px-4 py-1 text-xs font-medium tracking-wide text-primary-700">
        For Indian cat parents
      </p>
      <h1 className="font-serif text-4xl leading-tight text-gray-900 sm:text-5xl">
        Know what you feed,
        <br />
        <span className="text-primary-600">before you buy.</span>
      </h1>
      <p className="mt-5 max-w-md text-base text-gray-500">
        Wiser reads the label so you don&apos;t have to decode it — grounded in published
        nutrition standards, never opinion.
      </p>
      <Link
        href="/food-input"
        className="mt-8 rounded-full bg-primary-600 px-8 py-3.5 text-base font-medium text-white shadow-soft-lg transition hover:bg-primary-700"
      >
        Scan a pack
      </Link>

      <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-soft">
            <Icon className="mb-3 h-6 w-6 text-primary-600" />
            <h3 className="font-serif text-lg text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{text}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs text-gray-400">
        Trust us to help you make better decisions, faster.
      </p>
    </div>
  );
}
