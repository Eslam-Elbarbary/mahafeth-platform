import { siteConfig } from '@/config/site';
import type { CityKey, InterestKey } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

/** Where the form was submitted from; mirrors the backend `LeadSource` enum. */
export type LeadSource = 'WEBSITE' | 'CONTACT_FORM' | 'PROJECT_PAGE';

export type LeadPayload = {
  name: string;
  phone: string;
  city: CityKey;
  interest: InterestKey | null;
  /** Project slug from `?project=`; the backend resolves it to the project relation. */
  project: string | null;
  source: LeadSource;
  locale: Locale;
};

export type LeadResult = { ok: true } | { ok: false; error: string };

const INTEREST_TYPES: Record<InterestKey, string> = {
  own: 'OWN',
  invest: 'INVEST',
  owner: 'OWNER_SERVICES',
  partner: 'PARTNERSHIP',
  job: 'JOB',
};

const TIMEOUT_MS = 15_000;

/** `POST /leads` — the public interest-form endpoint. */
export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  try {
    const res = await fetch(`${siteConfig.apiUrl}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: payload.name,
        // The backend accepts an optional leading `+` followed by digits only.
        phone: payload.phone.replace(/(?!^\+)[^\d]/g, ''),
        city: payload.city,
        interestType: payload.interest ? INTEREST_TYPES[payload.interest] : null,
        projectSlug: payload.project,
        source: payload.source,
        locale: payload.locale,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    return { ok: false, error: body?.error?.code ?? `HTTP_${res.status}` };
  } catch {
    return { ok: false, error: 'NETWORK' };
  }
}
