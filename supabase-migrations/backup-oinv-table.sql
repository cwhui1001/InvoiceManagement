-- Backup script - Run this FIRST!
-- This creates a backup of your OINV table

CREATE TABLE OINV_backup AS SELECT * FROM OINV;

-- Verify backup
SELECT COUNT(*) as original_count FROM OINV;
SELECT COUNT(*) as backup_count FROM OINV_backup;

-- Check a few sample records
SELECT DocNum, DocDate, DueDate FROM OINV_backup LIMIT 5;
