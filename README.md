# Nichole Zheng — Personal Website

A personal portfolio website built with pure HTML, CSS, and vanilla JavaScript.

## Structure

```
personal-website/
├── index.html      # Main page (Hero → About → Portfolio → Skills → Contact)
├── style.css       # All styles
├── main.js         # Scroll-reveal animation via IntersectionObserver
└── assets/
    └── profile.jpg # (add your own photo here)
```

## Features
- Warm beige colour palette matching the original design
- **Fade-up on load** for the hero section
- **Scroll-reveal** — every section animates in as it enters the viewport
- Fully responsive (mobile, tablet, desktop)
- No frameworks or dependencies — zero build step

## Customisation
- Replace `assets/profile.jpg` with your actual photo
- Update the `href` links on project cards and contact buttons with real URLs
- Edit the `mailto:` address to your actual email

## Running locally
Open `index.html` directly in a browser, or use any static server:

```bash
npx serve .
# or
python3 -m http.server 8080
```
