import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { type Prisma, ProjectStatus, PublishStatus, Role } from '../src/generated/prisma/client.js';
import { env } from '../src/config/env.js';
import {
  type CatalogKey,
  contentKeys,
  groupOf,
  isMediaRef,
  settingsCatalog,
} from '../src/modules/settings/settings.catalog.js';
import { hashPassword } from '../src/lib/password.js';
import { prisma } from '../src/lib/prisma.js';
import { publicUrlFor, uploadDir } from '../src/lib/upload.js';
import { seedPages } from './seed-pages.js';

const seedEnv = z
  .object({
    SEED_ADMIN_NAME: z.string().min(1).default('Mahafeth Admin'),
    SEED_ADMIN_EMAIL: z.email().toLowerCase(),
    SEED_ADMIN_PASSWORD: z.string().min(10, 'SEED_ADMIN_PASSWORD must be at least 10 characters'),
  })
  .superRefine((value, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (/replace-with|change-me/i.test(value.SEED_ADMIN_PASSWORD)) {
      ctx.addIssue({
        code: 'custom',
        path: ['SEED_ADMIN_PASSWORD'],
        message: 'Set a real password',
      });
    }
    if (value.SEED_ADMIN_EMAIL.endsWith('.local')) {
      ctx.addIssue({ code: 'custom', path: ['SEED_ADMIN_EMAIL'], message: 'Use a real mailbox' });
    }
  })
  .parse(process.env);

/*
 * The three launch projects, matching the website's fallback content. Images are uploaded from
 * the admin (Media library → project COVER / GALLERY / FLOOR_PLAN); coordinates stay empty until
 * the exact sites are confirmed. Paragraphs in descriptions are separated by a blank line.
 */
const projects: Prisma.ProjectCreateInput[] = [
  {
    slug: 'mahafeth-diamond',
    titleAr: 'محافظ دايموند',
    titleEn: 'Mahafeth Diamond',
    summaryAr:
      'محافظ دايموند مشروع سكني في حي الصفا بجدة، يضم 36 وحدة سكنية بمساحات تتراوح بين 160 و280 م²، ومتاح للبيع مع تسليم في 2025.',
    summaryEn:
      'Mahafeth Diamond is a residential project in Jeddah’s Al Safa district with 36 homes from 160 to 280 m², available for sale with handover in 2025.',
    descriptionAr:
      'محافظ دايموند مشروع سكني في حي الصفا بجدة، يضم 36 وحدة سكنية بمساحات تتراوح بين 160 و280 مترًا مربعًا.\n\nالمشروع متاح للبيع الآن مع تسليم في 2025، ويتولى فريق محافظ تطويره وتسويقه وخدمة ملّاكه بعد التسليم.',
    descriptionEn:
      'Mahafeth Diamond is a residential project in Jeddah’s Al Safa district, with 36 homes ranging from 160 to 280 square metres.\n\nThe project is available for sale now with handover in 2025, developed, marketed and serviced after handover by the Mahafeth team.',
    city: 'jeddah',
    locationAr: 'جدة، حي الصفا',
    locationEn: 'Jeddah, Al Safa district',
    status: ProjectStatus.AVAILABLE,
    featured: true,
    order: 0,
    unitsCount: 36,
    sizeRange: { min: 160, max: 280 },
    completionYear: 2025,
    features: [
      {
        icon: 'plan',
        titleAr: 'مساحات من 160 إلى 280 م²',
        titleEn: 'Homes from 160 to 280 m²',
        bodyAr: '36 وحدة سكنية بمساحات متنوعة تناسب احتياجات الأسرة.',
        bodyEn: '36 homes in a range of sizes to suit different households.',
      },
      {
        icon: 'pin',
        titleAr: 'في حي الصفا بجدة',
        titleEn: 'In Jeddah’s Al Safa district',
        bodyAr: 'موقع داخل حي سكني قائم في جدة.',
        bodyEn: 'Set within an established residential district of Jeddah.',
      },
    ],
  },
  {
    slug: 'mahafeth-platinum',
    titleAr: 'محافظ بلاتينيوم',
    titleEn: 'Mahafeth Platinum',
    summaryAr:
      'محافظ بلاتينيوم مشروع سكني تحت الإنشاء في حي النزهة بجدة، يضم 48 وحدة سكنية بمساحات تتراوح بين 145 و320 م²، مع تسليم متوقع في 2026.',
    summaryEn:
      'Mahafeth Platinum is a residential project under construction in Jeddah’s Al Nuzha district with 48 homes from 145 to 320 m², with handover expected in 2026.',
    descriptionAr:
      'محافظ بلاتينيوم مشروع سكني في حي النزهة بجدة، يضم 48 وحدة سكنية بمساحات تتراوح بين 145 و320 مترًا مربعًا.\n\nالمشروع تحت الإنشاء مع تسليم متوقع في 2026، ويمكنك تسجيل اهتمامك الآن ليتواصل معك فريقنا بالتفاصيل.',
    descriptionEn:
      'Mahafeth Platinum is a residential project in Jeddah’s Al Nuzha district, with 48 homes ranging from 145 to 320 square metres.\n\nThe project is under construction with handover expected in 2026 — register your interest and our team will contact you with details.',
    city: 'jeddah',
    locationAr: 'جدة، حي النزهة',
    locationEn: 'Jeddah, Al Nuzha district',
    status: ProjectStatus.UNDER_CONSTRUCTION,
    featured: true,
    order: 1,
    unitsCount: 48,
    sizeRange: { min: 145, max: 320 },
    completionYear: 2026,
    features: [
      {
        icon: 'plan',
        titleAr: 'مساحات من 145 إلى 320 م²',
        titleEn: 'Homes from 145 to 320 m²',
        bodyAr: '48 وحدة سكنية بمساحات متنوعة تناسب احتياجات الأسرة.',
        bodyEn: '48 homes in a range of sizes to suit different households.',
      },
      {
        icon: 'pin',
        titleAr: 'في حي النزهة بجدة',
        titleEn: 'In Jeddah’s Al Nuzha district',
        bodyAr: 'موقع داخل حي سكني قائم في جدة.',
        bodyEn: 'Set within an established residential district of Jeddah.',
      },
    ],
  },
  {
    slug: 'abha-view',
    titleAr: 'أبها فيو',
    titleEn: 'Abha View',
    summaryAr:
      'أبها فيو مشروع سكني تحت الإنشاء في حي الوردتين بأبها، يضم 52 وحدة سكنية بمساحات تتراوح بين 150 و310 م²، مع تسليم متوقع في 2026.',
    summaryEn:
      'Abha View is a residential project under construction in Abha’s Al Wardatain district with 52 homes from 150 to 310 m², with handover expected in 2026.',
    descriptionAr:
      'أبها فيو مشروع سكني في حي الوردتين بأبها، يضم 52 وحدة سكنية بمساحات تتراوح بين 150 و310 مترًا مربعًا.\n\nالمشروع تحت الإنشاء مع تسليم متوقع في 2026، ويمكنك تسجيل اهتمامك الآن ليتواصل معك فريقنا بالتفاصيل.',
    descriptionEn:
      'Abha View is a residential project in Abha’s Al Wardatain district, with 52 homes ranging from 150 to 310 square metres.\n\nThe project is under construction with handover expected in 2026 — register your interest and our team will contact you with details.',
    city: 'abha',
    locationAr: 'أبها، حي الوردتين',
    locationEn: 'Abha, Al Wardatain district',
    status: ProjectStatus.UNDER_CONSTRUCTION,
    featured: true,
    order: 2,
    unitsCount: 52,
    sizeRange: { min: 150, max: 310 },
    completionYear: 2026,
    features: [
      {
        icon: 'plan',
        titleAr: 'مساحات من 150 إلى 310 م²',
        titleEn: 'Homes from 150 to 310 m²',
        bodyAr: '52 وحدة سكنية بمساحات متنوعة تناسب احتياجات الأسرة.',
        bodyEn: '52 homes in a range of sizes to suit different households.',
      },
      {
        icon: 'pin',
        titleAr: 'في حي الوردتين بأبها',
        titleEn: 'In Abha’s Al Wardatain district',
        bodyAr: 'موقع داخل حي سكني في مدينة أبها.',
        bodyEn: 'Set within a residential district of Abha.',
      },
    ],
  },
];

/*
 * The six services on the current website, in display order. Images are chosen from the admin
 * (Media library → service image); until then the website keeps its bundled image per slug.
 */
const services: Prisma.ServiceCreateInput[] = [
  {
    slug: 'real-estate-marketing',
    titleAr: 'التسويق العقاري',
    titleEn: 'Real estate marketing',
    summaryAr: 'خطة تسويقية وإعلانية كاملة لكل مشروع، وفريق مبيعات في الموقع.',
    summaryEn:
      'A complete marketing and advertising plan for every project, with an on-site sales team.',
    descriptionAr:
      'حملات ممولة على كل المنصات، إدارة حسابات، تقارير أداء أسبوعية وشهرية، ومبيعات ميدانية على مدار الساعة.',
    descriptionEn:
      'Paid campaigns across platforms, account management, weekly and monthly performance reports, and round-the-clock on-site sales.',
  },
  {
    slug: 'real-estate-development',
    titleAr: 'التطوير العقاري',
    titleEn: 'Real estate development',
    summaryAr: 'من دراسة الفكرة إلى تسليم العقار، بفريق هندسي ومعماري.',
    summaryEn:
      'From concept studies to property handover, supported by engineering and architectural teams.',
    descriptionAr: 'دراسة جدوى، تصميم، إشراف تنفيذ، ضمانات بناء مفعّلة، وخدمة ما بعد البيع.',
    descriptionEn:
      'Feasibility studies, design, construction supervision, active building warranties and after-sales care.',
  },
  {
    slug: 'real-estate-participation',
    titleAr: 'المساهمات العقارية',
    titleEn: 'Real estate participation',
    summaryAr: 'فرص استثمار جماعي في أصول مدروسة بحصص واضحة.',
    summaryEn:
      'Collective investment opportunities in carefully assessed assets, with clearly defined shares.',
    descriptionAr: 'حصص موثّقة، عقود واضحة، وتقارير دورية للمساهمين.',
    descriptionEn: 'Documented shares, clear contracts and regular reports for participants.',
  },
  {
    slug: 'investment-funds',
    titleAr: 'الصناديق الاستثمارية',
    titleEn: 'Investment funds',
    summaryAr: 'أوعية استثمارية عقارية بمرونة أعلى ومخاطر موزّعة.',
    summaryEn: 'Real estate investment vehicles offering greater flexibility and diversified risk.',
    descriptionAr: 'دخول مرن إلى السوق، ومخاطر موزّعة على أكثر من أصل.',
    descriptionEn: 'Flexible market access, with risk spread across multiple assets.',
  },
  {
    slug: 'real-estate-brokerage',
    titleAr: 'الوساطة العقارية',
    titleEn: 'Real estate brokerage',
    summaryAr: 'بيع وشراء وتأجير موثّق، بتقييم مبني على بيانات السوق.',
    summaryEn: 'Documented sales, purchases and leasing, with valuations based on market data.',
    descriptionAr:
      'وساطة موثّقة في البيع والشراء والتأجير، وتقييم سعري مبني على بيانات السوق لا على التقدير.',
    descriptionEn:
      'Documented brokerage for sales, purchases and leasing, with pricing based on market data rather than guesswork.',
  },
  {
    slug: 'property-management',
    titleAr: 'إدارة الأملاك',
    titleEn: 'Property management',
    summaryAr: 'إدارة تشغيلية للأصول: عقود وتحصيل وصيانة وتقارير عائد.',
    summaryEn:
      'Operational asset management: contracts, collections, maintenance and return reports.',
    descriptionAr: 'عقود وتحصيل، صيانة دورية، وتقارير عائد واضحة لأصحاب الأملاك.',
    descriptionEn:
      'Contracts and collections, scheduled maintenance and clear return reports for property owners.',
  },
];

/*
 * Partner logos bundled with the website (`p01.png` …), imported into the media library so the
 * CMS starts with the same marquee. Their real names are not known yet: the placeholders match the
 * website's fallback and are meant to be renamed from the admin.
 */
const partnerLogosDir = fileURLToPath(
  new URL('../../web/public/images/partners/', import.meta.url),
);

/** Width/height from the PNG IHDR chunk. */
function pngSize(buffer: Buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/* Leadership members as currently shown on the website; portraits are imported into the media library. */
const peopleDir = fileURLToPath(new URL('../../web/public/images/people/', import.meta.url));

const team = [
  {
    photo: 'sultan-albassami.jpg',
    nameAr: 'سلطان البسامي',
    nameEn: 'Sultan Al Bassami',
    positionAr: 'رئيس مجلس الإدارة',
    positionEn: 'Chairman of the Board',
    bioAr:
      'تعمل القيادة الرشيدة على أن يكون الاستثمار العقاري عامل جذب للمستثمر المحلي والأجنبي، ونحن نمضي قدمًا نحو تحقيق أهداف رؤية مملكتنا بما يخدم الوطن والمواطن.',
    bioEn:
      'The Kingdom’s leadership is working to make real estate investment attractive to local and international investors. We continue towards the goals of our Kingdom’s Vision in ways that serve the nation and its citizens.',
  },
  {
    photo: 'khalid-albassami.jpg',
    nameAr: 'خالد البسامي',
    nameEn: 'Khalid Al Bassami',
    positionAr: 'الرئيس التنفيذي',
    positionEn: 'Chief Executive Officer',
    bioAr:
      'ارتفع عدد سكان المملكة من سبعة وعشرين إلى خمسة وثلاثين مليون نسمة، وزاد الطلب على المساكن. حرصنا على مواكبة التطورات التقنية لتحقيق أعلى مستويات النجاح في الاستثمار المتميز.',
    bioEn:
      'The Kingdom’s population grew from twenty-seven to thirty-five million, increasing the demand for homes. We have kept pace with technological advances to achieve the highest standards of success in distinguished investment.',
  },
  {
    photo: 'amr-khattab.jpg',
    nameAr: 'عمرو خطاب',
    nameEn: 'Amr Khattab',
    positionAr: 'المدير العام',
    positionEn: 'General Manager',
    bioAr:
      'نعمل جاهدين للمساهمة في زيادة الاستثمار العقاري بالمملكة عن طريق مشاريعنا وفريقنا المحترف، بخطط مدروسة بعناية وطرق علمية تهدف إلى تحقيق الأهداف المنشودة.',
    bioEn:
      'We work to grow real estate investment in the Kingdom through our projects and professional team, using carefully considered plans and systematic methods to achieve our goals.',
  },
];

/** Width/height from the first JPEG start-of-frame marker. */
function jpegSize(buffer: Buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    const marker = buffer.readUInt16BE(offset);
    if (marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  return {};
}

async function seedAdmin() {
  const passwordHash = await hashPassword(seedEnv.SEED_ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: seedEnv.SEED_ADMIN_EMAIL },
    create: {
      name: seedEnv.SEED_ADMIN_NAME,
      email: seedEnv.SEED_ADMIN_EMAIL,
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
    // An existing account is left exactly as the admins configured it (password, role, status).
    update: {},
  });
  console.log(`✔ admin user: ${admin.email}`);
}

/* Page images (hero backdrops, about photos…) as bundled with the website. */
const webImagesDir = fileURLToPath(new URL('../../web/public/images/', import.meta.url));

const pageMedia = (path: string) =>
  bundledMedia(join(webImagesDir, path), `page-${path.replaceAll('/', '-')}`, '', '');

/* Brand images the website ships today, imported so the logo/favicon settings start filled. */
const brandDir = fileURLToPath(new URL('../../web/public/images/brand/', import.meta.url));
const brandMedia: Partial<Record<CatalogKey, string>> = {
  'branding.logo': 'logo-seal-512.png',
  'branding.favicon': 'logo-seal-192.png',
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEmptySetting = (value: unknown) =>
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (isMediaRef(value) && !value.mediaId);

async function defaultValue(key: CatalogKey): Promise<unknown> {
  const file = brandMedia[key];
  if (!file) return settingsCatalog[key].defaultValue;
  const media = await bundledMedia(
    join(brandDir, file),
    `brand-${file}`,
    'شعار محافظ للاستثمار العقاري',
    'Mahafeth Real Estate Investment logo',
  );
  return { mediaId: media?.id ?? null };
}

/*
 * Idempotent: missing catalog settings are created and empty ones get the default. A value the
 * admin has set is never overwritten. Settings outside the catalog (older keys) are left as-is.
 */
async function seedSettings() {
  let created = 0;
  let filled = 0;
  for (const key of Object.keys(settingsCatalog) as CatalogKey[]) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    const stored = existing?.value;
    /* Copy objects: add fields missing from the stored value (new in this release) only. */
    if (contentKeys.has(key) && isPlainObject(stored)) {
      const defaults = settingsCatalog[key].defaultValue as Record<string, unknown>;
      const missing = Object.keys(defaults).filter((field) => !(field in stored));
      if (missing.length > 0) {
        const value = { ...Object.fromEntries(missing.map((f) => [f, defaults[f]])), ...stored };
        await prisma.setting.update({
          where: { key },
          data: { value: value as Prisma.InputJsonValue },
        });
        filled++;
      }
      continue;
    }
    if (existing && !isEmptySetting(existing.value)) continue;
    const value = (await defaultValue(key)) as Prisma.InputJsonValue;
    if (isEmptySetting(value) && existing) continue;
    if (existing) {
      await prisma.setting.update({ where: { key }, data: { value } });
      filled++;
    } else {
      await prisma.setting.create({
        data: {
          key,
          group: groupOf(key),
          value,
          isPublic: true,
          description: settingsCatalog[key].description,
        },
      });
      created++;
    }
  }
  const total = Object.keys(settingsCatalog).length;
  console.log(
    `✔ settings: ${created} created, ${filled} filled, ${total - created - filled} unchanged`,
  );
}

async function seedProjects() {
  for (const project of projects) {
    const existing = await prisma.project.findUnique({
      where: { slug: project.slug },
      select: { id: true },
    });
    if (existing) {
      console.log(`• project "${project.slug}" exists, skipped`);
      continue;
    }
    await prisma.project.create({ data: { ...project, publishStatus: PublishStatus.PUBLISHED } });
    console.log(`✔ project "${project.slug}"`);
  }
}

async function seedServices() {
  for (const [order, service] of services.entries()) {
    const existing = await prisma.service.findUnique({
      where: { slug: service.slug },
      select: { id: true },
    });
    if (existing) {
      console.log(`• service "${service.slug}" exists, skipped`);
      continue;
    }
    await prisma.service.create({ data: { ...service, order, status: PublishStatus.PUBLISHED } });
    console.log(`✔ service "${service.slug}"`);
  }
}

async function seedPartners() {
  if (await prisma.partner.count({ where: { deletedAt: null } })) {
    console.log('• partners exist, skipped');
    return;
  }
  if (!existsSync(partnerLogosDir)) {
    console.log(`• partner logos not found in ${partnerLogosDir}, skipped`);
    return;
  }
  const files = readdirSync(partnerLogosDir)
    .filter((name) => /^p\d+\.png$/.test(name))
    .sort();
  for (const [order, file] of files.entries()) {
    const n = String(order + 1).padStart(2, '0');
    const nameAr = `شريك ${n}`;
    const nameEn = `Partner ${n}`;
    const source = join(partnerLogosDir, file);
    const buffer = readFileSync(source);
    const filename = `${randomUUID()}.png`;
    copyFileSync(source, join(uploadDir, filename));
    const logo = await prisma.media.create({
      data: {
        filename,
        originalName: `partner-${file}`,
        url: publicUrlFor(filename),
        mimeType: 'image/png',
        size: buffer.length,
        ...pngSize(buffer),
        altAr: nameAr,
        altEn: nameEn,
      },
    });
    await prisma.partner.create({ data: { nameAr, nameEn, logoId: logo.id, order } });
  }
  console.log(`✔ ${files.length} partners with logos`);
}

/**
 * Media row for an image bundled with the website (JPEG or PNG). Reuses the row from an earlier run
 * (restoring its file if the uploads folder was cleared); `null` when the website no longer ships it.
 */
async function bundledMedia(source: string, originalName: string, altAr: string, altEn: string) {
  if (!existsSync(source)) {
    console.log(`• ${source} not found`);
    return null;
  }
  const existing = await prisma.media.findFirst({
    where: { originalName, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) {
    const target = join(uploadDir, existing.filename);
    if (!existsSync(target)) copyFileSync(source, target);
    return existing;
  }
  const buffer = readFileSync(source);
  const png = source.toLowerCase().endsWith('.png');
  const filename = `${randomUUID()}${png ? '.png' : '.jpg'}`;
  copyFileSync(source, join(uploadDir, filename));
  return prisma.media.create({
    data: {
      filename,
      originalName,
      url: publicUrlFor(filename),
      mimeType: png ? 'image/png' : 'image/jpeg',
      size: buffer.length,
      ...(png ? pngSize(buffer) : jpegSize(buffer)),
      altAr,
      altEn,
    },
  });
}

const portraitMedia = (photo: string, altAr: string, altEn: string) =>
  bundledMedia(join(peopleDir, photo), `team-${photo}`, altAr, altEn);

/*
 * Idempotent: members are matched by English name. Missing members are created visible, in the
 * website order; existing ones only get their empty fields filled, so admin edits are kept.
 */
async function seedTeam() {
  let created = 0;
  let filled = 0;
  for (const [order, { photo, ...member }] of team.entries()) {
    const existing = await prisma.teamMember.findFirst({
      where: { nameEn: member.nameEn, deletedAt: null },
      include: { photo: { select: { deletedAt: true } } },
    });

    if (!existing) {
      const media = await portraitMedia(photo, member.nameAr, member.nameEn);
      await prisma.teamMember.create({
        data: { ...member, photoId: media?.id ?? null, order, visible: true },
      });
      created++;
      continue;
    }

    const data: Prisma.TeamMemberUncheckedUpdateInput = {};
    if (!existing.nameAr.trim()) data.nameAr = member.nameAr;
    if (!existing.positionAr.trim()) data.positionAr = member.positionAr;
    if (!existing.positionEn.trim()) data.positionEn = member.positionEn;
    if (!existing.bioAr?.trim()) data.bioAr = member.bioAr;
    if (!existing.bioEn?.trim()) data.bioEn = member.bioEn;
    if (!existing.photoId || existing.photo?.deletedAt) {
      const media = await portraitMedia(photo, member.nameAr, member.nameEn);
      if (media) data.photoId = media.id;
    }
    if (Object.keys(data).length > 0) {
      await prisma.teamMember.update({ where: { id: existing.id }, data });
      filled++;
    }
  }
  console.log(
    `✔ team: ${created} created, ${filled} completed, ${team.length - created - filled} unchanged`,
  );
}

/* The seed writes to the database directly, bypassing the admin API's revalidation middleware. */
async function revalidateWebsite() {
  if (!env.WEB_REVALIDATE_URL || !env.REVALIDATE_SECRET) return;
  try {
    const res = await fetch(env.WEB_REVALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': env.REVALIDATE_SECRET },
      body: JSON.stringify({ tags: ['cms'] }),
      signal: AbortSignal.timeout(5000),
    });
    console.log(res.ok ? '✔ website cache revalidated' : `• website revalidation: ${res.status}`);
  } catch {
    console.log('• website not reachable, cache refreshes on its own schedule');
  }
}

try {
  await seedAdmin();
  await seedPages(pageMedia);
  await seedSettings();
  await seedProjects();
  await seedServices();
  await seedPartners();
  await seedTeam();
  await revalidateWebsite();
} finally {
  await prisma.$disconnect();
}
