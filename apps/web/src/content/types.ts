/*
 * View models consumed by components — already resolved to one locale.
 * Temporary content files (`site.ts`, `home.ts`) produce these today; a CMS adapter mapping the
 * backend's `*Ar`/`*En` columns, `Media` rows and `Section.content` JSON will produce the same shapes.
 */

/** Mirrors backend `Media` (url, width, height, altAr/altEn). `position` is the CSS object-position. */
export type MediaAsset = {
  src: string;
  width: number;
  height: number;
  alt: string;
  position?: string;
};

export type CityKey = 'jeddah' | 'riyadh' | 'abha';

/** Lead interest keys used by the design (`data-k`); map to backend `LeadInterest` on submit. */
export type InterestKey = 'own' | 'invest' | 'owner' | 'partner' | 'job';

/** Mirrors backend `ProjectStatus`. */
export type ProjectStatus = 'AVAILABLE' | 'UNDER_CONSTRUCTION' | 'COMING_SOON' | 'SOLD_OUT';

/**
 * `href` conventions: `#id` = home-page section, `/path` = locale-relative route,
 * anything else (tel:, https:) is used as-is.
 */
export type NavLink = {
  label: string;
  href: string;
  /** Showcase slide index (`data-go`) — scrolls the pinned stack instead of jumping. */
  go?: number;
  /** Pre-selects the lead-form interest chip (`data-k`). */
  interest?: InterestKey;
  /** Thumbnail shown next to the label where the menu supports it (project links). */
  image?: MediaAsset;
};

export type MegaPanel = {
  id: string;
  title: string;
  body: string;
  cta: NavLink;
  links: NavLink[];
};

/** `section` is the home-page section id used for scroll-spy while the nav links to real routes. */
export type NavItem = NavLink & { menu?: MegaPanel; section?: string };

export type FooterColumn = { id: string; title: string; links: NavLink[] };

export type SocialLink = {
  network: 'linkedin' | 'x' | 'instagram' | 'snapchat';
  label: string;
  href: string;
};

export type SiteContent = {
  brand: { name: string; homeLabel: string; logo: MediaAsset; seal: MediaAsset };
  nav: NavItem[];
  navLabel: string;
  mobileNav: { label: string; links: NavLink[]; sub: NavLink };
  cta: NavLink;
  contact: { phone: string; whatsapp: string };
  floatingContact: {
    label: string;
    whatsapp: { aria: string; label: string };
    call: { aria: string; label: string };
  };
  footer: {
    heading: string;
    cta: NavLink;
    tagline: string;
    /** Company, Projects, Services — rendered in order after the brand column. */
    columns: FooterColumn[];
    contact: {
      title: string;
      phoneLabel: string;
      phone: string;
      whatsappLabel: string;
      branchesLabel: string;
      /** `phone` is empty when the branch has no direct number. */
      branches: Array<{ city: string; address: string; phone: string }>;
      cta: NavLink;
    };
    socialLabel: string;
    social: SocialLink[];
    /** "© year holder. rights" — the holder links to `href`. */
    copyright: { holder: string; href: string; rights: string };
    legal: NavLink[];
  };
};

/** Global settings (CMS `GET /settings`, else `content/fallback/settings.ts`) for one locale. */
export type SiteSettings = {
  companyName: string;
  /** Header mark (small) and footer / page-transition seal (large); one image when set in the CMS. */
  logo: MediaAsset;
  seal: MediaAsset;
  favicon: string;
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    branches: Array<{ city: string; address: string; phone: string }>;
  };
  /** Profile URLs; `#` when not set so every icon keeps its place in the footer. */
  social: Record<SocialLink['network'], string>;
  seo: { title: string; description: string; ogImage: string | null };
  footer: { legal: NavLink[] };
};

/** Cinematic hero shared by every internal page. */
export type PageHeroContent = {
  eyebrow?: string;
  titleLines: string[];
  lede?: string;
  media: MediaAsset;
};

export type PageMeta = { title: string; description: string };

export type PageContent = { meta: PageMeta; crumb: string; hero: PageHeroContent };

/** The branded 404 (`app/[locale]/not-found.tsx`). */
export type NotFoundContent = {
  title: string;
  /** Large number behind the heading. */
  mark: string;
  hero: PageHeroContent;
  home: string;
  projects: string;
};

export type AuraSpark = { top: string; left: string; delay: string };

export type IntroContent = { words: string[] };

export type HeroContent = {
  label: string;
  eyebrow: string;
  titleLines: string[];
  sub: string;
  cta: NavLink;
  film: { label: string; dialogLabel: string; poster: MediaAsset };
  /** Cinematic backdrop behind the aura (image today; a looping CDN video can replace it later). */
  backdrop: MediaAsset;
  hint: string;
};

export type TimelineItem = { year: string; title: string; body: string; current?: boolean };

export type FigureStat = { value: number; plus?: boolean; label: string };

export type AboutContent = {
  label: string;
  titleLines: string[];
  primaryImage: MediaAsset;
  secondaryImage: MediaAsset;
  lede: string;
  more: string;
  less: string;
  story: { label: string; items: TimelineItem[] };
  figures: FigureStat[];
};

export type ShowcaseProject = {
  slug: string;
  name: string;
  city: CityKey;
  location: string;
  status: ProjectStatus;
  statusLabel: string;
  image: MediaAsset;
  href: string;
  linkLabel: string;
  facts: { value: string; unit?: string; label: string }[];
};

export type MapPin = { city: CityKey; label: string; x: number; y: number };

/** Showcase copy and map. The featured projects themselves come from `lib/cms/projects.ts`. */
export type ShowcaseContent = {
  label: string;
  title: string;
  cta: NavLink;
  pagerLabel: string;
  /** Visual CTA on each slide (the whole slide is the link). */
  exploreLabel: string;
  pins: MapPin[];
  /** When set, the map always highlights this city (the design pins Abha). */
  focusCity?: CityKey;
};

/** View model of the CMS `Service`, produced by `lib/cms/services.ts`. */
export type ServiceItem = {
  slug: string;
  /** Two-digit position in the list (`01`…), derived from the display order. */
  no: string;
  title: string;
  /** `summaryAr/En` — the accordion row line and the detail hero lede. */
  summary: string;
  /** First paragraph of `descriptionAr/En`, shown when the accordion row opens. */
  body: string;
  image: MediaAsset;
  href: string;
};

/** Services section copy. The services themselves come from `lib/cms/services.ts`. */
export type ServicesContent = {
  label: string;
  titleLines: string[];
  /** Link to the service page inside an open accordion row. */
  more: string;
};

export type ServiceDetail = ServiceItem & {
  /** CMS uuid. Absent in temporary content. */
  id?: string;
  /** `descriptionAr/En`, split into paragraphs on blank lines. */
  description: string[];
  /** `metaTitle*` / `metaDescription*`, falling back to the title and summary. */
  meta: PageMeta;
};

export type ServiceDetailLabels = {
  overview: { label: string; facts: string };
  factKeys: { service: string; scope: string; developer: string };
  scopeValue: string;
  developerValue: string;
  enquire: string;
  more: { label: string; title: string[] };
  next: string;
};

/** View model of the CMS `TeamMember`, produced by `lib/cms/team.ts`. */
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  /** Biography / message, split into paragraphs. */
  bio: string[];
  photo: MediaAsset | null;
};

/** One slide of the leadership track: a member's portrait and message. */
export type LeadershipMember = {
  id: string;
  name: string;
  role: string;
  quote: string;
  photo: MediaAsset;
};

/** Leadership section copy. The members themselves come from `lib/cms/team.ts`. */
export type LeadershipContent = {
  label: string;
  title: string;
  trackLabel: string;
  dotsLabel: string;
  dotLabel: string;
  swipeHint: string;
};

/** `/leadership` introduction next to the members list. */
export type LeadershipIntroContent = {
  label: string;
  titleLines: string[];
  body: string[];
  members: string;
};

/** Label, heading, paragraph and a wide image (about vision / mission). */
export type StatementContent = {
  label: string;
  titleLines: string[];
  body: string;
  image?: MediaAsset;
};

/** Closing call to action over a full-bleed image; call / WhatsApp numbers come from the settings. */
export type PageCtaContent = {
  label: string;
  titleLines: string[];
  body: string;
  /** Without an `href` the button uses the site-wide interest link. */
  button: { label: string; href?: string };
  call: string;
  whatsapp: string;
  image: MediaAsset;
};

/** Contact channels block; the numbers and email come from the settings. */
export type ContactInfoContent = {
  label: string;
  titleLines: string[];
  lede?: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours?: { label: string; value: string };
};

/** Branch list block; the branches come from the settings. */
export type BranchesContent = { label: string; titleLines: string[]; lede?: string };

export type ContactMapContent = {
  label: string;
  titleLines: string[];
  lede?: string;
  address: string;
  coordinates: GeoPoint | null;
  directions: string;
  pending: string;
};

export type ReachItem = { key: InterestKey; title: string; body: string; button: string };

export type ReachContent = { label: string; title: string; items: ReachItem[] };

/** Interest section copy (Pages CMS `INTEREST_FORM` section). */
export type InterestSectionContent = {
  label: string;
  titleLines: string[];
  lede: string;
  points: string[];
  card: { title: string; body: string };
  submit: string;
  note: string;
  success: { title: string; body: string };
};

/** Interest form labels, options and messages (global content `forms.interest`). */
export type InterestFormLabels = {
  fields: { name: string; phone: string; city: string; interest: string };
  cities: { key: CityKey; label: string }[];
  interests: { key: InterestKey; label: string }[];
  /** Shown when the form is opened from a project page (`?project=`). */
  project: { label: string; clear: string };
  errors: { name: string; phone: string; city: string; submit: string };
  again: string;
};

export type InterestContent = Omit<InterestSectionContent, 'success'> &
  Omit<InterestFormLabels, 'again'> & {
    success: InterestSectionContent['success'] & { again: string };
  };

/** View model of the CMS `Partner`, produced by `lib/cms/partners.ts`. */
export type PartnerLogo = {
  name: string;
  logo: MediaAsset;
  /** `websiteUrl` — carried for structured data; the marquee itself is decorative. */
  url?: string;
};

/** Partners section copy. The logos themselves come from `lib/cms/partners.ts`. */
export type PartnersContent = { label: string; lede: string };

export type HomeContent = {
  intro: IntroContent;
  sparks: AuraSpark[];
  hero: HeroContent;
  about: AboutContent;
  showcase: ShowcaseContent;
  services: ServicesContent;
  leadership: LeadershipContent;
  reach: ReachContent;
  interest: InterestContent;
  partners: PartnersContent;
};

/* ───────────── Global content ─────────────
 * Menus, footer, buttons, labels and internal page headers (CMS settings `navigation`, `forms`,
 * `global`, `headers`, else `content/fallback/global-content.ts`) for one locale. */

export type HeaderPageKey = 'projects' | 'services' | 'partners';

export type NavigationLabels = {
  navLabel: string;
  mobileMenu: string;
  about: string;
  projects: string;
  services: string;
  leadership: string;
  contact: string;
  partners: string;
  aboutPage: string;
  journey: string;
  branches: string;
  careers: string;
  allProjects: string;
  aboutMenuBody: string;
  projectsMenuBody: string;
  servicesMenuBody: string;
  footerHeading: string;
  footerTagline: string;
  footerCompany: string;
  footerProjects: string;
  footerServices: string;
  footerContact: string;
  footerPhone: string;
  footerWhatsapp: string;
  footerBranches: string;
  footerSocial: string;
  footerRights: string;
};

export type ButtonLabels = {
  register: string;
  registerNow: string;
  more: string;
  contactUs: string;
  whatsapp: string;
  call: string;
  close: string;
  nextPage: string;
};

export type GlobalLabels = {
  home: string;
  crumbHome: string;
  scrollHint: string;
  quickContact: string;
  whatsappAria: string;
  callAria: string;
  linkedin: string;
  x: string;
  instagram: string;
  snapchat: string;
  menuOpen: string;
  menuClose: string;
  toTop: string;
  themeToggle: string;
  themeTitle: string;
  cursorView: string;
  cursorExplore: string;
  cursorClick: string;
};

export type GlobalContent = {
  navigation: NavigationLabels;
  forms: { interest: InterestFormLabels };
  buttons: ButtonLabels;
  labels: GlobalLabels;
  headers: Record<HeaderPageKey, PageContent>;
};

/* ───────────── Project details ─────────────
 * View model of the CMS `Project` (+ categorized `ProjectImage`s, `Media` cover), produced by
 * `lib/cms/projects.ts` — from the API when available, from `content/fallback` otherwise. */

export type ProjectStat = {
  /** A single number, or a `[min, max]` range (unit sizes). */
  value: number | [number, number];
  /** Render as-is instead of counting up (years). */
  plain?: boolean;
  unit?: string;
  label: string;
  note?: string;
};

export type ProjectFeatureIcon = 'plan' | 'key' | 'shield' | 'pin' | 'service' | 'calendar';

export type ProjectFeature = { icon: ProjectFeatureIcon; title: string; body: string };

/** `ProjectImage` row: media + caption, ordered by `order`. */
export type ProjectGalleryItem = { image: MediaAsset; caption: string };

export type GeoPoint = { lat: number; lng: number };

export type ProjectDetail = ShowcaseProject & {
  /** CMS uuid — sent as `projectId` with leads. Absent in temporary content. */
  id?: string;
  cityLabel: string;
  district: string;
  /** `summaryAr/En`. */
  summary: string;
  /** `descriptionAr/En`, split into paragraphs on blank lines. */
  description: string[];
  /** `unitsCount`. */
  units: number;
  /** `sizeRange` { min, max } — m². */
  area: [number, number];
  /** `completionYear` — handover year. */
  completion: number;
  completionLabel: string;
  stats: ProjectStat[];
  /** `features` JSON, followed by the company-wide features. */
  features: ProjectFeature[];
  /** `GALLERY` images. */
  gallery: ProjectGalleryItem[];
  /** `FLOOR_PLAN` images — carried for a future plans section, not rendered yet. */
  floorPlans?: ProjectGalleryItem[];
  /** `latitude` / `longitude` — `null` renders the map placeholder without a directions link. */
  coordinates: GeoPoint | null;
};

export type ProjectDetailLabels = {
  enquire: string;
  sqm: string;
  overview: { label: string; title: string[]; facts: string };
  factKeys: { city: string; district: string; type: string; developer: string };
  typeValue: string;
  developerValue: string;
  statsLabel: string;
  gallery: {
    label: string;
    title: string[];
    open: string;
    close: string;
    prev: string;
    next: string;
    thumbs: string;
  };
  info: {
    label: string;
    title: string[];
    location: string;
    units: string;
    status: string;
    completion: string;
    area: string;
    features: string;
  };
  location: {
    label: string;
    title: string[];
    pending: string;
    coords: string;
    directions: string;
    city: string;
  };
  cta: {
    label: string;
    title: string[];
    body: string;
    primary: string;
    call: string;
    whatsapp: string;
  };
  more: { label: string; title: string[]; all: string };
};
