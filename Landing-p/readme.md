# FEED - Agritech Website

A modern, responsive, single-page website for FEED, an agritech company specializing in intelligent and sustainable agricultural solutions.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Brand Identity](#brand-identity)
- [File Structure](#file-structure)
- [Features](#features)
- [Sections Breakdown](#sections-breakdown)
- [Styling Details](#styling-details)
- [JavaScript Functionality](#javascript-functionality)
- [Responsive Design](#responsive-design)
- [Image Integration](#image-integration)
- [Browser Compatibility](#browser-compatibility)
- [Getting Started](#getting-started)
- [Customization Guide](#customization-guide)

- [Contact Form / EmailJS Setup](#contact-form--emailjs-setup)

---

## 🎯 Project Overview

This is a complete, production-ready website built with vanilla HTML5, CSS3, and JavaScript (no frameworks). The website showcases FEED's agritech solutions including connected greenhouses, IoT sensors, intelligent supervision systems, and training services.

**Key Characteristics:**
- ✅ Fully responsive design (mobile-first approach)
- ✅ SEO-friendly semantic HTML
- ✅ Smooth scrolling and animations
- ✅ Clean, modern, minimal design
- ✅ Accessible (ARIA labels, focus states, reduced motion support)
- ✅ Production-ready code with comments

---

## 🛠 Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Variables, Flexbox, Grid
- **Vanilla JavaScript** - No frameworks or libraries
- **Google Fonts** - Poppins font family
- **No build tools required** - Runs directly in browser

---

## 🎨 Brand Identity

### Color Palette

The website uses CSS variables defined in `:root` for consistent theming:

```css
--green-primary: #B5E042    /* Leaf Green - Primary brand color */
--turquoise-primary: #17C6BC /* Turquoise - Secondary brand color */
--blue-dark: #052952        /* Deep Blue - Text & headings */
--white: #ffffff            /* White - Background */
--black: #000000            /* Black - Text */
--gray-light: #A3ABB4       /* Light Gray - Secondary text */
--gray-medium: #667270      /* Medium Gray - Body text */
```

### Typography

- **Font Family**: Poppins (Google Fonts)
- **Headings**: Bold, color: `--blue-dark`
- **Body Text**: Regular, color: `--gray-medium`
- **Font Weights Used**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Design Style

- Clean and minimal aesthetic
- Agritech/sustainable theme
- Rounded buttons (border-radius: 30px)
- Large visual elements
- Soft shadows for depth
- Modern startup look
- Light section spacing

---

## 📁 File Structure

```
/feed-website
│── index.html              # Main HTML file
│── css/
│   └── style.css          # All styles (variables, layouts, responsive)
│── js/
│   └── main.js            # JavaScript functionality
│── assets/
│   └── images/
│       ├── Feedin_pnglogo.png                    # Logo (header & footer)
│       ├── Serre connectée intelligente.jpg      # Hero section image
│       ├── Équipe travaillant dans une serre.png # About section image
│       ├── Dashboard IoT & Capteurs.png          # Solutions section - IoT
│       └── Dashboard de Supervision.png          # Solutions section - Supervision
│── README.md              # This file
```

---

## ✨ Features

### Navigation & Header
- **Fixed header** with green background (`--green-primary`)
- **Smooth scrolling** navigation to all sections
- **Mobile hamburger menu** for responsive navigation
- **CTA button** "Parler à un expert" in header
- **Logo integration** (90px height, 100px width)
- **Active link highlighting** on scroll
- **Hover effects** on navigation links with underline animation

### Hero Section
- **Large title**: "Cultiver intelligemment, produire durablement"
- **Subtitle** describing FEED's mission
- **Two CTA buttons**:
  - Primary button (green): "Découvrir nos solutions"
  - Outline button (turquoise): "Nous contacter"
- **Hero image**: Connected greenhouse image
- **Fade-in animations** on load

### About Section
- **Mission statement** paragraph
- **Feature list** with checkmark icons:
  - Expertise agritech
  - Solutions sur mesure
  - Approche durable
  - Accompagnement complet
- **Team image** on the right side
- **Two-column layout** (responsive)

### Services Section
- **6 service cards** in responsive grid:
  1. Serres agricoles connectées
  2. Serres verticales connectées
  3. Automatisation de serres
  4. Aménagement agricole
  5. Urban farming
  6. Étude de projet & formation
- **Hover effects**: Cards lift up with green border glow
- **Icon placeholders** for each service
- **Grid layout**: Auto-fit, minimum 320px per card

### Solutions & Technologies Section
- **Two feature blocks**:
  1. **IoT & Capteurs** - Dashboard image on right
  2. **Supervision intelligente** - Dashboard image on left (reversed layout)
- **Turquoise accent line** on left of content
- **Feature lists** with arrow bullets
- **Alternating layout** (left-right, right-left)

### Projects Section
- **Grid gallery** with 6 project placeholders
- **Hover overlay** with project titles
- **Smooth transitions** on hover
- **Project cards** with scale effect on hover
- **Gradient overlay** from bottom on hover

### Formation Section
- **Training description** paragraph
- **Highlight box** with green background (`--green-primary`)
- **Training programs list** with checkmarks
- **Image placeholder** for training session
- **Two-column layout** (responsive)

### Contact Section
- **Full-width section** with gradient background
- **Call-to-action text**: "Vous avez un projet agricole ou urbain ?"
- **Large CTA button**: "Parler à un expert"
- **Dark gradient overlay** (blue to turquoise)
- **Centered content** with white text

### Footer
- **Four-column layout** (responsive grid):
  1. Brand section (logo + tagline)
  2. Quick links (navigation)
  3. Contact information
  4. Social media icons
- **Dark blue background** (`--blue-dark`)
- **White text** with gray accents
- **Logo** inverted (white) in footer
- **Social icons** with hover effects
- **Copyright notice**

---

## 🎨 Styling Details

### CSS Architecture

1. **CSS Variables** - All brand colors defined in `:root`
2. **Reset & Base Styles** - Universal reset, typography, container
3. **Component Styles** - Each section has its own styling block
4. **Responsive Design** - Mobile-first with media queries
5. **Animations** - Keyframes for fade-in effects
6. **Utility Classes** - Reusable button styles, section titles

### Key Style Features

- **Rounded Corners**: 20px for cards/images, 30px for buttons
- **Box Shadows**: Layered shadows for depth
  - Light: `0 5px 15px rgba(0, 0, 0, 0.08)`
  - Medium: `0 10px 30px rgba(0, 0, 0, 0.1)`
  - Heavy: `0 10px 30px rgba(181, 224, 66, 0.3)` (green glow)
- **Transitions**: 0.3s ease for all interactive elements
- **Gradients**: Used in backgrounds and accents
- **Spacing**: 80px section padding, 4rem gaps in grids

### Button Styles

```css
.btn--primary      /* Green background, blue text */
.btn--outline      /* Transparent, turquoise border */
.btn--large        /* Larger padding for CTAs */
```

All buttons have:
- Hover lift effect (`translateY(-3px)`)
- Box shadow on hover
- Smooth transitions
- Rounded corners (30px)

---

## 💻 JavaScript Functionality

### Mobile Navigation

- **Hamburger menu toggle** for mobile devices
- **Menu slides in** from left when activated
- **Menu closes** when clicking a link or outside
- **Animated hamburger icon** (transforms to X)

### Smooth Scrolling

- **All anchor links** (#section-id) scroll smoothly
- **Header offset** (85px) accounted for fixed header
- **Prevents default** anchor jump behavior

### Scroll Animations

- **Intersection Observer API** for scroll-triggered animations
- **Fade-in effect** when elements enter viewport
- **Threshold**: 0.1 (10% visibility triggers animation)
- **Applied to**: Service cards, solution blocks, project cards, about/formation content

### Active Navigation

- **Dynamic highlighting** of current section in navigation
- **Scroll position tracking** to determine active section
- **Visual indicator** (color change + underline) on active link

### Interactive Elements

- **Button hover effects** (enhanced with JavaScript)
- **Service card hover** (lift animation)
- **Project card clicks** (ready for modal/lightbox integration)
- **Form submission handler** (ready for contact form)

### Performance Optimizations

- **Lazy loading support** for images (using Intersection Observer)
- **Event delegation** where appropriate
- **Efficient scroll handlers** with debouncing potential

---

## 📱 Responsive Design

### Breakpoints

1. **Desktop**: Default styles (> 968px)
   - Two-column layouts
   - Full navigation menu
   - Large typography

2. **Tablet**: `@media (max-width: 968px)`
   - Single-column layouts
   - Hamburger menu activated
   - Adjusted typography sizes
   - Grid columns collapse to 1

3. **Mobile**: `@media (max-width: 576px)`
   - Further reduced padding
   - Smaller font sizes
   - Full-width buttons
   - Optimized spacing

### Responsive Features

- **Grid layouts** automatically adjust (auto-fit, minmax)
- **Navigation** transforms to hamburger menu
- **Images** scale appropriately with max-height constraints
- **Buttons** stack vertically on mobile
- **Text** remains readable at all sizes

### Mobile Menu

- **Fixed position** below header (85px from top)
- **Full-width** overlay
- **Green background** matching header
- **Smooth slide animation** (left: -100% to 0)
- **Touch-friendly** large tap targets

---

## 🖼 Image Integration

### Integrated Images

1. **Logo** (`Feedin_pnglogo.png`)
   - Header: 90px height, 100px width
   - Footer: 50px height, inverted (white)

2. **Hero Image** (`Serre connectée intelligente.jpg`)
   - Full-width responsive
   - Rounded corners (20px)
   - Box shadow for depth

3. **About Image** (`Équipe travaillant dans une serre.png`)
   - Right side of about section
   - Responsive sizing
   - Rounded corners

4. **Solution Images**:
   - `Dashboard IoT & Capteurs.png` - IoT section
   - `Dashboard de Supervision.png` - Supervision section
   - Both with rounded corners and shadows

### Image Styling

All images use:
- `object-fit: cover` for proper scaling
- `border-radius: 20px` for rounded corners
- `box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1)` for depth
- `width: 100%` and `height: auto` for responsiveness
- `max-height: 400px` on mobile devices

### Placeholder Images

Remaining placeholders (Projects, Formation) use gradient backgrounds with descriptive text. Ready to be replaced with actual images.

---

## 🌐 Browser Compatibility

### Supported Browsers

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Modern Features Used

- CSS Grid (with fallbacks)
- CSS Variables (native support)
- Flexbox (widely supported)
- Intersection Observer API (polyfill available if needed)
- Smooth scrolling (with fallback)

### Accessibility Features

- **Semantic HTML** for screen readers
- **ARIA labels** on interactive elements
- **Focus states** visible (2px outline)
- **Reduced motion** support (`prefers-reduced-motion`)
- **Keyboard navigation** fully functional
- **Alt text** on all images

---

## 🚀 Getting Started

### Prerequisites

None! This is a static website that runs directly in a browser.

### Installation

1. **Download/Clone** the project files
2. **Ensure file structure** matches the structure above
3. **Place images** in `assets/images/` folder
4. **Open `index.html`** in any modern web browser

### Local Development

```bash
# Simply open index.html in your browser
# Or use a local server:

# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

### File Requirements

Make sure these files exist:
- ✅ `index.html`
- ✅ `css/style.css`
- ✅ `js/main.js`
- ✅ `assets/images/Feedin_pnglogo.png` (logo)


---

## ✉️ Contact Form / EmailJS Setup

This project includes an accessible contact form wired to EmailJS. Follow these steps to enable live email delivery to khmedayoub@gmail.com.

- Files to review:
  - `index.html` — contains the form markup (`#contact-form`) and includes the EmailJS SDK and `js/contact-form.js`.
  - `js/contact-form.js` — initializes EmailJS and sends the form using `emailjs.sendForm(service, template, form)`.
  - `css/style.css` — styles for the contact form (`.contact-form`).

- EmailJS configuration (already set in `js/contact-form.js`):
  - Service ID: `service_444x595`
  - Template ID: `template_l4hwp89`
  - Public Key: `nNmHCo9nlVJvZUNmv`

- Template variables used (the form maps fields directly): `name`, `email`, `phone`, `message`, `to_email`.
  - The form includes a hidden `to_email` set to `khmedayoub@gmail.com` so messages are delivered there.

- How to test locally:
  1. Open a local server and navigate to the site (see commands above).
 2. Fill the contact form and submit — the UI shows a sending state and success/error feedback.
 3. Check the browser console for EmailJS responses if delivery fails.

- If you need to change recipient or template mapping:
  1. Update the hidden `to_email` value in `index.html` or modify your EmailJS template to use different variable names.
 2. Edit `js/contact-form.js` to match any custom variable names.

- Security note: Keep your EmailJS public key in client-side code (it's public by design). Do not commit private API secrets to the repo.

Optional images (if not present, placeholders will show):
- `assets/images/Serre connectée intelligente.jpg`
- `assets/images/Équipe travaillant dans une serre.png`
- `assets/images/Dashboard IoT & Capteurs.png`
- `assets/images/Dashboard de Supervision.png`

---

## 🎛 Customization Guide

### Changing Colors

All colors are defined as CSS variables in `css/style.css`:

```css
:root {
  --green-primary: #B5E042;    /* Change primary green */
  --turquoise-primary: #17C6BC; /* Change turquoise */
  --blue-dark: #052952;        /* Change text blue */
  /* ... etc */
}
```

Simply modify these values and all references will update automatically.

### Changing Font

1. **Update Google Fonts link** in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap" rel="stylesheet">
```

2. **Update font-family** in `css/style.css`:
```css
body {
  font-family: 'YourFont', sans-serif;
}
```

### Adding New Sections

1. **Add HTML** in `index.html`:
```html
<section class="section" id="your-section">
  <div class="container">
    <!-- Your content -->
  </div>
</section>
```

2. **Add styles** in `css/style.css`:
```css
.your-section {
  /* Your styles */
}
```

3. **Add navigation link** in header navigation

### Modifying Layouts

- **Grid layouts**: Modify `grid-template-columns` values
- **Spacing**: Adjust `gap`, `padding`, `margin` values
- **Container width**: Change `max-width` in `.container` (default: 1200px)

### Adding Images

1. **Place image** in `assets/images/` folder
2. **Update HTML**:
```html
<img src="assets/images/your-image.jpg" alt="Description" class="your-class">
```
3. **Add CSS** if needed:
```css
.your-class {
  width: 100%;
  border-radius: 20px;
  /* ... */
}
```

### Customizing Animations

Animations are defined in `css/style.css`:

```css
@keyframes fadeInUp {
  /* Modify animation properties */
}
```

JavaScript scroll animations use Intersection Observer - modify thresholds in `js/main.js`:

```javascript
const observerOptions = {
  threshold: 0.1,  // Change trigger point (0-1)
  rootMargin: '0px 0px -100px 0px'  // Adjust offset
};
```

### Contact Form Integration

The JavaScript includes a placeholder for form submission. To add a contact form:

1. **Add form HTML** in contact section
2. **Add form styles** in CSS
3. **Implement submission handler** in `js/main.js`:

```javascript
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  // Add your form submission logic
  // (e.g., fetch API, form submission service)
});
```

---

## 📝 Code Structure Notes

### HTML

- **Semantic elements**: `<header>`, `<nav>`, `<section>`, `<footer>`
- **BEM naming convention**: Block__Element--Modifier (e.g., `nav__link`, `btn--primary`)
- **Accessibility**: Alt text, ARIA labels where needed
- **SEO**: Meta tags, semantic structure, descriptive headings

### CSS

- **Organization**: Logical grouping by component
- **Comments**: Section headers for easy navigation
- **Variables**: All colors/spacing in `:root`
- **Mobile-first**: Base styles for mobile, then desktop enhancements

### JavaScript

- **Vanilla JS**: No dependencies
- **Event listeners**: Efficient event handling
- **Modern APIs**: Intersection Observer for scroll animations
- **Comments**: Descriptive comments for functionality

---

## 🐛 Known Issues / Future Enhancements

### Potential Improvements

- [ ] Add contact form functionality
- [ ] Implement project modal/lightbox for project gallery
- [ ] Add loading states for images
- [ ] Implement form validation
- [ ] Add more animation variants
- [ ] Add testimonials section
- [ ] Implement blog/news section
- [ ] Add multi-language support
- [ ] Add dark mode toggle
- [ ] Implement image lazy loading more comprehensively

### Browser Considerations

- Internet Explorer: Not supported (uses modern CSS/JS)
- Old mobile browsers: May need polyfills for Intersection Observer
- Print styles: Not optimized (can be added)

---

## 📄 License

This project was created for FEED agritech company. All rights reserved.

---

## 👨‍💻 Development Notes

### Design Decisions

1. **No frameworks**: Chose vanilla JS/HTML/CSS for performance and simplicity
2. **CSS Variables**: For easy theming and maintenance
3. **Mobile-first**: Ensures best mobile experience
4. **Semantic HTML**: For SEO and accessibility
5. **BEM naming**: For maintainable CSS architecture

### Performance Considerations

- **Minimal JavaScript**: Only essential functionality
- **CSS optimizations**: Efficient selectors, no redundant styles
- **Image optimization**: Ready for WebP format if needed
- **No external dependencies**: Faster load times

---

## 📞 Support

For questions or issues:
- Check browser console for JavaScript errors
- Verify all image paths are correct
- Ensure file structure matches documentation
- Test in multiple browsers for compatibility

---

**Built with ❤️ for FEED - Cultiver intelligemment, produire durablement**

