-- Smazat duplicitní policy kterou jsem přidal
DROP POLICY IF EXISTS "authenticated_insert_generated_images" ON public.generated_images;