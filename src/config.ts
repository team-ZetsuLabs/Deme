/** Adresse du site public de Dɛmɛ (réglable avec VITE_SITE_URL). */
export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL || 'https://hackathon-web-4glg.onrender.com/'
).replace(/\/?$/, '/')

/** Adresse d'une page du site public, par exemple siteUrl('question/12'). */
export const siteUrl = (path = '') => `${SITE_URL}${path.replace(/^\//, '')}`
