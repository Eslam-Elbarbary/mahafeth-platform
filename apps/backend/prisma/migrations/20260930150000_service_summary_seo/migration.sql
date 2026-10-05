-- AlterTable
ALTER TABLE `services` ADD COLUMN `summaryAr` VARCHAR(500) NULL,
    ADD COLUMN `summaryEn` VARCHAR(500) NULL,
    ADD COLUMN `metaTitleAr` VARCHAR(255) NULL,
    ADD COLUMN `metaTitleEn` VARCHAR(255) NULL,
    ADD COLUMN `metaDescriptionAr` VARCHAR(500) NULL,
    ADD COLUMN `metaDescriptionEn` VARCHAR(500) NULL;
