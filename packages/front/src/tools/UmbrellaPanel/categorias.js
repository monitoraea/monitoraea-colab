/* Categorias de iniciativas do painel: chave (igual à do backend), rótulo, cor e rota da página da comunidade. */
export const CATEGORIAS = [
  { key: 'politicas', label: 'Políticas públicas de EA', color: '#b0182c', route: 'politica' },
  { key: 'colegiados', label: 'Colegiados de PPEA', color: '#1f3a8a', route: 'comissao' },
  { key: 'cecsas', label: 'CECSAs', color: '#1f8a5b', route: 'cne' },
  { key: 'projetos', label: 'Projetos de EA', color: '#2f7fd1', route: 'iniciativa' },
];

export const CATEGORIA_BY_KEY = Object.fromEntries(CATEGORIAS.map(c => [c.key, c]));
