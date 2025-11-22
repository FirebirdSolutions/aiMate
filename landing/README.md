# aiMate Landing Page

A simple, modern landing page for the aiMate AI workspace platform.

## Overview

This is a standalone HTML/CSS/JS landing page that showcases aiMate's features, benefits, and value proposition. It's designed to be the first thing visitors see before accessing the main application.

## Features

- **Fully Responsive**: Works on desktop, tablet, and mobile devices
- **Modern Design**: Clean, gradient-based design matching aiMate's branding
- **Fast Loading**: No frameworks, just vanilla HTML/CSS/JS
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Accessible**: ARIA labels and keyboard navigation support

## Structure

```
landing/
├── index.html          # Main landing page
├── css/
│   └── landing.css     # Stylesheet
├── js/
│   └── landing.js      # JavaScript for interactivity
├── images/             # Placeholder for images/logos
└── README.md           # This file
```

## Sections

1. **Navigation**: Fixed navbar with links to sections and CTAs
2. **Hero**: Main headline, value proposition, and primary CTAs
3. **Features**: 6-card grid showcasing key features
4. **Why aiMate**: Comparison with other platforms
5. **How It Works**: 3-step process visualization
6. **CTA**: Final call-to-action section
7. **Footer**: Links, resources, social media

## Deployment Options

### Option 1: Static Hosting (Recommended)

Deploy to any static hosting service:

**GitHub Pages:**
```bash
# Already in the aiMate repo, just configure GitHub Pages to serve from /landing
```

**Netlify/Vercel:**
```bash
# Point to the /landing directory
# Build command: (none)
# Publish directory: landing
```

**Cloudflare Pages:**
```bash
# Connect to GitHub repo
# Build output directory: landing
```

### Option 2: Nginx

```nginx
server {
    listen 80;
    server_name aimate.nz www.aimate.nz;

    root /var/www/aimate-landing;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Route /app to the React application
    location /app {
        proxy_pass http://localhost:3000;
    }

    # Route /survey to the survey application
    location /survey {
        proxy_pass http://localhost:5000;
    }
}
```

### Option 3: Apache

```apache
<VirtualHost *:80>
    ServerName aimate.nz
    DocumentRoot /var/www/aimate-landing

    <Directory /var/www/aimate-landing>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Proxy /app to React application
    ProxyPass /app http://localhost:3000
    ProxyPassReverse /app http://localhost:3000

    # Proxy /survey to survey application
    ProxyPass /survey http://localhost:5000
    ProxyPassReverse /survey http://localhost:5000
</VirtualHost>
```

## Customization

### Colors

Edit `css/landing.css` to change the color scheme:

```css
:root {
    --primary-purple: #667eea;
    --secondary-purple: #764ba2;
    /* ... other colors */
}
```

### Content

Edit `index.html` to update:
- Headlines and copy
- Feature descriptions
- Call-to-action buttons
- Footer links

### Links

Update these links in `index.html`:
- `/survey` - Link to the alpha testing survey
- `/app` - Link to the main application
- GitHub URLs
- Social media links

## Adding Images

1. Place images in the `images/` directory
2. Update `index.html` to reference them:

```html
<img src="images/logo.svg" alt="aiMate Logo">
```

### Recommended Images

- **Logo**: SVG format, place in navigation
- **Hero Background**: Optional hero image or pattern
- **Feature Icons**: Replace emoji with custom icons if desired
- **Screenshots**: Add app screenshots to showcase features

## Performance

- **No Dependencies**: Pure HTML/CSS/JS, no frameworks
- **Optimized CSS**: Minimal, efficient styles
- **Lazy Loading**: Images can be lazy-loaded
- **Caching**: Set appropriate cache headers on server

### Recommended Cache Headers

```
Cache-Control: public, max-age=31536000  # For CSS/JS
Cache-Control: public, max-age=3600      # For HTML
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 12+
- Chrome Android: Latest version

## Analytics (Optional)

Add Google Analytics or similar:

```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Testing

Test the landing page:

1. **Local Testing**:
   ```bash
   # Use any simple HTTP server
   python3 -m http.server 8000
   # Or
   npx serve .
   ```

2. **Responsive Testing**:
   - Chrome DevTools responsive mode
   - Real devices (phone, tablet)
   - BrowserStack or similar service

3. **Performance Testing**:
   - Google Lighthouse
   - WebPageTest
   - GTmetrix

## SEO Checklist

- [x] Title tag optimized
- [x] Meta description added
- [x] Semantic HTML structure
- [x] Alt text for images (add when images added)
- [ ] Open Graph tags (recommended)
- [ ] Twitter Card tags (recommended)
- [ ] Schema.org markup (optional)
- [ ] Sitemap.xml (if part of larger site)
- [ ] robots.txt (if needed)

## License

Same as the main aiMate project (MIT License).

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Support

For issues or questions:
- GitHub Issues: https://github.com/ChoonForge/aiMate/issues
- Discussions: https://github.com/ChoonForge/aiMate/discussions
