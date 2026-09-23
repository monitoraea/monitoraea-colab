-- Backfill starter activities for Plano de Ação / Plano de Monitoramento
-- for every draft CIEA (tipo_colegiado = 2).
-- Depends on the plano_acao_itens/plano_monitoramento_itens columns added
-- in ../ciea_plano_acao_monitoramento/ciea.comissoes.sql

UPDATE ciea.comissoes
SET plano_acao_itens = jsonb_build_array(
  jsonb_build_object(
    'atividade', 'Realização da avaliação da Política Estadual de Educação Ambiental a partir dos indicadores do Sistema MonitoraEA',
    'fragilidade', 'Ausência ou insuficiência de processos sistemáticos de monitoramento e avaliação da Política Estadual de Educação Ambiental no âmbito do controle social exercido pela CIEA, limitando a geração de evidências, a aprendizagem institucional e o aperfeiçoamento contínuo da política.',
    'indicador_relacionado', 'dgg_4_6',
    'resultado_esperado', 'Avaliação participativa da Política Estadual de Educação Ambiental realizada com base nos indicadores do Sistema MonitoraEA, produzindo evidências para subsidiar a tomada de decisão, o aperfeiçoamento da política e o fortalecimento da atuação da CIEA.'
  ),
  jsonb_build_object(
    'atividade', 'Proposição de estratégia de capilarização da EA nos municípios (indução do Programa MES)',
    'fragilidade', 'Baixo enraizamento territorial da Política Estadual de Educação Ambiental, caracterizado pela limitada articulação com os municípios, pela necessidade de fomentar a criação e o fortalecimento dos Sistemas Municipais de Educação Ambiental e pela insuficiência de dados e informações sistematizadas sobre sua implementação e funcionamento, comprometendo o monitoramento e a gestão da política.',
    'indicador_relacionado', 'dippe_1_7',
    'resultado_esperado', 'Estratégia estadual de capilarização da Educação Ambiental construída e pactuada pela CIEA, orientando a indução do Programa MES nos municípios e ampliando o enraizamento territorial da Política Estadual de Educação Ambiental.'
  )
)
WHERE tipo_colegiado = 2
  AND versao = 'draft'
  AND (plano_acao_itens IS NULL OR plano_acao_itens = '[]'::jsonb);

UPDATE ciea.comissoes
SET plano_monitoramento_itens = jsonb_build_array(
  jsonb_build_object(
    'atividade', 'Realização da avaliação da Política Estadual de Educação Ambiental a partir dos indicadores do Sistema MonitoraEA'
  ),
  jsonb_build_object(
    'atividade', 'Proposição de estratégia de capilarização da EA nos municípios (indução do Programa MES)'
  )
)
WHERE tipo_colegiado = 2
  AND versao = 'draft'
  AND (plano_monitoramento_itens IS NULL OR plano_monitoramento_itens = '[]'::jsonb);
