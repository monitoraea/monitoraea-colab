CREATE TYPE content_type AS ENUM ('page', 'news', 'helpbox');

CREATE TABLE public.contents (
	id serial4 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp NULL,
	"type" content_type NOT NULL,
	title varchar NOT NULL,
	"text" text NULL,
	categories _int4 NULL,
	tags _int4 NULL,
	published boolean NOT NULL DEFAULT false,
	featured_images varchar NULL,
	CONSTRAINT contents_pk PRIMARY KEY (id)
);

INSERT INTO
	public.contents (
		"createdAt",
		"updatedAt",
		"deletedAt",
		"type",
		title,
		"text",
		categories,
		tags,
		published,
		featured_images
	)
VALUES
	(
		'2023-01-27 16:28:33.336',
		'2023-04-04 08:58:37.239',
		NULL,
		'news' :: public."content_type",
		'Lançamento da Plataforma Monitora EA - PPPZCM',
		'<p>A Rede de Comunidades de Aprendizagens do PPPZCM se alinha às estruturas de redes horizontais e informais, pautada na confiança e cooperação entre seus elos, compartilhando objetivos comuns.</p>

<p>Para favorecer esse processo, em setembro de 2021 foi lançada a Plataforma Monitora EA, ferramenta digital de apoio ao processo de implementação do PPPZCM, especialmente customizada para facilitar a participação de todos os elos, a divulgação das ações da rede, seu monitoramento e avaliação. </p>

<p>E para fortalecer ainda mais essa Rede, está em curso o processo formativo de facilitadores, que contribuirão diretamente no diálogo entre todos os elos da Rede, assim como no monitoramento, avaliação e revisão do PPPZCM. O processo formativo teve início em maio/2021 e se encerrará em agosto/2022.</p>

<p>A Rede de Comunidades de Aprendizagens do PPPZCM tem sua Secretaria Executiva formada pela ANPPEA – Articulação Nacional de Políticas Públicas de Educação Ambiental, GIZ, Projetos TerraMar e GEF-Mar. Soma-se ainda o grupo de aproximadamente 40 facilitadora/es responsáveis pela governança, e os  elos, que são todas organizações que aderiram ao PPPZCM, ou seja, se dispuseram a difundi-lo e implementá-lo. </p>

<p>Na Plataforma MonitoraEA-PPPZCM cada instituição que adere ao PPPZCM pode cadastrar suas iniciativas, dando visibilidade às ações, fortalecendo articulações, além de ter acesso a um conjunto de 32 indicadores de processos e resultados para autoavaliar seus projetos. A plataforma possui uma série de ferramentas espaciais e colaborativas. É possível fazer buscas com filtros por território ou tipos de ações, ofertando dados relevantes para tomada de decisão e planejamento institucional e de políticas públicas.</p>

<p>O evento de lançamento da Plataforma MonitoraEA-PPPZCM pode ser acessado na íntegra em <a target="_blank" href="https://www.youtube.com/watch?v=l4KB0rE9mks&t=255s">https://www.youtube.com/watch?v=l4KB0rE9mks&t=255s</a> .</p>

<p><img src="https://pppzcm-news.s3.us-east-2.amazonaws.com/lancamento_plataforma_c1.png" /></p>
<p><img src="https://pppzcm-news.s3.us-east-2.amazonaws.com/lancamento_plataforma_c2.png" /></p>',
		'{3}',
		NULL,
		TRUE,
		'https://pppzcm-news.s3.us-east-2.amazonaws.com/lancamento_plataforma.png'
	);

--
INSERT INTO
	public.contents (
		"createdAt",
		"updatedAt",
		"deletedAt",
		"type",
		title,
		"text",
		categories,
		tags,
		published,
		featured_images
	)
VALUES
	(
		'2023-01-27 11:08:04.033',
		'2023-04-04 09:51:03.115',
		NULL,
		'news' :: public."content_type",
		'Mapeamento das necessidades dos usuários da Plataforma MonitoraEA-PPPZCM',
		'<head>

  <style>
  
    img {
      float: left;
      margin-right: 2rem;
    }
  
    p {
      text-align: justify;

    }
  </style>
  </head>
 <div class="square">
   <div><img src="https://pppzcm-news.s3.us-east-2.amazonaws.com/formulario.jpeg"  width="auto" height="400" /></div>
<p>A Plataforma MonitoraEA-PPPZCM &eacute; um espa&ccedil;o virtual para o monitoramento e avalia&ccedil;&atilde;o das iniciativas educativas alinhadas ao Projeto Pol&iacute;tico Pedag&oacute;gico da Zona Costeira e Marinha (PPPZCM). Por meio desta ferramenta estrat&eacute;gica j&aacute; foram cadastradas mais de 300 a&ccedil;&otilde;es educativas. 🐟</p>
<p>Com o objetivo de aprimorar as funcionalidades da plataforma, est&aacute; sendo realizado um levantamento das sugest&otilde;es de aprimoramento com foco nas necessidades cotidianas dos profissionais que atuam com educa&ccedil;&atilde;o ambiental na regi&atilde;o.</p>
<p>Quais dados/informa&ccedil;&otilde;es sobre iniciativas na zona costeira e marinha do Brasil te ajudariam a desenvolver projetos, programas e pol&iacute;ticas p&uacute;blicas de educa&ccedil;&atilde;o ambiental? Queremos saber! Contamos com sua ajuda! 💪🦞🐠🐬🐋🌴🌊</p>

<p>Nos envie suas contribui&ccedil;&otilde;es atrav&eacute;s do link: <a target="_blank" href="https://bit.ly/plataformapppzcm" rel="noopener">bit.ly/plataformapppzcm</a></p>
   
  </div>',
		'{3}',
		'{}',
		TRUE,
		'https://pppzcm-news.s3.us-east-2.amazonaws.com/formulario.jpeg'
	);

--
INSERT INTO
	public.contents (
		"createdAt",
		"updatedAt",
		"deletedAt",
		"type",
		title,
		"text",
		categories,
		tags,
		published,
		featured_images
	)
VALUES
	(
		'2023-01-27 16:28:08.380',
		'2023-04-04 09:50:56.744',
		NULL,
		'news' :: public."content_type",
		'Processo formativo marca início da formação de facilitadora/es da Rede de Comunidades de Aprendizagens do PPPZCM',
		'<p>O processo formativo de facilitadora/es da Rede de Comunidades de Aprendizagens do PPPZCM teve início no dia 17/05/2021 e contou com a participação de aproximadamente 50 lideranças da Zona Costeira e Marinha do Brasil. A missão dessa/es facilitadora/es é mobilizar e apoiar os elos da rede na implementação, monitoramento e avaliação do PPPZCM.</p>
<p>A formação, realizada pela ANPPEA e GIZ, conta com 188 horas de atividades entre maio/2021 e julho/2022 distribuídas em cinco ciclos formativos. O primeiro ciclo teve como temática central as diretrizes e princípios do PPPZCM, bem como o papel das/os facilitadora/es na rede.</p>
<p>Durante os encontros, as/os facilitadora/es definiram da seguinte forma seu trabalho: “atuamos no uso sustentável e conservação da sociobiodiversidade costeira e marinha do Brasil por meio de processos educadores e incidência em políticas públicas. Buscamos conectar saberes e fazeres, através do diálogo e da cooperação, valorizando a integração, o compromisso ético, a resistência política, a educação emancipatória e a coletividade com vistas ao desenvolvimento territorial justo, sustentável e inclusivo. A Rede de Comunidades de Aprendizagens visa implementar, monitorar e avaliar o Projeto Político Pedagógico da Zona Costeira e Marinha, fortalecendo este instrumento de gestão de políticas públicas”.</p>
<p>Ao final do ciclo a turma de facilitadora/es se dividiu em grupos para atuação direta nos territórios. Formaram-se sete grupos por regiões: 1) Amapá, Maranhão e Pará; 2) Piauí, Ceará e Rio Grande do Norte; 3) Alagoas, Pernambuco e Paraíba; 4) Bahia e Sergipe; 5) Espírito Santo, Rio de Janeiro e São Paulo; 6) Paraná, Santa Catarina e Rio Grande do Sul e 7) grupo nacional, composto por instituições que atuam transversalmente em toda a zona costeira e marinha do país.</p>
<p>Nesses grupos, as/os facilitadora/es desenvolveram um plano de ação para mobilização dos territórios. A estratégia é convocar reuniões territoriais por todo o país com vistas a convidar as instituições que atuam com educação ambiental e conservação e uso sustentável da biodiversidade a aderirem ao PPPZCM e participar da rede.
Acompanhe as próximas notícias sobre o tema em <a target="_blank" href="https://pppzcm.monitoraea.org.br/noticias">https://pppzcm.monitoraea.org.br/</a></p>',
		'{3}',
		'{}',
		TRUE,
		'https://pppzcm-news.s3.us-east-2.amazonaws.com/quinto_encontro2.png'
	);

--
INSERT INTO
	public.contents (
		"createdAt",
		"updatedAt",
		"deletedAt",
		"type",
		title,
		"text",
		categories,
		tags,
		published,
		featured_images
	)
VALUES
	(
		'2023-04-04 14:56:13.084',
		'2023-04-04 08:58:37.239',
		NULL,
		'news' :: public."content_type",
		'Lançamento do PPPZCM e da Rede de Comunidades de Aprendizagens do PPPZCM',
		'<p>Foi lançado em maio deste ano a Rede de Comunidades de Aprendizagens do Projeto Político Pedagógico da Zona Costeira e Marinha do Brasil (PPPZCM), com objetivo de desenvolver processos críticos e estruturantes de capacitação e educação ambiental que contribuam para o uso sustentável e conservação da biodiversidade da Zona Costeira e Marinha (ZCM). O evento pode ser assistido na íntegra em https://www.youtube.com/watch?v=tZ3IAbRkXA4 .</p><p>&nbsp;</p><p>A primeira fase do PPPZCM, que aconteceu entre dezembro/2019 e abril/2021, foi a construção participativa deste instrumento político-pedagógico. A iniciativa foi dos Projetos TerraMar e GEF-Mar, ancorados no Ministério do Meio Ambiente, ICMBio e GIZ, com a perspectiva de apoiar uma ação estruturante, que orientasse os processos formativos nos ambientes costeiros e marinhos, bem como tivesse um efeito multiplicador, que pudesse agregar as diversas iniciativas em movimento.</p><p>&nbsp;</p><p>A construção do PPPZCM envolveu cerca de 1200 pessoas, representantes do poder público, das comunidades e povos tradicionais, sociedade civil organizada e de instituições de ensino superior, abrangendo os 17 estados costeiros, que contribuíram na elaboração de um diagnóstico, das diretrizes, dos princípios e da proposição de ações educativas, que consolidaram a primeira versão do instrumento, para o período de 2021 a 2023.</p><p>O PPPZCM é o primeiro projeto político pedagógico para um bioma no Brasil. Enquanto um instrumento de gestão de políticas públicas, o documento tem como missão ser um instrumento político-pedagógico dinâmico, vivo, emancipatório, crítico, científico e popular - de gestão de processos educativos com foco no uso sustentável e conservação da biodiversidade da Zona Costeira e Marinha. No documento ficou registrado as utopias para o território nos próximos 10 anos: Uma sociedade consciente, crítica, bem informada, atuante e comprometida com a cidadania ambiental, que compreende a importância da Zona Costeira Marinha, dos seus serviços ambientais e ecossistêmicos e do conhecimento tradicional de seus povos e, assim, sentindo-se pertencente. O documento completo está disponível em <a href="https://pppzcm.monitoraea.org.br/arquivos/PPPZCM_Atual.pdf">https://pppzcm.monitoraea.org.br/arquivos/PPPZCM_Atual.pdf</a> .</p><p>&nbsp;</p><p>A Rede de Comunidades de Aprendizagens é composta por diferentes papéis: secretaria executiva; facilitadoras/es e elos. A secretaria executiva tem a tarefa de estruturar e fortalecer a Rede e atualmente é formada pela Articulação Nacional de Políticas Públicas de Educação Ambiental (ANPPEA), GIZ e Projetos TerraMar e GEF-Mar. O grupo de facilitadora/es é composto por aproximadamente 40 pessoas dos 17 estados costeiros do Brasil. Lideranças de diferentes segmentos (setor público, ONGs, movimentos sociais e universidades) foram convidadas para participarem do processo formativo de facilitadora/es para atuarem na governança da Rede. E os elos são todas as pessoas que aderem ao PPPZCM colocando suas diretrizes, objetivos e missão em prática por meio das instituições que atuam.</p><p>&nbsp;</p><figure class="image"><img src="https://zcm-content-images.s3.us-east-2.amazonaws.com/content/images/lancamento_zcm.png"></figure><p>&nbsp;</p><p>O evento de lançamento da Rede de Comunidades de Aprendizagens do PPPZCM, contou com a participação de Érika de Almeida (pesquisadora do ICMBio) e Rachel A. Trovarelli (pesquisadora da ANPPEA), que atuam como educadoras no processo formativo de facilitadora/es; Doerte Segebart (GIZ), diretora do projeto TerraMar/GIZ; Evandro Branco e Henriqueta Raymundo, pesquisadores e coordenadores da ANPPEA. Marcos Sorrentino, Iara Vasco e Carlos dos Santos foram convidados para a mesa redonda “Educação ambiental como estratégia para o uso e conservação da biodiversidade na zona costeira e marinha”.</p>',
		'{3}',
		NULL,
		TRUE,
		'https://zcm-content-images.s3.us-east-2.amazonaws.com/content/images/lancamento_zcm.png'
	);