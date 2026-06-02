-- Lệnh tạo User và Database cho dự án
-- (Chạy bằng pgAdmin hoặc psql với quyền superuser như 'postgres')

-- 1. Tạo user nếu chưa có
CREATE USER prisma_user WITH ENCRYPTED PASSWORD 'StrongPassword123!';

-- 2. Tạo database
CREATE DATABASE tbu_schedule_db;

-- 3. Cấp quyền cho user trên database vừa tạo
GRANT ALL PRIVILEGES ON DATABASE tbu_schedule_db TO prisma_user;
