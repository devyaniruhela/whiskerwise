# Wiser by Whisker-Wise Design System Summary

## Overview
This design system provides a centralized, consistent set of design tokens and component styles for the Wiser by Whisker-Wise application. All values are stored in `design-system.json` and can be easily modified in one place to update the entire application.

---

## 🎨 Color Palette

### Primary Colors (Green/Emerald Theme)
- **Primary**: Main brand color - Green (#6cb257)
  - Used for: Primary buttons, active states, success indicators, branding
  - Shades: 50-900 + dark variant
  - Primary 600: `#6cb257` (Main brand color)
  - Primary Dark: `#3d7c32` (Hover states)

### Secondary Colors
- **Secondary**: Accent color - Amber/Yellow
  - Used for: Secondary CTAs, highlights, warnings
  - Full range: 50-900

### Supporting Colors
- **Emerald**: Light green tones
  - Used for: Backgrounds, borders, subtle highlights
  
- **Gray**: Neutral colors
  - Used for: Text, borders, backgrounds, disabled states
  - Gray 900: Dark text
  - Gray 600: Medium text
  - Gray 300: Borders
  - Gray 100: Light backgrounds

- **Red**: Error and alert colors
  - Used for: Error messages, failed states, alerts
  
- **Blue**: Information colors
  - Used for: Info badges, informational messages
  
- **Amber**: Warning colors
  - Used for: Warnings, caution messages

---

## 📝 Typography

### Font Families
- **Serif**: 'Prata', Georgia, serif
  - Used for: Headings, titles, hero text
  
- **Sans**: 'DM Sans', system-ui, sans-serif
  - Used for: Body text, buttons, UI elements
  
- **Mono**: 'JetBrains Mono', monospace
  - Used for: Code, technical information

### Font Sizes
- `xs`: 0.75rem (12px) - Small labels, captions
- `sm`: 0.875rem (14px) - Secondary text
- `base`: 1rem (16px) - Body text
- `lg`: 1.125rem (18px) - Emphasized text
- `xl`: 1.25rem (20px) - Small headings
- `2xl`: 1.5rem (24px) - Section headings
- `3xl`: 1.875rem (30px) - Page headings
- `4xl`: 2.25rem (36px) - Hero text

### Font Weights
- `normal`: 400 - Body text
- `medium`: 500 - Emphasized text
- `semibold`: 600 - Buttons, labels
- `bold`: 700 - Strong emphasis

---

## 📐 Spacing System

Consistent spacing scale:
- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)
- `3xl`: 4rem (64px)
- `4xl`: 6rem (96px)

---

## 🔲 Border Radius

Rounded corners for modern UI:
- `sm`: 0.125rem (2px)
- `md`: 0.375rem (6px)
- `lg`: 0.5rem (8px)
- `xl`: 0.75rem (12px) - Inputs, cards
- `2xl`: 1rem (16px) - Large cards
- `3xl`: 1.5rem (24px) - Modal dialogs
- `full`: 9999px - Pills, circular buttons

---

## 🌊 Shadows

Soft, subtle shadows with green tint:
- `soft`: 0 2px 8px rgba(0, 0, 0, 0.08) - Standard elevation
- `soft-lg`: 0 4px 16px rgba(0, 0, 0, 0.1) - Cards, dropdowns
- `soft-xl`: 0 8px 24px rgba(0, 0, 0, 0.12) - Modals, high elevation

---

## ⚡ Transitions & Animations

### Duration
- `fast`: 150ms - Quick interactions
- `normal`: 200ms - Standard transitions
- `slow`: 300ms - Emphasis transitions
- `slower`: 500ms - Dramatic effects

### Timing Functions
- `ease`: Default easing
- `easeIn`: Accelerating
- `easeOut`: Decelerating
- `easeInOut`: Smooth both ends
- `linear`: Constant speed

### Predefined Animations
- **fadeIn**: Opacity 0 → 1
- **slideInFromRight**: Slide from right edge
- **zoomIn**: Scale 0.95 → 1
- **dash**: 360° rotation for loading spinners
- **confettiBurst**: Particle explosion effect

---

## 🎯 Component Styles

### Buttons

#### Primary Button
- **Usage**: Main actions, primary CTAs
- **Style**: Green background, white text, rounded-full
- **Hover**: Darker green, slight lift (-translate-y-1)
- **Active**: Returns to base position
- **Disabled**: 50% opacity, no interactions

#### Secondary Button
- **Usage**: Alternative actions
- **Style**: White background, gray border, rounded-full
- **Hover**: Light gray background, slight lift
- **Active**: Returns to base position

#### Tertiary Button
- **Usage**: Low-emphasis actions, links
- **Style**: Text only, underlined, gray color
- **Hover**: Darker gray

#### Bordered Button
- **Usage**: Special actions in personalization flow
- **Style**: Primary border, primary text, rounded-full
- **Hover**: Fills with primary color, white text

#### Dashed Button
- **Usage**: Add actions (add cat, add item)
- **Style**: Dashed border, rounded-xl
- **Hover**: Primary border and background tint

### Input Fields
- **Base**: White background, 2px border, rounded-xl
- **Default**: Gray border
- **Focus**: Primary border + ring effect
- **Error**: Red border + ring effect
- **Success**: Green border + ring effect
- **Disabled**: Gray background, reduced opacity

### Cards
- **Base**: White background, 2px border, rounded-2xl, soft shadow
- **Default**: Emerald border
- **Hover**: Primary border, slight lift, larger shadow
- **Active**: Primary border, primary tinted background, ring effect
- **Error**: Red border, red tinted background

### Badges
- **Primary**: Primary background tint, primary text
- **Secondary**: Gray background, gray text
- **Success**: Green background tint, green text
- **Error**: Red background tint, red text
- **Warning**: Amber background tint, amber text
- **Info**: Blue background tint, blue text

### Checkboxes
- **Base**: 5x5, rounded, 2px border
- **Default**: Emerald border
- **Checked**: Primary background and border
- **Focus**: Ring effect

### Modals
- **Overlay**: Semi-transparent black with backdrop blur
- **Panel**: Side panel (right), full height, slide-in animation
- **Dialog**: Centered, rounded-3xl, zoom-in animation
- **Content**: White, large padding, shadow

---

## 🎨 Gradients

### Primary Gradient
- **Colors**: #6cb257 → #4ade80
- **Usage**: Buttons, hero sections, emphasis elements
- **Class**: `bg-gradient-primary`

### Warm Gradient
- **Colors**: #fbbf24 → #f59e0b
- **Usage**: Accent elements, secondary emphasis
- **Class**: `bg-gradient-warm`

### Cool Gradient
- **Colors**: #60a5fa → #3b82f6
- **Usage**: Information elements, alternative styling
- **Class**: `bg-gradient-cool`

---

## 🔄 Scrollbar Styling

### Thin Scrollbar
- **Height**: 6px
- **Track**: Light emerald (#d1fae5), rounded
- **Thumb**: Medium emerald (#6ee7b7), rounded
- **Thumb Hover**: Darker emerald (#34d399)
- **Usage**: Avatar picker, long lists

---

## 📱 Breakpoints

Responsive design breakpoints:
- `sm`: 640px - Small tablets
- `md`: 768px - Tablets
- `lg`: 1024px - Small laptops
- `xl`: 1280px - Laptops
- `2xl`: 1536px - Large screens

---

## 🛠️ Usage Guide

### In Code (Tailwind Classes)
```jsx
// Using Tailwind classes directly
<button className="bg-primary-600 hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-full shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200">
  Click Me
</button>
```

### Using Design System Components
```jsx
import { Button } from '@/components/ui/Button';

// Simplified with design system
<Button variant="primary">
  Click Me
</Button>
```

### Using Design System Utilities
```jsx
import { getButtonClasses, getColor } from '@/lib/design-system';

const buttonClasses = getButtonClasses('primary');
const primaryColor = getColor('primary', '600');
```

### Direct Access to Design System
```jsx
import ds from '@/lib/design-system';

const cardStyle = {
  background: ds.colors.primary['50'],
  borderRadius: ds.borderRadius['xl'],
  boxShadow: ds.shadows.soft,
};
```

---

## 🎯 Design Principles

### 1. **Consistency**
All components use the same color palette, spacing, and interaction patterns

### 2. **Accessibility**
- Clear color contrasts
- Focus states on all interactive elements
- Proper sizing for touch targets (minimum 44x44px)

### 3. **Responsiveness**
- Mobile-first approach
- Flexible layouts
- Breakpoint-based adjustments

### 4. **Visual Hierarchy**
- Clear distinction between primary and secondary actions
- Consistent spacing creates rhythm
- Typography scale guides eye movement

### 5. **Feedback**
- Hover states for clickable elements
- Loading states for async operations
- Success/error states for form inputs
- Smooth transitions for state changes

---

## 🔧 Customization

To modify the design system:

1. **Edit `design-system.json`**: Change any value (colors, spacing, etc.)
2. **Changes propagate automatically**: All components using the design system will update
3. **Rebuild Tailwind**: Run `npm run dev` to regenerate Tailwind classes

### Example: Changing Primary Color
```json
// In design-system.json
"primary": {
  "600": "#ff6b6b"  // Change from green to red
}
```

All buttons, badges, borders, and primary-colored elements will update automatically.

---

## 📦 File Structure

```
next-app/
├── design-system.json           # Central design tokens
├── lib/
│   └── design-system.ts         # TypeScript utilities
├── components/
│   └── ui/
│       ├── Button.tsx           # Button component
│       ├── Input.tsx            # Input component
│       └── Badge.tsx            # Badge component
├── tailwind.config.ts           # Tailwind configuration
└── DESIGN_SYSTEM_SUMMARY.md     # This file
```

---

## ✅ Benefits

1. **Single Source of Truth**: All design values in one place
2. **Easy Updates**: Change once, update everywhere
3. **Consistency**: Automatically consistent across all pages
4. **Type Safety**: TypeScript support for design tokens
5. **Documentation**: Clear reference for developers and designers
6. **Maintainability**: Easy to understand and modify
7. **Scalability**: Add new components following the same patterns

---

## 🚀 Next Steps

1. **Component Library**: Continue building reusable UI components
2. **Dark Mode**: Add dark mode color variants
3. **Themes**: Create alternative color schemes
4. **Icons**: Standardize icon usage and sizing
5. **Spacing**: Document component-specific spacing patterns
6. **Motion**: Expand animation library for micro-interactions

---

*Last Updated: January 31, 2026*
