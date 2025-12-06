-- Runs automatically on first container startup.
-- Creates one database per service for local/dev.

CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE interview_db;
CREATE DATABASE notification;
CREATE USER notify WITH PASSWORD 'notify_pass';
GRANT ALL PRIVILEGES ON DATABASE notification TO notify;

-- Template Service DB
CREATE DATABASE template;
CREATE USER template_user WITH PASSWORD 'template_pass';
GRANT ALL PRIVILEGES ON DATABASE template TO template_user;
