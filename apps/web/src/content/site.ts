import type { GlobalContent, NavLink, SiteContent, SiteSettings } from './types';

/*
 * Structure of the global chrome (header, menus, footer, quick contact): links, anchors and menu
 * ids. Every label comes from the global content (`lib/cms/global-content.ts`); project and
 * service links and the global settings (brand, contact numbers, branches, social profiles, legal
 * links) come from the CMS too (`lib/cms/site.ts`).
 */

const PROJECTS_MENU_ID = 'm-projects';
const PROJECTS_COLUMN_ID = 'projects';
const SERVICES_MENU_ID = 'm-services';
const SERVICES_COLUMN_ID = 'services';

const interestHref = '/contact#interest';

/**
 * Site chrome with the CMS links placed in the mega menu and footer (projects before "Explore all
 * projects", services as the whole services list) and the global settings filled in.
 */
export function getSiteContent(
  links: { projects: NavLink[]; services: NavLink[] },
  settings: SiteSettings,
  { navigation: n, buttons, labels }: GlobalContent,
): SiteContent {
  const { contact } = settings;
  const allProjects: NavLink = { label: n.allProjects, href: '/projects' };

  return {
    brand: {
      name: settings.companyName,
      homeLabel: `${settings.companyName} — ${labels.home}`,
      logo: settings.logo,
      seal: settings.seal,
    },
    navLabel: n.navLabel,
    nav: [
      {
        label: n.about,
        href: '/about',
        section: 'about',
        menu: {
          id: 'm-about',
          title: n.about,
          body: n.aboutMenuBody,
          cta: { label: buttons.more, href: '/about' },
          links: [
            { label: n.aboutPage, href: '/about' },
            { label: n.journey, href: '/about#story' },
            { label: n.leadership, href: '/leadership' },
            { label: n.partners, href: '/partners' },
            { label: n.branches, href: '/contact#branches' },
          ],
        },
      },
      {
        label: n.projects,
        href: '/projects',
        section: 'projects',
        menu: {
          id: PROJECTS_MENU_ID,
          title: n.projects,
          body: n.projectsMenuBody,
          cta: allProjects,
          links: [...links.projects, allProjects],
        },
      },
      {
        label: n.services,
        href: '/services',
        section: 'services',
        menu: {
          id: SERVICES_MENU_ID,
          title: n.services,
          body: n.servicesMenuBody,
          cta: { label: buttons.more, href: '/services' },
          links: links.services,
        },
      },
      { label: n.leadership, href: '/leadership', section: 'leadership' },
      { label: n.contact, href: '/contact', section: 'contact' },
    ],
    mobileNav: {
      label: n.mobileMenu,
      links: [
        { label: n.about, href: '/about' },
        { label: n.projects, href: '/projects' },
        { label: n.services, href: '/services' },
        { label: n.leadership, href: '/leadership' },
        { label: n.partners, href: '/partners' },
        { label: n.contact, href: '/contact' },
      ],
      sub: allProjects,
    },
    cta: { label: buttons.register, href: interestHref },
    contact: { phone: contact.phone, whatsapp: contact.whatsapp },
    floatingContact: {
      label: labels.quickContact,
      whatsapp: { aria: labels.whatsappAria, label: buttons.whatsapp },
      call: { aria: labels.callAria, label: buttons.call },
    },
    footer: {
      heading: n.footerHeading,
      cta: { label: buttons.registerNow, href: interestHref },
      tagline: n.footerTagline,
      columns: [
        {
          id: 'company',
          title: n.footerCompany,
          links: [
            { label: n.about, href: '/about' },
            { label: n.journey, href: '/about#story' },
            { label: n.leadership, href: '/leadership' },
            { label: n.partners, href: '/partners' },
            { label: n.careers, href: interestHref, interest: 'job' },
          ],
        },
        {
          id: PROJECTS_COLUMN_ID,
          title: n.footerProjects,
          links: [...links.projects, allProjects],
        },
        { id: SERVICES_COLUMN_ID, title: n.footerServices, links: links.services },
      ],
      contact: {
        title: n.footerContact,
        phoneLabel: n.footerPhone,
        phone: contact.phone,
        whatsappLabel: n.footerWhatsapp,
        branchesLabel: n.footerBranches,
        branches: contact.branches.map(({ city, address, phone }) => ({ city, address, phone })),
        cta: { label: buttons.contactUs, href: '/contact' },
      },
      socialLabel: n.footerSocial,
      social: [
        { network: 'linkedin', label: labels.linkedin, href: settings.social.linkedin },
        { network: 'x', label: labels.x, href: settings.social.x },
        { network: 'instagram', label: labels.instagram, href: settings.social.instagram },
        { network: 'snapchat', label: labels.snapchat, href: settings.social.snapchat },
      ],
      /* Developer branding: fixed, deliberately not editable in the CMS. */
      copyright: {
        holder: 'Qeema Tech',
        href: 'https://www.qeematech.net/',
        rights: n.footerRights,
      },
      legal: settings.footer.legal,
    },
  };
}
