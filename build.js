/**
 * Static Portfolio Site Generator for Mashuke Alam Jim
 * Reads portfolio.config.json and compiles index.html
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'portfolio.config.json');
const outputPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(configPath)) {
  console.error('Error: portfolio.config.json not found!');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const icons = {
  email: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  github: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
  linkedin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`,
  bolt: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  box: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  external: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  code: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  layers: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
  database: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`
};

const navHtml = config.nav.map(item => `<li><a href="${item.href}">${escapeHtml(item.label)}</a></li>`).join('\n          ');

const heroActionsHtml = config.hero.actions.map(action => {
  const btnClass = action.primary ? 'btn btn-primary' : 'btn btn-secondary';
  const iconSvg = icons[action.type] || '';
  const isExternal = action.href.startsWith('http');
  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${action.href}" class="${btnClass}"${targetAttr}>
          ${iconSvg}
          ${escapeHtml(action.label)}
        </a>`;
}).join('\n        ');

const projectsHtml = config.projects.items.map(p => {
  const cardClass = p.featured ? 'project-card featured' : 'project-card';
  const iconSvg = p.icon === 'bolt' ? icons.bolt : '';
  
  let linkButtons = '';
  if (p.liveUrl) {
    linkButtons += `<a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-link-icon" title="Live Preview">
                ${icons.external}
              </a>\n              `;
  }
  if (p.githubUrl) {
    linkButtons += `<a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-link-icon" title="View Source on GitHub">
                ${icons.github}
              </a>`;
  }

  const techTagsHtml = p.techTags.map(t => {
    const tagClass = t.highlight ? 'tech-tag highlight' : 'tech-tag';
    return `<span class="${tagClass}">${escapeHtml(t.name)}</span>`;
  }).join('\n            ');

  return `        <div class="${cardClass}">
          <div class="project-header">
            <h3 class="project-title">
              ${iconSvg}
              ${escapeHtml(p.title)}
            </h3>
            <div class="project-links">
              ${linkButtons}
            </div>
          </div>
          <p class="project-desc">
            ${escapeHtml(p.description)}
          </p>
          <div class="project-tech-tags">
            ${techTagsHtml}
          </div>
        </div>`;
}).join('\n\n');

const labHtml = config.lab.items.map(item => {
  return `        <a href="${item.url}" class="lab-card">
          <div class="lab-icon">${item.icon}</div>
          <h3 class="lab-title">${escapeHtml(item.title)}</h3>
          <p class="lab-desc">${escapeHtml(item.description)}</p>
        </a>`;
}).join('\n\n');

const skillsHtml = config.skills.categories.map(cat => {
  const catIcon = icons[cat.icon] || icons.code;
  const pillsHtml = cat.items.map(skill => `<span class="skill-pill">${escapeHtml(skill)}</span>`).join('\n            ');
  return `        <div class="skill-category">
          <h3 class="skill-cat-title">
            ${catIcon}
            ${escapeHtml(cat.title)}
          </h3>
          <div class="skill-pills">
            ${pillsHtml}
          </div>
        </div>`;
}).join('\n\n');

const socialsHtml = config.contact.socials.map(s => {
  const isExternal = s.url.startsWith('http');
  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${s.url}"${targetAttr}>${escapeHtml(s.label)}</a>`;
}).join('\n          ');

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.meta.title)}</title>
  <meta name="description" content="${escapeHtml(config.meta.description)}">
  <meta name="theme-color" content="${config.meta.themeColor}">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(config.meta.title)}">
  <meta property="og:description" content="${escapeHtml(config.meta.description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${config.meta.canonicalUrl}">

  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- Sticky Glassmorphic Header -->
  <header class="site-header">
    <div class="container nav-wrap">
      <a href="#" class="brand-logo">
        <span class="brand-badge">${escapeHtml(config.brand.badgeText)}</span>
        <span>${escapeHtml(config.brand.name)}</span>
      </a>
      <nav>
        <ul class="nav-links">
          ${navHtml}
        </ul>
      </nav>
    </div>
  </header>

  <main class="container">
    
    <!-- Hero Section -->
    <section id="about" class="hero-section">
      <div class="hero-status">
        <span class="status-dot"></span>
        <span>${escapeHtml(config.hero.status)}</span>
      </div>
      <h1 class="hero-title">
        ${config.hero.headline}
      </h1>
      <p class="hero-role">${escapeHtml(config.hero.role)}</p>
      <p class="hero-bio">
        ${escapeHtml(config.hero.bio)}
      </p>
      <div class="hero-actions">
        ${heroActionsHtml}
      </div>
    </section>

    <!-- Featured Projects Section -->
    <section id="projects" class="section">
      <div class="section-header">
        <span class="section-tag">${escapeHtml(config.projects.sectionTag)}</span>
        <h2 class="section-title">${escapeHtml(config.projects.sectionTitle)}</h2>
      </div>

      <div class="projects-grid">
${projectsHtml}
      </div>
    </section>

    <!-- The CS Lab / Retro Sandbox Section -->
    <section id="lab" class="section">
      <div class="section-header">
        <span class="section-tag">${escapeHtml(config.lab.sectionTag)}</span>
        <h2 class="section-title">${escapeHtml(config.lab.sectionTitle)}</h2>
        <p style="margin-top: 0.5rem; font-size: 0.95rem;">
          ${escapeHtml(config.lab.description)}
        </p>
      </div>

      <div class="lab-grid">
${labHtml}
      </div>
    </section>

    <!-- Skills & Toolkit Section -->
    <section id="skills" class="section">
      <div class="section-header">
        <span class="section-tag">${escapeHtml(config.skills.sectionTag)}</span>
        <h2 class="section-title">${escapeHtml(config.skills.sectionTitle)}</h2>
      </div>

      <div class="skills-wrapper">
${skillsHtml}
      </div>
    </section>

    <!-- Contact & Footer -->
    <section id="contact" class="section">
      <div class="contact-card">
        <h3>${escapeHtml(config.contact.headline)}</h3>
        <p>
          ${escapeHtml(config.contact.description)}
        </p>
        <a href="mailto:${config.contact.email}" class="btn btn-primary">
          ${icons.email}
          ${escapeHtml(config.contact.email)}
        </a>
      </div>

      <footer class="footer">
        <div>
          <span>${escapeHtml(config.contact.footerCopy)}</span>
        </div>
        <div class="footer-links">
          ${socialsHtml}
        </div>
      </footer>
    </section>

  </main>

</body>
</html>
`;

fs.writeFileSync(outputPath, fullHtml, 'utf-8');
console.log('✅ Successfully generated index.html from portfolio.config.json!');
