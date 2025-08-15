# Dinesh Dawonauth - Portfolio MVP

A modern portfolio website for a data scientist & full-stack engineer, built with Next.js 15, TypeScript, and Tailwind CSS. Features an interactive Hero section with planned 3D galaxy visualization.

## 🚀 Quick Start

### Prerequisites

- Node.js ≥18.17.0
- npm ≥8.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dinesh-portfolio-mvp

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the portfolio.

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom theme
- **Fonts**: Geist Sans & Mono
- **Code Quality**: ESLint + Prettier
- **Build Tool**: Turbopack (development)

## 🛠️ Development Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Create production build
npm run start            # Start production server

# Code Quality
npm run type-check       # TypeScript compilation check
npm run lint             # ESLint analysis
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check Prettier compliance

# Utilities
npm run clean            # Clean build artifacts and cache
npm run analyze          # Bundle size analysis
```

## 🎨 Custom Theme

The project uses a custom Tailwind theme with galaxy-inspired colors:

- **Space Colors**: `space-50` to `space-950` (blues)
- **Stellar Colors**: `stellar-50` to `stellar-950` (grays)
- **Nebula Colors**: `nebula-50` to `nebula-950` (purples)

Custom CSS variables are defined in `src/app/globals.css` and available throughout the application.

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles and custom theme
├── components/
│   └── sections/
│       └── Hero/
│           ├── index.tsx    # Hero container component
│           └── HeroCopy.tsx # Hero text content (SSR)
└── [Future directories]
    ├── ui/                  # Reusable UI components
    ├── lib/                 # Utilities and helpers
    └── types/               # TypeScript type definitions
```

## ✅ Quality Standards

### Performance Targets (ST-0 Baseline)

- **Lighthouse Performance**: ≥95
- **Lighthouse Best Practices**: ≥95
- **Lighthouse Accessibility**: 100
- **Lighthouse SEO**: ≥95
- **Time to Interactive**: ≤2.5s
- **Hero Text Render**: <1s

### Code Quality

- TypeScript strict mode enabled
- Zero compilation errors
- ESLint + Prettier compliance
- Responsive design (320px - 1920px+)

## 🔍 Verification & Testing

### Performance Audit

1. **Build for production**:
   ```bash
   npm run build
   npm run start
   ```

2. **Run Lighthouse audit**:
   - Open Chrome DevTools
   - Navigate to Lighthouse tab
   - Run audit on http://localhost:3000
   - Verify scores meet targets

### Responsive Testing

Test the following breakpoints:
- Mobile: 320px, 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1440px, 1920px

### Accessibility Testing

- Keyboard navigation (Tab, Enter, Escape)
- Screen reader compatibility
- High contrast mode support
- Reduced motion preference

## 🚧 Development Roadmap

### Phase 1: Foundations (ST-0) ✅
- [x] Next.js 15 setup with TypeScript
- [x] Tailwind CSS configuration
- [x] Hero section with SSR text
- [x] Responsive layout system
- [x] SEO optimization

### Phase 2: 3D Galaxy (ST-1) 🔄
- [ ] Three.js/R3F integration
- [ ] Interactive galaxy visualization
- [ ] Particle system implementation
- [ ] Performance optimization

### Phase 3: Interactions (ST-2) 📋
- [ ] Camera controls (orbit, zoom)
- [ ] Supernova particle effects
- [ ] Keyboard navigation
- [ ] Touch/gesture support

### Phase 4: Audio (ST-4) 📋
- [ ] Web Audio API integration
- [ ] Ambient soundscape
- [ ] User consent system
- [ ] Audio controls UI

## 🐛 Troubleshooting

### Common Issues

**TypeScript Errors**: 
```bash
npm run type-check
# Fix any reported errors, then retry
```

**Tailwind Classes Not Working**:
```bash
# Restart dev server to pick up CSS changes
npm run dev
```

**Build Failures**:
```bash
# Clean cache and rebuild
npm run clean
npm install
npm run build
```

### Browser Compatibility

- Chrome 90+
- Safari 14+ (iOS/macOS)
- Firefox 88+
- Edge 90+

## 📄 License

This project is private and proprietary. All rights reserved.

## 🤝 Contributing

This is a personal portfolio project. For feedback or suggestions, please contact [info@dineshd.dev].

---
