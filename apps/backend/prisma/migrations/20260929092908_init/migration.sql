-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR') NOT NULL DEFAULT 'EDITOR',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` CHAR(36) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `altAr` VARCHAR(255) NULL,
    `altEn` VARCHAR(255) NULL,
    `uploadedById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `media_filename_key`(`filename`),
    INDEX `media_mimeType_idx`(`mimeType`),
    INDEX `media_createdAt_idx`(`createdAt`),
    INDEX `media_deletedAt_idx`(`deletedAt`),
    INDEX `media_uploadedById_idx`(`uploadedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(120) NOT NULL,
    `group` VARCHAR(60) NOT NULL DEFAULT 'general',
    `value` JSON NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    INDEX `settings_group_idx`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pages` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `titleAr` VARCHAR(255) NOT NULL,
    `titleEn` VARCHAR(255) NOT NULL,
    `metaDescriptionAr` VARCHAR(320) NULL,
    `metaDescriptionEn` VARCHAR(320) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `pages_slug_key`(`slug`),
    INDEX `pages_status_idx`(`status`),
    INDEX `pages_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` CHAR(36) NOT NULL,
    `pageId` CHAR(36) NOT NULL,
    `type` ENUM('HERO', 'ABOUT', 'STATS', 'PROJECTS_SHOWCASE', 'SERVICES', 'LEADERSHIP', 'CONTACT', 'INTEREST_FORM', 'PARTNERS', 'CTA', 'RICH_TEXT') NOT NULL,
    `titleAr` VARCHAR(255) NULL,
    `titleEn` VARCHAR(255) NULL,
    `contentAr` JSON NULL,
    `contentEn` JSON NULL,
    `imageId` CHAR(36) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sections_pageId_order_idx`(`pageId`, `order`),
    INDEX `sections_type_idx`(`type`),
    INDEX `sections_imageId_idx`(`imageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `titleAr` VARCHAR(255) NOT NULL,
    `titleEn` VARCHAR(255) NOT NULL,
    `summaryAr` VARCHAR(500) NULL,
    `summaryEn` VARCHAR(500) NULL,
    `descriptionAr` TEXT NULL,
    `descriptionEn` TEXT NULL,
    `city` VARCHAR(60) NOT NULL,
    `locationAr` VARCHAR(255) NULL,
    `locationEn` VARCHAR(255) NULL,
    `status` ENUM('AVAILABLE', 'UNDER_CONSTRUCTION', 'COMING_SOON', 'SOLD_OUT') NOT NULL DEFAULT 'COMING_SOON',
    `publishStatus` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `coverImageId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `projects_slug_key`(`slug`),
    INDEX `projects_publishStatus_status_idx`(`publishStatus`, `status`),
    INDEX `projects_city_idx`(`city`),
    INDEX `projects_featured_order_idx`(`featured`, `order`),
    INDEX `projects_deletedAt_idx`(`deletedAt`),
    INDEX `projects_coverImageId_idx`(`coverImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_images` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `mediaId` CHAR(36) NOT NULL,
    `captionAr` VARCHAR(255) NULL,
    `captionEn` VARCHAR(255) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `project_images_projectId_order_idx`(`projectId`, `order`),
    INDEX `project_images_mediaId_idx`(`mediaId`),
    UNIQUE INDEX `project_images_projectId_mediaId_key`(`projectId`, `mediaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `titleAr` VARCHAR(255) NOT NULL,
    `titleEn` VARCHAR(255) NOT NULL,
    `descriptionAr` TEXT NULL,
    `descriptionEn` TEXT NULL,
    `icon` VARCHAR(80) NULL,
    `imageId` CHAR(36) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `services_slug_key`(`slug`),
    INDEX `services_status_order_idx`(`status`, `order`),
    INDEX `services_deletedAt_idx`(`deletedAt`),
    INDEX `services_imageId_idx`(`imageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `team_members` (
    `id` CHAR(36) NOT NULL,
    `nameAr` VARCHAR(160) NOT NULL,
    `nameEn` VARCHAR(160) NOT NULL,
    `positionAr` VARCHAR(160) NOT NULL,
    `positionEn` VARCHAR(160) NOT NULL,
    `bioAr` TEXT NULL,
    `bioEn` TEXT NULL,
    `photoId` CHAR(36) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `team_members_visible_order_idx`(`visible`, `order`),
    INDEX `team_members_deletedAt_idx`(`deletedAt`),
    INDEX `team_members_photoId_idx`(`photoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partners` (
    `id` CHAR(36) NOT NULL,
    `nameAr` VARCHAR(160) NOT NULL,
    `nameEn` VARCHAR(160) NOT NULL,
    `websiteUrl` VARCHAR(500) NULL,
    `logoId` CHAR(36) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `partners_visible_order_idx`(`visible`, `order`),
    INDEX `partners_deletedAt_idx`(`deletedAt`),
    INDEX `partners_logoId_idx`(`logoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `email` VARCHAR(191) NULL,
    `city` VARCHAR(60) NULL,
    `interest` ENUM('OWN', 'INVEST', 'OWNER_SERVICES', 'PARTNERSHIP', 'JOB') NULL,
    `message` TEXT NULL,
    `projectId` CHAR(36) NULL,
    `locale` ENUM('ar', 'en') NOT NULL DEFAULT 'ar',
    `source` VARCHAR(60) NOT NULL DEFAULT 'website',
    `status` ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'SPAM') NOT NULL DEFAULT 'NEW',
    `notes` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `leads_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `leads_projectId_idx`(`projectId`),
    INDEX `leads_phone_idx`(`phone`),
    INDEX `leads_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_coverImageId_fkey` FOREIGN KEY (`coverImageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_images` ADD CONSTRAINT `project_images_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_images` ADD CONSTRAINT `project_images_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `media`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partners` ADD CONSTRAINT `partners_logoId_fkey` FOREIGN KEY (`logoId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
