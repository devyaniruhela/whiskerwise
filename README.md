# Whisker Wise — Cat Food Analysis Tool

A modern, premium web application for research-backed cat nutrition analysis.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (Icons)

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── page.tsx             # Landing page (/)
│   ├── now-wiser/           # Alternative landing route
│   ├── food-input/          # Food analysis input form
│   ├── loading-page/        # Analysis progress tracker
│   ├── profile/             # User profile & cats
│   ├── report/              # Analysis report
│   ├── layout.tsx           # Root layout
│   └── ...
├── components/
│   ├── layout/              # Header, Footer, AboutSection
│   └── ui/                  # Button, Input, Badge
├── public/                  # Static assets
│   ├── logo-light.png
│   ├── founder.jpeg
│   └── squiggle-mask.svg
├── styles/                  # globals.css
└── tailwind.config.ts       # Design system config
```

## Getting Started

From the project root:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Design System

### Typography
- **Serif (Headings):** Prata (400 weight only)
- **Sans (Body):** DM Sans
- **Mono (Labels):** JetBrains Mono

### Colors
- **Primary:** Green palette (#5a9e48 → #41624F dark)
- **Secondary:** Orange palette
- **Background:** Gradient with vintage paper texture

### Key Features
- 8pt grid spacing system
- Soft shadows with tints
- Fully rounded CTAs (`rounded-full`)
- Interactive hover/click states
- Vintage paper texture overlay
- Responsive design (mobile-first)

## Development Notes

- Prata font only supports 400 weight - never use `font-bold` with `font-serif`
- All ports automatically assigned by Next.js (3000+)
- LocalStorage used for cross-page data persistence
