-- 心理学聚合平台 · Hostinger MySQL/MariaDB 生产建表脚本
-- 前置：请先在 Hostinger hPanel「数据库」中创建数据库（共享主机不允许用 SQL 建库）。
-- 在 phpMyAdmin 选中该库后，直接执行本脚本即可（表名无需改动）。
-- 兼容 MariaDB 10.6+，字符集 utf8mb4。也可用命令：prisma db push --schema prisma/schema.mysql.prisma

-- CreateTable
CREATE TABLE `Resource` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `language` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `trafficLevel` VARCHAR(191) NULL,
    `suitableFor` TEXT NULL,
    `tags` TEXT NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Resource_type_idx`(`type`),
    INDEX `Resource_country_idx`(`country`),
    INDEX `Resource_featured_idx`(`featured`),
    UNIQUE INDEX `Resource_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Helpline` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `url` TEXT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Helpline_country_idx`(`country`),
    INDEX `Helpline_language_idx`(`language`),
    UNIQUE INDEX `Helpline_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assessment` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(191) NULL,
    `questions` TEXT NOT NULL,
    `interpretation` TEXT NULL,
    `source` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Assessment_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Article` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` TEXT NOT NULL,
    `category` VARCHAR(191) NULL,
    `tags` TEXT NOT NULL,
    `sourceName` TEXT NULL,
    `sourceUrl` TEXT NULL,
    `author` TEXT NULL,
    `coverImage` TEXT NULL,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Article_slug_key`(`slug`),
    INDEX `Article_category_idx`(`category`),
    INDEX `Article_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Counselor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `specialties` TEXT NOT NULL,
    `approach` TEXT NOT NULL,
    `region` VARCHAR(191) NULL,
    `remote` BOOLEAN NOT NULL DEFAULT false,
    `languages` TEXT NOT NULL,
    `pricePerSession` INTEGER NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CNY',
    `org` TEXT NULL,
    `bio` TEXT NULL,
    `avatar` TEXT NULL,
    `bookingUrl` TEXT NULL,
    `rating` DOUBLE NULL,
    `yearsExperience` INTEGER NULL,
    `tags` TEXT NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Counselor_region_idx`(`region`),
    INDEX `Counselor_featured_idx`(`featured`),
    UNIQUE INDEX `Counselor_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `counselorId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Review_counselorId_idx`(`counselorId`),
    INDEX `Review_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `membershipTier` VARCHAR(191) NOT NULL DEFAULT 'free',
    `membershipExpiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_counselorId_fkey` FOREIGN KEY (`counselorId`) REFERENCES `Counselor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

