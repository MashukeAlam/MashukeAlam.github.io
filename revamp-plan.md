I merged the two reviews into one list. Both cover the same ground: the out-of-sync build, missing metadata, no robots.txt/sitemap/404, the heavy background animation, and focus styles. The other review caught some things I missed, and I found some it didn't. I've also flagged two of its suggestions I'd adjust.

## Combined plan

### A. Repo health (do first)
1. **Pick one source for the homepage.** Running `npm run build` would overwrite the current `index.html` with the old design. The section IDs also differ (`#work/#about` vs `#projects/#skills`). Update [build.js](build.js) to output the current design and treat [portfolio.config.json](portfolio.config.json) as the place you edit content. That makes it easy to generate the JSON-LD and sitemap below.
2. **Fix four pages that are probably broken.** [game_math.html](game_math.html), [snake.html](snake.html), [typingrace.html](typingrace.html) and [passwordgenerator.html](passwordgenerator.html) still load the root `style.css`, which is now the portfolio's stylesheet. *(Only in my review.)*
3. **Archive or delete the old experiments and leftover files.** That includes `priv.html` (titled "Document"), `privacy_policy.html` (a bare `<ol>`), `jim`, `data/ips.json`, `database.rules.json`, `utility_functions/` and `lib/`. Keep the Asmaul Husna privacy pages reachable, because Google Play links to them.

### B. SEO
4. **Add head tags:** `rel="canonical"`, `og:image` and `og:image:alt`, `og:site_name`, the `twitter:card`/title/description tags, and `meta author`.
5. **Add JSON-LD `Person` data:** name, job title, URL, `sameAs` links to GitHub and LinkedIn, and your areas of expertise. Also add `rel="me"` to the profile links.
6. **Use real headings.** *(The other review's catch, and a good one.)* The section labels are `<span class="section-label">`. Change them to `<h2>` and make the stack group titles `<h3>`. The CSS stays the same, so the look won't change.
7. **Put your name and role in the hero text.** Right now your name appears only in the header, and the H1 doesn't say who you are.
8. **Add `robots.txt`, a curated `sitemap.xml` and a branded `404.html`.** The sitemap should list only pages you want indexed. Mark old experiments `noindex`.
9. **Give the Windows 7 lab a proper title and meta description, and remove `user-scalable=no`.** *(Only in my review.)*

### C. Performance and motion
10. **Load only the background scene you show.** `ascii-background.js` is 370 KB and contains all 13 scenes. Split it into one file per scene and load the chosen one. Also remove the watchdog `setInterval` that runs forever. *(Only in my review.)*
11. **Support reduced motion.** The other review suggests hiding the canvas with CSS. That alone isn't enough, because the JavaScript keeps animating while hidden and still uses CPU. The script should check `matchMedia('(prefers-reduced-motion: reduce)')` and either draw one frame or not start. Consider doing the same on small screens.
12. **Compress `pic_rect.jpeg`** (650 KB) to WebP if you use it as an avatar or the og:image.

### D. Accessibility and polish
13. **Add `:focus-visible` rings and a skip link.**
14. **Make mobile nav taps easier.** Let the nav links wrap and give links and the theme button a 44px tap target. *(The other review's catch.)*
15. **Stop the theme flash.** Move the theme script into `<head>`, and only save to `localStorage` when the user clicks the toggle. Right now the first visit locks in the system theme. *(Only in my review.)*
16. **Fix the dark-mode `theme-color`.** Use two `theme-color` meta tags with `media` queries instead of one light value.

### E. Content (I'll need you for this)
17. **Write a short About paragraph** that says who you are, what you build and what you're looking for. Optionally add a current role and a link to your résumé.
18. **Make project descriptions concrete:** the problem, what you built, one technical detail, and a result. As the other review says, don't make up benchmark numbers.
19. **Make a 1200×630 social preview image** and, optionally, project thumbnails.
20. **Finish with a Lighthouse run** on mobile and desktop, plus a keyboard-only pass.

### Two suggestions from the other review I'd skip or change
- `<meta name="robots" content="index, follow">`: that's already the default, so the tag adds nothing.
- Putting your email in JSON-LD: it's already on the page, so it's fine either way. But leaving it out of structured data means a bit less scraping.

**Next step:** I can do A, B (except the image), C and D on a branch, in separate commits, with no input from you. Section E needs your text and image. Should I start?