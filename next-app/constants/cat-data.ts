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

export const QC_ERROR_MESSAGES: Record<string, string> = {
  unsupported_format: "Oops! We need PNG, JPEG, HEIC, or WEBP formats",
  file_too_large: "Image is too large. Please use files under 10MB",
  resolution_too_low: "Image resolution too low. Minimum 800x600 pixels",
  unclear: "This one's a bit blurry. Hold steady and try again?",
  lighting_issue: "Can't quite read the label. Try bright light without a glare or shadows.",
  low_resolution: "We need a higher quality image to give you quality insights. Try downloading image instead of screenshots.",
  not_cat_food: "Hmm, this doesn't look like cat food. Wrong photo?"
};
