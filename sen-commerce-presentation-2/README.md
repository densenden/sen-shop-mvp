# SenCommerce MVP Presentation

A modern, interactive presentation showcasing the SenCommerce e-commerce platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

### Homepage
- **Animated Floating Tiles**: Key facts and statistics float from right to left
- **Interactive Design**: Click any tile to enter the presentation
- **Clean Branding**: Studio Sen aesthetic with professional typography
- **Background Image**: Beautiful artwork showcase from your collection
- **GitHub Integration**: Direct link to repository

### Presentation Slides
- **16:9 Fullscreen Layout**: Optimized for presentation displays
- **Keyboard Navigation**: Arrow keys, spacebar, Home/End, and Escape
- **Mouse Navigation**: Click left/right halves of screen to navigate
- **Progress Indicator**: Visual progress bar at the top
- **Responsive Design**: Works on desktop, tablet, and mobile

### Content Structure
- **17 Comprehensive Slides**: From project overview to technical deep-dives
- **JSON-Driven Content**: Easy to update and maintain
- **Multiple Slide Types**: Title, diagram, problem/solution, tech stack, and more
- **Professional Design**: Black/white theme with accent colors

## 📋 Slide Contents

1. **Title Slide** - Project overview and key details
2. **Architecture** - System architecture diagram
3. **The Challenge** - Problems with existing platforms
4. **The Solution** - My approach: SenCommerce platform benefits
5. **Technology Stack** - Core technologies and infrastructure
6. **Medusa Modules** - Core and custom module overview
7. **Custom Modules** - Deep dive into artwork, digital product, and Printful modules
8. **Database Architecture** - 15+ tables and relationships
9. **API Architecture** - 25+ RESTful endpoints
10. **User Flow** - Customer and admin workflows
11. **Key Features** - Production-ready functionality
12. **Admin Interface** - 8 custom dashboard interfaces
13. **Business Value** - Revenue streams and efficiency gains
14. **Technical Achievements** - Problem-solving and skills developed
15. **Live Demo** - Demo scenarios and access points
16. **Project Roadmap** - Future enhancements and scaling plans
17. **Contact & Q&A** - Summary and discussion

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and Navigate**
   ```bash
   cd sen-commerce-presentation
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   - Homepage: http://localhost:3001
   - Direct to presentation: http://localhost:3001/presentation

### Production Build

```bash
npm run build
npm run start
```

## 🎮 Navigation Controls

### Keyboard Shortcuts
- **→ (Right Arrow)** or **Spacebar**: Next slide
- **← (Left Arrow)**: Previous slide  
- **Home**: Go to first slide
- **End**: Go to last slide
- **Escape**: Exit to homepage

### Mouse Controls
- **Click right half of screen**: Next slide
- **Click left half of screen**: Previous slide
- **Click navigation buttons**: Direct control
- **Click floating tiles**: Enter presentation

## 📁 Project Structure

```
sen-commerce-presentation/
├── app/
│   ├── globals.css              # Global styles and animations
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage with floating tiles
│   └── presentation/
│       └── page.tsx             # Main presentation controller
├── components/
│   ├── FloatingTile.tsx         # Animated homepage tiles
│   ├── PresentationNavigation.tsx  # Navigation controls
│   └── slides/                  # Individual slide components
│       ├── BaseSlide.tsx        # Base slide wrapper
│       ├── TitleSlide.tsx       # Title slide
│       ├── DiagramSlide.tsx     # Architecture diagrams
│       ├── ProblemSlide.tsx     # Problem statement
│       ├── SolutionSlide.tsx    # Solution overview
│       ├── TechStackSlide.tsx   # Technology stack
│       ├── DatabaseSlide.tsx    # Database architecture
│       ├── FlowSlide.tsx        # User workflows
│       ├── RoadmapSlide.tsx     # Future roadmap
│       └── GenericSlide.tsx     # Flexible slide renderer
├── data/
│   └── presentation.json        # All presentation content
└── public/                      # Static assets
```

## 🎨 Design System

### Colors
- **Primary Black**: #000000 (headers, text)
- **Gray Scale**: Various shades for hierarchy
- **Accent Blue**: #6366f1 (Sen accent color)
- **Background**: White with subtle gray gradients

### Typography
- **Font Family**: Inter (fallback: system fonts)
- **Headings**: Bold, large sizes for hierarchy
- **Body Text**: Clean, readable with proper spacing

### Animations
- **Floating Tiles**: 20-second cross-screen animation
- **Slide Transitions**: Smooth fade-in effects
- **Interactive Elements**: Hover and click feedback

## ⚙️ Customization

### Updating Content
Edit `data/presentation.json` to modify:
- Slide content and structure
- Floating tile information
- Presentation metadata

### Styling Changes
- **Global styles**: `app/globals.css`
- **Tailwind config**: `tailwind.config.js`
- **Component styles**: Individual component files

### Adding New Slides
1. Add slide data to `presentation.json`
2. Create new slide component if needed
3. Update presentation router in `app/presentation/page.tsx`

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Static Export
```bash
npm run build
# Deploy static files from .next/static
```

### Docker
```bash
docker build -t sen-presentation .
docker run -p 3001:3001 sen-presentation
```

## 📱 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile**: iOS Safari, Chrome Mobile
- **Features**: ES6+, CSS Grid, Flexbox, CSS Animations

## 🎯 Usage Tips

### For Presentations
- Use fullscreen mode (F11) for best experience
- Test keyboard navigation beforehand
- Have backup navigation via mouse clicks
- Use progress bar to track timing

### For Development
- Content is hot-reloaded in development
- Use browser dev tools for responsive testing
- Check console for any navigation issues

## 📄 License

Part of the SenShop MVP project. All rights reserved.

## 🤝 Contributing

This presentation is part of the larger SenShop MVP project. For updates or modifications, ensure consistency with the main project documentation.

---

**Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS**

For questions or support, refer to the main SenCommerce project documentation.