-- CreateIndex
CREATE INDEX `users_role_idx` ON `users`(`role`);

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `userName` VARCHAR(120) NULL,
    `userEmail` VARCHAR(191) NULL,
    `userRole` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR') NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `entity` VARCHAR(40) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `entityLabel` VARCHAR(255) NULL,
    `oldData` JSON NULL,
    `newData` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    INDEX `audit_logs_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `audit_logs_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `audit_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
