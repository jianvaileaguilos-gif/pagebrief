// Site settings. Values can also come from a .env file (see README).

export const CONFIG = {
  // Free Google PageSpeed Insights API key. Without one, checks share Google's
  // public quota, which is often used up. Restrict the key to your site's domain.
  psiApiKey: import.meta.env.VITE_PSI_KEY || '',

  // Where "Get a fix plan" requests go. Use ONE of these:
  //  - formEndpoint: a form service URL that accepts JSON POSTs (e.g. Formspree)
  //  - contactEmail: opens the visitor's email app with the request filled in
  // Leave both empty to run the form in demo mode (nothing is sent).
  formEndpoint: import.meta.env.VITE_FORM_ENDPOINT || '',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
};
