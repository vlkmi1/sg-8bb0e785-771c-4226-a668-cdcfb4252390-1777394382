-- Vytvoření jediné jednoduché politiky pro credit_packages - čtení pro všechny
CREATE POLICY "allow_read_credit_packages" 
ON credit_packages FOR SELECT 
USING (true);