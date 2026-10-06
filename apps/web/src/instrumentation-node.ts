import tls from 'node:tls';

/*
 * Development only: also trust the operating system's certificate store for server-side fetches.
 * Antivirus HTTPS scanning (e.g. Avast) re-signs remote certificates with a root that only the OS
 * store knows, so CMS reads from a local `next dev` to the remote API would otherwise fail and
 * silently serve the fallback content.
 */
if (process.env.NODE_ENV === 'development' && typeof tls.setDefaultCACertificates === 'function') {
  tls.setDefaultCACertificates([
    ...tls.getCACertificates('default'),
    ...tls.getCACertificates('system'),
  ]);
}
