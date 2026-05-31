import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import type {
  ChatRole,
  Comment,
  CommentWithAuthor,
  Community,
  CommunityMember,
  CommunityWithMeta,
  Conversation,
  ConversationPreview,
  Interest,
  Message,
  Post,
  PostWithMeta,
  Profile,
  ReactionType,
  Report,
  ReportStatus,
  ReportTargetType,
} from "../types/domain";
import type { ReportReason } from "../constants/moderation";
import type { FeedMode } from "../features/feed/services/feed-service";
import type {
  AuthLoginInput,
  AuthRegisterInput,
  CommentInput,
  CreateCommunityInput,
  MessageInput,
  OnboardingInput,
  PostFormInput,
  ProfileInput,
  ResetPasswordInput,
} from "../utils/validation";
import { sanitizePlainText } from "../utils/sanitize";
import { createEmptyReactionCounts } from "../features/posts/services/post-mapper";

const DEMO_SESSION_KEY = "nexo.demo.session";
const DEMO_PASSWORD = "Password123!";

type DemoAuthListener = (session: Session | null) => void;
type MessageListener = (message: Message) => void;

const authListeners = new Set<DemoAuthListener>();
const messageListeners = new Map<string, Set<MessageListener>>();

const now = () => new Date().toISOString();
const uuid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`;

function createDemoCommunityAvatar({
  initials,
  primary,
  secondary,
  accent,
  motif,
}: {
  initials: string;
  primary: string;
  secondary: string;
  accent: string;
  motif: "brush" | "gamepad" | "book";
}) {
  const motifSvg =
    motif === "brush"
      ? `<path d="M150 235c44-42 64-89 90-133 7-12 25-5 22 9-12 58-34 104-80 144-23 20-54 17-72-6 15 0 29-4 40-14Z" fill="${accent}" opacity=".82"/><path d="M112 289c25-10 41-22 52-41 10 17 25 28 44 33-24 20-55 29-96 8Z" fill="#F4F7FB" opacity=".82"/>`
      : motif === "gamepad"
        ? `<path d="M89 178c9-40 30-57 66-47l35 10c11 3 22 3 33 0l35-10c36-10 57 7 66 47l12 54c9 41-25 69-58 43l-25-20c-8-6-17-10-27-10h-64c-10 0-19 4-27 10l-25 20c-33 26-67-2-58-43l12-54Z" fill="#F4F7FB" opacity=".86"/><path d="M130 194h50M155 169v50" stroke="${primary}" stroke-width="14" stroke-linecap="round"/><circle cx="263" cy="183" r="13" fill="${accent}"/><circle cx="296" cy="211" r="13" fill="${secondary}"/>`
        : `<path d="M94 122c55-18 89-8 117 26 28-34 62-44 117-26v166c-50-17-86-9-117 23-31-32-67-40-117-23V122Z" fill="#F4F7FB" opacity=".86"/><path d="M211 148v163M126 158c34-7 58-1 76 19M252 177c18-20 42-26 76-19" stroke="${primary}" stroke-width="10" stroke-linecap="round" opacity=".8"/>`;

  const svg = `<svg width="384" height="384" viewBox="0 0 384 384" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="384" height="384" rx="96" fill="#090A12"/><circle cx="192" cy="192" r="156" fill="url(#g)"/><circle cx="264" cy="142" r="104" fill="#090A12" opacity=".18"/><path d="M48 213c48-42 98-64 151-66 53-2 99 15 137 50" stroke="#F4F7FB" stroke-width="9" stroke-linecap="round" opacity=".22"/><path d="M58 254c42 36 91 54 146 51 55-3 98-25 128-66" stroke="#F4F7FB" stroke-width="9" stroke-linecap="round" opacity=".16"/>${motifSvg}<circle cx="296" cy="84" r="17" fill="${accent}"/><circle cx="78" cy="270" r="12" fill="${secondary}"/><text x="192" y="232" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900">${initials}</text><defs><linearGradient id="g" x1="48" y1="48" x2="336" y2="336" gradientUnits="userSpaceOnUse"><stop stop-color="${primary}"/><stop offset=".54" stop-color="${secondary}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const demoCommunityAvatars = {
  atelierNebula: createDemoCommunityAvatar({
    initials: "AN",
    primary: "#7C5CFF",
    secondary: "#00D4FF",
    accent: "#FF4FD8",
    motif: "brush",
  }),
  checkpointCafe: createDemoCommunityAvatar({
    initials: "CC",
    primary: "#00D4FF",
    secondary: "#37E29F",
    accent: "#FFB020",
    motif: "gamepad",
  }),
  clubOrbita: createDemoCommunityAvatar({
    initials: "CO",
    primary: "#FF4FD8",
    secondary: "#7C5CFF",
    accent: "#00D4FF",
    motif: "book",
  }),
};

const demoUsers: Array<{ email: string; id: string }> = [
  { email: "luna@nexo.local", id: "11111111-1111-4111-8111-111111111111" },
  { email: "kai@nexo.local", id: "22222222-2222-4222-8222-222222222222" },
  { email: "iris@nexo.local", id: "33333333-3333-4333-8333-333333333333" },
];

const profiles: Profile[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    username: "luna_vega",
    display_name: "Luna Vega",
    bio: "Mod de arte, fanart y retos semanales.",
    avatar_url: null,
    banner_url: null,
    created_at: now(),
    updated_at: now(),
    is_banned: false,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    username: "kai_nova",
    display_name: "Kai Nova",
    bio: "Pregunto demasiado y guardo buenas recomendaciones.",
    avatar_url: null,
    banner_url: null,
    created_at: now(),
    updated_at: now(),
    is_banned: false,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    username: "iris_sol",
    display_name: "Iris Sol",
    bio: "Comunidades sanas, debates claros y musica rara.",
    avatar_url: null,
    banner_url: null,
    created_at: now(),
    updated_at: now(),
    is_banned: false,
  },
];

const interests: Interest[] = [
  {
    id: "aaaaaaaa-0000-4000-8000-000000000001",
    name: "Arte",
    slug: "arte",
    icon: "art",
  },
  {
    id: "aaaaaaaa-0000-4000-8000-000000000002",
    name: "Gaming",
    slug: "gaming",
    icon: "game",
  },
  {
    id: "aaaaaaaa-0000-4000-8000-000000000003",
    name: "Lectura",
    slug: "lectura",
    icon: "book",
  },
  {
    id: "aaaaaaaa-0000-4000-8000-000000000004",
    name: "Musica",
    slug: "musica",
    icon: "music",
  },
  {
    id: "aaaaaaaa-0000-4000-8000-000000000005",
    name: "Tecnologia",
    slug: "tecnologia",
    icon: "code",
  },
  {
    id: "aaaaaaaa-0000-4000-8000-000000000006",
    name: "Cine",
    slug: "cine",
    icon: "film",
  },
];

const userInterests = new Map<string, string[]>([
  [
    "11111111-1111-4111-8111-111111111111",
    [
      "aaaaaaaa-0000-4000-8000-000000000001",
      "aaaaaaaa-0000-4000-8000-000000000004",
    ],
  ],
  [
    "22222222-2222-4222-8222-222222222222",
    [
      "aaaaaaaa-0000-4000-8000-000000000002",
      "aaaaaaaa-0000-4000-8000-000000000005",
    ],
  ],
  [
    "33333333-3333-4333-8333-333333333333",
    ["aaaaaaaa-0000-4000-8000-000000000003"],
  ],
]);

const communities: Community[] = [
  {
    id: "bbbbbbbb-0000-4000-8000-000000000001",
    slug: "atelier-nebula",
    name: "Atelier Nebula",
    description:
      "Comunidad para fanarts, procesos creativos y retos semanales con feedback cuidado.",
    avatar_url: demoCommunityAvatars.atelierNebula,
    banner_url: null,
    owner_id: "11111111-1111-4111-8111-111111111111",
    visibility: "public",
    category: "Arte",
    rules: [
      "Acredita referencias",
      "Critica con respeto",
      "No publiques arte de terceros como propio",
    ],
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "bbbbbbbb-0000-4000-8000-000000000002",
    slug: "checkpoint-cafe",
    name: "Checkpoint Cafe",
    description:
      "Gaming tranquilo para recomendaciones, quedadas y ayuda sin spoilers.",
    avatar_url: demoCommunityAvatars.checkpointCafe,
    banner_url: null,
    owner_id: "22222222-2222-4222-8222-222222222222",
    visibility: "public",
    category: "Gaming",
    rules: ["Marca spoilers", "No flame wars", "Comparte guias con contexto"],
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "bbbbbbbb-0000-4000-8000-000000000003",
    slug: "club-orbita",
    name: "Club Orbita",
    description:
      "Lecturas, teorias y debates sobre mundos imaginarios sin prisas.",
    avatar_url: demoCommunityAvatars.clubOrbita,
    banner_url: null,
    owner_id: "33333333-3333-4333-8333-333333333333",
    visibility: "unlisted",
    category: "Lectura",
    rules: [
      "Debate ideas, no personas",
      "Usa avisos de contenido",
      "Respeta ritmos de lectura",
    ],
    created_at: now(),
    updated_at: now(),
  },
];

const members: CommunityMember[] = [
  {
    community_id: communities[0]!.id,
    user_id: profiles[0]!.id,
    role: "owner",
    joined_at: now(),
  },
  {
    community_id: communities[0]!.id,
    user_id: profiles[1]!.id,
    role: "member",
    joined_at: now(),
  },
  {
    community_id: communities[0]!.id,
    user_id: profiles[2]!.id,
    role: "mod",
    joined_at: now(),
  },
  {
    community_id: communities[1]!.id,
    user_id: profiles[1]!.id,
    role: "owner",
    joined_at: now(),
  },
  {
    community_id: communities[1]!.id,
    user_id: profiles[0]!.id,
    role: "helper",
    joined_at: now(),
  },
  {
    community_id: communities[2]!.id,
    user_id: profiles[2]!.id,
    role: "owner",
    joined_at: now(),
  },
  {
    community_id: communities[2]!.id,
    user_id: profiles[0]!.id,
    role: "member",
    joined_at: now(),
  },
];

const posts: Post[] = [
  {
    id: "cccccccc-0000-4000-8000-000000000001",
    community_id: communities[0]!.id,
    author_id: profiles[0]!.id,
    type: "event",
    title: "Mision semanal: paleta imposible",
    body: "Crea una pieza usando solo violeta, cian y verde. Sube proceso y una nota de aprendizaje.",
    media_urls: [],
    status: "published",
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "cccccccc-0000-4000-8000-000000000002",
    community_id: communities[1]!.id,
    author_id: profiles[1]!.id,
    type: "recommendation",
    title: "Juego cooperativo corto para este finde",
    body: "Busco algo de 2 a 4 horas, con buena conversacion y poca friccion para gente nueva.",
    media_urls: [],
    status: "published",
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "cccccccc-0000-4000-8000-000000000003",
    community_id: communities[2]!.id,
    author_id: profiles[2]!.id,
    type: "debate",
    title: "Finales abiertos: genialidad o salida facil?",
    body: "Me gustan cuando cambian la lectura completa de la historia, pero no cuando parecen evadir cierre.",
    media_urls: [],
    status: "published",
    created_at: now(),
    updated_at: now(),
  },
];

const reactions: Array<{
  post_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
}> = [
  {
    post_id: posts[0]!.id,
    user_id: profiles[1]!.id,
    reaction: "inspire",
    created_at: now(),
  },
  {
    post_id: posts[0]!.id,
    user_id: profiles[2]!.id,
    reaction: "support",
    created_at: now(),
  },
  {
    post_id: posts[1]!.id,
    user_id: profiles[0]!.id,
    reaction: "curious",
    created_at: now(),
  },
  {
    post_id: posts[2]!.id,
    user_id: profiles[0]!.id,
    reaction: "relate",
    created_at: now(),
  },
];

const comments: Comment[] = [
  {
    id: "dddddddd-0000-4000-8000-000000000001",
    post_id: posts[0]!.id,
    author_id: profiles[1]!.id,
    parent_id: null,
    body: "Me apunto. Voy a probar con siluetas grandes primero.",
    status: "published",
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "dddddddd-0000-4000-8000-000000000002",
    post_id: posts[1]!.id,
    author_id: profiles[0]!.id,
    parent_id: null,
    body: "Si quereis algo amable, probad una aventura cooperativa de puzzles cortos.",
    status: "published",
    created_at: now(),
    updated_at: now(),
  },
];

const savedPosts = new Set<string>([`${profiles[0]!.id}:${posts[1]!.id}`]);
const follows = new Set<string>([`${profiles[0]!.id}:${profiles[1]!.id}`]);
const blocks = new Set<string>();

function buildDemoConversation(
  overrides: Partial<Conversation> & Pick<Conversation, "id" | "type">,
): Conversation {
  return {
    community_id: null,
    name: null,
    description: null,
    avatar_url: null,
    banner_url: null,
    created_by: null,
    visibility: "public",
    slow_mode_seconds: 0,
    is_default: false,
    created_at: now(),
    updated_at: now(),
    ...overrides,
  };
}

const conversations: Conversation[] = [
  buildDemoConversation({
    id: "eeeeeeee-0000-4000-8000-000000000001",
    type: "community",
    community_id: communities[0]!.id,
    name: "Lobby",
    description: "Espacio principal de la Orbita.",
    is_default: true,
    created_by: communities[0]!.owner_id,
  }),
  buildDemoConversation({
    id: "eeeeeeee-0000-4000-8000-000000000002",
    type: "community",
    community_id: communities[1]!.id,
    name: "Lobby",
    description: "Espacio principal de la Orbita.",
    is_default: true,
    created_by: communities[1]!.owner_id,
  }),
];

const conversationMembers: Array<{
  conversation_id: string;
  user_id: string;
  joined_at: string;
  role: ChatRole;
  muted: boolean;
  last_read_at: string | null;
}> = [];

for (const conversation of conversations) {
  const communityOwner = communities.find(
    (entry) => entry.id === conversation.community_id,
  )?.owner_id;

  for (const member of members.filter(
    (item) => item.community_id === conversation.community_id,
  )) {
    conversationMembers.push({
      conversation_id: conversation.id,
      user_id: member.user_id,
      joined_at: now(),
      role: member.user_id === communityOwner ? "admin" : "member",
      muted: false,
      last_read_at: null,
    });
  }
}

const messages: Message[] = [
  {
    id: uuid(),
    conversation_id: conversations[0]!.id,
    sender_id: profiles[0]!.id,
    body: "Bienvenidas a la sala del Atelier. Esta semana abrimos critica suave.",
    media_urls: [],
    status: "sent",
    created_at: now(),
  },
  {
    id: uuid(),
    conversation_id: conversations[0]!.id,
    sender_id: profiles[2]!.id,
    body: "Puedo moderar el hilo de feedback del viernes.",
    media_urls: [],
    status: "sent",
    created_at: now(),
  },
  {
    id: uuid(),
    conversation_id: conversations[1]!.id,
    sender_id: profiles[1]!.id,
    body: "Dejad recomendaciones sin spoilers aqui.",
    media_urls: [],
    status: "sent",
    created_at: now(),
  },
];

const reports: Report[] = [];

function notifyAuth(session: Session | null) {
  for (const listener of authListeners) {
    listener(session);
  }
}

function findProfile(id: string) {
  const profile = profiles.find((item) => item.id === id);
  if (!profile) {
    throw new Error("Perfil demo no encontrado.");
  }
  return profile;
}

function findCommunity(idOrSlug: string) {
  const community = communities.find(
    (item) => item.id === idOrSlug || item.slug === idOrSlug,
  );
  if (!community) {
    throw new Error("Orbita demo no encontrada.");
  }
  return community;
}

function communityMeta(
  community: Community,
  userId?: string | null,
): CommunityWithMeta {
  const membership = userId
    ? members.find(
        (item) => item.community_id === community.id && item.user_id === userId,
      )
    : undefined;
  const communityPosts = posts.filter(
    (item) => item.community_id === community.id && item.status === "published",
  );
  const conversation = conversations.find(
    (item) => item.type === "community" && item.community_id === community.id,
  );
  const hasChatActivity = conversation
    ? messages.some(
        (item) =>
          item.conversation_id === conversation.id && item.status === "sent",
      )
    : false;

  return {
    ...community,
    member_count: members.filter((item) => item.community_id === community.id)
      .length,
    online_count: Math.max(
      1,
      Math.ceil(
        members.filter((item) => item.community_id === community.id).length *
          0.45,
      ),
    ),
    user_role: membership?.role ?? null,
    recent_post_count: communityPosts.length,
    new_posts_count: communityPosts.length,
    active_chat: hasChatActivity,
    event_today: communityPosts.some((item) => item.type === "event"),
    mission_active: communityPosts.some((item) =>
      `${item.title ?? ""} ${item.body ?? ""}`.toLowerCase().includes("mision"),
    ),
  };
}

function postMeta(post: Post, userId?: string | null): PostWithMeta {
  const counts = createEmptyReactionCounts();
  const postReactions = reactions.filter((item) => item.post_id === post.id);

  for (const reaction of postReactions) {
    counts[reaction.reaction] += 1;
  }

  return {
    ...post,
    author: profiles.find((item) => item.id === post.author_id) ?? null,
    community:
      communities.find((item) => item.id === post.community_id) ?? null,
    reaction_counts: counts,
    user_reactions: userId
      ? postReactions
          .filter((item) => item.user_id === userId)
          .map((item) => item.reaction)
      : [],
    is_saved: userId ? savedPosts.has(`${userId}:${post.id}`) : false,
  };
}

function createDemoSession(
  profile: Profile,
  email: string,
  metadata?: { display_name?: string; username?: string },
): Session {
  return {
    access_token: `demo-token-${profile.id}`,
    refresh_token: `demo-refresh-${profile.id}`,
    expires_in: 60 * 60 * 24 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    token_type: "bearer",
    user: {
      id: profile.id,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {
        display_name: metadata?.display_name ?? profile.display_name,
        username: metadata?.username ?? profile.username,
      },
      aud: "authenticated",
      email,
      created_at: profile.created_at,
    },
  } as Session;
}

export function onDemoAuthStateChange(listener: DemoAuthListener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export type DemoAccount = {
  email: string;
  password: string;
  displayName: string;
  username: string;
};

/**
 * Cuentas semilla del modo demo, para ofrecerlas como acceso rapido en el login
 * y que cualquiera pueda entrar sin conocer las credenciales.
 */
export function demoListAccounts(): DemoAccount[] {
  return demoUsers
    .map((user) => {
      const profile = profiles.find((item) => item.id === user.id);

      if (!profile) {
        return null;
      }

      return {
        email: user.email,
        password: DEMO_PASSWORD,
        displayName: profile.display_name ?? profile.username,
        username: profile.username,
      } satisfies DemoAccount;
    })
    .filter((account): account is DemoAccount => account !== null);
}

export async function demoSignInWithEmail(input: AuthLoginInput) {
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();
  const user = demoUsers.find((item) => item.email.toLowerCase() === email);

  if (!user || password !== DEMO_PASSWORD) {
    throw new Error("Credenciales demo invalidas. Usa Password123!.");
  }

  const session = createDemoSession(findProfile(user.id), user.email);
  await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  notifyAuth(session);
  return { session, user: session.user };
}

export async function demoSignUpWithEmail(input: AuthRegisterInput) {
  const id = uuid();
  const email = input.email.toLowerCase();
  const temporaryUsername = `nexo_${id.replaceAll("-", "").slice(0, 10)}`;
  demoUsers.push({ email, id });
  profiles.push({
    id,
    username: temporaryUsername,
    display_name: null,
    bio: null,
    avatar_url: null,
    banner_url: null,
    created_at: now(),
    updated_at: now(),
    is_banned: false,
  });

  const session = createDemoSession(findProfile(id), email, {
    username: temporaryUsername,
  });
  await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  notifyAuth(session);
  return { session, user: session.user };
}

export async function demoResetPassword(_input: ResetPasswordInput) {
  return {};
}

export async function demoSignOut() {
  await AsyncStorage.removeItem(DEMO_SESSION_KEY);
  notifyAuth(null);
}

export async function demoGetCurrentSession() {
  const raw = await AsyncStorage.getItem(DEMO_SESSION_KEY);
  const session = raw ? (JSON.parse(raw) as Session) : null;

  // El dataset demo es in-memory y se resetea en cada reload, pero la sesion se
  // persiste. Si la sesion guardada apunta a una cuenta creada en runtime
  // (registro/onboarding), su perfil ya no existe tras recargar. Lo
  // reconstruimos desde los metadatos de la sesion para que el perfil propio y
  // el saludo no rompan.
  if (session?.user?.id) {
    rehydrateSessionProfile(session);
  }

  return session;
}

function rehydrateSessionProfile(session: Session) {
  const { id, email, user_metadata: metadata, created_at } = session.user;

  if (profiles.some((item) => item.id === id)) {
    return;
  }

  const username =
    (metadata?.username as string | undefined) ??
    `nexo_${id.replaceAll("-", "").slice(0, 10)}`;

  profiles.push({
    id,
    username,
    display_name:
      (metadata?.display_name as string | undefined) ?? username,
    bio: null,
    avatar_url: null,
    banner_url: null,
    created_at: created_at ?? now(),
    updated_at: now(),
    is_banned: false,
  });

  if (email && !demoUsers.some((item) => item.id === id)) {
    demoUsers.push({ email, id });
  }
}

export async function demoGetProfile(userId: string) {
  return profiles.find((item) => item.id === userId) ?? null;
}

export async function demoListInterests() {
  return interests;
}

export async function demoCompleteOnboarding(
  userId: string,
  input: OnboardingInput,
) {
  let profile = profiles.find((item) => item.id === userId);

  if (!profile) {
    profile = {
      id: userId,
      username: input.username,
      display_name: input.displayName,
      bio: input.bio ?? null,
      avatar_url: input.avatarUrl ?? null,
      banner_url: null,
      created_at: now(),
      updated_at: now(),
      is_banned: false,
    };
    profiles.push(profile);
  } else {
    profile.username = input.username;
    profile.display_name = input.displayName;
    profile.bio = input.bio ?? null;
    profile.avatar_url = input.avatarUrl ?? null;
    profile.updated_at = now();
  }

  userInterests.set(userId, input.interestIds);
  return profile;
}

export async function demoListCommunities(params?: {
  query?: string | undefined;
  category?: string | undefined;
}) {
  const term = params?.query?.trim().toLowerCase();
  return communities
    .filter((item) => item.visibility !== "private")
    .filter((item) => !params?.category || item.category === params.category)
    .filter(
      (item) =>
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term),
    )
    .map((item) => communityMeta(item));
}

export async function demoCreateCommunity(
  input: CreateCommunityInput,
  ownerId: string,
) {
  const id = uuid();
  const slugBase = input.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
  const slug = `${slugBase || "orbita"}-${id.slice(0, 6)}`;
  const rules = input.rulesText
    ? input.rulesText
        .split("\n")
        .map((rule) => sanitizePlainText(rule).trim())
        .filter(Boolean)
    : [
        "Respeta a otras personas.",
        "Evita spam.",
        "Reporta contenido de riesgo.",
      ];

  const community: Community = {
    id,
    slug,
    name: sanitizePlainText(input.name),
    description: sanitizePlainText(input.description),
    avatar_url: input.avatarUrl ?? null,
    banner_url: input.bannerUrl ?? null,
    owner_id: ownerId,
    visibility: input.visibility,
    category: sanitizePlainText(input.category),
    rules,
    created_at: now(),
    updated_at: now(),
  };

  communities.unshift(community);
  members.unshift({
    community_id: id,
    user_id: ownerId,
    role: "owner",
    joined_at: now(),
  });

  const conversation: Conversation = buildDemoConversation({
    id: uuid(),
    type: "community",
    community_id: id,
    name: "Lobby",
    description: "Espacio principal de la Orbita.",
    is_default: true,
    created_by: ownerId,
  });
  conversations.unshift(conversation);
  conversationMembers.push({
    conversation_id: conversation.id,
    user_id: ownerId,
    joined_at: now(),
    role: "admin",
    muted: false,
    last_read_at: null,
  });

  return communityMeta(community, ownerId);
}

export async function demoGetCommunity(communityIdOrSlug: string) {
  return communityMeta(findCommunity(communityIdOrSlug));
}

export async function demoGetCommunityMembership(
  communityId: string,
  userId: string,
) {
  return (
    members.find(
      (item) => item.community_id === communityId && item.user_id === userId,
    ) ?? null
  );
}

export async function demoListJoinedCommunities(userId: string) {
  return members
    .filter((item) => item.user_id === userId)
    .map((item) => communityMeta(findCommunity(item.community_id), userId));
}

export async function demoListCommunityMembers(communityId: string) {
  return members
    .filter((item) => item.community_id === communityId)
    .map((item) => ({
      ...item,
      profile: profiles.find((profile) => profile.id === item.user_id) ?? null,
    }));
}

export async function demoJoinCommunity(communityId: string, userId: string) {
  if (!(await demoGetCommunityMembership(communityId, userId))) {
    members.push({
      community_id: communityId,
      user_id: userId,
      role: "member",
      joined_at: now(),
    });
  }
}

export async function demoLeaveCommunity(communityId: string, userId: string) {
  const index = members.findIndex(
    (item) => item.community_id === communityId && item.user_id === userId,
  );
  if (index >= 0) {
    members.splice(index, 1);
  }
}

export async function demoListCommunityPosts({
  communityId,
  userId,
}: {
  communityId: string;
  userId?: string | null | undefined;
}) {
  return posts
    .filter(
      (item) =>
        item.community_id === communityId && item.status === "published",
    )
    .map((item) => postMeta(item, userId));
}

export async function demoListFeed({
  mode,
  userId,
  pageParam = 0,
}: {
  mode: FeedMode;
  userId?: string | null | undefined;
  pageParam?: number;
}) {
  const pageSize = 12;
  let visible = posts.filter((item) => item.status === "published");

  if (mode === "following" && userId) {
    const following = Array.from(follows)
      .filter((item) => item.startsWith(`${userId}:`))
      .map((item) => item.split(":")[1]);
    visible = visible.filter((item) => following.includes(item.author_id));
  }

  let mapped = visible.map((item) => {
    const post = postMeta(item, userId);
    post.recommendation_reason =
      mode === "following"
        ? "Aparece porque sigues a este perfil."
        : mode === "trending"
          ? "Aparece por actividad reciente en Ecos."
          : `Aparece por tu actividad en ${post.community?.category ?? "Nexo"}.`;
    return post;
  });

  if (mode === "trending") {
    mapped = mapped.sort(
      (a, b) =>
        Object.values(b.reaction_counts).reduce(
          (sum, count) => sum + count,
          0,
        ) -
        Object.values(a.reaction_counts).reduce((sum, count) => sum + count, 0),
    );
  }

  const start = pageParam * pageSize;
  const page = mapped.slice(start, start + pageSize);
  return {
    posts: page,
    nextPage: page.length === pageSize ? pageParam + 1 : null,
  };
}

export async function demoCreatePost(input: PostFormInput, authorId: string) {
  const post: Post = {
    id: uuid(),
    community_id: input.communityId,
    author_id: authorId,
    type: input.type,
    title: input.title ? sanitizePlainText(input.title) : null,
    body: sanitizePlainText(input.body),
    media_urls: input.mediaUrls,
    status: "published",
    created_at: now(),
    updated_at: now(),
  };
  posts.unshift(post);
  return post;
}

export async function demoGetPost(postId: string, userId?: string | null) {
  const post = posts.find((item) => item.id === postId);
  if (!post) {
    throw new Error("Publicacion demo no encontrada.");
  }
  return postMeta(post, userId);
}

export async function demoToggleReaction({
  post,
  userId,
  reaction,
}: {
  post: PostWithMeta;
  userId: string;
  reaction: ReactionType;
}) {
  const index = reactions.findIndex(
    (item) =>
      item.post_id === post.id &&
      item.user_id === userId &&
      item.reaction === reaction,
  );
  if (index >= 0) {
    reactions.splice(index, 1);
  } else {
    reactions.push({
      post_id: post.id,
      user_id: userId,
      reaction,
      created_at: now(),
    });
  }
}

export async function demoToggleSavedPost({
  postId,
  userId,
  isSaved,
}: {
  postId: string;
  userId: string;
  isSaved: boolean;
}) {
  const key = `${userId}:${postId}`;
  if (isSaved) {
    savedPosts.delete(key);
  } else {
    savedPosts.add(key);
  }
}

export async function demoListComments(postId: string) {
  const flat = comments
    .filter((item) => item.post_id === postId && item.status === "published")
    .map<CommentWithAuthor>((comment) => ({
      ...comment,
      author: profiles.find((item) => item.id === comment.author_id) ?? null,
      replies: [],
    }));

  const byParent = new Map<string | null, CommentWithAuthor[]>();
  for (const comment of flat) {
    const key = comment.parent_id ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), comment]);
  }

  return (byParent.get(null) ?? []).map((comment) => ({
    ...comment,
    replies: byParent.get(comment.id) ?? [],
  }));
}

export async function demoCreateComment({
  postId,
  authorId,
  input,
}: {
  postId: string;
  authorId: string;
  input: CommentInput;
}) {
  const comment: Comment = {
    id: uuid(),
    post_id: postId,
    author_id: authorId,
    parent_id: input.parentId ?? null,
    body: sanitizePlainText(input.body),
    status: "published",
    created_at: now(),
    updated_at: now(),
  };
  comments.push(comment);
  return comment;
}

export async function demoListConversations(
  userId: string,
): Promise<ConversationPreview[]> {
  return conversationMembers
    .filter((item) => item.user_id === userId)
    .map((item) => {
      const conversation = conversations.find(
        (entry) => entry.id === item.conversation_id,
      )!;
      const community = conversation.community_id
        ? (communities.find(
            (entry) => entry.id === conversation.community_id,
          ) ?? null)
        : null;
      const lastMessage =
        messages
          .filter(
            (entry) =>
              entry.conversation_id === conversation.id &&
              entry.status === "sent",
          )
          .at(-1) ?? null;
      const memberCount = conversationMembers.filter(
        (entry) => entry.conversation_id === conversation.id,
      ).length;
      return {
        ...conversation,
        community,
        last_message: lastMessage,
        unread_count: 0,
        member_count: memberCount,
        role: item.role,
      };
    });
}

export async function demoGetOrCreateCommunityConversation(
  communityId: string,
) {
  let conversation = conversations.find(
    (item) =>
      item.type === "community" &&
      item.community_id === communityId &&
      item.is_default,
  );
  if (!conversation) {
    const owner =
      communities.find((entry) => entry.id === communityId)?.owner_id ?? null;
    conversation = buildDemoConversation({
      id: uuid(),
      type: "community",
      community_id: communityId,
      name: "Lobby",
      description: "Espacio principal de la Orbita.",
      is_default: true,
      created_by: owner,
    });
    conversations.push(conversation);
  }

  const owner = communities.find((entry) => entry.id === communityId)?.owner_id;

  for (const member of members.filter(
    (item) => item.community_id === communityId,
  )) {
    if (
      !conversationMembers.some(
        (item) =>
          item.conversation_id === conversation!.id &&
          item.user_id === member.user_id,
      )
    ) {
      conversationMembers.push({
        conversation_id: conversation.id,
        user_id: member.user_id,
        joined_at: now(),
        role: member.user_id === owner ? "admin" : "member",
        muted: false,
        last_read_at: null,
      });
    }
  }

  return conversation.id;
}

export async function demoGetOrCreateDirectConversation(
  userId: string,
  otherUserId: string,
) {
  const existing = conversations.find((conversation) => {
    if (conversation.type !== "direct") {
      return false;
    }

    const conversationUserIds = conversationMembers
      .filter((item) => item.conversation_id === conversation.id)
      .map((item) => item.user_id);

    return (
      conversationUserIds.includes(userId) &&
      conversationUserIds.includes(otherUserId)
    );
  });

  if (existing) {
    return existing.id;
  }

  const conversation: Conversation = buildDemoConversation({
    id: uuid(),
    type: "direct",
    created_by: userId,
  });
  conversations.unshift(conversation);
  conversationMembers.push(
    {
      conversation_id: conversation.id,
      user_id: userId,
      joined_at: now(),
      role: "member",
      muted: false,
      last_read_at: null,
    },
    {
      conversation_id: conversation.id,
      user_id: otherUserId,
      joined_at: now(),
      role: "member",
      muted: false,
      last_read_at: null,
    },
  );

  return conversation.id;
}

export async function demoListMessages(conversationId: string) {
  return messages
    .filter(
      (item) =>
        item.conversation_id === conversationId && item.status === "sent",
    )
    .map((message) => ({
      ...message,
      sender: profiles.find((item) => item.id === message.sender_id),
    }));
}

export async function demoSendMessage({
  conversationId,
  senderId,
  input,
}: {
  conversationId: string;
  senderId: string;
  input: MessageInput;
}) {
  const message: Message = {
    id: uuid(),
    conversation_id: conversationId,
    sender_id: senderId,
    body: sanitizePlainText(input.body),
    media_urls: [],
    status: "sent",
    created_at: now(),
  };
  messages.push(message);

  for (const listener of messageListeners.get(conversationId) ?? []) {
    listener(message);
  }

  return message;
}

export function demoSubscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void,
) {
  const listeners =
    messageListeners.get(conversationId) ?? new Set<MessageListener>();
  listeners.add(onMessage);
  messageListeners.set(conversationId, listeners);
  return {
    unsubscribe: () => {
      listeners.delete(onMessage);
      return Promise.resolve();
    },
  };
}

export async function demoGetProfileById(profileId: string) {
  return findProfile(profileId);
}

export async function demoListProfilePosts(
  profileId: string,
  viewerId?: string | null,
) {
  return posts
    .filter(
      (item) => item.author_id === profileId && item.status === "published",
    )
    .map((item) => postMeta(item, viewerId));
}

export async function demoListProfilePostsInCommunity({
  profileId,
  communityId,
  viewerId,
}: {
  profileId: string;
  communityId: string;
  viewerId?: string | null | undefined;
}) {
  return posts
    .filter(
      (item) =>
        item.author_id === profileId &&
        item.community_id === communityId &&
        item.status === "published",
    )
    .map((item) => postMeta(item, viewerId));
}

export async function demoUpdateProfile(
  profileId: string,
  input: ProfileInput,
) {
  const profile = findProfile(profileId);
  profile.username = input.username;
  profile.display_name = sanitizePlainText(input.displayName);
  profile.bio = input.bio ? sanitizePlainText(input.bio) : null;
  profile.avatar_url = input.avatarUrl ?? null;
  profile.banner_url = input.bannerUrl ?? null;
  profile.updated_at = now();
  return profile;
}

export async function demoFollowProfile({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  follows.add(`${followerId}:${followingId}`);
}

export async function demoUnfollowProfile({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  follows.delete(`${followerId}:${followingId}`);
}

export async function demoBlockProfile({
  blockerId,
  blockedId,
}: {
  blockerId: string;
  blockedId: string;
}) {
  blocks.add(`${blockerId}:${blockedId}`);
}

export async function demoCreateReport({
  reporterId,
  targetType,
  targetId,
  reason,
  details,
}: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string | undefined;
}) {
  const report: Report = {
    id: uuid(),
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details ? sanitizePlainText(details) : null,
    status: "open",
    created_at: now(),
    resolved_by: null,
    resolved_at: null,
  };
  reports.unshift(report);
  return report;
}

export async function demoListReportsForModerator() {
  return reports;
}

export async function demoUpdateReportStatus({
  reportId,
  status,
  moderatorId,
}: {
  reportId: string;
  status: ReportStatus;
  moderatorId: string;
}) {
  const report = reports.find((item) => item.id === reportId);
  if (!report) {
    throw new Error("Reporte demo no encontrado.");
  }
  report.status = status;
  report.resolved_by = ["resolved", "rejected"].includes(status)
    ? moderatorId
    : null;
  report.resolved_at = ["resolved", "rejected"].includes(status) ? now() : null;
  return report;
}

export async function demoHidePost(postId: string) {
  const post = posts.find((item) => item.id === postId);
  if (post) {
    post.status = "hidden";
  }
}

export async function demoHideComment(commentId: string) {
  const comment = comments.find((item) => item.id === commentId);
  if (comment) {
    comment.status = "hidden";
  }
}

export async function demoHideMessage(messageId: string) {
  const message = messages.find((item) => item.id === messageId);
  if (message) {
    message.status = "hidden";
  }
}

export async function demoWarnUser(
  _userId: string,
  _moderatorId: string,
  _reason: string,
) {
  return {};
}
