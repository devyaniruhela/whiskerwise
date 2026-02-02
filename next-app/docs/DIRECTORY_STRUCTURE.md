# Project Directory Structure

## ✅ Reorganized with Best Practices (Next.js 15 + React)

```
next-app/
├── app/                          # Next.js 15 App Router
│   ├── page.tsx                  # Home/Landing page
│   ├── layout.tsx                # Root layout
│   ├── food-input/               # Food input flow
│   │   └── page.tsx
│   ├── loading-page/             # Loading/Analysis page
│   │   └── page.tsx
│   ├── report/                   # Verification & Results page
│   │   └── page.tsx
│   ├── profile/                  # User profile page
│   │   └── page.tsx
│   └── now-wiser/                # About/Info page
│       └── page.tsx
│
├── components/                   # React Components
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx            # App header
│   │   ├── Footer.tsx            # App footer
│   │   └── AboutSection.tsx      # About section
│   ├── ui/                       # Reusable UI primitives
│   │   ├── Button.tsx            # Button component
│   │   ├── Input.tsx             # Input component
│   │   ├── Badge.tsx             # Badge component
│   │   └── index.ts              # Export barrel
│   └── features/                 # Feature-specific components (future)
│
├── lib/                          # Library code & utilities
│   └── design-system.ts          # Design system helpers
│
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Shared types (CatProfile, ExtractedData, etc.)
│
├── constants/                    # Application constants
│   └── cat-data.ts               # Cat avatars, body conditions, health conditions
│
├── hooks/                        # Custom React hooks (future)
│
├── utils/                        # Utility functions
│   └── helpers/                  # Helper functions (future)
│
├── config/                       # Configuration files
│   └── design-system.json        # Design system tokens
│
├── styles/                       # Global styles
│   └── globals.css               # Global CSS
│
├── public/                       # Static assets
│   ├── cats-*.png                # Cat avatar images
│   ├── body-condition-*.png      # Body condition images
│   ├── logo-*.png                # Logo variants
│   └── ...                       # Other static assets
│
├── docs/                         # Documentation
│   ├── DIRECTORY_STRUCTURE.md    # This file
│   ├── DESIGN_SYSTEM_SUMMARY.md  # Design system documentation
│   └── QUICK_REFERENCE.md        # Quick reference guide
│
├── .next/                        # Next.js build output (generated)
├── node_modules/                 # Dependencies (generated)
│
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.mjs            # PostCSS configuration
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Dependency lock file
├── .eslintrc.json                # ESLint configuration
├── .gitignore                    # Git ignore rules
├── next-env.d.ts                 # Next.js TypeScript declarations
└── README.md                     # Project readme
```

---

## 📁 Directory Explanations

### `/app` - Pages & Routes
- **Purpose**: Next.js 15 App Router pages
- **Convention**: Each folder is a route, `page.tsx` is the page component
- **Example**: `/app/food-input/page.tsx` → `/food-input` route

### `/components` - React Components

#### `/components/layout`
- **Purpose**: Layout-level components used across pages
- **Contains**: Header, Footer, AboutSection
- **Import**: `import Header from '@/components/layout/Header'`

#### `/components/ui`
- **Purpose**: Reusable, primitive UI components
- **Contains**: Button, Input, Badge, etc.
- **Import**: `import { Button } from '@/components/ui'`
- **Features**: 
  - Design system integrated
  - TypeScript types
  - Variants support

#### `/components/features` (Future)
- **Purpose**: Feature-specific, complex components
- **Examples**: CatProfileCard, IngredientList, etc.

### `/lib` - Library Code
- **Purpose**: Reusable library code, utilities, helpers
- **Contains**: Design system utilities, API clients, etc.
- **Import**: `import { getButtonClasses } from '@/lib/design-system'`

### `/types` - TypeScript Types
- **Purpose**: Shared TypeScript type definitions
- **Contains**: Interfaces, types, enums used across the app
- **Import**: `import type { CatProfile } from '@/types'`
- **Benefits**:
  - Centralized type definitions
  - No duplication
  - Easy to maintain
  - Type safety across the app

### `/constants` - Application Constants
- **Purpose**: Static data, configuration constants
- **Contains**: CAT_AVATARS, BODY_CONDITIONS, HEALTH_CONDITIONS, etc.
- **Import**: `import { CAT_AVATARS } from '@/constants/cat-data'`
- **Benefits**:
  - Single source of truth
  - Easy to update
  - No magic strings/numbers

### `/hooks` - Custom React Hooks (Future)
- **Purpose**: Reusable React hooks
- **Examples**: `useLocalStorage`, `useCatProfile`, `useFormValidation`
- **Import**: `import { useLocalStorage } from '@/hooks/useLocalStorage'`

### `/utils` - Utility Functions (Future)
- **Purpose**: Pure helper functions
- **Examples**: formatters, validators, parsers
- **Import**: `import { formatCurrency } from '@/utils/helpers/formatters'`

### `/config` - Configuration Files
- **Purpose**: Application configuration, settings
- **Contains**: design-system.json, feature flags, etc.
- **Import**: `import designSystem from '@/config/design-system.json'`

### `/styles` - Global Styles
- **Purpose**: Global CSS, Tailwind directives
- **Contains**: globals.css
- **Import**: `import '@/styles/globals.css'`

### `/public` - Static Assets
- **Purpose**: Static files served as-is
- **Access**: `/image.png` in code → `https://domain.com/image.png`
- **Contains**: Images, fonts, icons, etc.

### `/docs` - Documentation
- **Purpose**: Project documentation
- **Contains**: Architecture docs, guides, references
- **Not imported**: For developers to read

---

## 🎯 Import Path Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Usage Examples:

```tsx
// Components
import Header from '@/components/layout/Header';
import { Button, Input } from '@/components/ui';

// Types
import type { CatProfile, ExtractedData } from '@/types';

// Constants
import { CAT_AVATARS, BODY_CONDITIONS } from '@/constants/cat-data';

// Lib
import { getButtonClasses } from '@/lib/design-system';

// Config
import designSystem from '@/config/design-system.json';

// Styles
import '@/styles/globals.css';
```

---

## ✅ Benefits of This Structure

### 1. **Separation of Concerns**
- Pages in `/app`
- Components in `/components`
- Logic in `/lib`
- Types in `/types`
- Data in `/constants`

### 2. **Scalability**
- Easy to add new features
- Clear where things belong
- Minimal file conflicts in teams

### 3. **Maintainability**
- Easy to find files
- Clear dependencies
- No circular imports
- Consistent patterns

### 4. **Type Safety**
- Centralized type definitions
- No duplication
- Compile-time error checking

### 5. **Reusability**
- UI components are reusable
- Utilities are pure functions
- Constants are shared

### 6. **Testability**
- Pure functions in `/utils`
- Isolated components
- Easy to mock dependencies

---

## 🏗️ Best Practices Followed

### ✅ Next.js 15 Conventions
- App Router structure
- Server/Client component separation
- Route groups for organization

### ✅ React Best Practices
- Component composition
- Props interface definitions
- Hooks for side effects
- Controlled components

### ✅ TypeScript Best Practices
- Strict type definitions
- Interface over type (when appropriate)
- No `any` types
- Proper type exports

### ✅ File Naming
- `PascalCase` for components: `Button.tsx`
- `camelCase` for utilities: `formatDate.ts`
- `kebab-case` for routes: `food-input/`
- `SCREAMING_SNAKE_CASE` for constants: `CAT_AVATARS`

### ✅ Import Organization
1. External dependencies (React, Next.js, etc.)
2. Internal components
3. Internal utilities/lib
4. Types
5. Styles
6. Assets

Example:
```tsx
// 1. External
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Components
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui';

// 3. Lib/Utils
import { getButtonClasses } from '@/lib/design-system';

// 4. Types
import type { CatProfile } from '@/types';

// 5. Constants
import { CAT_AVATARS } from '@/constants/cat-data';

// 6. Styles (if needed)
import '@/styles/custom.css';
```

---

## 🚀 Adding New Features

### Adding a New Page
1. Create folder in `/app`: `/app/new-page/`
2. Add `page.tsx`: `/app/new-page/page.tsx`
3. Import shared components from `/components`

### Adding a New Component
1. Determine type: layout, ui, or feature
2. Create in appropriate folder: `/components/ui/NewComponent.tsx`
3. Export from index: `/components/ui/index.ts`
4. Use in pages: `import { NewComponent } from '@/components/ui'`

### Adding a New Type
1. Add to `/types/index.ts`
2. Use across the app: `import type { NewType } from '@/types'`

### Adding New Constants
1. Add to appropriate file in `/constants`
2. Export: `export const NEW_CONSTANT = [...];`
3. Import: `import { NEW_CONSTANT } from '@/constants/filename'`

### Adding a New Utility
1. Create in `/utils/helpers/`
2. Export pure function
3. Write tests (future)
4. Import: `import { utilityName } from '@/utils/helpers/filename'`

---

## 📊 Folder Statistics

- **Pages**: 6 routes
- **Layout Components**: 3 (Header, Footer, AboutSection)
- **UI Components**: 3 (Button, Input, Badge) + growing
- **Type Definitions**: 8 interfaces/types
- **Constants**: 3 major data sets (avatars, conditions, messages)
- **Configuration**: 1 design system file
- **Documentation**: 3 comprehensive guides

---

## 🔄 Migration Notes

### What Changed?
1. **Moved** `design-system.json` → `/config/`
2. **Moved** `globals.css` → `/styles/`
3. **Moved** layout components → `/components/layout/`
4. **Created** `/types/` for type definitions
5. **Created** `/constants/` for static data
6. **Created** `/docs/` for documentation
7. **Updated** all import paths

### Breaking Changes?
- ❌ **None** - All imports updated automatically
- ✅ **Backwards compatible** with existing code
- ✅ **No build errors**
- ✅ **All pages working**

---

## 📝 Future Enhancements

### Planned Additions:
1. **`/hooks`** - Custom React hooks
   - `useLocalStorage`
   - `useCatProfile`
   - `useFormValidation`

2. **`/utils`** - Utility functions
   - Form validators
   - Date formatters
   - String manipulators

3. **`/api`** or `/services`** - API clients
   - Backend API calls
   - Data fetching
   - Error handling

4. **`/store`** - State management (if needed)
   - Redux/Zustand setup
   - Global state

5. **`/__tests__`** - Test files
   - Component tests
   - Integration tests
   - E2E tests

---

## 🎓 Learning Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Best Practices**: https://react.dev/learn
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

*Last Updated: January 31, 2026*
*Structure Version: 2.0*
