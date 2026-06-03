# Senales de Nexo — Arquitectura, backend y logica

Documento autoritativo para implementar el backend, datos, permisos y logica del sistema de contenido publicado en Orbitas. **Esta IA no debe tocar diseno visual**: estilos, componentes, layout y estetica los gestiona otra IA en paralelo. Aqui se define que existe, como se conecta y que falta para que el feature funcione de extremo a extremo.

> Punto de entrada para una IA backend o full-stack que va a continuar trabajando en Senales. Lee este doc primero. Para contexto general consulta `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `FEATURES.md`. Para chats consulta `CHATS_ARCHITECTURE.md` (estructura espejo a este). Estado de la ultima sesion en `SESSION_2026-05-25.md`.

---

## 0. Naming y resumen ejecutivo

### Naming

- **Senal**: la entidad de contenido publicado dentro de una Orbita. A nivel de schema y codigo se mantiene la tabla y tipo `posts` (decision pragmatica para no romper lo que ya esta). A nivel de **copy de producto** y de **lenguaje en docs/UI** se llama **Senal**.
- **Eco**: la reaccion a una Senal. **Una unica interaccion** (boton "Eco" que se alterna). El cliente escribe siempre `inspire`. La migracion `009_post_reactions_single_eco.sql` estrecho el CHECK de `post_reactions` para que **solo admita `inspire`**: los tipos legacy `relate`/`curious`/`support` ya no se permiten (la migracion los convirtio a `inspire` y los borro). Con la reaccion constante, la PK `(post_id, user_id, reaction)` garantiza un unico Eco por usuario y Senal.
- **Comentario**: respuesta textual a una Senal. Anidamiento a 1 nivel.

Regla: el schema mantiene `posts` / `post_reactions` / `comments` / `saved_posts` para evitar migracion masiva. Toda la documentacion de producto y los nuevos copy hablan de "Senal" y "Eco".

### Que cubre V1

1. Tipos de Senal con schema fuerte solo para los 3 que aportan algo unico: **poll, event, help**. El resto (`debate, fanart, story, recommendation`) sigue como tag visual sobre el schema base de `posts`.
2. **Lifecycle**: edit con marca "editada", delete soft, pin por mod a la Orbita (max N), drafts. No scheduled posts en V1.
3. **Comentarios v2**: Ecos en comentarios, ordenacion (top/new), pin de comentario, mentions con `@username`.
4. **Feed**: trending real (ventana + decay), for-you basico por intereses, paginacion cursor-based, filtros por tipo.
5. **Media**: carrusel de imagenes (1-10), sin video, sin gif animado. Bucket `post-media` ya existe.
6. **Permisos por Orbita**: rate limit anti-spam, tipos restringibles por rol (configurable por Orbita).
7. **Notificaciones (3 minimas)**: comentario en mi Senal, eco en mi Senal, mencion en cuerpo o comentario.

### Que queda fuera de V1 (deferred)

- Posts privados intra-Orbita (todo es publico dentro de la Orbita; visibilidad la define la Orbita).
- Tags / hashtags cross-Orbita.
- Reputacion / gamificacion (puntos, badges, scores).
- Scheduled posts.
- Video y gif animado.
- Repost / quote cross-Orbita.
- Best-answer reputation systems mas alla del flag `is_accepted_answer`.

### Stack relevante

Supabase (PostgreSQL + RLS + Storage + RPCs), TanStack Query en cliente, modo demo en memoria (`src/services/demo-service.ts`).

---

## 1. Modelo de dominio

### 1.1 Conceptos

- **Senal (`posts`)**: contenedor de contenido. `community_id` obligatorio, `author_id` obligatorio, `type` discreto, `title?`, `body?`, `media_urls[]`, `status`. CHECK existente impone que haya body **o** media (no se permite Senal vacia).
- **Tipos de Senal**:
  - **Cosmeticos** (sin schema extra, solo el `type` string): `debate`, `fanart`, `story`, `recommendation`. Se renderizan distinto pero comparten esquema.
  - **Estructurados** (con tablas hijas): `poll`, `event`, `help`.
- **Eco (`post_reactions`)**: PK composite `(post_id, user_id, reaction)`. El producto colapso el Eco en una **unica interaccion**: el cliente solo escribe `inspire` y, desde la migracion `009`, el CHECK **solo admite `inspire`** (los tipos `relate/curious/support` quedaron eliminados del schema). Con la reaccion constante, la PK equivale a un unico Eco por `(post, usuario)`.
- **Comentario (`comments`)**: respuesta textual. `parent_id` opcional → 1 nivel de reply. Body 1-1000 chars.
- **Guardado (`saved_posts`)**: bookmark personal. PK `(user_id, post_id)`.

### 1.2 Tipos TypeScript autoritativos

Definidos en `src/types/domain.ts`. No duplicar.

```ts
export type PostType =
  | "debate" | "help" | "fanart" | "poll" | "story" | "recommendation" | "event";
export type ContentStatus = "published" | "hidden" | "deleted";
// El Eco es una unica interaccion: el cliente solo escribe "inspire" y, desde la
// migracion 009, el CHECK de post_reactions solo admite "inspire". La union
// conserva los literales legacy por historia/compat de lectura; no se generan.
export type ReactionType = "inspire" | "relate" | "curious" | "support";

export type Post = {
  id: string;
  community_id: string;
  author_id: string;
  type: PostType;
  title: string | null;
  body: string | null;
  media_urls: string[];
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type PostWithMeta = Post & {
  author: Profile | null;
  community: Community | null;
  reaction_counts: Record<ReactionType, number>;
  user_reactions: ReactionType[];
  is_saved: boolean;
  recommendation_reason?: string;
};
```

### 1.3 Tipos nuevos a anadir (V1)

```ts
// poll
export type PostPoll = {
  post_id: string;
  question: string;            // redundante con post.title si se quiere, pero util
  multiple_choice: boolean;
  closes_at: string | null;
  show_results: "always" | "after_vote" | "after_close";
};
export type PostPollOption = {
  id: string;
  post_id: string;
  label: string;
  position: number;
};
export type PostPollVote = {
  post_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
};

// event
export type PostEvent = {
  post_id: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;            // IANA ej "Europe/Madrid"
  location_text: string | null;
  location_url: string | null;
  capacity: number | null;
};
export type PostEventRsvp = {
  post_id: string;
  user_id: string;
  status: "yes" | "no" | "maybe";
  responded_at: string;
};

// help
export type PostHelpThread = {
  post_id: string;
  state: "open" | "answered" | "closed";
  accepted_comment_id: string | null;
};

// lifecycle (capa cross-tipos)
export type PostDraft = {
  id: string;
  author_id: string;
  community_id: string | null; // puede ser null hasta que se elija
  type: PostType | null;
  payload: Json;               // estado del wizard / formulario
  updated_at: string;
};
export type PostPin = {
  community_id: string;
  post_id: string;
  pinned_by: string | null;
  pinned_at: string;
};
export type PostMention = {
  post_id: string | null;
  comment_id: string | null;
  mentioned_user_id: string;
  created_at: string;
};

// comments v2
export type CommentReaction = {
  comment_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
};
export type CommentPin = {
  post_id: string;
  comment_id: string;
  pinned_by: string | null;
  pinned_at: string;
};
```

### 1.4 Invariantes de producto V1

| Invariante | Mecanismo de garantia |
|---|---|
| Senal no vacia (body o media) | CHECK existente en `posts` |
| 1 voto por usuario en poll de eleccion unica | Indice unico parcial `post_poll_votes_one_per_user` cuando `multiple_choice = false` |
| Multiple choice permite N votos por usuario | PK `(post_id, option_id, user_id)` — repetir misma opcion no permitido |
| Voto solo si poll esta abierta | Trigger BEFORE INSERT en `post_poll_votes` que comprueba `closes_at` |
| Capacidad de evento respetada | Trigger que rechaza RSVP `yes` si `count(yes) >= capacity` y capacity no es null |
| 1 RSVP por usuario por evento | PK `(post_id, user_id)` en `post_event_rsvps` |
| 1 best-answer maximo por help | Columna `accepted_comment_id` (unique no necesario, una sola fila) |
| Max N pin de Senal por Orbita (V1: 3) | Trigger BEFORE INSERT en `post_pins` |
| Solo Orbita-moderator puede pinear | Policy `post_pins_manage_mods` |
| Banned no puede crear Senal ni comentar | CHECK + policy basado en `community_members.role <> 'banned'` (ojo: hoy CommunityRole no tiene `banned`, ver §11) |
| Edit marca "editada" sin duplicar filas | Columna `edited_at timestamptz` en `posts` y `comments` (trigger lo actualiza si body cambia) |
| Delete soft | `status = 'deleted'`, body → null, media_urls → '{}', trigger lo limpia |
| Rate limit anti-spam | Trigger BEFORE INSERT en `posts` y `comments` (ver §4.6) |
| 1 emoji-eco por (post, user, reaction) | PK composite existente |
| Mention notifica solo a miembros de la Orbita | RPC `process_mentions` que filtra |

---

## 2. Esquema de base de datos

### 2.1 Lo que ya existe (migracion 001)

```sql
posts (
  id uuid pk,
  community_id uuid not null fk,
  author_id uuid not null fk,
  type text check (type in ('debate','help','fanart','poll','story','recommendation','event')),
  title text check (char_length <= 120),
  body text check (char_length <= 5000),
  media_urls text[] not null default '{}',
  status text check (status in ('published','hidden','deleted')),
  created_at, updated_at,
  check (body o media_urls no estan vacios ambos)
)
post_reactions (post_id, user_id, reaction, created_at) pk(post_id, user_id, reaction)
comments (id, post_id, author_id, parent_id?, body, status, created_at, updated_at)
saved_posts (user_id, post_id, created_at)
```

Indices existentes: `idx_posts_community_created`, `idx_posts_author_created`, `idx_comments_post_created`. Triggers: `set_posts_updated_at`, `set_comments_updated_at`.

### 2.2 Lo que hay que anadir (migraciones 014+ — ver §10)

#### 2.2.1 Lifecycle: edited_at, drafts, pins

```sql
-- ampliacion de posts y comments
alter table public.posts add column if not exists edited_at timestamptz;
alter table public.comments add column if not exists edited_at timestamptz;

-- triggers que actualizan edited_at si body o media_urls cambian
create or replace function public.set_post_edited_at() returns trigger language plpgsql as $$
begin
  if (new.body is distinct from old.body) or (new.media_urls is distinct from old.media_urls) or (new.title is distinct from old.title) then
    new.edited_at = now();
  end if;
  return new;
end;
$$;
drop trigger if exists posts_edited_at on public.posts;
create trigger posts_edited_at before update on public.posts
for each row execute function public.set_post_edited_at();
-- mismo patron para comments con set_comment_edited_at

-- drafts
create table if not exists public.post_drafts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  type text check (type in ('debate','help','fanart','poll','story','recommendation','event')),
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create index post_drafts_author_idx on public.post_drafts(author_id, updated_at desc);

-- pins de Senal por Orbita
create table if not exists public.post_pins (
  community_id uuid not null references public.communities(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  pinned_by uuid references public.profiles(id) on delete set null,
  pinned_at timestamptz not null default now(),
  primary key (community_id, post_id)
);
create or replace function public.enforce_post_pin_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.post_pins where community_id = new.community_id) >= 3 then
    raise exception 'Maximo 3 Senales fijadas por Orbita';
  end if;
  return new;
end;
$$;
drop trigger if exists post_pins_limit on public.post_pins;
create trigger post_pins_limit before insert on public.post_pins
for each row execute function public.enforce_post_pin_limit();
```

#### 2.2.2 Polls

```sql
create table if not exists public.post_polls (
  post_id uuid primary key references public.posts(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 200),
  multiple_choice boolean not null default false,
  closes_at timestamptz,
  show_results text not null default 'after_vote'
    check (show_results in ('always','after_vote','after_close')),
  created_at timestamptz not null default now()
);

create table if not exists public.post_poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.post_polls(post_id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  position int not null check (position between 0 and 9)
);
create unique index post_poll_options_unique_position on public.post_poll_options(post_id, position);

create table if not exists public.post_poll_votes (
  post_id uuid not null references public.post_polls(post_id) on delete cascade,
  option_id uuid not null references public.post_poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, option_id, user_id)
);

-- single-choice enforcement: 1 voto por usuario en polls no-multiple_choice
create unique index post_poll_votes_single_per_user
  on public.post_poll_votes(post_id, user_id)
  where exists (
    -- no podemos hacer subquery en indice, asi que va por trigger
    select 1
  );
-- como el indice condicional con subquery no es soportado, usar trigger:
create or replace function public.enforce_poll_single_choice() returns trigger language plpgsql as $$
declare
  is_multi boolean;
begin
  select multiple_choice into is_multi from public.post_polls where post_id = new.post_id;
  if is_multi is false and exists (
    select 1 from public.post_poll_votes
    where post_id = new.post_id and user_id = new.user_id
  ) then
    raise exception 'Esta encuesta solo permite un voto por usuario';
  end if;
  -- bloquear si la poll esta cerrada
  if exists (
    select 1 from public.post_polls
    where post_id = new.post_id and closes_at is not null and closes_at <= now()
  ) then
    raise exception 'Esta encuesta esta cerrada';
  end if;
  return new;
end;
$$;
drop trigger if exists poll_votes_single_choice on public.post_poll_votes;
create trigger poll_votes_single_choice before insert on public.post_poll_votes
for each row execute function public.enforce_poll_single_choice();
```

#### 2.2.3 Events

```sql
create table if not exists public.post_events (
  post_id uuid primary key references public.posts(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'UTC',
  location_text text check (location_text is null or char_length(location_text) <= 200),
  location_url text check (location_url is null or char_length(location_url) <= 500),
  capacity int check (capacity is null or capacity > 0),
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table if not exists public.post_event_rsvps (
  post_id uuid not null references public.post_events(post_id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('yes','no','maybe')),
  responded_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- enforce capacity: solo cuenta status='yes'
create or replace function public.enforce_event_capacity() returns trigger language plpgsql as $$
declare
  cap int;
  current_yes int;
begin
  if new.status <> 'yes' then return new; end if;

  select capacity into cap from public.post_events where post_id = new.post_id;
  if cap is null then return new; end if;

  select count(*) into current_yes
  from public.post_event_rsvps
  where post_id = new.post_id and status = 'yes' and user_id <> new.user_id;

  if current_yes >= cap then
    raise exception 'El evento ha alcanzado su capacidad maxima';
  end if;
  return new;
end;
$$;
drop trigger if exists event_rsvp_capacity on public.post_event_rsvps;
create trigger event_rsvp_capacity before insert or update on public.post_event_rsvps
for each row execute function public.enforce_event_capacity();
```

#### 2.2.4 Help threads

```sql
create table if not exists public.post_help_threads (
  post_id uuid primary key references public.posts(id) on delete cascade,
  state text not null default 'open' check (state in ('open','answered','closed')),
  accepted_comment_id uuid references public.comments(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- aceptar respuesta: solo autor del post o mod. Se hace via RPC accept_help_answer.
-- al aceptar: state pasa a 'answered'.
-- cerrar: solo autor o mod, sin aceptar respuesta. state pasa a 'closed'.
```

#### 2.2.5 Comentarios v2

```sql
-- ecos en comentarios
create table if not exists public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('inspire','relate','curious','support')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, reaction)
);

alter table public.comments
  add column if not exists is_op boolean generated always as (false) stored;
-- Nota: is_op se calcula mejor en query (author_id = post.author_id). Si se quiere materializar,
-- mantener via trigger. Recomiendo NO materializar y resolver en mapper del cliente.

-- pin de comentarios (max 1 por Senal)
create table if not exists public.comment_pins (
  post_id uuid primary key references public.posts(id) on delete cascade,
  comment_id uuid not null references public.comments(id) on delete cascade,
  pinned_by uuid references public.profiles(id) on delete set null,
  pinned_at timestamptz not null default now()
);
-- PK en post_id ya garantiza max 1 por Senal.
```

#### 2.2.6 Mentions

```sql
create table if not exists public.post_mentions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  mentioned_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);
create index post_mentions_user_idx on public.post_mentions(mentioned_user_id, created_at desc);
```

Las menciones se procesan via RPC al crear Senal o comentario (ver §4.5). El parseo es server-side por consistencia (regex `@[a-z0-9_]+`).

---

## 3. Helpers SQL

| Funcion | Devuelve | Uso |
|---|---|---|
| `is_community_member(community_id, user_id)` | boolean | existente |
| `is_community_moderator(community_id, user_id)` | boolean | existente |
| `can_read_community(community_id, user_id)` | boolean | existente |
| `is_post_author(post_id, user_id)` | boolean | nuevo helper |
| `can_moderate_post(post_id, user_id)` | boolean | mod de la Orbita del post |
| `post_eco_counts(post_id)` | jsonb `{inspire,relate,curious,support}` | para feed sin N+1 |
| `is_member_in_good_standing(community_id, user_id)` | boolean | miembro y NO banned (cuando exista) |

```sql
create or replace function public.is_post_author(input_post_id uuid, input_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts where id = input_post_id and author_id = input_user_id);
$$;

create or replace function public.can_moderate_post(input_post_id uuid, input_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.posts p
    where p.id = input_post_id
      and public.is_community_moderator(p.community_id, input_user_id)
  );
$$;
```

---

## 4. RPCs

Convencion identica a chats: `SECURITY DEFINER`, `language plpgsql`, validar permisos al inicio, **siempre auditar** las acciones de moderacion en una tabla nueva `community_audit_log` (espejo de `chat_audit_log`, ver §11.B).

### 4.1 `create_signal`

```sql
public.create_signal(
  input_community_id uuid,
  input_type text,
  input_title text default null,
  input_body text default null,
  input_media_urls text[] default '{}',
  input_poll jsonb default null,    -- { question, multiple_choice, closes_at, show_results, options:[{label,position}] }
  input_event jsonb default null,   -- { starts_at, ends_at, timezone, location_text, location_url, capacity }
  input_help jsonb default null     -- { } (basta con el flag; thread se crea con state='open')
) returns public.posts
```

Validaciones:
- `auth.uid()` no nulo.
- `is_community_member(community_id, caller)` y no banned (cuando exista flag).
- `type in (...)` enum permitido.
- Body o media_urls no ambos vacios (CHECK existente).
- Si `type='poll'`: `input_poll` requerido con 2-10 opciones.
- Si `type='event'`: `input_event` requerido con `starts_at` futuro.
- Si `type='help'`: `input_help` puede ser `{}` pero se crea fila en `post_help_threads`.
- **Rate limit**: ver §4.6.
- **Permiso por rol**: ver §6.5 (mods pueden restringir tipos por rol en su Orbita).

Side-effects:
- INSERT en `posts`.
- Si poll: INSERT en `post_polls` + `post_poll_options`.
- Si event: INSERT en `post_events`.
- Si help: INSERT en `post_help_threads`.
- Procesa menciones en `body` (helper `process_mentions(post_id, comment_id, body)`).

### 4.2 `update_signal`

```sql
public.update_signal(
  input_post_id uuid,
  input_patch jsonb -- subset de campos editables: { title?, body?, media_urls?, poll?, event?, help? }
) returns public.posts
```

Permisos: autor o `can_moderate_post`. Si es mod no-autor, anade flag a audit y a metadata del post (`edited_by_mod=true` en algun lado — recomiendo columna `last_editor_id` en `posts`).

No permite cambiar `type` ni `community_id`.

### 4.3 `delete_signal`

```sql
public.delete_signal(input_post_id uuid) returns void
```

Permisos: autor o mod. Soft delete: `status='deleted'`, `body=null`, `media_urls='{}'`, `title=null`. Audita.

### 4.4 `pin_signal` / `unpin_signal`

```sql
public.pin_signal(input_post_id uuid) returns void
public.unpin_signal(input_post_id uuid) returns void
```

Permisos: solo mod de la Orbita. Trigger `enforce_post_pin_limit` ya cubre el max 3.

### 4.5 `process_mentions`

```sql
public.process_mentions(
  input_post_id uuid,
  input_comment_id uuid,
  input_body text
) returns void
```

Logica:
- Regex `@([a-z0-9_]+)` sobre el body.
- Resolver username → profile_id.
- Filtrar a usuarios que sean **miembros de la Orbita** de la Senal (evita spam externo).
- INSERT en `post_mentions` por cada match.
- Emitir notificacion de tipo `mention` (ver §9).

Llamada desde `create_signal`, `update_signal`, `create_comment`, `update_comment`.

### 4.6 Rate limiting (`check_signal_rate_limit`)

Helper que la RPC `create_signal` invoca al inicio:

```sql
create or replace function public.check_signal_rate_limit(input_user_id uuid, input_community_id uuid)
returns void language plpgsql security definer as $$
declare
  hour_count int;
  day_count int;
begin
  select count(*) into hour_count
  from public.posts
  where author_id = input_user_id
    and created_at > now() - interval '1 hour';
  if hour_count >= 5 then
    raise exception 'Limite de 5 Senales por hora alcanzado';
  end if;

  select count(*) into day_count
  from public.posts
  where author_id = input_user_id
    and community_id = input_community_id
    and created_at > now() - interval '24 hours';
  if day_count >= 15 then
    raise exception 'Limite de 15 Senales en esta Orbita en 24h';
  end if;
end;
$$;
```

Valores iniciales (ajustables): **5 Senales/hora globalmente, 15 Senales/24h por Orbita**. Mods exentos? V1: no, los mods tambien estan sujetos (evita abuso si un mod se compromete).

Mismo patron para comentarios: max 30/hora globalmente.

### 4.7 Poll: `vote_poll`

```sql
public.vote_poll(
  input_post_id uuid,
  input_option_ids uuid[] -- 1 elemento si single-choice; N si multiple_choice
) returns void
```

- Verifica miembro de Orbita y poll abierta (`closes_at` futuro o null).
- Si single-choice: borra votos previos del usuario en esa poll y inserta el nuevo.
- Si multiple-choice: inserta solo los que no esten, borra los que el cliente no haya enviado (sync explicito).

### 4.8 Event: `rsvp_event`

```sql
public.rsvp_event(input_post_id uuid, input_status text) returns void
```

UPSERT en `post_event_rsvps`. Trigger `enforce_event_capacity` valida la capacidad si `status='yes'`.

### 4.9 Help: `accept_help_answer`, `close_help`

```sql
public.accept_help_answer(input_post_id uuid, input_comment_id uuid) returns void
public.close_help(input_post_id uuid) returns void
```

- `accept_help_answer`: solo autor del post o mod. Comprueba que el comentario pertenece al post. Setea `accepted_comment_id`, `state='answered'`. Notifica al autor del comentario aceptado.
- `close_help`: solo autor o mod. `state='closed'`. No requiere accepted_comment_id.

### 4.10 Comentarios: `create_comment`, `update_comment`, `delete_comment`, `pin_comment`, `unpin_comment`

Patrones analogos a Senal:
- `create_comment`: valida miembro, rate-limit (max 30/hora), procesa menciones, notifica al autor del post.
- `update_comment`: autor o mod. `edited_at`.
- `delete_comment`: autor o mod. Soft delete (`status='deleted'`, body→`''` o reemplazo, conserva fila por integridad de hilo).
- `pin_comment` / `unpin_comment`: solo autor de la Senal o mod. PK garantiza max 1.

### 4.11 Drafts

Tabla `post_drafts` se gestiona client-side directo (INSERT/UPDATE/DELETE bajo RLS de autor). No requiere RPC.

---

## 5. Triggers

| Trigger | Tabla | Cuando | Funcion |
|---|---|---|---|
| `set_posts_updated_at` | `posts` | BEFORE UPDATE | `set_updated_at()` (existente) |
| `set_comments_updated_at` | `comments` | BEFORE UPDATE | `set_updated_at()` (existente) |
| `posts_edited_at` | `posts` | BEFORE UPDATE | `set_post_edited_at()` (nuevo) |
| `comments_edited_at` | `comments` | BEFORE UPDATE | `set_comment_edited_at()` (nuevo) |
| `post_pins_limit` | `post_pins` | BEFORE INSERT | `enforce_post_pin_limit()` |
| `poll_votes_single_choice` | `post_poll_votes` | BEFORE INSERT | `enforce_poll_single_choice()` |
| `event_rsvp_capacity` | `post_event_rsvps` | BEFORE INSERT OR UPDATE | `enforce_event_capacity()` |
| `help_threads_updated_at` | `post_help_threads` | BEFORE UPDATE | `set_updated_at()` |

---

## 6. RLS

Habilitado en todas las tablas nuevas. Las policies usan los helpers existentes.

### 6.1 `posts` (status quo + ajustes)

| Op | Policy actual | Notas V1 |
|---|---|---|
| select | `posts_read` segun `can_read_community` | Filtrar tambien `status <> 'deleted'` en query (no en RLS — los mods necesitan ver borrados) |
| insert | exigir miembro | **CAMBIO**: ahora se hace via `create_signal` RPC. La policy de INSERT directo se mantiene como fallback pero las apps deben pasar por la RPC. |
| update | autor o mod | Mantener. La RPC `update_signal` la usa. |
| delete | autor o mod | **CAMBIO V1**: solo permitir DELETE fisico al owner de la Orbita. El delete normal es soft via RPC. |

### 6.2 `post_polls`, `post_poll_options`, `post_poll_votes`

```sql
-- read: cualquiera que pueda leer el post
create policy "polls_read_by_post" on public.post_polls for select
using (exists (
  select 1 from public.posts p
  where p.id = post_polls.post_id
    and public.can_read_community(p.community_id, auth.uid())
));
-- mismo para post_poll_options y post_poll_votes

-- write polls/options: solo via RPC create_signal / update_signal (SECURITY DEFINER)
create policy "polls_insert_via_rpc" on public.post_polls for insert with check (false);
create policy "polls_options_insert_via_rpc" on public.post_poll_options for insert with check (false);

-- write votes: usuario es miembro de la orbita del post
create policy "poll_votes_insert_member" on public.post_poll_votes for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.posts p
    where p.id = post_poll_votes.post_id
      and public.is_community_member(p.community_id, auth.uid())
  )
);
create policy "poll_votes_delete_self" on public.post_poll_votes for delete
using (user_id = auth.uid());
```

### 6.3 `post_events`, `post_event_rsvps`

```sql
-- read: cualquiera que lea el post
create policy "events_read_by_post" on public.post_events for select using (...);
create policy "events_rsvp_read_by_post" on public.post_event_rsvps for select using (...);

-- write events: via RPC create_signal / update_signal
create policy "events_insert_via_rpc" on public.post_events for insert with check (false);

-- write rsvp: self + miembro de la orbita
create policy "rsvp_write_self" on public.post_event_rsvps for insert with check (
  user_id = auth.uid() and is_member_via_post(post_id, auth.uid())
);
create policy "rsvp_update_self" on public.post_event_rsvps for update using (user_id = auth.uid());
create policy "rsvp_delete_self" on public.post_event_rsvps for delete using (user_id = auth.uid());
```

### 6.4 `post_help_threads`

```sql
create policy "help_read_by_post" on public.post_help_threads for select using (...);
create policy "help_write_via_rpc" on public.post_help_threads for all with check (false);
```

### 6.5 `comment_reactions`, `comment_pins`, `post_mentions`, `post_pins`, `post_drafts`

```sql
-- comment_reactions: read miembro orbita, write self + miembro
-- comment_pins: read miembro, write via RPC (autor post o mod)
-- post_mentions: read solo el mencionado o el autor del contenido + mods
create policy "mentions_read_self_or_author" on public.post_mentions for select using (
  mentioned_user_id = auth.uid()
  or exists (
    select 1 from public.posts p where p.id = post_mentions.post_id and p.author_id = auth.uid()
  )
);
create policy "mentions_insert_via_rpc" on public.post_mentions for insert with check (false);

-- post_pins: read public, write via RPC pin_signal
create policy "post_pins_read_all" on public.post_pins for select using (
  exists (select 1 from public.communities c where c.id = community_id and c.visibility in ('public','unlisted')
    or public.is_community_member(c.id, auth.uid()))
);
create policy "post_pins_write_via_rpc" on public.post_pins for all with check (false);

-- post_drafts: estrictamente del autor
create policy "drafts_select_self" on public.post_drafts for select using (author_id = auth.uid());
create policy "drafts_insert_self" on public.post_drafts for insert with check (author_id = auth.uid());
create policy "drafts_update_self" on public.post_drafts for update using (author_id = auth.uid());
create policy "drafts_delete_self" on public.post_drafts for delete using (author_id = auth.uid());
```

### 6.6 Permisos por rol configurables por Orbita

Anadir tabla `community_post_permissions(community_id, post_type, min_role)` opcional:

```sql
create table if not exists public.community_post_permissions (
  community_id uuid not null references public.communities(id) on delete cascade,
  post_type text not null check (post_type in ('debate','help','fanart','poll','story','recommendation','event')),
  min_role text not null default 'member' check (min_role in ('owner','admin','mod','helper','member')),
  primary key (community_id, post_type)
);
```

Comportamiento: si no hay fila para `(community_id, post_type)`, se asume `min_role='member'`. La RPC `create_signal` consulta esta tabla y rechaza si el rol del caller esta por debajo. Para V1, dejar la tabla creada pero sin UI de configuracion (los mods la editan directo o queda para V2).

---

## 7. Cliente: servicios, hooks y reglas

### 7.1 Servicio (`src/features/posts/services/posts-service.ts`)

Estado actual: existe pero solo cubre `createPost`, `getPost`, `toggleReaction`, `toggleSavedPost`. Hay que extender. Patron identico a chats: `env.demoMode` con rama demo o `ensureNotDemo()`.

**Lectura**
- `getPost(postId, userId)` — existente. Adaptar para incluir poll/event/help embebido segun type.
- `listSignals({ communityId?, type?, cursor?, limit })` — nuevo. Cursor-based con `(created_at, id)` para estabilidad.
- `listFeed({ mode, userId, cursor, limit })` — usa `feed-service.ts` (ya existe esqueleto).
- `listComments(postId, sort: 'top' | 'new')` — top: order by ecos_count desc, new: order by created_at desc.
- `listMentionsForUser(userId)` — para badge de notificaciones.

**Lifecycle**
- `createSignal(input)` — pasa por RPC `create_signal`.
- `updateSignal(postId, patch)` — RPC `update_signal`.
- `deleteSignal(postId)` — RPC `delete_signal`.
- `pinSignal(postId)`, `unpinSignal(postId)` — RPCs.

**Polls**
- `votePoll(postId, optionIds)` — RPC `vote_poll`.
- `listPollResults(postId, userId)` — calcula counts y `user_voted_for: option_id[]`.

**Events**
- `rsvpEvent(postId, status)` — RPC `rsvp_event`.
- `listRsvps(postId)` — read RLS suficiente.

**Help**
- `acceptHelpAnswer(postId, commentId)` — RPC.
- `closeHelp(postId)` — RPC.

**Comments**
- `createComment(postId, body, parentId?)` — RPC `create_comment`.
- `updateComment(commentId, body)` — RPC.
- `deleteComment(commentId)` — RPC.
- `pinComment(postId, commentId)` / `unpinComment(postId)` — RPC.
- `reactToComment(commentId, reaction)` / `unreactToComment(commentId, reaction)` — INSERT/DELETE directo bajo RLS.

**Drafts**
- `listDrafts(userId)`, `getDraft(id)`, `saveDraft(input)`, `deleteDraft(id)` — CRUD directo bajo RLS.

**Reactions de Senal** (existentes pero a revisar)
- `toggleReaction({post, userId, reaction})` — mantener.

### 7.2 Hooks (`src/features/posts/hooks/usePosts.ts`)

Query keys oficiales V1:

```
["post", postId]
["signals", communityId, type, sort]
["feed", mode, userId]
["comments", postId, sort]
["poll-results", postId]
["event-rsvps", postId]
["help-thread", postId]
["drafts", userId]
["mentions", userId]
["pinned-signals", communityId]
```

Reglas:
- Toda mutation invalida sus keys relacionadas + posibles cross-keys (un pin invalida `["signals", communityId, ...]` y `["pinned-signals", communityId]`).
- Optimistic updates **OK** en: `toggleReaction`, `reactToComment`, `voteP oll` (asumiendo poll abierta y sin cap), `rsvpEvent`.
- Optimistic **NO** en: `createSignal`, `updateSignal` (server tiene validacion compleja, mejor esperar respuesta).

### 7.3 Modo demo

Mantener paridad de tipos. Implementar en memoria:
- `polls`, `pollOptions`, `pollVotes` (objetos en memoria).
- `events`, `eventRsvps`.
- `helpThreads`.
- `drafts`.
- `postPins`, `commentPins`.
- `commentReactions`.
- `mentions`.

Las RPCs en demo no validan permisos (es demo), solo simulan el side-effect en memoria. Mantener mensajes de error coherentes para flows donde se testee error path.

---

## 8. Feed y discovery

### 8.1 Modo `community` (feed de una Orbita)

Cursor pagination:

```sql
-- pseudo
select * from posts
where community_id = $1
  and ($type is null or type = $type)
  and status = 'published'
  and ($cursor_created_at is null or (created_at, id) < ($cursor_created_at, $cursor_id))
order by created_at desc, id desc
limit $limit;
```

Indice ya existe: `idx_posts_community_created`. Anadir indice multi-columna si el filtro por type es comun: `idx_posts_community_type_created (community_id, type, created_at desc)`.

### 8.2 Modo `trending`

Algoritmo simple V1 (similar a Hacker News / Reddit "hot"):

```
score(post) = (eco_count + 2*comment_count) / pow(hours_since_post + 2, 1.5)
```

Implementacion:
- Vista materializada `post_trending` refrescada cada 5 minutos (cron job de Supabase o Edge Function).
- Columnas: `post_id, community_id, score, computed_at`.
- Query: `select * from post_trending order by score desc limit X`.

Alternativa lite: calcular on-the-fly con `select ... where created_at > now() - interval '48 hours' order by score desc`. Funciona hasta cierto volumen.

### 8.3 Modo `for-you`

V1: union de Senales de comunidades a las que el user pertenece, ordenadas por `trending_score` dentro de cada comunidad, mezclado con peso por intereses.

```sql
-- pseudo
with my_communities as (
  select community_id from community_members where user_id = $1
),
my_interests as (
  select interest_id from user_interests where user_id = $1
)
-- Senales de mis comunidades, peso extra si la Orbita tiene category coincidente con mis intereses.
```

Implementar como RPC `list_for_you_feed(input_user_id uuid, input_cursor jsonb, input_limit int)`. Devuelve cursor opaco en cada llamada.

### 8.4 Modo `following`

```sql
select p.* from posts p
join follows f on f.following_id = p.author_id
where f.follower_id = $1 and p.status = 'published'
order by created_at desc;
```

---

## 9. Notificaciones (V1: 3 minimas)

Tabla existente: `notifications(id, user_id, type, payload, read_at, created_at)`. Tipos a anadir:

| Tipo | Cuando | Payload |
|---|---|---|
| `signal_comment` | comentario nuevo en mi Senal | `{post_id, comment_id, author_id}` |
| `signal_eco` | nuevo Eco en mi Senal | `{post_id, user_id, reaction}` |
| `mention` | me mencionan en body de Senal o comentario | `{post_id?, comment_id?, mentioned_by}` |

Insercion centralizada en RPCs (`create_comment`, `toggle_eco` si se decide, `process_mentions`). El cliente solo lee y marca como leida.

Para V1 evitar agrupacion (`fulanito y otros 3 reaccionaron`): cada evento → una fila. Agrupacion en V2.

---

## 10. Estado de migraciones

```
001  init_schema                         aplicada (incluye posts, post_reactions, comments, saved_posts base)
003  community_product                   aplicada
005  auto_create_profile                 PENDIENTE
006  chats_v2                            PENDIENTE
007  chats_v2_policies                   PENDIENTE
008  create_chat_rpc                     PENDIENTE
009-013 chats backlog (ver CHATS_ARCHITECTURE.md)
```

**Reservado para Senales V1 (a crear)**: 014 en adelante.

| Mig | Contenido |
|---|---|
| `014_signals_lifecycle.sql` | `edited_at`, `post_drafts`, `post_pins` + trigger limit |
| `015_signals_polls.sql` | `post_polls`, `post_poll_options`, `post_poll_votes` + trigger single-choice + closes |
| `016_signals_events.sql` | `post_events`, `post_event_rsvps` + trigger capacity |
| `017_signals_help.sql` | `post_help_threads` |
| `018_comments_v2.sql` | `comment_reactions`, `comment_pins` |
| `019_signals_mentions.sql` | `post_mentions` |
| `020_signals_permissions.sql` | `community_post_permissions` |
| `021_signals_rpcs.sql` | RPCs `create_signal`, `update_signal`, `delete_signal`, `pin_signal`, `unpin_signal`, `vote_poll`, `rsvp_event`, `accept_help_answer`, `close_help`, `process_mentions`, `check_signal_rate_limit`, `create_comment`, `update_comment`, `delete_comment`, `pin_comment`, `unpin_comment` |
| `022_signals_feed.sql` | Vista materializada `post_trending` + RPC `list_for_you_feed` + cron refresh |
| `023_signals_policies.sql` | RLS explicito para todas las tablas nuevas |
| `024_community_audit_log.sql` | Tabla `community_audit_log` + RLS + helper inserts (espejo de chats) |

Orden de aplicacion: 014 → 024 estricto.

---

## 11. Lo que falta (backlog priorizado)

### P0 — Bloqueantes V1

#### 11.1 Soft delete real y mostrar "Senal eliminada"

- Hoy: el cliente borra fila. No hay senal de tombstone para el lector.
- Esperado: `delete_signal` deja `status='deleted'`, body=null. El feed filtra estos por defecto pero el detalle de un comentario puede mostrar "Senal eliminada por el autor".
- Aceptacion: tras borrar, la fila persiste con `status='deleted'`, los comentarios quedan accesibles, el preview muestra placeholder.

#### 11.2 Banned a nivel de Orbita

- Hoy: `community_members.role` no tiene `banned`. Solo `owner|admin|mod|helper|member`.
- Esperado: anadir `banned` al check constraint. Helper `is_member_in_good_standing` filtra `role <> 'banned'`. Policies y RPCs de Senal usan ese helper en vez de `is_community_member` plano.
- Aceptacion: un usuario baneado de una Orbita ve las Senales (si es publica) pero no puede crear ni reaccionar ni comentar.

Migracion sugerida: incluir en `024_community_audit_log.sql` o crear `025_community_banned_role.sql`.

#### 11.3 Conectar `create_signal` desde cliente

- Hoy: `createPost` en `posts-service.ts` hace INSERT directo. No es robusto para validacion compleja (poll, event, help, mentions, rate limit).
- Esperado: refactor a llamar RPC. Mantener firma del hook estable.
- Aceptacion: las llamadas a `useCreatePostMutation` siguen funcionando; bajo el capot van por RPC.

#### 11.4 Mapper de `PostWithMeta` con poll/event/help embebidos

- Hoy: `post-mapper.ts` solo trae reactions y saved. No carga datos hijos.
- Esperado: si `post.type === 'poll'`, hacer join o segunda query para incluir options + user_voted_for. Idem event y help.
- Aceptacion: detalle de Senal renderiza correctamente todos los tipos.

### P1 — Datos y operaciones

#### 11.5 Endpoints de feed con cursor real

- Hoy: `feed-service.ts` y `useFeed.ts` son esqueletos.
- Esperado: implementar `list_community_feed`, `list_trending_feed`, `list_for_you_feed`, `list_following_feed` con cursor base64-encoded `{created_at, id}`.
- Aceptacion: `useFeed(mode)` permite scroll infinito sin duplicados ni gaps.

#### 11.6 Trending real

- Migrar a vista materializada + cron de refresh cada 5 minutos.
- Si no se quiere cron desde el principio: usar `list_trending_feed` on-the-fly con la formula del §8.2 limitada a 48h.
- Aceptacion: el modo trending de feed devuelve resultados ordenados por engagement reciente, no por created_at.

#### 11.7 Comentarios v2 completos

- Ecos en comentarios (`comment_reactions`).
- Ordenacion top/new.
- Pin de comentario por autor del post o mod.
- Mentions parseadas server-side.
- Aceptacion: PostDetailScreen muestra ordenacion configurable, comentarios pineados arriba, ecos en cada comentario, menciones notificadas.

#### 11.8 Pin de Senal por Orbita

- Tabla `post_pins` con limite 3 (trigger).
- RPC `pin_signal` / `unpin_signal` solo para mods.
- En el feed por comunidad: pinned aparecen al top antes del orden normal.
- Aceptacion: en CommunityDetailScreen los mods pueden pinear hasta 3 Senales y aparecen destacadas.

#### 11.9 Drafts

- CRUD client-side bajo RLS de autor.
- Auto-save cada N segundos en el wizard de crear Senal.
- Lista de drafts en perfil propio o en el wizard.
- Aceptacion: cerrar el wizard a mitad de redactar conserva el draft.

#### 11.10 Edit con historial visible

- `edited_at` en `posts` y `comments`.
- Mostrar "editado hace X" en UI cuando `edited_at IS NOT NULL`.
- **No historial completo en V1** (no guardamos versiones). Si se quiere V2, crear `post_revisions(post_id, body, edited_by, edited_at)`.
- Aceptacion: editar Senal o comentario activa la marca visible.

### P2 — Features de tipo

#### 11.11 Polls funcionando E2E

- Tablas + trigger + RPC `vote_poll`.
- Cliente: crear desde wizard, votar, ver resultados segun `show_results`.
- Aceptacion: crear poll de 4 opciones, votar, ver counts respetando la configuracion de visibilidad.

#### 11.12 Events funcionando E2E

- Tablas + RPC `rsvp_event`.
- Recordatorio push N horas antes (V2 opcionalmente). Para V1 basta con render del evento y RSVP.
- Aceptacion: crear evento con fecha futura, hacer RSVP yes/no/maybe, capacidad enforce server-side.

#### 11.13 Help threads E2E

- Tabla + RPCs `accept_help_answer` y `close_help`.
- UI marca respuesta aceptada (no diseno aqui, solo el flag).
- Aceptacion: autor del help acepta un comentario, `state='answered'`, comentario marcado, notificacion al autor del comentario.

### P3 — Permisos y moderacion

#### 11.14 `community_post_permissions`

- Tabla creada. Sin UI de configuracion en V1.
- `create_signal` la consulta para validar `min_role`.
- Aceptacion: si un mod inserta una fila `(orbita-X, event, mod)`, un miembro normal no puede crear Senales tipo event en esa Orbita.

#### 11.15 Audit log de comunidad

- Tabla `community_audit_log` espejo de `chat_audit_log` con acciones:
  - `signal_pinned`, `signal_unpinned`, `signal_deleted_by_mod`, `signal_hidden`, `signal_restored`
  - `comment_pinned`, `comment_unpinned`, `comment_deleted_by_mod`, `comment_hidden`
  - `member_banned`, `member_unbanned`, `member_role_changed`
  - `permissions_changed`
- Read: solo mods. Insert: solo via RPCs SECURITY DEFINER.
- Aceptacion: cualquier accion de moderacion deja rastro auditable.

### P4 — Notificaciones y mentions

#### 11.16 Notificaciones de Senal (3 tipos V1)

- `signal_comment`, `signal_eco`, `mention`.
- Insercion centralizada en RPCs.
- UI ya tiene `notifications` table; falta tipar y renderizar.
- Aceptacion: las 3 notificaciones aparecen en el feed de notificaciones del usuario destinatario.

#### 11.17 Procesado de mentions

- Regex `@[a-z0-9_]+`.
- Filtra a miembros de la Orbita.
- Inserta `post_mentions` + emite notificacion.
- Aceptacion: escribir `@usuario` en body de Senal o comentario notifica al usuario y crea fila en `post_mentions`.

### P5 — Tests y observabilidad

- Tests de RLS para Senales (analogos a los de chats).
- Tests de RPC: rate limit, capacity, poll single-choice, accept_help_answer.
- Rate limiting en Edge Function (defer V2 si la RPC es suficiente).

---

## 12. Decisiones cerradas (no volver a abrir)

- **Schema mantiene `posts`** y `post_reactions`. El cambio Senal/Eco es solo de copy y producto.
- **Tipos estructurados solo poll/event/help**. Debate, fanart, story, recommendation son tag visual.
- **Privacidad heredada de Orbita**. No hay posts privados intra-Orbita en V1.
- **Sin tags/hashtags en V1**. Todo el contenido vive dentro de su Orbita.
- **Sin reputacion/gamificacion en V1**.
- **Sin video, gif animado o scheduled posts en V1**. Solo imagenes (jpeg/png/webp), bucket `post-media` ya creado con 10 MB max.
- **Comentarios a 1 nivel** (parent_id existente). Sin Reddit-style infinito.
- **Soft delete por defecto**. Hard delete reservado para owner de la Orbita en casos extremos.
- **`Eco` es una unica interaccion** (boton que se alterna). El cliente escribe solo `inspire` y la migracion `009` estrecho el CHECK de `post_reactions` a `reaction = 'inspire'` (los tipos `relate/curious/support` se eliminaron del schema). _(Decision revisada en el rediseno de Senales, 2026-06; antes eran 4 reacciones tipadas.)_
- **Rate limit inicial: 5/hora globales, 15/24h por Orbita** para Senales; **30/hora para comentarios**. Ajustable via constantes en la RPC, no exposed en UI.

---

## 13. Reglas de oro para la IA que continue

1. **Schema mantiene `posts`. El nombre "Senal" vive en copy, docs y UI.** No renombrar tablas ni columnas para alinear con producto; aumentaria churn sin valor.
2. **Las RPCs son la unica via para acciones complejas** (create, update, delete, pin, vote, rsvp, accept). Lo trivial (toggle eco, toggle saved, RSVP self-only) puede ir por insert/update directo bajo RLS.
3. **Auditar en `community_audit_log` toda accion de moderacion**. Si no encaja en el enum, ampliar el enum en una migracion nueva — no usar `metadata` como volcadero generico.
4. **No relajar RLS** para "que funcione". Si una operacion no pasa, ajustar la RPC o la operacion cliente, no la policy.
5. **No crear migraciones renombrando archivos previos**. Cada cambio = migracion nueva. Las 014+ son tuyas.
6. **Mentions y rate limit SIEMPRE server-side**. Cliente puede asistir con autocomplete y countdown, pero la barrera real es la RPC.
7. **`Eco` es una sola interaccion** (`inspire`). PK composite `(post_id, user_id, reaction)` intacta; desde la migracion `009` el CHECK solo admite `inspire`. Reintroducir Ecos tipados (o un 5o tipo) es una decision de producto con migracion nueva que reabra el CHECK y justificacion explicita.
8. **No tocar UI** salvo para mover logica al hook/servicio. TODO claro al diseno cuando aparezca friccion.
9. **Mantener paridad tipos / SQL / demo** en la misma sesion.
10. **Validar con `npm run typecheck` y `npm test` antes de cerrar**. Si tocas SQL, prueba la migracion en una base limpia.

---

## 14. Mapa rapido de archivos

```
supabase/migrations/001_init_schema.sql                base posts, post_reactions, comments, saved_posts
supabase/migrations/014_signals_lifecycle.sql          PENDIENTE
supabase/migrations/015_signals_polls.sql              PENDIENTE
supabase/migrations/016_signals_events.sql             PENDIENTE
supabase/migrations/017_signals_help.sql               PENDIENTE
supabase/migrations/018_comments_v2.sql                PENDIENTE
supabase/migrations/019_signals_mentions.sql           PENDIENTE
supabase/migrations/020_signals_permissions.sql        PENDIENTE
supabase/migrations/021_signals_rpcs.sql               PENDIENTE
supabase/migrations/022_signals_feed.sql               PENDIENTE
supabase/migrations/023_signals_policies.sql           PENDIENTE
supabase/migrations/024_community_audit_log.sql        PENDIENTE

src/types/domain.ts                                    tipos autoritativos
src/features/posts/services/posts-service.ts           a extender
src/features/posts/services/post-mapper.ts             a extender (poll/event/help)
src/features/posts/hooks/usePosts.ts                   a extender
src/features/comments/services/comments-service.ts     a extender
src/features/comments/hooks/useComments.ts             a extender
src/features/feed/services/feed-service.ts             a implementar de verdad
src/features/feed/hooks/useFeed.ts                     a implementar de verdad
src/services/demo-service.ts                           anadir paridad de demo
src/utils/sanitize.ts                                  sanitizePlainText (reusable)
src/utils/validation.ts                                anadir schemas Zod por tipo
```

UI (no tocar logica desde aqui):

```
src/features/posts/screens/CreatePostScreen.tsx
src/features/posts/screens/PostDetailScreen.tsx
src/features/feed/screens/HomeFeedScreen.tsx
```

---

## 15. Checklist de "primer commit" para la siguiente IA

Si te encargan empezar, este es un orden razonable:

1. Aplicar las migraciones de chats pendientes (005, 006, 007, 008) — bloqueo previo.
2. Escribir migracion **014_signals_lifecycle.sql** (`edited_at`, `post_drafts`, `post_pins` + trigger limit).
3. Escribir **015_signals_polls.sql**.
4. Escribir **016_signals_events.sql**.
5. Escribir **017_signals_help.sql**.
6. Escribir **018_comments_v2.sql**.
7. Escribir **019_signals_mentions.sql** + **020_signals_permissions.sql**.
8. Escribir **021_signals_rpcs.sql** con todas las RPCs (la mas grande, separar bloques con comentarios claros).
9. Escribir **022_signals_feed.sql** con vista materializada `post_trending` y RPC `list_for_you_feed`.
10. Escribir **023_signals_policies.sql** RLS explicito.
11. Escribir **024_community_audit_log.sql** con la tabla y los inserts desde las RPCs anteriores (puede requerir re-ejecutar 021 con CREATE OR REPLACE para anadir audit calls).
12. Refactor `posts-service.ts` para usar RPCs.
13. Extender `post-mapper.ts` para poll/event/help.
14. Implementar `feed-service.ts` de verdad con cursor.
15. Extender `useFeed`, `usePosts`, `useComments` hooks.
16. Anadir paridad demo en `demo-service.ts`.
17. Validar `npm run typecheck`, `npm test`, y E2E con 2 usuarios reales en una Orbita: crear poll, votar, crear event, RSVP, crear help, aceptar respuesta, mencionar, pinear, editar, borrar, rate limit.

Cuando termines, actualiza este doc moviendo items de §11 a "implementado", refleja en `FEATURES.md` y `ROADMAP.md`.
