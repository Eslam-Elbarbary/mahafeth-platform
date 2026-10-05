-- Widen the status enum so legacy values can be remapped before narrowing.
ALTER TABLE `leads` MODIFY `status` ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'SPAM', 'CONVERTED', 'LOST') NOT NULL DEFAULT 'NEW';

UPDATE `leads` SET `status` = 'CONVERTED' WHERE `status` = 'CLOSED';
UPDATE `leads` SET `status` = 'LOST' WHERE `status` = 'SPAM';

-- Free-text source becomes an enum.
UPDATE `leads` SET `source` = CASE
    WHEN UPPER(`source`) IN ('CONTACT_FORM', 'CONTACT') THEN 'CONTACT_FORM'
    WHEN UPPER(`source`) IN ('PROJECT_PAGE', 'PROJECT') THEN 'PROJECT_PAGE'
    ELSE 'WEBSITE'
END;

-- AlterTable
ALTER TABLE `leads` RENAME COLUMN `interest` TO `interestType`,
    MODIFY `status` ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST') NOT NULL DEFAULT 'NEW',
    MODIFY `source` ENUM('WEBSITE', 'CONTACT_FORM', 'PROJECT_PAGE') NOT NULL DEFAULT 'WEBSITE',
    ADD COLUMN `assignedToId` CHAR(36) NULL;

-- CreateIndex
CREATE INDEX `leads_assignedToId_idx` ON `leads`(`assignedToId`);

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
