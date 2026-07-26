'use client';

import { useState } from 'react';
import { ArrowRight, Check } from '@phosphor-icons/react';
import { Input, Select, Textarea } from '@/components/ui';
import { COUNTRY_CODES } from '@/constants/cat-data';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { WEB3FORMS_KEY } from '@/lib/flags';
import type { CatProfile, UserProfile } from '@/types';

/** Personal-consult intake (/personal-consult). Common fields reuse the profile
 *  primitives (Input/Select) in the same format as app/profile - phone with a
 *  country code, cat age as DOB + years + months - so the data maps straight onto
 *  the profile schema. On submit it (1) emails the team via Web3Forms and (2)
 *  fills any EMPTY profile fields for the anonymous user. Both are best-effort:
 *  neither blocks the confirmation the visitor sees. */

const CONCERNS = [
  'Food/Feeding',
  'Weight',
  'Health condition',
  'Behaviour',
  'Introductions (new house/another pet)',
  'Litter box issue',
  "I'm not sure",
] as const;

type Errors = Partial<Record<'firstName' | 'phone' | 'catName' | 'age' | 'months' | 'concerns', string>>;

const Req = () => <span className="text-iron"> *</span>;

/** Same maths as the profile CatForm: a DOB auto-fills years + months. */
function ageFromDob(dob: string): { years: number; months: number } {
  const d = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (now.getDate() < d.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

function ageLabel(years: number, months: number, dob: string): string {
  const parts = [years ? `${years}y` : '', months ? `${months}m` : ''].filter(Boolean).join(' ');
  return parts || (dob ? `DOB ${dob}` : '');
}

export function ConsultForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [catName, setCatName] = useState('');
  const [catDob, setCatDob] = useState('');
  const [catAgeYear, setCatAgeYear] = useState(0);
  const [catAgeMonth, setCatAgeMonth] = useState(0);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [describe, setDescribe] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const maxDob = new Date().toISOString().slice(0, 10);

  const clearErr = (k: keyof Errors) => setErrors((e) => ({ ...e, [k]: undefined }));

  const toggleConcern = (c: string) => {
    clearErr('concerns');
    setConcerns((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  };

  const onDob = (v: string) => {
    setCatDob(v);
    if (v) { const { years, months } = ageFromDob(v); setCatAgeYear(years); setCatAgeMonth(months); }
    clearErr('age'); clearErr('months');
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!firstName.trim()) e.firstName = 'Add your first name.';
    if (phoneDigits.length !== 10) e.phone = 'Enter a 10-digit phone number.';
    if (!catName.trim()) e.catName = "Add your cat's name.";
    if (!catAgeYear && !catAgeMonth && !catDob) e.age = 'Add an age: years, months, or a date of birth.';
    if (catAgeMonth > 12) e.months = 'Months go from 1 to 12. For older cats, use years.';
    if (concerns.length === 0) e.concerns = 'Pick at least one.';
    return e;
  };

  /** Web3Forms email to the team. Skipped (logged) when no key is set, so the form
   *  ships and works before the key lands - the visitor still gets a confirmation. */
  async function notifyTeam(): Promise<void> {
    if (!WEB3FORMS_KEY) { console.info('[consult] notify skipped: no WEB3FORMS_KEY'); return; }
    const started = performance.now();
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `New cat consult request: ${firstName.trim()} for ${catName.trim()}`,
          Name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          Phone: `${phoneCode} ${phoneDigits}`,
          Cat: catName.trim(),
          Age: ageLabel(catAgeYear, catAgeMonth, catDob),
          Concerns: concerns.join(', '),
          Message: describe.trim() || '(none)',
        }),
      });
      console.info(`[consult] notify ${res.ok ? 'ok' : `failed ${res.status}`} in ${Math.round(performance.now() - started)}ms`);
    } catch (err) {
      console.warn('[consult] notify error (non-blocking)', err);
    }
  }

  /** Fill EMPTY profile fields only - never overwrite what the visitor already
   *  saved. saveProfile is a full-row write, so we merge onto the current profile
   *  first. Best-effort: any failure is logged and swallowed. */
  async function syncProfile(): Promise<void> {
    const started = performance.now();
    try {
      const me = (await api.me().catch(() => null)) ?? ({} as UserProfile);
      const cats = await api.cats().catch(() => [] as CatProfile[]);

      const phone = `${phoneCode} ${phoneDigits}`;
      const nextMe: UserProfile = {
        ...me,
        first_name: me.first_name?.trim() ? me.first_name : firstName.trim(),
        last_name: me.last_name?.trim() ? me.last_name : (lastName.trim() || me.last_name || null),
        phone_number: me.phone_number?.trim() ? me.phone_number : phone,
      };
      if (
        nextMe.first_name !== me.first_name ||
        nextMe.last_name !== me.last_name ||
        nextMe.phone_number !== me.phone_number
      ) {
        await api.saveMe(nextMe);
      }

      const match = cats.find(
        (c) => c.cat_name.trim().toLowerCase() === catName.trim().toLowerCase(),
      );
      if (match) {
        const ageEmpty = !match.cat_age_year && !match.cat_age_month && !match.cat_dob;
        if (ageEmpty) {
          await api.saveCat({
            ...match,
            cat_dob: match.cat_dob ?? (catDob || null),
            cat_age_year: catAgeYear || 0,
            cat_age_month: catAgeMonth || 0,
          });
        }
      } else {
        await api.saveCat({
          cat_name: catName.trim(),
          cat_dob: catDob || null,
          cat_age_year: catAgeYear || 0,
          cat_age_month: catAgeMonth || 0,
          health_condition: [],
        });
      }
      console.info(`[consult] profile sync ok in ${Math.round(performance.now() - started)}ms`);
    } catch (err) {
      console.warn('[consult] profile sync failed (non-blocking)', err);
    }
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.values(e).some(Boolean)) {
      console.info(`[consult] submit rejected: ${Object.keys(e).filter((k) => e[k as keyof Errors]).join(', ')}`);
      return;
    }
    setSubmitting(true);
    const started = performance.now();
    track('cta_click', { cta: 'consult_submit', page: 'personal_consult', concerns: concerns.length });
    await Promise.allSettled([notifyTeam(), syncProfile()]);
    console.info(`[consult] submit done in ${Math.round(performance.now() - started)}ms`);
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="px-2 py-10 text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-ochre text-seashell">
          <Check size={26} weight="bold" aria-hidden />
        </span>
        <h2 className="font-serif text-3xl leading-tight text-ink">Thank you, we&apos;ve got it.</h2>
        <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-ink-muted">
          Our team will look over what you&apos;ve shared about {catName.trim() || 'your cat'} and get
          back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">
          What worries you about your cat?
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-muted">
          Tell us what&apos;s going on and we&apos;ll take it from there.
        </p>
      </header>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={<>First name<Req /></>} value={firstName} error={errors.firstName}
          autoComplete="given-name" placeholder="Your first name"
          onChange={(e) => { setFirstName(e.target.value); clearErr('firstName'); }} />
        <Input label="Last name" value={lastName} autoComplete="family-name" placeholder="Your last name"
          onChange={(e) => setLastName(e.target.value)} />
      </div>

      <div>
        <p className="mb-1.5 font-sans text-sm font-semibold text-ink">Phone number<Req /></p>
        <div className="flex gap-2">
          <div className="w-24 shrink-0">
            <Select value={phoneCode} options={COUNTRY_CODES.map((c) => ({ value: c.code, label: c.code }))}
              onChange={setPhoneCode} />
          </div>
          <Input className="flex-1" type="tel" inputMode="numeric" maxLength={10}
            placeholder="10-digit number" value={phoneDigits} error={errors.phone}
            onChange={(e) => { setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10)); clearErr('phone'); }} />
        </div>
      </div>

      <Input label={<>Cat&apos;s name<Req /></>} value={catName} error={errors.catName} placeholder="e.g. Toto"
        onChange={(e) => { setCatName(e.target.value); clearErr('catName'); }} />

      {/* age in the profile format: DOB auto-fills years + months; the required
          marker sits on the years field so there is no duplicate "Age" header */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Date of birth" type="date" max={maxDob} value={catDob} error={errors.age}
          onChange={(e) => onDob(e.target.value)} />
        <Input label={<>Age: years<Req /></>} type="number" min={0} max={30} value={catAgeYear || ''}
          onChange={(e) => { setCatAgeYear(+e.target.value || 0); clearErr('age'); }} />
        <Input label="+ months" type="number" min={0} max={12} value={catAgeMonth || ''} error={errors.months}
          onChange={(e) => { setCatAgeMonth(+e.target.value || 0); clearErr('age'); clearErr('months'); }} />
      </div>

      <fieldset>
        <legend className="mb-2 font-sans text-sm font-semibold text-ink">
          What are you concerned about?<Req />
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONCERNS.map((c) => {
            const on = concerns.includes(c);
            return (
              <label key={c}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                  on ? 'border-ochre bg-ochre-tint text-ink'
                     : 'border-hairline-strong bg-paper text-ink-muted hover:border-graphite/50'
                }`}>
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
                  on ? 'border-ochre bg-ochre text-seashell' : 'border-hairline-strong bg-transparent'
                }`}>
                  {on && <Check size={12} weight="bold" aria-hidden />}
                </span>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleConcern(c)} />
                {c}
              </label>
            );
          })}
        </div>
        {errors.concerns && <p className="mt-1.5 text-sm text-iron">{errors.concerns}</p>}
      </fieldset>

      <Textarea label={<>Describe your concern <span className="font-normal text-ink-faint">(optional)</span></>}
        value={describe} rows={4}
        placeholder="Anything you'd like us to know before we get in touch"
        onChange={(e) => setDescribe(e.target.value)} />

      <div className="pt-1">
        <button type="submit" disabled={submitting}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-ochre px-6 py-3 font-sans text-base font-semibold text-seashell shadow-raised transition-all duration-150 ease-out hover:bg-ochre-deep active:shadow-pressed disabled:opacity-70">
          {submitting ? 'Sending…' : 'Submit'}
          {!submitting && <ArrowRight size={18} weight="bold" aria-hidden />}
        </button>
        <p className="mt-3 text-center text-sm text-ink-faint">
          Submit your concern and our team will get back to you shortly.
        </p>
      </div>
      </form>
    </>
  );
}
