-- Dados de exemplo para "Cursos e formações" (conteúdo do documento "Cursos e Formações.pdf").
-- Idempotente: só insere a formação se não houver outra com o mesmo título.
-- thumb dos cursos abertos vem do S3; image ainda é exemplo (picsum.photos); links vêm do PDF.
-- O UPDATE ao final completa os links de linhas já inseridas (só onde o link está vazio ou é um dos provisórios anteriores).
-- Rodar depois de formacoes.sql.

BEGIN;

WITH ins AS (
  INSERT INTO public.formacoes (published, titulo, intro, image, thumb, tipo, link, aberto_inscricao, "isEAD", pinned)
    SELECT true, 'Curso de Registro e Sistematização de Experiências', 'O curso aborda conceitos, abordagens e ferramentas metodológicas para registrar, refletir e sistematizar experiências em projetos, programas, organizações e iniciativas socioambientais.', 'https://picsum.photos/seed/registro/1200/500', 'https://zcm-content-images.s3.us-east-2.amazonaws.com/formacoes/curso_1.png', 'curso', 'http://even3.com.br/registro-e-sistematizacao-de-experiencias-810505', true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM public.formacoes WHERE titulo = 'Curso de Registro e Sistematização de Experiências')
    RETURNING id
)
INSERT INTO public.formacoes_detalhes (formacoes_id, tipo, texto, ordem)
SELECT formacoes_id, tipo::public.formacao_detalhe_tipo, texto, ordem FROM (VALUES
  ((SELECT id FROM ins), 'formato', 'On-line e autoinstrucional.', 1),
  ((SELECT id FROM ins), 'carga', '2 horas', 2),
  ((SELECT id FROM ins), 'plataforma', 'Even3', 3),
  ((SELECT id FROM ins), 'publico', 'Aberto ao público, especialmente gestores, técnicos e educadores ambientais', 4),
  ((SELECT id FROM ins), 'prazo', 'Inscrições abertas até 15 de novembro de 2027', 5)
) v(formacoes_id, tipo, texto, ordem)
WHERE EXISTS (SELECT 1 FROM ins);

WITH ins AS (
  INSERT INTO public.formacoes (published, titulo, intro, image, thumb, tipo, link, aberto_inscricao, "isEAD", pinned)
    SELECT true, 'Curso de Monitoramento e Avaliação de PPEA', 'O curso aborda políticas públicas de educação ambiental, metodologias de monitoramento e avaliação e dimensões e indicadores do Sistema MonitoraEA.', 'https://picsum.photos/seed/ppea/1200/500', 'https://zcm-content-images.s3.us-east-2.amazonaws.com/formacoes/curso_2.png', 'curso', 'https://www.escolavirtual.gov.br/curso/617', true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM public.formacoes WHERE titulo = 'Curso de Monitoramento e Avaliação de PPEA')
    RETURNING id
)
INSERT INTO public.formacoes_detalhes (formacoes_id, tipo, texto, ordem)
SELECT formacoes_id, tipo::public.formacao_detalhe_tipo, texto, ordem FROM (VALUES
  ((SELECT id FROM ins), 'formato', 'On-line e autoinstrucional.', 1),
  ((SELECT id FROM ins), 'carga', '20 horas', 2),
  ((SELECT id FROM ins), 'plataforma', 'Escola Virtual de Governo, uma iniciativa da Escola Nacional de Administração Pública (ENAP)', 3),
  ((SELECT id FROM ins), 'publico', 'Aberto ao público, especialmente gestores, técnicos e educadores ambientais', 4),
  ((SELECT id FROM ins), 'prazo', 'Inscrições abertas (prazo a definir)', 5)
) v(formacoes_id, tipo, texto, ordem)
WHERE EXISTS (SELECT 1 FROM ins);

INSERT INTO public.formacoes (published, titulo, intro, image, thumb, tipo, link, aberto_inscricao, "isEAD", pinned)
SELECT true, 'Oficinas de Formação, Monitoramento e Avaliação de Educação Ambiental com foco no Uso Sustentável e Conservação da Biodiversidade na Zona Costeira e Marinha em consonância com o Projeto Político Pedagógico da Zona Costeira e Marinha do Brasil - PPPZCM na APA Ponta da Baleia - Abrolhos (ou APA Plataforma Continental) - Bahia', NULL, NULL, NULL, 'oficina', 'https://www.monitoraea.org.br/novidade-single/116', false, false, false
WHERE NOT EXISTS (SELECT 1 FROM public.formacoes WHERE titulo = 'Oficinas de Formação, Monitoramento e Avaliação de Educação Ambiental com foco no Uso Sustentável e Conservação da Biodiversidade na Zona Costeira e Marinha em consonância com o Projeto Político Pedagógico da Zona Costeira e Marinha do Brasil - PPPZCM na APA Ponta da Baleia - Abrolhos (ou APA Plataforma Continental) - Bahia')
RETURNING id;

INSERT INTO public.formacoes (published, titulo, intro, image, thumb, tipo, link, aberto_inscricao, "isEAD", pinned)
SELECT true, 'Ciclo de Oficinas de Indicadores de Políticas Públicas de Educação Ambiental (PPEA)', NULL, NULL, NULL, 'oficina', 'https://www.funbea.org.br/oficinas-prepararam-educadores-e-gestores-para-usar-a-plataforma-de-avaliacao-de-politicas-de-educacao-ambiental/', false, false, false
WHERE NOT EXISTS (SELECT 1 FROM public.formacoes WHERE titulo = 'Ciclo de Oficinas de Indicadores de Políticas Públicas de Educação Ambiental (PPEA)')
RETURNING id;

INSERT INTO public.formacoes (published, titulo, intro, image, thumb, tipo, link, aberto_inscricao, "isEAD", pinned)
SELECT true, 'Curso livre de Formação de Articuladores do Sistema MonitoraEA', NULL, NULL, NULL, 'curso', 'https://www.monitoraea.org.br/novidade-single/124', false, false, false
WHERE NOT EXISTS (SELECT 1 FROM public.formacoes WHERE titulo = 'Curso livre de Formação de Articuladores do Sistema MonitoraEA')
RETURNING id;

INSERT INTO public.formacoes (published, titulo, intro, image, thumb, tipo, link, aberto_inscricao, "isEAD", pinned)
SELECT true, 'Processo formativo de estruturação e fortalecimento da rede de comunidades de aprendizagem do Projeto Político Pedagógico da Zona Costeira e Marinha (PPPZCM)', NULL, NULL, NULL, 'consultoria', 'https://www.monitoraea.org.br/novidade-single/4', false, false, false
WHERE NOT EXISTS (SELECT 1 FROM public.formacoes WHERE titulo = 'Processo formativo de estruturação e fortalecimento da rede de comunidades de aprendizagem do Projeto Político Pedagógico da Zona Costeira e Marinha (PPPZCM)')
RETURNING id;

INSERT INTO public.formacoes (published, titulo, intro, image, thumb, tipo, link, aberto_inscricao, "isEAD", pinned)
SELECT true, 'Desenvolvimento da Plataforma MonitoraEA-PPPZCM', NULL, NULL, NULL, 'consultoria', 'https://www.monitoraea.org.br/novidade-single/1', false, false, false
WHERE NOT EXISTS (SELECT 1 FROM public.formacoes WHERE titulo = 'Desenvolvimento da Plataforma MonitoraEA-PPPZCM')
RETURNING id;

INSERT INTO public.formacoes (published, titulo, intro, image, thumb, tipo, link, aberto_inscricao, "isEAD", pinned)
SELECT true, 'Revisão participativa do Projeto Político Pedagógico da Zona Costeira e Marinha', NULL, NULL, NULL, 'consultoria', 'https://www.monitoraea.org.br/novidade-single/115', false, false, false
WHERE NOT EXISTS (SELECT 1 FROM public.formacoes WHERE titulo = 'Revisão participativa do Projeto Político Pedagógico da Zona Costeira e Marinha')
RETURNING id;

-- Links de linhas já existentes
UPDATE public.formacoes SET link = 'http://even3.com.br/registro-e-sistematizacao-de-experiencias-810505', "updatedAt" = now()
WHERE titulo LIKE 'Curso de Registro e Sistematização de Experiências%' AND (link IS NULL OR link IN ('https://www.even3.com.br/', 'https://www.escolavirtual.gov.br/'));
UPDATE public.formacoes SET link = 'https://www.escolavirtual.gov.br/curso/617', "updatedAt" = now()
WHERE titulo LIKE 'Curso de Monitoramento e Avaliação de PPEA%' AND (link IS NULL OR link IN ('https://www.even3.com.br/', 'https://www.escolavirtual.gov.br/'));
UPDATE public.formacoes SET link = 'https://www.monitoraea.org.br/novidade-single/116', "updatedAt" = now()
WHERE titulo LIKE 'Oficinas de Formação, Monitoramento%' AND (link IS NULL OR link IN ('https://www.even3.com.br/', 'https://www.escolavirtual.gov.br/'));
UPDATE public.formacoes SET link = 'https://www.funbea.org.br/oficinas-prepararam-educadores-e-gestores-para-usar-a-plataforma-de-avaliacao-de-politicas-de-educacao-ambiental/', "updatedAt" = now()
WHERE titulo LIKE 'Ciclo de Oficinas de Indicadores%' AND (link IS NULL OR link IN ('https://www.even3.com.br/', 'https://www.escolavirtual.gov.br/'));
UPDATE public.formacoes SET link = 'https://www.monitoraea.org.br/novidade-single/124', "updatedAt" = now()
WHERE titulo LIKE 'Curso livre de Formação de Articuladores%' AND (link IS NULL OR link IN ('https://www.even3.com.br/', 'https://www.escolavirtual.gov.br/'));
UPDATE public.formacoes SET link = 'https://www.monitoraea.org.br/novidade-single/4', "updatedAt" = now()
WHERE titulo LIKE 'Processo formativo de estruturação%' AND (link IS NULL OR link IN ('https://www.even3.com.br/', 'https://www.escolavirtual.gov.br/'));
UPDATE public.formacoes SET link = 'https://www.monitoraea.org.br/novidade-single/1', "updatedAt" = now()
WHERE titulo LIKE 'Desenvolvimento da Plataforma%' AND (link IS NULL OR link IN ('https://www.even3.com.br/', 'https://www.escolavirtual.gov.br/'));
UPDATE public.formacoes SET link = 'https://www.monitoraea.org.br/novidade-single/115', "updatedAt" = now()
WHERE titulo LIKE 'Revisão participativa%' AND (link IS NULL OR link IN ('https://www.even3.com.br/', 'https://www.escolavirtual.gov.br/'));
-- Thumbs (S3) das linhas já existentes
UPDATE public.formacoes SET thumb = 'https://zcm-content-images.s3.us-east-2.amazonaws.com/formacoes/curso_1.png', "updatedAt" = now()
WHERE titulo = 'Curso de Registro e Sistematização de Experiências' AND (thumb IS NULL OR thumb LIKE 'https://picsum.photos/%');
UPDATE public.formacoes SET thumb = 'https://zcm-content-images.s3.us-east-2.amazonaws.com/formacoes/curso_2.png', "updatedAt" = now()
WHERE titulo = 'Curso de Monitoramento e Avaliação de PPEA' AND (thumb IS NULL OR thumb LIKE 'https://picsum.photos/%');

COMMIT;
