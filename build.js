/**
 * Static Portfolio Site & Sitemap Generator for Mashuke Alam Jim
 * Compiles portfolio.config.json into a performant, accessible, and SEO-optimized index.html
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'portfolio.config.json');
const outputPath = path.join(__dirname, 'index.html');
const sitemapPath = path.join(__dirname, 'sitemap.xml');

if (!fs.existsSync(configPath)) {
  console.error('Error: portfolio.config.json not found!');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Navigation links
const navHtml = config.nav.map(item => `            <li><a href="${item.href}" class="nav-link">${escapeHtml(item.label)}</a></li>`).join('\n');

// Hero social / contact links
const heroLinksHtml = config.hero.links.map(link => {
  const isExt = link.external ? ' target="_blank" rel="noopener noreferrer' + (link.relMe ? ' me' : '') + '"' : '';
  return `          <a href="${link.url}" class="text-link"${isExt}>${escapeHtml(link.label)} <span class="arrow-icon">&#8599;</span></a>`;
}).join('\n');

// Projects list
const projectsHtml = config.work.items.map(p => {
  const pillsHtml = p.tags.map(t => `              <span class="meta-pill">${escapeHtml(t)}</span>`).join('\n');
  return `          <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="project-item">
            <div class="project-header-row">
              <span class="project-title">${escapeHtml(p.title)} <span class="arrow-icon">&#8599;</span></span>
              <span class="project-tagline">${escapeHtml(p.tagline)}</span>
            </div>
            <p class="project-desc">
              ${escapeHtml(p.description)}
            </p>
            <div class="project-meta-pills">
${pillsHtml}
            </div>
          </a>`;
}).join('\n\n');

// Lab items
const labItemsHtml = config.lab.items.map(item => {
  const badgeHtml = item.badge ? `<span class="lab-badge">${escapeHtml(item.badge)}</span>` : '';
  return `          <a href="${item.url}" class="lab-item featured-lab">
            <div class="lab-item-header">
              <span class="lab-title">${item.icon} ${escapeHtml(item.title)}</span>
              ${badgeHtml}
            </div>
            <p class="lab-desc">
              ${escapeHtml(item.description)}
            </p>
          </a>`;
}).join('\n\n');

// Stack & Foundations
const stackHtml = config.about.categories.map(cat => {
  const skillsHtml = cat.skills.map(s => `              <li class="stack-item">${escapeHtml(s)}</li>`).join('\n');
  return `          <div>
            <h3 class="stack-group-title">${escapeHtml(cat.title)}</h3>
            <ul class="stack-items">
${skillsHtml}
            </ul>
          </div>`;
}).join('\n\n');

// Footer links
const footerLinksHtml = config.contact.links.map(l => {
  const isExt = l.external ? ' target="_blank" rel="noopener noreferrer' + (l.relMe ? ' me' : '') + '"' : '';
  return `          <a href="${l.url}" class="footer-link"${isExt}>${escapeHtml(l.label)}</a>`;
}).join('\n');

// JSON-LD Person Schema
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": config.brand.name,
  "jobTitle": config.brand.title,
  "url": config.meta.canonicalUrl,
  "sameAs": [
    "https://github.com/MashukeAlam",
    "https://www.linkedin.com/in/mashukjim/"
  ],
  "knowsAbout": [
    "Go",
    "Distributed Systems",
    "Microservices",
    "TypeScript",
    "Node.js",
    "WebSockets",
    "WebRTC",
    "Docker",
    "PostgreSQL",
    "Redis"
  ]
};

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.meta.title)}</title>
  <meta name="description" content="${escapeHtml(config.meta.description)}">
  <meta name="author" content="${escapeHtml(config.meta.author)}">
  <link rel="canonical" href="${config.meta.canonicalUrl}">
  
  <!-- Dual Theme Color for system appearance -->
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="${config.meta.themeColorLight}">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="${config.meta.themeColorDark}">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  
  <!-- Open Graph -->
  <meta property="og:site_name" content="${escapeHtml(config.meta.title)}">
  <meta property="og:title" content="${escapeHtml(config.meta.title)}">
  <meta property="og:description" content="${escapeHtml(config.meta.description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${config.meta.canonicalUrl}">
  <meta property="og:image" content="${config.meta.ogImage}">
  <meta property="og:image:alt" content="${escapeHtml(config.meta.ogImageAlt)}">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(config.meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(config.meta.description)}">
  <meta name="twitter:image" content="${config.meta.ogImage}">

  <!-- Prevent Theme Flash -->
  <script>
    (function() {
      try {
        const savedTheme = localStorage.getItem('theme');
        const theme = savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  </script>

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <link rel="stylesheet" href="style.css?v=2.3">
</head>
<body>

  <!-- Accessible Skip Link -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Ambient Animated ASCII Background Canvas & Overlay -->
  <canvas id="ascii-bg-canvas" aria-hidden="true"></canvas>
  <div class="ascii-bg-overlay" aria-hidden="true"></div>

  <div class="layout-container">
    
    <!-- Minimalist Header -->
    <header class="site-header">
      <div class="site-brand">
        <a href="#" class="brand-name">${escapeHtml(config.brand.name)}</a>
        <span class="brand-title">${escapeHtml(config.brand.title)}</span>
      </div>

      <div class="nav-cluster">
        <nav aria-label="Main Navigation">
          <ul class="nav-links">
${navHtml}
          </ul>
        </nav>

        <!-- Theme Switcher Button -->
        <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle dark/light theme" title="Toggle theme">
          <svg id="theme-sun-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <svg id="theme-moon-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
      </div>
    </header>

    <!-- Main Content Column -->
    <main id="main-content" class="content-column">
      
      <!-- Hero / Introduction -->
      <section class="hero-section" id="intro">
        <h1 class="hero-heading">
          ${escapeHtml(config.hero.heading)}
        </h1>
        <p class="hero-sub">
          ${escapeHtml(config.hero.sub)}
        </p>
        <div class="hero-links">
${heroLinksHtml}
        </div>
      </section>

      <!-- Selected Work / Projects -->
      <section class="section" id="work">
        <h2 class="section-label">${escapeHtml(config.work.sectionLabel)}</h2>
        
        <div class="project-list">
${projectsHtml}
        </div>
      </section>

      <!-- The Lab / Creative Experiments -->
      <section class="section" id="lab">
        <h2 class="section-label">${escapeHtml(config.lab.sectionLabel)}</h2>
        <p class="lab-intro">
          ${escapeHtml(config.lab.intro)}
        </p>

        <div class="lab-grid">
${labItemsHtml}
        </div>
      </section>

      <!-- Technical Foundations -->
      <section class="section" id="about">
        <h2 class="section-label">${escapeHtml(config.about.sectionLabel)}</h2>
        
        <div class="stack-grid">
${stackHtml}
        </div>
      </section>

      <!-- Footer & Contact -->
      <footer class="site-footer" id="contact">
        <div>
          <span>${escapeHtml(config.contact.copyright)}</span>
        </div>
        <div class="footer-links">
${footerLinksHtml}
        </div>
      </footer>

    </main>
  </div>

  <!-- Minimal Theme Toggle Script -->
  <script>
    (function() {
      const toggle = document.getElementById('theme-toggle');
      const sunIcon = document.getElementById('theme-sun-icon');
      const moonIcon = document.getElementById('theme-moon-icon');
      const html = document.documentElement;

      function updateIcons(theme) {
        if (theme === 'dark') {
          sunIcon.style.display = 'block';
          moonIcon.style.display = 'none';
        } else {
          sunIcon.style.display = 'none';
          moonIcon.style.display = 'block';
        }
      }

      updateIcons(html.getAttribute('data-theme') || 'light');

      toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateIcons(next);
      });
    })();
  </script>

  <!-- Ambient Animated ASCII Background Engine & Active Scene -->
  <script src="assets/scenes/aurora-fjord.js"></script>
  <script src="assets/js/ascii-engine.js"></script>

</body>
</html>
`;

fs.writeFileSync(outputPath, fullHtml, 'utf-8');
console.log('✅ Generated index.html from portfolio.config.json');

// Generate curated sitemap.xml
const today = new Date().toISOString().split('T')[0];
const pages = [
  { loc: 'https://mashukealam.github.io/', priority: '1.0', changefreq: 'weekly' },
  { loc: 'https://mashukealam.github.io/wordle/index.html', priority: '0.9', changefreq: 'daily' },
  { loc: 'https://mashukealam.github.io/flagle/index.html', priority: '0.9', changefreq: 'daily' },
  { loc: 'https://mashukealam.github.io/loopsort/index.html', priority: '0.9', changefreq: 'weekly' },
  { loc: 'https://mashukealam.github.io/windows7/index.html', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://mashukealam.github.io/privacy.html', priority: '0.3', changefreq: 'yearly' },
  { loc: 'https://mashukealam.github.io/privacy-husna.html', priority: '0.3', changefreq: 'yearly' },
  { loc: 'https://mashukealam.github.io/privacy-husna-ext.html', priority: '0.3', changefreq: 'yearly' }
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
console.log('✅ Generated sitemap.xml');
