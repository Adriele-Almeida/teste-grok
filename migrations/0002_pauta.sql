create table if not exists studio (
  id integer primary key check (id = 1),
  client_name text not null,
  agency_name text not null,
  tagline text not null default '',
  month_note text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists posts (
  id serial primary key,
  scheduled_at timestamptz not null,
  platform text not null,
  format text not null default 'feed',
  title text not null,
  caption text not null,
  media_url text not null,
  media_alt text not null default '',
  campaign text not null default '',
  status text not null default 'pending',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id serial primary key,
  post_id integer not null references posts(id) on delete cascade,
  action text not null,
  comment text not null default '',
  author_label text not null,
  created_at timestamptz not null default now()
);

create index if not exists posts_scheduled_at_idx on posts (scheduled_at);
create index if not exists reviews_post_id_idx on reviews (post_id);

insert into studio (id, client_name, agency_name, tagline, month_note)
values (
  1,
  'Casa Alva',
  'Estúdio Norte',
  'Casa contemporânea · Belo Horizonte',
  'Setembro: texturas naturais, linho e cerâmica. Tom acolhedor, sem promoção agressiva. Priorizar luz da manhã e ambientes reais.'
)
on conflict (id) do nothing;

insert into posts (scheduled_at, platform, format, title, caption, media_url, media_alt, campaign, status, notes)
values
(
  '2026-08-12 09:00:00-03', 'instagram', 'feed', 'Manhã de linho',
  $cap$A cama que convida a ficar. Lençóis de linho lavado, luz da janela, nada mais.

Casa Alva, coleção inverno.

#casaalva #linho #casacontemporanea$cap$,
  '/posts/cama.jpg', 'Cama desfeita em linho claro com luz da manhã', 'Casa de setembro', 'posted', ''
),
(
  '2026-08-18 18:00:00-03', 'reels', 'reel', 'A sala respira',
  $cap$Plantas, linho e a luz que atravessa a cortina. Um tour curto pela sala da Casa Alva.

Som ambiente. Sem fala.$cap$,
  '/posts/sala.jpg', 'Sala clara com sofá, plantas e luz de janela', 'Casa de setembro', 'posted', ''
),
(
  '2026-08-25 12:00:00-03', 'pinterest', 'feed', 'Oliveira na parede',
  $cap$Um ramo, um vaso, uma parede de cal. O silêncio que a casa pede.

Disponível no site.$cap$,
  '/posts/oliveira.jpg', 'Ramo de oliveira em vaso de cerâmica', 'Linho e luz', 'posted', ''
),
(
  '2026-08-28 19:00:00-03', 'stories', 'story', 'Bastidor do arranjo',
  $cap$Hoje no ateliê: flores da estação em cerâmica branca. Stories com a sequência do arranjo.$cap$,
  '/posts/flores.jpg', 'Pessoa arranjando flores em vaso de cerâmica', 'Linho e luz', 'posted', ''
),
(
  '2026-09-02 09:00:00-03', 'instagram', 'feed', 'Cama feita, dia inteiro',
  $cap$Base de madeira, linho lavado, almofadas em areia e cinza. A cama como peça da sala — não só do quarto.

Casa Alva.$cap$,
  '/posts/cama-feita.jpg', 'Cama de linho sobre base de madeira com almofadas', 'Casa de setembro', 'posted', ''
),
(
  '2026-09-05 18:00:00-03', 'reels', 'reel', 'Cantos que ficam',
  $cap$A poltrona, a luminária, o vaso. Três segundos em cada canto da sala.

Música: piano baixo.$cap$,
  '/posts/boucle.jpg', 'Sala contemporânea com sofá claro e poltrona', 'Casa de setembro', 'posted', ''
),
(
  '2026-09-08 12:00:00-03', 'linkedin', 'feed', 'Morar no clima de Minas',
  $cap$Piso de terracota, plantas à solta, madeira à vista. A Casa Alva nasceu em Belo Horizonte e leva esse clima para dentro.

Um texto curto sobre material local e ofício.$cap$,
  '/posts/brasil.jpg', 'Interior brasileiro com piso de terracota e plantas', 'Institucional', 'approved', 'Versão institucional. Sem preço.'
),
(
  '2026-09-10 10:00:00-03', 'stories', 'story', 'A trama do linho',
  $cap$Close na trama. Stories com swipe-up para a coleção de tecidos.$cap$,
  '/posts/linho.jpg', 'Close da textura de linho natural', 'Linho e luz', 'posted', ''
),
(
  '2026-09-11 15:00:00-03', 'pinterest', 'feed', 'Oliveira, estudo',
  $cap$Estudo de still para o pin da oliveira. Fundo de cal, vaso de barro.$cap$,
  '/posts/oliveira.jpg', 'Ramo de oliveira em vaso', 'Linho e luz', 'rejected', ''
),
(
  '2026-09-12 18:00:00-03', 'tiktok', 'reel', 'Sala em movimento',
  $cap$A câmera entra pela janela e senta no sofá. 12 segundos.

Som original: vento e xícara.$cap$,
  '/posts/sala.jpg', 'Sala com plantas e sofá claro', 'Casa de setembro', 'changes', 'Primeiro corte enviado 12/09.'
),
(
  '2026-09-15 09:00:00-03', 'instagram', 'carousel', 'Três peças da semana',
  $cap$1. Cama de linho
2. Poltrona da sala
3. A oliveira na consola

Carrossel com créditos do fotógrafo no último slide.$cap$,
  '/posts/cama.jpg', 'Cama de linho com luz da manhã', 'Casa de setembro', 'approved', ''
),
(
  '2026-09-16 18:00:00-03', 'reels', 'reel', 'Fim de tarde na cama',
  $cap$A luz muda e o linho também. Reel de 8 segundos, só câmera lenta.

Sem texto na tela.$cap$,
  '/posts/cama.jpg', 'Cama desfeita em linho com luz da janela', 'Casa de setembro', 'pending', 'Post de hoje. Enviado para o cliente às 14h.'
),
(
  '2026-09-17 12:00:00-03', 'instagram', 'feed', 'A sala de estar que abraça',
  $cap$Sofá de linho, manta, ficus e a prateleira que não precisa de nada a mais.

Casa Alva, setembro.$cap$,
  '/posts/sala.jpg', 'Sala aconchegante com plantas e sofá', 'Casa de setembro', 'pending', ''
),
(
  '2026-09-18 09:00:00-03', 'stories', 'story', 'Flores da manhã',
  $cap$Sequência no ateliê: corte, vaso, mesa. Três stories + destaque na capa.$cap$,
  '/posts/flores.jpg', 'Arranjo de flores em ateliê', 'Linho e luz', 'pending', ''
),
(
  '2026-09-19 18:00:00-03', 'tiktok', 'reel', 'Casa que é mata',
  $cap$Tour da casa com as plantas no teto. TikTok com som original.

Texto na tela: “a casa também é jardim”.$cap$,
  '/posts/brasil.jpg', 'Interior com teto de plantas e piso de terracota', 'Institucional', 'draft', 'Aguardando autorização de locação.'
),
(
  '2026-09-22 12:00:00-03', 'instagram', 'feed', 'Quarto em madeira e linho',
  $cap$A base aparente, o linho lavado, as almofadas no chão. Um quarto que não esconde o ofício.

Nova cama, no site.$cap$,
  '/posts/cama-feita.jpg', 'Cama de linho sobre madeira', 'Casa de setembro', 'pending', ''
),
(
  '2026-09-24 19:00:00-03', 'linkedin', 'feed', 'Matéria e ofício',
  $cap$Por que escolhemos madeira maciça e cerâmica feita à mão. Um texto para a rede — tom de estúdio, não de anúncio.$cap$,
  '/posts/estante.jpg', 'Estante com livros, velas e vaso', 'Institucional', 'changes', ''
),
(
  '2026-09-26 09:00:00-03', 'pinterest', 'feed', 'Still da oliveira',
  $cap$Pin vertical. Vaso, ramo, parede. Sem logo na imagem — só na descrição.$cap$,
  '/posts/oliveira.jpg', 'Oliveira em vaso de cerâmica', 'Linho e luz', 'pending', ''
),
(
  '2026-09-28 18:00:00-03', 'reels', 'reel', 'Luz de lâmpada, não de flash',
  $cap$A sala à noite. Abajur, vela, tecido. Reel silencioso com um único movimento de câmera.$cap$,
  '/posts/boucle.jpg', 'Sala contemporânea à luz quente', 'Casa de setembro', 'draft', ''
),
(
  '2026-09-30 12:00:00-03', 'instagram', 'carousel', 'O mês em quatro cantos',
  $cap$Recap de setembro: cama, sala, mesa, varanda. Carrossel de 4 fotos + legenda de agradecimento.$cap$,
  '/posts/sala.jpg', 'Sala com sofá e plantas', 'Casa de setembro', 'pending', ''
),
(
  '2026-10-03 09:00:00-03', 'instagram', 'feed', 'Outubro começa no linho',
  $cap$A coleção segue. Mesma trama, outra luz. Outubro na Casa Alva.$cap$,
  '/posts/cama.jpg', 'Cama de linho com luz da manhã', 'Outubro quieto', 'pending', ''
),
(
  '2026-10-07 18:00:00-03', 'reels', 'reel', 'Terracota e folha',
  $cap$Piso quente, planta alta, cadeira de madeira. Reel de 10s.$cap$,
  '/posts/brasil.jpg', 'Casa com piso de terracota', 'Outubro quieto', 'draft', ''
),
(
  '2026-10-10 12:00:00-03', 'stories', 'story', 'Ateliê aberto',
  $cap$Stories do making of do arranjo de outubro.$cap$,
  '/posts/flores.jpg', 'Arranjo de flores', 'Outubro quieto', 'pending', ''
),
(
  '2026-10-14 09:00:00-03', 'pinterest', 'feed', 'Verde em casa',
  $cap$Pin da oliveira para o board “plantas internas”.$cap$,
  '/posts/oliveira.jpg', 'Ramo de oliveira', 'Outubro quieto', 'draft', ''
),
(
  '2026-10-20 18:00:00-03', 'instagram', 'feed', 'A poltrona da leitura',
  $cap$Um canto, uma lâmpada, um livro. A peça da semana.$cap$,
  '/posts/boucle.jpg', 'Sala com poltrona e sofá', 'Outubro quieto', 'pending', ''
),
(
  '2026-10-27 12:00:00-03', 'linkedin', 'feed', 'O que a casa ensina',
  $cap$Texto institucional de outubro: menos tendência, mais matéria. Casa Alva.$cap$,
  '/posts/estante.jpg', 'Estante com livros e velas', 'Institucional', 'pending', ''
);

insert into reviews (post_id, action, comment, author_label, created_at)
select id, 'approved', 'Aprovado. Tom certo para o institucional.', 'Cliente', '2026-09-08 16:40:00-03'
from posts where title = 'Morar no clima de Minas' limit 1;

insert into reviews (post_id, action, comment, author_label, created_at)
select id, 'rejected', 'A arte parece um pôster de catálogo. Queremos a oliveira no ambiente real da casa, não um quadro na parede.', 'Cliente', '2026-09-11 17:22:00-03'
from posts where title = 'Oliveira, estudo' limit 1;

insert into reviews (post_id, action, comment, author_label, created_at)
select id, 'changes', 'O corte está rápido demais no início. Dá para alongar a primeira cena da sala uns dois segundos?', 'Cliente', '2026-09-12 20:14:00-03'
from posts where title = 'Sala em movimento' limit 1;

insert into reviews (post_id, action, comment, author_label, created_at)
select id, 'comment', 'Vamos refazer o corte e reenviar até sexta. Obrigado pelo apontamento.', 'Agência', '2026-09-13 09:05:00-03'
from posts where title = 'Sala em movimento' limit 1;

insert into reviews (post_id, action, comment, author_label, created_at)
select id, 'approved', 'Aprovado. Pode seguir o carrossel como está.', 'Cliente', '2026-09-15 11:10:00-03'
from posts where title = 'Três peças da semana' limit 1;

insert into reviews (post_id, action, comment, author_label, created_at)
select id, 'changes', 'A foto está escura demais para o LinkedIn. Preferimos a sala clara — a estante de noite perde o tom da marca.', 'Cliente', '2026-09-24 21:03:00-03'
from posts where title = 'Matéria e ofício' limit 1;
