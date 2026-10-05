# Continuidade — Planejamento de Postagens no Instagram

Este arquivo é para o próximo agente. A dona do produto é a Adriele. Não invente funções. O que está abaixo já foi combinado com ela.

## O que ela pediu

Um calendário simples para o cliente acompanhar o que foi programado no Instagram dele.

- Nome na tela: **Planejamento de Postagens no Instagram**.
- Sem visão de ano.
- Sem botão de nome do cliente, por enquanto.
- Sem aprovar, pedir ajuste ou reprovar, por enquanto. Isso entra numa etapa futura, só quando ela pedir.
- Tela principal: o mês e, logo abaixo, a semana daqueles dias.
- Ao tocar num dia, abre a página daquele dia, com as postagens em ordem de horário.
- Até quatro miniaturas no mesmo dia, sem esticar e sem quebrar a grade, no celular e no computador. Não bloqueie uma quinta: ela não quer regras. O layout é pensado para quatro.
- Nenhum campo é obrigatório. Ela pode salvar vazio, só com título, ou sem miniatura.
- Se o dia estiver vazio, a postagem é salva e não aparece no calendário. Na visão da administradora ela fica na lista **Sem data**.

Campos da postagem:

- Dia
- Hora
- Título
- Formato: post, reel, story ou carrossel. Pode ficar sem formato.
- Miniatura
- Link
- Legenda

Na página do dia, para o cliente:

- Mostrar horário, título, formato e miniatura só quando existirem.
- **Ver legenda** em toda postagem. O texto só abre ao tocar. Se não houver texto, mostrar "Sem legenda."
- **Ver imagem** só se houver link. O clique abre o link. Sem link, o botão não aparece.

## Quem vê o quê

- A administradora cria, edita e apaga. O endereço de teste é `#/admin`.
- O cliente só acompanha. O endereço é a raiz, `#/`. Não coloque link para a área da administradora na visão do cliente.
- Ela não personaliza a cópia pelo lado do cliente. O cliente não edita o aplicativo.

## O que já está no ar

Os arquivos do aplicativo são só estes:

- `index.html`
- `app.js`
- `app.css`
- `vercel.json`

O resto da pasta (`src/`, `package.json`, migrações) é um aplicativo antigo, maior do que ela pediu. Não publique esse aplicativo. Não volte a exigir campos. Não recoloque o ano, o nome do cliente nem a aprovação.

Os posts de teste ficam no `localStorage` do navegador, chave `planejamento-instagram-v1`. Por isso a administradora e o cliente só veem a mesma pauta se usarem o mesmo navegador. Ela sabe disso e aceitou testar a tela antes do Supabase.

O deploy da Vercel deve continuar estático: `vercel.json` copia `index.html`, `app.js` e `app.css` para `dist`. Não deixe a Vercel buildar o Vite/TanStack da raiz.

## O que falta: Supabase

Não há conector do Supabase. O próximo agente não consegue entrar na conta dela. Esperar ela criar o projeto e enviar só isto:

- Project URL
- chave `anon` (pública)

Não pedir e não colocar a chave `service_role` no site.

Quando esses dois dados existirem:

1. Criar a tabela e as políticas com o SQL abaixo, no editor SQL do projeto dela.
2. Criar um bucket público de leitura `miniaturas`. Upload só para usuária autenticada. Guardar o caminho do arquivo, não a imagem em base64.
3. Criar uma usuária administradora (e-mail e senha) no Authentication do Supabase.
4. Trocar o `localStorage` por essa tabela.
5. A raiz continua pública, só leitura.
6. `#/admin` passa a exigir o login dela. Sem login, não mostra Novo post, Editar nem Excluir.
7. Manter a tela exatamente como está. Não acrescentar CRM, ano, nome do cliente nem aprovação.

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  post_date date,
  post_time text default '',
  title text default '',
  format text default '',
  image_path text default '',
  link text default '',
  caption text default '',
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "leitura publica"
  on public.posts for select
  to anon, authenticated
  using (true);

create policy "admin escreve"
  on public.posts for insert
  to authenticated
  with check (true);

create policy "admin atualiza"
  on public.posts for update
  to authenticated
  using (true)
  with check (true);

create policy "admin apaga"
  on public.posts for delete
  to authenticated
  using (true);
```

Na Vercel, guardar `SUPABASE_URL` e `SUPABASE_ANON_KEY`. Como o site é estático, gerar um `config.js` no build e não commitar a chave se der para evitar. A chave anon pode ir no frontend. A service role não pode.
