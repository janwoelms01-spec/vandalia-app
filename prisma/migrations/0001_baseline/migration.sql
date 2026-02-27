-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(25) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `role` ENUM('ADMIN', 'SCRIPTOR', 'ARCHIVAR', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `password_hash` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_users_username`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

