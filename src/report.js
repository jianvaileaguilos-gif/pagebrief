// Turns a Lighthouse result (from PageSpeed Insights or a local run) into a
// plain-language report. No DOM access here, so it also runs in Node.

// ---------- Plain-language translations ----------
// who: 'you' = a site owner can usually fix it in their site builder,
//      'dev' = needs a developer or the hosting company.
const PLAIN = {
  // Speed
  'image-delivery-insight': {
    title: 'Your images are bigger than they need to be',
    why: 'Oversized photos are the most common reason small-business sites are slow on phones.',
    fix: 'Resize photos to the size they are shown at and save them as WebP or compressed JPEG.',
    who: 'you',
  },
  'cache-insight': {
    title: 'Returning visitors download everything again',
    why: 'Your site does not tell browsers to keep its files, so a second visit is as slow as the first.',
    fix: 'Turn on browser caching in your hosting settings or caching plugin.',
    who: 'dev',
  },
  'render-blocking-insight': {
    title: 'The page waits on files before showing anything',
    why: 'Visitors stare at a blank screen while style and script files download.',
    fix: 'Load non-essential scripts later and inline the styles needed for the top of the page.',
    who: 'dev',
  },
  'unused-javascript': {
    title: 'The page downloads code it never uses',
    why: 'Every unused script still has to travel to the phone and be read.',
    fix: 'Remove plugins and scripts you no longer need, or load them only on pages that use them.',
    who: 'dev',
  },
  'unused-css-rules': {
    title: 'The page loads styling that is not used',
    why: 'Extra style files add download time before the page can appear.',
    fix: 'Remove unused theme styles or split them per page.',
    who: 'dev',
  },
  'unminified-javascript': {
    title: 'Code files are not compressed',
    why: 'Uncompressed code is bigger than it needs to be.',
    fix: 'Turn on minification in your build tool or optimisation plugin.',
    who: 'dev',
  },
  'unminified-css': {
    title: 'Style files are not compressed',
    why: 'Uncompressed styles are bigger than they need to be.',
    fix: 'Turn on CSS minification in your build tool or optimisation plugin.',
    who: 'dev',
  },
  'font-display-insight': {
    title: 'Text stays invisible while fonts load',
    why: 'Visitors see empty space where your words should be.',
    fix: 'Set fonts to show a fallback straight away (font-display: swap).',
    who: 'dev',
  },
  'server-response-time': {
    title: 'Your server is slow to answer',
    why: 'Nothing can load until your hosting responds, so everything else waits.',
    fix: 'Upgrade hosting, add page caching, or use a CDN.',
    who: 'dev',
  },
  'document-latency-insight': {
    title: 'The first response from your server is slow',
    why: 'Nothing can load until your hosting responds, so everything else waits.',
    fix: 'Add page caching, enable compression, and avoid redirects on the first request.',
    who: 'dev',
  },
  redirects: {
    title: 'Visitors are bounced through extra redirects',
    why: 'Each redirect is another trip across the network before the page starts loading.',
    fix: 'Link straight to the final address of the page.',
    who: 'dev',
  },
  'total-byte-weight': {
    title: 'The page is heavy to download',
    why: 'On a mobile connection, every megabyte adds seconds and uses up data plans.',
    fix: 'Compress images, remove unused scripts, and avoid large background videos.',
    who: 'you',
  },
  'bootup-time': {
    title: 'Phones work hard to run your site’s code',
    why: 'While a phone is busy running scripts, taps and scrolling do not respond.',
    fix: 'Cut back on heavy scripts, sliders, and add-ons.',
    who: 'dev',
  },
  'mainthread-work-breakdown': {
    title: 'The page keeps the phone busy',
    why: 'A busy phone feels frozen: buttons do nothing for a moment after a tap.',
    fix: 'Reduce scripts and complex effects, and load them after the page is visible.',
    who: 'dev',
  },
  'third-parties-insight': {
    title: 'Outside add-ons slow the page down',
    why: 'Chat widgets, trackers, and embeds load from other companies’ servers.',
    fix: 'Keep only the add-ons that earn their place, and load them after the page.',
    who: 'you',
  },
  'legacy-javascript-insight': {
    title: 'The site sends old-style code to modern phones',
    why: 'Older code is larger and slower than it needs to be.',
    fix: 'Update your build settings to target modern browsers.',
    who: 'dev',
  },
  'duplicated-javascript-insight': {
    title: 'The same code is loaded twice',
    why: 'Duplicate libraries double the download for no benefit.',
    fix: 'Remove the duplicate plugin or library.',
    who: 'dev',
  },
  'lcp-discovery-insight': {
    title: 'Your main image is found late',
    why: 'The biggest thing on screen starts downloading later than it should.',
    fix: 'Do not lazy-load the main image at the top, and mark it as high priority.',
    who: 'dev',
  },
  'dom-size-insight': {
    title: 'The page is built from too many pieces',
    why: 'Very large pages take longer for phones to lay out and update.',
    fix: 'Simplify page-builder sections and remove hidden content.',
    who: 'dev',
  },
  'modern-http-insight': {
    title: 'Your server uses an older connection method',
    why: 'Newer connection types load many files at once, which is faster.',
    fix: 'Ask your host to enable HTTP/2 or HTTP/3.',
    who: 'dev',
  },
  'bf-cache': {
    title: 'The back button reloads the whole page',
    why: 'Visitors who go back have to wait all over again.',
    fix: 'Avoid code that stops the browser from keeping the page in memory.',
    who: 'dev',
  },
  'unsized-images': {
    title: 'Images have no set size, so the page jumps',
    why: 'Text moves as pictures appear, and visitors tap the wrong thing.',
    fix: 'Give every image a width and height.',
    who: 'dev',
  },

  // Mobile
  'meta-viewport': {
    title: 'Your site is not set up for phone screens',
    why: 'Phones show a shrunken desktop page that people have to pinch and zoom.',
    fix: 'Add a viewport tag and use a responsive theme.',
    who: 'dev',
  },
  'viewport-insight': {
    title: 'Taps feel delayed on phones',
    why: 'Without mobile settings, phones wait before reacting to a tap.',
    fix: 'Add a proper viewport tag to every page.',
    who: 'dev',
  },
  'target-size': {
    title: 'Buttons and links are too small to tap easily',
    why: 'People with larger fingers or shaky hands tap the wrong thing.',
    fix: 'Make buttons at least 24 pixels tall with space between them.',
    who: 'you',
  },
  'image-size-responsive': {
    title: 'Some images look blurry on phones',
    why: 'Images smaller than the screen needs look soft on sharp phone displays.',
    fix: 'Upload images at twice the size they appear on screen.',
    who: 'you',
  },
  'cumulative-layout-shift': {
    title: 'Things jump around while the page loads',
    why: 'Visitors lose their place or tap the wrong button as content moves.',
    fix: 'Reserve space for images, ads, and banners before they load.',
    who: 'dev',
  },

  // Search
  'document-title': {
    title: 'The page has no title',
    why: 'The title is the blue headline people click on in Google.',
    fix: 'Give every page a clear title with your business name and what you offer.',
    who: 'you',
  },
  'meta-description': {
    title: 'There is no description for Google to show',
    why: 'Without one, Google picks random text from your page for search results.',
    fix: 'Write a one or two sentence summary for each page in your site settings.',
    who: 'you',
  },
  'is-crawlable': {
    title: 'Search engines are told not to list this page',
    why: 'This page can not appear in Google at all.',
    fix: 'Remove the “noindex” setting, often a “discourage search engines” box in your site settings.',
    who: 'you',
  },
  'http-status-code': {
    title: 'The page answers with an error code',
    why: 'Search engines will not list pages that report an error.',
    fix: 'Check the page address and your hosting setup.',
    who: 'dev',
  },
  'link-text': {
    title: 'Links say “click here” instead of where they go',
    why: 'Google and screen readers use link text to understand your pages.',
    fix: 'Change link text to describe the destination, like “See our menu”.',
    who: 'you',
  },
  'crawlable-anchors': {
    title: 'Some links can not be followed by Google',
    why: 'Pages that are only reachable through these links may never be found.',
    fix: 'Use normal links with a real address.',
    who: 'dev',
  },
  hreflang: {
    title: 'Language versions of the page are set up wrongly',
    why: 'Google may show the wrong language to searchers.',
    fix: 'Fix the language links in your page settings.',
    who: 'dev',
  },
  canonical: {
    title: 'The page points Google at the wrong main address',
    why: 'Google may list a different page, or none.',
    fix: 'Set the page’s canonical address to itself.',
    who: 'dev',
  },
  'robots-txt': {
    title: 'Your robots.txt file has problems',
    why: 'This file tells search engines what they may read. Errors can block your site.',
    fix: 'Fix or remove the broken lines in robots.txt.',
    who: 'dev',
  },

  // Accessibility
  'color-contrast': {
    title: 'Some text is hard to read',
    why: 'Pale text on a light background is hard to read in sunlight or with weaker eyesight.',
    fix: 'Darken the text or lighten the background.',
    who: 'you',
  },
  'image-alt': {
    title: 'Images have no descriptions',
    why: 'Blind visitors hear nothing, and Google can not tell what the photos show.',
    fix: 'Add a short “alt text” description to each meaningful image.',
    who: 'you',
  },
  'button-name': {
    title: 'Some buttons have no name',
    why: 'Screen readers announce them only as “button”, so visitors do not know what they do.',
    fix: 'Give icon buttons a text label.',
    who: 'dev',
  },
  'link-name': {
    title: 'Some links have no readable name',
    why: 'Screen reader users can not tell where the link goes.',
    fix: 'Add text or a label to image and icon links.',
    who: 'dev',
  },
  label: {
    title: 'Form fields have no labels',
    why: 'Screen reader users do not know what to type, so enquiries get lost.',
    fix: 'Add a visible label above each form field.',
    who: 'you',
  },
  'select-name': {
    title: 'Drop-down menus have no labels',
    why: 'Screen reader users do not know what they are choosing.',
    fix: 'Add a label to each drop-down.',
    who: 'dev',
  },
  'html-has-lang': {
    title: 'The page does not say what language it is in',
    why: 'Screen readers may read your words with the wrong accent.',
    fix: 'Set the page language in your site settings.',
    who: 'dev',
  },
  'heading-order': {
    title: 'Headings skip levels',
    why: 'People using screen readers jump between headings to find their way around.',
    fix: 'Use headings in order: one main heading, then smaller ones below it.',
    who: 'you',
  },
  'label-content-name-mismatch': {
    title: 'Some buttons are named differently from what they show',
    why: 'Voice-control users say the words they see, and the button does not respond.',
    fix: 'Make each button’s hidden label start with its visible text.',
    who: 'dev',
  },
  'link-in-text-block': {
    title: 'Links only stand out by colour',
    why: 'Colour-blind visitors can not spot them.',
    fix: 'Underline links inside paragraphs.',
    who: 'you',
  },
  'skip-link': {
    title: 'The “skip to content” link is broken',
    why: 'Keyboard users have to tab through the whole menu on every page.',
    fix: 'Point the skip link at the main content.',
    who: 'dev',
  },

  // Security and basics
  'is-on-https': {
    title: 'Your site is not fully secure',
    why: 'Browsers show a “Not secure” warning, which scares visitors away.',
    fix: 'Turn on HTTPS (a free SSL certificate) with your host.',
    who: 'dev',
  },
  'errors-in-console': {
    title: 'The page has errors behind the scenes',
    why: 'Hidden errors can break forms, menus, or tracking without you noticing.',
    fix: 'Have a developer look at the browser console errors.',
    who: 'dev',
  },
  deprecations: {
    title: 'The site uses outdated browser features',
    why: 'These may stop working in future browser updates.',
    fix: 'Update your theme and plugins.',
    who: 'dev',
  },
  'image-aspect-ratio': {
    title: 'Some images are stretched or squashed',
    why: 'Distorted photos make a business look careless.',
    fix: 'Upload images in the shape they are shown at.',
    who: 'you',
  },
  'third-party-cookies': {
    title: 'The page relies on third-party cookies',
    why: 'Browsers are blocking these, so features that depend on them may stop working.',
    fix: 'Check which add-ons set them and whether you still need them.',
    who: 'dev',
  },
  'paste-preventing-inputs': {
    title: 'Some form fields block pasting',
    why: 'People can not paste passwords or addresses, and some give up.',
    fix: 'Allow pasting in every field.',
    who: 'dev',
  },
};

// Audits that only matter to developers
const IGNORE = new Set(['valid-source-maps', 'inspector-issues', 'max-potential-fid', 'interactive', 'lcp-breakdown-insight', 'network-dependency-tree-insight', 'forced-reflow-insight', 'cls-culprits-insight', 'inp-breakdown-insight']);

// Always shown near the top when they fail
const CRITICAL = new Set(['is-crawlable', 'is-on-https', 'meta-viewport', 'http-status-code', 'document-title']);

// The mobile score is ours: four checks that decide how a site feels on a phone
const MOBILE_CHECKS = [
  { id: 'meta-viewport', weight: 35 },
  { id: 'target-size', weight: 25 },
  { id: 'cumulative-layout-shift', weight: 25 },
  { id: 'image-size-responsive', weight: 15 },
];

export const CATEGORIES = {
  speed: { label: 'Speed', lh: 'performance' },
  mobile: { label: 'Mobile', lh: null },
  search: { label: 'Search', lh: 'seo' },
  access: { label: 'Accessibility', lh: 'accessibility' },
};

const METRICS = [
  { id: 'first-contentful-paint', label: 'Something appears', target: 1800, unit: 'ms' },
  { id: 'largest-contentful-paint', label: 'Main content is visible', target: 2500, unit: 'ms' },
  { id: 'speed-index', label: 'Page looks loaded', target: 3400, unit: 'ms' },
  { id: 'total-blocking-time', label: 'Page is frozen for', target: 200, unit: 'ms' },
  { id: 'cumulative-layout-shift', label: 'Layout jumps', target: 0.1, unit: 'cls' },
];

export function rating(score) {
  if (score == null) return { key: 'na', word: 'Not tested' };
  if (score >= 90) return { key: 'good', word: 'Great' };
  if (score >= 50) return { key: 'ok', word: 'Needs work' };
  return { key: 'poor', word: 'Poor' };
}

export function formatMs(ms) {
  if (ms == null) return '-';
  // Non-breaking space keeps the number and unit on one line
  if (ms < 1000) return `${Math.round(ms / 10) * 10} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

const clean = (s = '') =>
  s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

// ---------- Main entry ----------
export function buildReport(lhr, { source = 'live' } = {}) {
  const audits = lhr.audits || {};
  const cats = lhr.categories || {};
  const a = (id) => audits[id];
  const desktop = lhr.configSettings?.formFactor === 'desktop';
  const pct =(s) => (s == null ? null : Math.round(s * 100));

  // Which categories each audit belongs to, with its weight
  const membership = {};
  for (const [catId, cat] of Object.entries(cats)) {
    for (const ref of cat.auditRefs || []) {
      (membership[ref.id] ||= []).push({ cat: catId, weight: ref.weight || 0 });
    }
  }

  // Mobile score: weighted average of the mobile checks that ran
  let mSum = 0;
  let mWeight = 0;
  const mobileChecks = [];
  for (const { id, weight } of MOBILE_CHECKS) {
    const au = a(id);
    if (!au || au.score == null) continue;
    mSum += au.score * weight;
    mWeight += weight;
    mobileChecks.push({ id, passed: au.score >= 0.9 });
  }

  const scores = {
    speed: pct(cats.performance?.score),
    mobile: mWeight ? Math.round((mSum / mWeight) * 100) : null,
    search: pct(cats.seo?.score),
    access: pct(cats.accessibility?.score),
    basics: pct(cats['best-practices']?.score),
  };

  // Metrics in plain words
  const metrics = METRICS.map((m) => {
    const au = a(m.id);
    if (!au || au.numericValue == null) return null;
    const v = au.numericValue;
    const good = v <= m.target;
    let value;
    let targetText;
    if (m.unit === 'cls') {
      value = v < 0.05 ? 'Barely' : v <= 0.1 ? 'A little' : v <= 0.25 ? 'Noticeably' : 'A lot';
      targetText = 'Google’s target: barely at all';
    } else {
      value = formatMs(v);
      targetText = `Google’s target: under ${formatMs(m.target)}`;
    }
    return { id: m.id, label: m.label, value, raw: v, good, score: au.score, targetText };
  }).filter(Boolean);

  // Loading filmstrip
  const filmstrip = (a('screenshot-thumbnails')?.details?.items || []).map((f) => ({ t: f.timing, src: f.data }));
  const screenshot = a('final-screenshot')?.details?.data || null;

  // Issues
  const issues = [];
  const passed = { speed: 0, mobile: 0, search: 0, access: 0, basics: 0 };
  const mobileIds = new Set(MOBILE_CHECKS.map((c) => c.id));

  for (const [id, au] of Object.entries(audits)) {
    if (IGNORE.has(id)) continue;
    const mode = au.scoreDisplayMode;
    if (mode === 'manual' || mode === 'notApplicable' || mode === 'informative' || mode === 'error') continue;
    if (au.score == null) continue;

    const member = membership[id] || [];
    const catList = member.map((m) => mapCat(m.cat));
    if (mobileIds.has(id)) catList.unshift('mobile');
    if (!catList.length) continue;
    const primary = catList[0];

    // Insights with no measurable saving and a middling score are noise
    const quietInsight = mode === 'metricSavings' && id !== 'total-byte-weight' && !hasSavings(au) && au.score >= 0.5;
    const failing = au.score < 0.9 && !quietInsight;
    if (!failing) {
      new Set(catList).forEach((c) => passed[c]++);
      continue;
    }
    // Speed metrics are shown as the timeline, not as issues
    if (METRICS.some((m) => m.id === id) && id !== 'cumulative-layout-shift') continue;

    const plain = PLAIN[id];
    const ms = au.metricSavings || {};
    const savingsMs = Math.max(ms.LCP || 0, ms.FCP || 0) || au.details?.overallSavingsMs || 0;
    const savingsTbt = ms.TBT || 0;
    const savingsBytes = savedBytes(au);
    const weight = Math.max(0, ...member.map((m) => m.weight));

    let impact = weight * (1 - au.score) + savingsMs / 100 + savingsTbt / 150 + savingsBytes / 150000;
    if (CRITICAL.has(id)) impact += 100;
    if (primary === 'mobile') impact += 8;
    if (id === 'total-byte-weight') impact += (au.numericValue || 0) / 1024 / 1024;

    let gain = '';
    if (savingsMs >= 100) gain = `Could make the page appear about ${formatMs(savingsMs)} sooner.`;
    else if (savingsTbt >= 200) gain = `Could cut up to ${formatMs(savingsTbt)} of freezing while the page loads.`;
    else if (savingsBytes >= 50 * 1024) gain = `Could cut about ${formatBytes(savingsBytes)} from the download.`;
    else if (id === 'total-byte-weight' && au.numericValue) gain = `The page is ${formatBytes(au.numericValue)} in total. Aim for under 1.6 MB.`;

    const count = Array.isArray(au.details?.items) ? au.details.items.length : 0;

    let title = plain?.title || clean(au.title);
    if (desktop) title = title.replace(/\bPhones\b/, 'Computers').replace(/\bthe phone\b/, 'the computer');

    issues.push({
      id,
      category: primary,
      title,
      why: plain?.why || clean(au.description).split('. ')[0] + '.',
      fix: plain?.fix || '',
      who: plain?.who || 'dev',
      gain,
      count,
      technical: clean(au.title),
      severity: CRITICAL.has(id) ? 'critical' : impact >= 12 ? 'high' : impact >= 4 ? 'medium' : 'low',
      impact,
    });
  }
  issues.sort((x, y) => y.impact - x.impact);

  const url = lhr.finalDisplayedUrl || lhr.finalUrl || lhr.requestedUrl;
  return {
    url,
    host: safeHost(url),
    strategy: lhr.configSettings?.formFactor === 'desktop' ? 'desktop' : 'mobile',
    fetchedAt: lhr.fetchTime,
    lighthouseVersion: lhr.lighthouseVersion,
    source,
    scores,
    metrics,
    filmstrip,
    screenshot,
    mobileChecks,
    issues,
    passed,
    summary: summarise(scores, metrics, issues),
  };
}

function mapCat(lhCat) {
  return { performance: 'speed', seo: 'search', accessibility: 'access', 'best-practices': 'basics' }[lhCat] || 'basics';
}

function hasSavings(au) {
  const s = au.metricSavings || {};
  return Object.values(s).some((v) => v > 0) || savedBytes(au) > 0;
}

// Lighthouse 13 insights list savings per item instead of as a total
function savedBytes(au) {
  const d = au.details;
  if (!d) return 0;
  if (d.overallSavingsBytes) return d.overallSavingsBytes;
  if (!Array.isArray(d.items)) return 0;
  return d.items.reduce((sum, it) => sum + (typeof it === 'object' && it ? it.wastedBytes || 0 : 0), 0);
}

// Host plus path, so sites that live in a sub-folder (like GitHub Pages) are identifiable
function safeHost(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    return u.hostname.replace(/^www\./, '') + path;
  } catch {
    return url;
  }
}

// One or two sentences a business owner can read in five seconds
function summarise(scores, metrics, issues) {
  const names = { speed: 'speed', mobile: 'how it works on phones', search: 'how search engines read it', access: 'accessibility' };
  const entries = Object.entries(names).filter(([k]) => scores[k] != null);
  const strong = entries.filter(([k]) => scores[k] >= 90).map(([, v]) => v);
  const weak = entries.filter(([k]) => scores[k] < 50).map(([k]) => k);
  const middling = entries.filter(([k]) => scores[k] >= 50 && scores[k] < 90).map(([k]) => k);
  const lcp = metrics.find((m) => m.id === 'largest-contentful-paint');

  let headline;
  if (!weak.length && !middling.length) headline = 'Your site is in great shape.';
  else if (weak.includes('speed')) headline = 'Your site is slow, and that is costing you visitors.';
  else if (weak.length) headline = `Your site has a problem with ${names[weak[0]]}.`;
  else headline = 'Your site is solid, with a few things worth fixing.';

  const parts = [];
  if (strong.length) parts.push(`It scores well on ${listJoin(strong)}.`);
  if (lcp && !lcp.good) parts.push(`Visitors wait ${lcp.value} to see the main content. Google’s target is ${formatMs(2500)}.`);
  const top = issues.filter((i) => i.severity !== 'low').length;
  const allGood = !weak.length && !middling.length;
  if (allGood && issues.length) parts.push('There are still a few small things below you could tidy up.');
  else if (top) parts.push(`Fixing the ${Math.min(top, 3) === 1 ? 'first item' : `first ${Math.min(top, 3)} items`} below would make the biggest difference.`);

  return { headline, detail: parts.join(' ') };
}

function listJoin(arr) {
  if (arr.length <= 1) return arr.join('');
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

// ---------- Slimming for storage ----------
// Keeps only what buildReport reads, so a saved sample stays small.
export function slimLhr(lhr) {
  const keep = {};
  for (const [id, au] of Object.entries(lhr.audits)) {
    const d = au.details;
    let details;
    if (d?.type === 'filmstrip') details = { type: d.type, items: d.items };
    else if (d?.type === 'screenshot') details = { type: d.type, data: d.data };
    else if (d)
      details = {
        overallSavingsMs: d.overallSavingsMs,
        overallSavingsBytes: savedBytes(au) || undefined,
        items: Array.isArray(d.items) ? d.items.map(() => 0) : undefined,
      };
    keep[id] = {
      title: au.title,
      description: au.description,
      score: au.score,
      scoreDisplayMode: au.scoreDisplayMode,
      numericValue: au.numericValue,
      metricSavings: au.metricSavings,
      details,
    };
  }
  const categories = {};
  for (const [k, c] of Object.entries(lhr.categories)) {
    categories[k] = { score: c.score, auditRefs: c.auditRefs.map((r) => ({ id: r.id, weight: r.weight })) };
  }
  return {
    lighthouseVersion: lhr.lighthouseVersion,
    requestedUrl: lhr.requestedUrl,
    finalDisplayedUrl: lhr.finalDisplayedUrl,
    fetchTime: lhr.fetchTime,
    configSettings: { formFactor: lhr.configSettings?.formFactor },
    categories,
    audits: keep,
  };
}
