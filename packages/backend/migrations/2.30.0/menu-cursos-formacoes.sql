-- Item de menu 32 ("Fique por dentro" > "Cursos e formações") passa a apontar para a página /cursos-e-formacoes.
-- Idempotente.

UPDATE public.menu_portal
SET "type" = 'link', link = '/cursos-e-formacoes', blank = false, content_id = NULL, "updatedAt" = now()
WHERE id = 32;
