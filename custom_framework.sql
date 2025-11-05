-- This table holds ACCOUNT data (the real person)
CREATE TABLE IF NOT EXISTS `accounts` (
                                          `id` INT(11) NOT NULL AUTO_INCREMENT,
                                          `license` VARCHAR(50) NULL DEFAULT NULL UNIQUE,
                                          `discord` VARCHAR(50) NULL DEFAULT NULL,
                                          PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- This table holds CHARACTER data (the in-game persona)
CREATE TABLE IF NOT EXISTS `characters` (
                                            `id` INT(11) NOT NULL AUTO_INCREMENT,
                                            `account_id` INT(11) NOT NULL, -- This links to accounts.id
                                            `citizenid` VARCHAR(50) NOT NULL UNIQUE, -- Defined as UNIQUE here
                                            `license` VARCHAR(50) NULL DEFAULT NULL, -- Added the license column
                                            `name` VARCHAR(50) NULL DEFAULT NULL,
                                            `money` TEXT NULL DEFAULT NULL,
                                            `job` TEXT NULL DEFAULT NULL,
                                            `inventory` TEXT DEFAULT NULL,
                                            PRIMARY KEY (`id`),
                                            KEY `account_id` (`account_id`),
                                            CONSTRAINT `FK_characters_accounts` FOREIGN KEY (`account_id`)
                                                REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- This table holds INVENTORY data
CREATE TABLE IF NOT EXISTS `inventories` (
                                             `id` INT NOT NULL AUTO_INCREMENT,
                                             `invId` VARCHAR(100) NOT NULL, -- e.g., "trunk-GF1234", "stash-police", "drop-123"
                                             `label` VARCHAR(100) DEFAULT NULL,
                                             `slots` INT(11) NOT NULL,
                                             `maxWeight` INT(11) NOT NULL,
                                             `items` TEXT DEFAULT NULL, -- Store items as JSON
                                             PRIMARY KEY (`id`),
                                             UNIQUE KEY `invId` (`invId`)
) ENGINE=InnoDB AUTO_INCREMENT=1;
