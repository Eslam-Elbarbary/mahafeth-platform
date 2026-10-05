-- DropForeignKey
ALTER TABLE `project_images` DROP FOREIGN KEY `project_images_projectId_fkey`;

-- DropIndex
DROP INDEX `project_images_projectId_order_idx` ON `project_images`;

-- DropIndex
DROP INDEX `project_images_projectId_mediaId_key` ON `project_images`;

-- AlterTable
ALTER TABLE `projects` ADD COLUMN `completionYear` SMALLINT UNSIGNED NULL,
    ADD COLUMN `features` JSON NULL,
    ADD COLUMN `latitude` DECIMAL(9, 6) NULL,
    ADD COLUMN `longitude` DECIMAL(9, 6) NULL,
    ADD COLUMN `sizeRange` JSON NULL,
    ADD COLUMN `unitsCount` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `project_images` ADD COLUMN `category` ENUM('COVER', 'GALLERY', 'FLOOR_PLAN') NOT NULL DEFAULT 'GALLERY';

-- CreateIndex
CREATE INDEX `project_images_projectId_category_order_idx` ON `project_images`(`projectId`, `category`, `order`);

-- CreateIndex
CREATE UNIQUE INDEX `project_images_projectId_mediaId_category_key` ON `project_images`(`projectId`, `mediaId`, `category`);

-- AddForeignKey
ALTER TABLE `project_images` ADD CONSTRAINT `project_images_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
