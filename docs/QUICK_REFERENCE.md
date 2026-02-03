# Quick Reference Guide - Design System

## 🎨 Common Color Classes

```jsx
// Primary Colors
bg-primary-50       // Lightest green
bg-primary-600      // Main brand green
bg-primary-dark     // Dark green (hover states)
text-primary-600    // Primary text color
border-primary-500  // Primary border

// Grays
bg-gray-50          // Almost white
bg-gray-100         // Light gray backgrounds
text-gray-600       // Secondary text
text-gray-900       // Primary dark text
border-gray-200     // Default borders

// Status Colors
bg-red-500          // Error backgrounds
bg-green-500        // Success backgrounds
bg-amber-50         // Warning backgrounds
bg-blue-50          // Info backgrounds
```

## 🎯 Button Patterns

```jsx
// Primary Button
<button className="bg-primary-600 hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-full shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200">
  Primary Action
</button>

// Using Component
import { Button } from '@/components/ui/Button';
<Button variant="primary">Primary Action</Button>

// Secondary Button
<button className="bg-white border-2 border-gray-300 text-gray-700 font-semibold px-8 py-4 rounded-full hover:bg-gray-50 hover:-translate-y-1 transition-all duration-200">
  Secondary Action
</button>

// Bordered Button (Personalization style)
<button className="border-2 border-primary-500 text-primary-700 font-medium px-5 py-2.5 rounded-full hover:bg-primary-dark hover:text-[#f0fdf4] transition-all duration-200">
  Personalize
</button>

// Dashed Button (Add action)
<button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary-500 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200">
  Add Item
</button>
```

## 📝 Input Patterns

```jsx
// Default Input
<input className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all" />

// Using Component
import { Input } from '@/components/ui/Input';
<Input state="default" placeholder="Enter text" />

// Error State
<input className="w-full px-4 py-3 rounded-xl border-2 border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all" />

// Select/Dropdown
<select className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all">
  <option>Option 1</option>
</select>

// Textarea
<textarea className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all resize-none" rows={3} />

// Checkbox
<input type="checkbox" className="w-5 h-5 rounded border-2 border-emerald-300 text-primary-600 focus:ring-4 focus:ring-primary-500/20 cursor-pointer" />
```

## 🃏 Card Patterns

```jsx
// Default Card
<div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft">
  Card Content
</div>

// Hoverable Card
<div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft hover:border-primary-500 hover:-translate-y-2 hover:shadow-soft-lg transition-all duration-300">
  Card Content
</div>

// Active/Selected Card
<div className="bg-white rounded-2xl p-6 border-2 border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-soft">
  Selected Card
</div>

// Section Container
<div className="bg-white rounded-3xl p-8 lg:p-12 border-2 border-emerald-100 shadow-soft-lg">
  Large Section Content
</div>
```

## 🏷️ Badge Patterns

```jsx
// Primary Badge
<span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
  Badge
</span>

// Using Component
import { Badge } from '@/components/ui/Badge';
<Badge variant="primary">Badge Text</Badge>

// Success Badge
<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
  <Check className="w-3 h-3" /> Success
</span>

// Error Badge
<span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
  <X className="w-3 h-3" /> Error
</span>

// Info Badge (Chips)
<span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
  Information
</span>
```

## 🎭 Modal Patterns

```jsx
// Modal Overlay
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />

// Side Panel Modal
<div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
  Panel Content
</div>

// Centered Dialog Modal
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
    Dialog Content
  </div>
</div>
```

## 📊 Loading States

```jsx
// Loading Spinner
<div className="w-10 h-10">
  <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
</div>

// Dashed Circle - In Progress
<div className="w-12 h-12 rounded-full border-2 border-dashed border-primary-500 bg-white relative">
  <svg className="w-full h-full" viewBox="0 0 48 48" style={{ animation: 'dash 2s linear infinite' }}>
    <circle cx="24" cy="24" r="20" fill="none" stroke="#6cb257" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" />
  </svg>
</div>

// Completed State
<div className="w-12 h-12 rounded-full border-2 border-dashed border-primary-500 bg-white flex items-center justify-center">
  <div className="w-6 h-6 rounded-full bg-primary-500" />
</div>

// Error State
<div className="w-12 h-12 rounded-full border-2 border-dashed border-red-600 bg-white flex items-center justify-center">
  <div className="w-6 h-6 rounded-full bg-red-600" />
</div>
```

## 📐 Spacing Patterns

```jsx
// Padding
p-3    // 12px padding all sides
p-6    // 24px padding all sides
p-8    // 32px padding all sides
px-4   // 16px horizontal padding
py-3   // 12px vertical padding

// Margin
mb-2   // 8px bottom margin
mb-4   // 16px bottom margin
mb-6   // 24px bottom margin
mb-8   // 32px bottom margin

// Gap (Flex/Grid)
gap-2  // 8px gap
gap-3  // 12px gap
gap-4  // 16px gap
gap-6  // 24px gap
```

## 📝 Typography Patterns

```jsx
// Headings
<h1 className="text-3xl sm:text-4xl font-serif text-gray-900">
  Page Title
</h1>

<h2 className="text-2xl font-serif text-gray-900">
  Section Heading
</h2>

<h3 className="text-xl font-serif text-gray-900">
  Subsection Heading
</h3>

// Body Text
<p className="text-gray-600">
  Regular body text
</p>

<p className="text-sm text-gray-600">
  Small body text
</p>

<p className="text-xs text-gray-500">
  Caption or helper text
</p>

// Labels
<label className="text-sm font-medium text-gray-700">
  Field Label
</label>

<label className="text-xs text-gray-500">
  Helper Label
</label>

// Mono/Technical
<span className="font-mono text-sm text-gray-700">
  Technical Info
</span>
```

## 🎨 Gradients

```jsx
// Primary Gradient (Green)
<div className="bg-gradient-primary">
  Gradient Background
</div>

// Or with Tailwind
<div className="bg-gradient-to-br from-primary-600 to-primary-400">
  Custom Gradient
</div>

// Gradient Text
<span className="text-gradient-primary bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
  Gradient Text
</span>
```

## 🔄 Transitions & Animations

```jsx
// Standard Transition
className="transition-all duration-200"

// Hover Lift
className="hover:-translate-y-1 transition-all duration-200"

// Active Press
className="active:translate-y-0 active:shadow-soft"

// Smooth Color Transition
className="transition-colors duration-200"

// Fade In
className="animate-in fade-in duration-300"

// Slide In
className="animate-in slide-in-from-right duration-300"

// Zoom In
className="animate-in zoom-in duration-300"

// Spin (Loading)
className="animate-spin"
```

## 🎯 Common Patterns

### Error Message
```jsx
<div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
  <p>Error message here</p>
</div>
```

### Success Message
```jsx
<div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
  <p>Success message here</p>
</div>
```

### Info Box
```jsx
<div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
  <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
  <p>Helpful information here</p>
</div>
```

### Image Upload Zone
```jsx
<div className="relative rounded-2xl border-2 border-dashed border-emerald-200 bg-white hover:border-primary-500 hover:bg-emerald-50 p-8 transition-all duration-300 cursor-pointer">
  <Upload className="w-10 h-10 text-gray-400 mb-3 mx-auto" />
  <span className="text-sm text-gray-600 block text-center">Tap to upload</span>
</div>
```

---

## 💡 Pro Tips

1. **Always use transition classes** for smooth interactions
2. **Combine hover with translate-y** for button lift effects
3. **Use ring effects on focus** for accessibility
4. **Add disabled states** to all interactive elements
5. **Use consistent spacing** (multiples of 4px/0.25rem)
6. **Round buttons should be `rounded-full`**
7. **Cards and inputs should be `rounded-xl` or `rounded-2xl`**
8. **Always add `duration-*` with `transition-*`**

---

*For complete documentation, see DESIGN_SYSTEM_SUMMARY.md*
