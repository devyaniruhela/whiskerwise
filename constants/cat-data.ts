import { CatAvatar, BodyCondition } from '@/types';

export const CAT_AVATARS: CatAvatar[] = [
  { id: 'black-white', image: '/cats-black-white.png' },
  { id: 'black', image: '/cats-black.png' },
  { id: 'brow-tabby', image: '/cats-brow-tabby.png' },
  { id: 'brown-white', image: '/cats-brown-white.png' },
  { id: 'calico1', image: '/cats-calico1.png' },
  { id: 'calico2', image: '/cats-calico2.png' },
  { id: 'calico3', image: '/cats-calico3.png' },
  { id: 'grey-white1', image: '/cats-grey-white1.png' },
  { id: 'orange-white1', image: '/cats-orange-white1.png' },
  { id: 'orange-white2', image: '/cats-orange-white2.png' },
  { id: 'orange1', image: '/cats-orange1.png' },
  { id: 'orange2', image: '/cats-orange2.png' },
  { id: 'orange3', image: '/cats-orange3.png' },
  { id: 'tuxedo', image: '/cats-tuxedo.png' },
  { id: 'white', image: '/cats-white.png' },
];

export const BODY_CONDITIONS: BodyCondition[] = [
  { 
    id: 'underweight', 
    label: 'A Bit Skinny', 
    desc: 'Ribs visible\nSevere waist tuck',
    image: '/body-condition-underweight.png'
  },
  { 
    id: 'ideal', 
    label: 'Just Right', 
    desc: 'Ribs felt easily\nVisible waist tuck',
    image: '/body-condition-ideal.png'
  },
  { 
    id: 'overweight', 
    label: 'A Bit Chonky', 
    desc: 'Ribs hard to feel\nWaist barely visible',
    image: '/body-condition-overweight.png'
  },
  { 
    id: 'obese', 
    label: 'Significantly Overweight', 
    desc: 'Cannot feel ribs\nLarge/round belly',
    image: '/body-condition-obese.png'
  },
];

export const HEALTH_CONDITIONS = [
  'No known health conditions',
  'Arthritis',
  'Dental disease/Gingivitis',
  'Diabetes',
  'Food allergies/sensitivities',
  'Heart disease/HCM',
  'Hyperthyroidism',
  'Gastroenteric conditions/IBD',
  'Kidney disease',
  'Urinary issues',
  'Other (please describe)',
];

export const NEUTERING_OPTIONS = [
  { value: 'neutered', label: 'Neutered' },
  { value: 'not_neutered', label: 'Not neutered' },
  { value: 'unknown', label: 'Unknown' },
] as const;

export const OUTDOOR_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;

export const ACTIVITY_LEVELS = [
  { value: 'lightly', label: 'Lightly active' },
  { value: 'moderately', label: 'Moderately active' },
  { value: 'very', label: 'Very active' },
] as const;

/** Country codes for phone: code and label. +91 default. Scrollable select. */
export const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'US/Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+86', label: 'China (+86)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+34', label: 'Spain (+34)' },
  { code: '+31', label: 'Netherlands (+31)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+55', label: 'Brazil (+55)' },
  { code: '+52', label: 'Mexico (+52)' },
  { code: '+7', label: 'Russia (+7)' },
  { code: '+82', label: 'South Korea (+82)' },
  { code: '+90', label: 'Turkey (+90)' },
  { code: '+20', label: 'Egypt (+20)' },
  { code: '+234', label: 'Nigeria (+234)' },
  { code: '+254', label: 'Kenya (+254)' },
  { code: '+62', label: 'Indonesia (+62)' },
  { code: '+60', label: 'Malaysia (+60)' },
  { code: '+63', label: 'Philippines (+63)' },
  { code: '+66', label: 'Thailand (+66)' },
  { code: '+84', label: 'Vietnam (+84)' },
  { code: '+64', label: 'New Zealand (+64)' },
  { code: '+353', label: 'Ireland (+353)' },
];

export const QC_ERROR_MESSAGES: Record<string, string> = {
  unsupported_format: "Oops! We need PNG, JPEG, HEIC, or WEBP formats",
  file_too_large: "Image is too large. Please use files under 10MB",
  resolution_too_low: "Image resolution too low. Minimum 800x600 pixels",
  unclear: "This one's a bit blurry. Hold steady and try again?",
  lighting_issue: "Can't quite read the label. Try bright light without a glare or shadows.",
  low_resolution: "We need a higher quality image to give you quality insights. Try downloading image instead of screenshots.",
  not_cat_food: "Hmm, this doesn't look like cat food. Wrong photo?"
};
