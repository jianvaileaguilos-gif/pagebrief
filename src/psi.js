import { CONFIG } from './config.js';

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const TIMEOUT_MS = 90_000;

export class CheckError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // 'unreachable' | 'quota' | 'invalid' | 'timeout' | 'network' | 'failed'
  }
}

// Adds https:// when missing and rejects things that are clearly not a web address
export function normaliseUrl(input) {
  let value = (input || '').trim();
  if (!value) throw new CheckError('invalid', 'Type your website address first.');
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new CheckError('invalid', 'That does not look like a website address. Try something like yourshop.com');
  }
  const host = url.hostname;
  if (!host.includes('.') || host.endsWith('.') || /\s/.test(host)) {
    throw new CheckError('invalid', 'That does not look like a website address. Try something like yourshop.com');
  }
  if (host === 'localhost' || /^(127\.|10\.|192\.168\.)/.test(host)) {
    throw new CheckError('invalid', 'We can only check sites that are live on the internet.');
  }
  return url.href;
}

export async function runCheck(url, strategy, { signal } = {}) {
  const params = new URLSearchParams({ url, strategy });
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) params.append('category', c);
  if (CONFIG.psiApiKey) params.set('key', CONFIG.psiApiKey);

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
  const onAbort = () => timeout.abort();
  signal?.addEventListener('abort', onAbort);

  let res;
  try {
    res = await fetch(`${ENDPOINT}?${params}`, { signal: timeout.signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (timeout.signal.aborted) throw new CheckError('timeout', 'The check took too long. Your site may be very slow or blocking automated visits.');
    throw new CheckError('network', 'We could not reach the checking service. Check your internet connection and try again.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  let body = null;
  try {
    body = await res.json();
  } catch {}

  if (!res.ok) {
    const msg = body?.error?.message || '';
    // Google's own reason, for the site owner (e.g. a key restriction that does not match)
    console.warn(`PageSpeed Insights ${res.status}: ${msg}`);
    if (res.status === 429) {
      throw new CheckError('quota', 'So many people are running checks that Google’s free limit is used up for today. Please try again later.');
    }
    if (/FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS_FAILURE|NO_FCP|unreachable/i.test(msg)) {
      throw new CheckError('unreachable', 'We could not open that website. Check the address is right and the site is online.');
    }
    if (res.status === 400) {
      throw new CheckError('invalid', 'Google could not check that address. Check it is spelled correctly.');
    }
    throw new CheckError('failed', 'Something went wrong while checking your site. Please try again in a minute.');
  }

  const lhr = body?.lighthouseResult;
  if (!lhr || lhr.runtimeError?.code) {
    throw new CheckError('unreachable', 'We could not load that page properly. It may be down, blocking automated visits, or redirecting in a loop.');
  }
  return lhr;
}
