-- Dropnout širokou SELECT policy a vytvořit restriktivnější
-- Nejdřív dropnout starou policy
DROP POLICY IF EXISTS "Anyone can view generated images" ON storage.objects;

-- Vytvořit novou policy - pouze vlastníci mohou listovat své soubory
CREATE POLICY "Users can view own generated images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-images' 
  AND auth.uid() = owner
);