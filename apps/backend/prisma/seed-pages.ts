import { type Prisma, PublishStatus, type SectionType } from '../src/generated/prisma/client.js';
import { prisma } from '../src/lib/prisma.js';
import {
  type CatalogPageSlug,
  type PageDefinition,
  pageCatalog,
} from '../src/modules/pages/pages.catalog.js';
import { sectionContentSchemas } from '../src/modules/sections/sections.schema.js';

/*
 * Page and section content as the website shows it today (`apps/web/src/content/fallback/pages.ts`).
 * Multi-line headings use "\n" between lines. Images are paths under `apps/web/public/images/`,
 * imported into the media library on first use.
 */

/** Resolves a bundled image path to its media id (`null` when the website no longer ships it). */
type ImageResolver = (path: string) => string | null;

type SectionSeed = {
  titleAr?: string;
  titleEn?: string;
  image?: string;
  /** Images referenced inside `content`, imported before `content` is built. */
  images?: string[];
  content?: (image: ImageResolver) => Record<string, unknown>;
};

type PageSeed = {
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescriptionAr?: string;
  metaDescriptionEn?: string;
  sections: Partial<Record<SectionType, SectionSeed>>;
};

const register = { labelAr: 'سجّل اهتمامك', labelEn: 'Register your interest' };

const ctaSeed: SectionSeed = {
  titleAr: 'لنبنِ معًا\nما يدوم',
  titleEn: 'Let’s build\nwhat lasts',
  image: 'media/poster-figures.jpg',
  content: () => ({
    labelAr: 'تواصل مع محافظ',
    labelEn: 'Connect with Mahafeth',
    descriptionAr:
      'فريقنا جاهز للإجابة عن استفساراتك حول التملّك والاستثمار وإدارة الأملاك.',
    descriptionEn:
      'Our team is ready to answer your questions on home ownership, investment and property management.',
    button: { ...register, href: '/contact#interest' },
    callLabelAr: 'اتصل بنا',
    callLabelEn: 'Call us',
    whatsappLabelAr: 'واتساب',
    whatsappLabelEn: 'WhatsApp',
  }),
};

const storySeed: SectionSeed = {
  titleAr: 'نطوّر ونسوّق مشاريع\nترتقي بجودة الحياة',
  titleEn: 'We develop and market projects\nThat elevate quality of life',
  images: ['projects/platinum.png', 'about/headquarters.png'],
  content: (image) => ({
    labelAr: 'عن محافظ',
    labelEn: 'About Mahafeth',
    descriptionAr:
      'شركة محافظ للاستثمار العقاري المحدودة شركة سعودية مقرها جدة، تعمل في التطوير والتسويق العقاري في جدة والرياض وأبها. تغطي محافظ دورة العقار كاملة: من دراسة الفكرة، إلى التصميم والتنفيذ، إلى تسليم المفتاح وخدمة ما بعد البيع، بفريق هندسي ومعماري متخصص وفرق مبيعات تعمل في مواقع المشاريع.',
    descriptionEn:
      'Mahafeth Real Estate Investment Co. Ltd. is a Saudi company headquartered in Jeddah, developing and marketing real estate in Jeddah, Riyadh and Abha. Mahafeth covers the full real estate lifecycle, from concept studies, design and construction to key handover and after-sales care, supported by specialist engineering and architectural teams and on-site sales teams.',
    buttonTextAr: 'المزيد',
    buttonTextEn: 'Learn more',
    buttonCloseTextAr: 'أقل',
    buttonCloseTextEn: 'Show less',
    imageIds: [image('projects/platinum.png'), image('about/headquarters.png')].filter(Boolean),
  }),
};

const timelineSeed: SectionSeed = {
  content: () => ({
    labelAr: 'مسيرتنا',
    labelEn: 'Our journey',
    items: [
      {
        year: '2006',
        titleAr: 'بداية المسيرة العقارية',
        titleEn: 'Beginning of the real estate journey',
        descriptionAr:
          'تأسيس محافظ ودخول قطاع الاستثمار العقاري بالتسويق والتطوير، وبناء شبكة علاقات محلية قوية.',
        descriptionEn:
          'Mahafeth is established, entering real estate investment through marketing and development while building a strong local network.',
      },
      {
        year: '2023',
        titleAr: 'قسم السكني وخدمات الأفراد',
        titleEn: 'Residential sales and services',
        descriptionAr: 'تدشين قسم مبيعات السكني للعمل مباشرة مع العميل من أول استفسار حتى التسليم.',
        descriptionEn:
          'Launching a residential sales division to work directly with customers from the first enquiry to handover.',
      },
      {
        year: '2030',
        current: true,
        titleAr: 'المستهدف',
        titleEn: 'Our goal',
        descriptionAr: 'المساهمة في رفع نسبة تملّك المواطنين للمساكن ضمن مستهدفات رؤية المملكة.',
        descriptionEn:
          'Helping increase home ownership among Saudi citizens in line with the Kingdom’s Vision targets.',
      },
    ],
  }),
};

const figuresSeed: SectionSeed = {
  content: () => ({
    items: [
      { value: '1450', labelAr: 'وحدة سكنية حصرية', labelEn: 'Exclusive residential units' },
      { value: '1015', labelAr: 'وحدة سكنية مباعة', labelEn: 'Residential units sold' },
      { value: '48', labelAr: 'مشروعًا تحت الإنشاء', labelEn: 'Projects under construction' },
      { value: '2500+', labelAr: 'عميل', labelEn: 'Customers' },
      { value: '325', labelAr: 'مليون ريال قيمة سوقية', labelEn: 'Million SAR in market value' },
    ],
  }),
};

const reachSeed: SectionSeed = {
  titleAr: 'حدّد اهتمامك',
  titleEn: 'Tell us your interests',
  content: () => ({
    labelAr: 'تواصل مع محافظ',
    labelEn: 'Connect with Mahafeth',
    items: [
      {
        key: 'own',
        titleAr: 'تملّك الوحدات السكنية',
        titleEn: 'Home ownership',
        descriptionAr:
          'شقق وفلل في جدة والرياض وأبها، بتمويل عقاري مدعوم ومتابعة كاملة من اختيار الوحدة حتى الإفراغ واستلام المفتاح.',
        descriptionEn:
          'Apartments and villas in Jeddah, Riyadh and Abha, with supported home financing and guidance from choosing a home to title transfer and key handover.',
        buttonAr: 'سجّل اهتمامك',
        buttonEn: 'Register your interest',
      },
      {
        key: 'invest',
        titleAr: 'الاستثمار العقاري',
        titleEn: 'Real estate investment',
        descriptionAr:
          'مساهمات وصناديق عقارية في أصول مدروسة، بحصص موثّقة وعقود واضحة وتقارير دورية للمستثمرين.',
        descriptionEn:
          'Real estate participation and funds in carefully assessed assets, with documented shares, clear contracts and regular investor reports.',
        buttonAr: 'سجّل اهتمامك',
        buttonEn: 'Register your interest',
      },
      {
        key: 'owner',
        titleAr: 'ملاك الأراضي والعقارات',
        titleEn: 'Land and property owners',
        descriptionAr:
          'تسويق وإدارة أملاك وتقييم سعري مبني على بيانات السوق، لأصحاب الأراضي والعقارات الراغبين في البيع أو التأجير أو التطوير.',
        descriptionEn:
          'Marketing, property management and market-based valuations for land and property owners looking to sell, lease or develop.',
        buttonAr: 'سجّل اهتمامك',
        buttonEn: 'Register your interest',
      },
      {
        key: 'partner',
        titleAr: 'شركاء النجاح',
        titleEn: 'Our partners',
        descriptionAr:
          'بنوك وجهات تمويل ومقاولون وموردون يشاركوننا تمويل الوحدات وتنفيذ المشاريع وتشغيلها بمعايير واضحة.',
        descriptionEn:
          'Banks, finance providers, contractors and suppliers working with us to finance homes, deliver projects and manage operations to clear standards.',
        buttonAr: 'كن شريكنا',
        buttonEn: 'Become a partner',
      },
      {
        key: 'job',
        titleAr: 'فرص العمل',
        titleEn: 'Career opportunities',
        descriptionAr:
          'انضم إلى فريق محافظ في جدة أو الرياض أو أبها، في المبيعات والتسويق والهندسة وإدارة المشاريع.',
        descriptionEn:
          'Join Mahafeth in Jeddah, Riyadh or Abha, in sales, marketing, engineering and project management.',
        buttonAr: 'قدّم طلبك',
        buttonEn: 'Apply now',
      },
    ],
  }),
};

const interestSeed: SectionSeed = {
  titleAr: 'اترك بياناتك\nونتواصل معك',
  titleEn: 'Leave your details\nWe’ll be in touch',
  content: () => ({
    labelAr: 'سجّل اهتمامك',
    labelEn: 'Register your interest',
    descriptionAr:
      'مستشار مبيعات مختص بمدينتك يتواصل معك خلال يوم عمل واحد، ويجيب على كل ما يخص الوحدات والأسعار وخيارات التمويل.',
    descriptionEn:
      'A sales consultant for your city will contact you within one business day to answer your questions about homes, prices and financing options.',
    points: [
      {
        textAr: 'عرض للوحدات المتاحة في المشروع الأقرب لاحتياجك وميزانيتك.',
        textEn: 'Explore available homes that best match your needs and budget.',
      },
      {
        textAr: 'مساعدة في إجراءات التمويل العقاري المدعوم حتى الإفراغ.',
        textEn: 'Support with home financing procedures through to title transfer.',
      },
      {
        textAr: 'متابعة كاملة بعد البيع مع فريق خدمة العملاء.',
        textEn: 'Ongoing after-sales support from our customer care team.',
      },
    ],
    cardTitleAr: 'بيانات التواصل',
    cardTitleEn: 'Contact details',
    cardBodyAr: 'اترك بياناتك ويتواصل معك مستشار مبيعات مختص بمدينتك.',
    cardBodyEn: 'Leave your details and a sales consultant for your city will contact you.',
    submitAr: 'أرسل الطلب',
    submitEn: 'Submit enquiry',
    noteAr: 'بإرسال الطلب توافق على أن يتواصل معك فريق محافظ عبر الجوال.',
    noteEn: 'By submitting, you agree to be contacted by the Mahafeth team by phone.',
    successTitleAr: 'وصلنا طلبك',
    successTitleEn: 'Enquiry received',
    successBodyAr: 'سيتواصل معك فريق المبيعات خلال يوم عمل على الرقم الذي أدخلته.',
    successBodyEn:
      'Our sales team will contact you within one business day at the number you provided.',
  }),
};

const leadershipQuotesSeed: SectionSeed = {
  titleAr: 'كلمة الإدارة',
  titleEn: 'Leadership',
  content: () => ({
    labelAr: 'فريق القيادة',
    labelEn: 'Our leadership team',
    swipeHintAr: 'اسحب للتنقّل',
    swipeHintEn: 'Swipe to explore',
  }),
};

const pageSeeds: Record<CatalogPageSlug, PageSeed> = {
  home: {
    sections: {
      HERO: {
        titleAr: 'جودة حياة\nتُبنى بثقة',
        titleEn: 'Quality of life\nBuilt on trust',
        image: 'media/poster-projects.jpg',
        content: () => ({
          eyebrowAr: 'محافظ للاستثمار العقاري',
          eyebrowEn: 'Mahafeth Real Estate',
          subtitleAr:
            'نطوّر ونسوّق مشاريع سكنية متكاملة في جدة والرياض وأبها، تجمع بين التصميم الرصين وجودة التنفيذ وخدمة ما بعد البيع.',
          subtitleEn:
            'We develop and market residential projects in Jeddah, Riyadh and Abha, combining thoughtful design, quality construction and after-sales care.',
          primaryButton: {
            labelAr: 'استكشف مشاريعنا',
            labelEn: 'Explore our projects',
            href: '#projects',
          },
          secondaryButton: { labelAr: 'شاهد فيلم محافظ', labelEn: 'Watch our film' },
          hintAr: 'انزل لاستكشاف المزيد',
          hintEn: 'Scroll to explore',
        }),
      },
      ABOUT: storySeed,
      TIMELINE: timelineSeed,
      STATS: figuresSeed,
      PROJECTS_SHOWCASE: {
        titleAr: 'أبرز مشاريعنا',
        titleEn: 'Featured projects',
        content: () => ({
          labelAr: 'مشاريعنا',
          labelEn: 'Our projects',
          button: {
            labelAr: 'سجلّ المشاريع كاملًا',
            labelEn: 'Explore all projects',
            href: '/projects',
          },
          exploreLabelAr: 'استكشف المشروع',
          exploreLabelEn: 'Explore project',
        }),
      },
      SERVICES: {
        titleAr: '6 ست خدمات تغطي\nدورة العقار كاملة',
        titleEn: '6 services covering\nThe full real estate lifecycle',
        content: () => ({
          labelAr: 'خدماتنا',
          labelEn: 'Our services',
          linkLabelAr: 'تفاصيل الخدمة',
          linkLabelEn: 'Service details',
        }),
      },
      LEADERSHIP: leadershipQuotesSeed,
      CONTACT: reachSeed,
      CTA: ctaSeed,
      INTEREST_FORM: interestSeed,
      PARTNERS: {
        content: () => ({
          labelAr: 'شركاء النجاح',
          labelEn: 'Our partners',
          descriptionAr:
            'بنوك وجهات تمويل وعلامات نعمل معها في تمويل الوحدات وتنفيذ المشاريع وتشغيلها.',
          descriptionEn:
            'Banks, finance providers and brands working with us to finance homes, deliver projects and manage operations.',
        }),
      },
    },
  },
  about: {
    metaTitleAr: 'عن محافظ',
    metaTitleEn: 'About Mahafeth',
    metaDescriptionAr: 'شركة محافظ للاستثمار العقاري: مسيرتنا وأرقامنا ورؤيتنا.',
    metaDescriptionEn: 'Mahafeth Real Estate Investment: our journey, figures and vision.',
    sections: {
      HERO: {
        titleAr: 'خبرة متخصصة\nفي التطوير العقاري',
        titleEn: 'Specialized real estate\nexpertise',
        image: 'about/headquarters.png',
        content: () => ({
          eyebrowAr: 'محافظ للاستثمار العقاري',
          eyebrowEn: 'Mahafeth Real Estate',
          subtitleAr:
            'من جدة والرياض وأبها، نغطي دورة العقار كاملة من دراسة الفكرة إلى تسليم المفتاح.',
          subtitleEn:
            'From Jeddah, Riyadh and Abha, covering the full real estate lifecycle from concept to key handover.',
        }),
      },
      STORY: storySeed,
      TIMELINE: timelineSeed,
      STATS: figuresSeed,
      VISION: {
        titleAr: 'نحو مستهدفات\nرؤية 2030',
        titleEn: 'Towards\nVision 2030',
        image: 'projects/project-1.jpg',
        content: () => ({
          labelAr: 'رؤيتنا',
          labelEn: 'Our vision',
          descriptionAr:
            'نعمل على المساهمة في رفع نسبة تملّك المواطنين للمساكن ضمن مستهدفات رؤية المملكة، عبر مشاريع سكنية متكاملة وخدمة تمتد من أول استفسار حتى ما بعد التسليم.',
          descriptionEn:
            'We aim to help increase home ownership among Saudi citizens in line with the Kingdom’s Vision targets, through complete residential projects and service that runs from the first enquiry to after handover.',
        }),
      },
      /* No mission copy exists on the website yet: created empty and hidden. */
      MISSION: { content: () => ({ labelAr: 'رسالتنا', labelEn: 'Our mission' }) },
      CTA: ctaSeed,
    },
  },
  contact: {
    metaTitleAr: 'تواصل معنا',
    metaTitleEn: 'Contact us',
    metaDescriptionAr: 'تواصل مع محافظ أو سجّل اهتمامك بمشاريعنا في جدة والرياض وأبها.',
    metaDescriptionEn:
      'Contact Mahafeth or register your interest in our projects in Jeddah, Riyadh and Abha.',
    sections: {
      HERO: {
        titleAr: 'لنبدأ\nالحديث',
        titleEn: 'Let’s start\nthe conversation',
        image: 'media/contact.jpg',
        content: () => ({
          eyebrowAr: 'نحن هنا لخدمتك',
          eyebrowEn: 'We are here to help',
          subtitleAr: 'اختر اهتمامك وسيتواصل معك فريقنا في أقرب وقت.',
          subtitleEn: 'Choose your interest and our team will be in touch shortly.',
        }),
      },
      CONTACT: reachSeed,
      INTEREST_FORM: interestSeed,
      CONTACT_INFO: {
        titleAr: 'قنوات\nالتواصل',
        titleEn: 'Ways to\nreach us',
        content: () => ({
          labelAr: 'بيانات التواصل',
          labelEn: 'Contact information',
          phoneLabelAr: 'الرقم الموحد',
          phoneLabelEn: 'Unified number',
          whatsappLabelAr: 'واتساب',
          whatsappLabelEn: 'WhatsApp',
          emailLabelAr: 'البريد الإلكتروني',
          emailLabelEn: 'Email',
        }),
      },
      BRANCHES: {
        titleAr: 'فروعنا',
        titleEn: 'Our branches',
        content: () => ({ labelAr: 'الفروع', labelEn: 'Branches' }),
      },
      MAP: {
        titleAr: 'موقعنا',
        titleEn: 'Find us',
        content: () => ({
          labelAr: 'الموقع',
          labelEn: 'Location',
          addressAr: 'جدة، المملكة العربية السعودية',
          addressEn: 'Jeddah, Saudi Arabia',
          directionsLabelAr: 'الاتجاهات',
          directionsLabelEn: 'Get directions',
        }),
      },
      CTA: ctaSeed,
    },
  },
  leadership: {
    metaTitleAr: 'كلمة الإدارة',
    metaTitleEn: 'Leadership',
    metaDescriptionAr: 'كلمة مجلس الإدارة والإدارة التنفيذية في شركة محافظ للاستثمار العقاري.',
    metaDescriptionEn:
      'Messages from the board and executive leadership of Mahafeth Real Estate Investment.',
    sections: {
      HERO: {
        titleAr: 'رؤية تقودها\nالخبرة',
        titleEn: 'A vision led\nby experience',
        image: 'media/poster-figures.jpg',
        content: () => ({ eyebrowAr: 'فريق القيادة', eyebrowEn: 'Leadership team' }),
      },
      INTRO: {
        titleAr: 'خبرة تقود\nرؤية واضحة',
        titleEn: 'Experience that leads\na clear vision',
        content: () => ({
          labelAr: 'فريق القيادة',
          labelEn: 'Leadership team',
          descriptionAr:
            'يقود محافظ للاستثمار العقاري فريق يجمع بين الخبرة الطويلة في السوق العقاري السعودي والتخصص في التطوير والتسويق والاستثمار العقاري.\n\nنضع جودة التنفيذ وثقة العميل في مقدمة كل قرار، ونمضي نحو مستهدفات رؤية المملكة 2030 في رفع نسبة تملّك المساكن.',
          descriptionEn:
            'Mahafeth Real Estate is led by a team that combines long experience in the Saudi real estate market with specialist expertise in real estate development, marketing and investment.\n\nWe put build quality and customer trust at the heart of every decision as we work towards the Kingdom’s Vision 2030 home ownership targets.',
          membersLabelAr: 'أعضاء الإدارة',
          membersLabelEn: 'Leadership members',
        }),
      },
      LEADERSHIP: leadershipQuotesSeed,
      CTA: ctaSeed,
    },
  },
};

type BundledMedia = (path: string) => Promise<{ id: string } | null>;

const isEmptySection = (section: {
  titleAr: string | null;
  titleEn: string | null;
  content: Prisma.JsonValue;
  imageId: string | null;
}) => !section.titleAr && !section.titleEn && section.content == null && !section.imageId;

async function sectionData(type: SectionType, seed: SectionSeed | undefined, media: BundledMedia) {
  if (!seed) return {};
  const ids = new Map<string, string | null>();
  for (const path of [seed.image, ...(seed.images ?? [])]) {
    if (path && !ids.has(path)) ids.set(path, (await media(path))?.id ?? null);
  }
  const content = seed.content?.((path) => ids.get(path) ?? null);
  return {
    titleAr: seed.titleAr ?? null,
    titleEn: seed.titleEn ?? null,
    imageId: seed.image ? (ids.get(seed.image) ?? null) : null,
    ...(content && {
      content: sectionContentSchemas[type].parse(content) as Prisma.InputJsonValue,
    }),
  };
}

/*
 * Idempotent and non-destructive:
 * - missing pages are created published, with every catalog section;
 * - on existing pages, missing sections are created and sections never edited (no title, content
 *   or image — the placeholders of the first seed) are filled. Anything the admin wrote is kept;
 * - a page whose sections were all untouched placeholders is still the first seed's draft: it gets
 *   the current titles/SEO, is published, and loses empty sections of types it no longer accepts.
 */
export async function seedPages(media: BundledMedia) {
  for (const [slug, definition] of Object.entries(pageCatalog) as Array<
    [CatalogPageSlug, PageDefinition]
  >) {
    const seed = pageSeeds[slug];
    const pageFields = {
      titleAr: definition.titleAr,
      titleEn: definition.titleEn,
      metaTitleAr: seed.metaTitleAr ?? null,
      metaTitleEn: seed.metaTitleEn ?? null,
      metaDescriptionAr: seed.metaDescriptionAr ?? null,
      metaDescriptionEn: seed.metaDescriptionEn ?? null,
    };
    const visible = (type: SectionType) => !definition.hidden?.includes(type);

    const existing = await prisma.page.findUnique({
      where: { slug },
      include: { sections: { orderBy: { order: 'asc' } } },
    });

    if (!existing || existing.deletedAt) {
      if (existing) {
        console.log(`• page "${slug}" is deleted, skipped`);
        continue;
      }
      const sections = [];
      for (const [order, type] of definition.sections.entries()) {
        sections.push({
          type,
          order,
          visible: visible(type),
          ...(await sectionData(type, seed.sections[type], media)),
        });
      }
      await prisma.page.create({
        data: {
          slug,
          ...pageFields,
          status: PublishStatus.PUBLISHED,
          publishedAt: new Date(),
          sections: { create: sections },
        },
      });
      console.log(`✔ page "${slug}" with ${sections.length} sections`);
      continue;
    }

    const placeholder = existing.sections.every(isEmptySection) && !existing.metaTitleAr;
    let created = 0;
    let filled = 0;
    let removed = 0;

    if (placeholder) {
      for (const section of existing.sections) {
        if (!definition.sections.includes(section.type)) {
          await prisma.section.delete({ where: { id: section.id } });
          removed++;
        }
      }
    }

    let nextOrder = Math.max(-1, ...existing.sections.map((s) => s.order)) + 1;
    for (const [index, type] of definition.sections.entries()) {
      const section = existing.sections.find((s) => s.type === type);
      if (!section) {
        await prisma.section.create({
          data: {
            pageId: existing.id,
            type,
            order: placeholder ? index : nextOrder++,
            visible: visible(type),
            ...(await sectionData(type, seed.sections[type], media)),
          },
        });
        created++;
      } else if (isEmptySection(section)) {
        await prisma.section.update({
          where: { id: section.id },
          data: {
            ...(await sectionData(type, seed.sections[type], media)),
            ...(placeholder && { order: index, visible: visible(type) }),
          },
        });
        filled++;
      }
    }

    if (placeholder) {
      await prisma.page.update({
        where: { id: existing.id },
        data: {
          ...pageFields,
          status: PublishStatus.PUBLISHED,
          publishedAt: existing.publishedAt ?? new Date(),
        },
      });
    }
    console.log(
      `✔ page "${slug}": ${created} sections created, ${filled} filled, ${removed} removed${placeholder ? ', published' : ''}`,
    );
  }
}
