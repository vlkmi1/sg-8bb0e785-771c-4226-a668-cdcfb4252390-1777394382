-- Get all tables with foreign key columns to create proper indexes
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  'CREATE INDEX IF NOT EXISTS idx_' || tc.table_name || '_' || kcu.column_name || 
  ' ON ' || tc.table_name || '(' || kcu.column_name || ');' as create_index_sql
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;