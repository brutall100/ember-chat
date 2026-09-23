-- Ember Chat – MySQL schema
-- The server also creates this table automatically on start.

CREATE DATABASE IF NOT EXISTS ember_chat
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ember_chat;

CREATE TABLE IF NOT EXISTS messages (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  author     VARCHAR(40)  NOT NULL,
  body       VARCHAR(500) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
