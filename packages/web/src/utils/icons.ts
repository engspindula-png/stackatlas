import {
  siSupabase,
  siTurso,
  siAnthropic,
  siStripe,
  siFirebase,
  siMongodb,
  siPostgresql,
  siNextdotjs,
  siReact,
  siTailwindcss,
  siVercel,
  siResend,
  siGooglegemini,
  siOpenrouter,
  siHuggingface,
  siAppwrite,
  siMailgun,
  siCloudflare,
  siRedis,
  siUpstash,
  type SimpleIcon,
} from 'simple-icons';

export interface IconeInfo {
  titulo: string;
  hex: string;
  path: string;
}

const MAPA_ICONES: Record<string, SimpleIcon> = {
  supabase: siSupabase,
  turso: siTurso,
  anthropic: siAnthropic,
  stripe: siStripe,
  firebase: siFirebase,
  mongodb: siMongodb,
  postgres: siPostgresql,
  postgresql: siPostgresql,
  nextjs: siNextdotjs,
  react: siReact,
  tailwind: siTailwindcss,
  vercel: siVercel,
  resend: siResend,
  gemini: siGooglegemini,
  googlegemini: siGooglegemini,
  openrouter: siOpenrouter,
  huggingface: siHuggingface,
  appwrite: siAppwrite,
  mailgun: siMailgun,
  cloudflare: siCloudflare,
  cloudflared1: siCloudflare,
  redis: siRedis,
  upstash: siUpstash,
};

const MAPA_CUSTOM: Record<string, IconeInfo> = {
  openai: {
    titulo: 'OpenAI',
    hex: '#10a37f',
    path: 'M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zM8.307 10.744l2.02-1.164 5.842 3.37-2.02 1.164-5.842-3.37z',
  },
  neon: {
    titulo: 'Neon',
    hex: '#00e599',
    path: 'M12 2L2 19.5h20L12 2zm0 4.5l6.5 11.5h-13L12 6.5z',
  },
  convex: {
    titulo: 'Convex',
    hex: '#ee342f',
    path: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V14h-2v2.93A8 8 0 0 1 4.07 13H7v-2H4.07A8 8 0 0 1 11 4.07V7h2V4.07A8 8 0 0 1 19.93 11H17v2h2.93A8 8 0 0 1 13 16.93z',
  },
  pocketbase: {
    titulo: 'PocketBase',
    hex: '#b8db57',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z',
  },
  sendgrid: {
    titulo: 'SendGrid',
    hex: '#009dd9',
    path: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  },
  amazonses: {
    titulo: 'Amazon SES',
    hex: '#ff9900',
    path: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  },
  postmark: {
    titulo: 'Postmark',
    hex: '#ffde00',
    path: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  },
  modulosinternos: {
    titulo: 'Módulos Internos',
    hex: '#8b5cf6',
    path: 'M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L5.7 7.7 12 11.25l6.3-3.55L12 4.15zM4.5 9.3v6.35l6.75 3.8V13.1L4.5 9.3zm8.25 10.15l6.75-3.8V9.3l-6.75 3.8v6.35z',
  },
};

/**
 * Retorna os metadados do ícone oficial do simple-icons ou um ícone padrão.
 */
export function obterIconeServico(idOuNome?: string | null): IconeInfo {
  if (!idOuNome) {
    return iconePadrao();
  }

  const normalizado = idOuNome.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (MAPA_CUSTOM[normalizado]) {
    return MAPA_CUSTOM[normalizado];
  }

  const icone = MAPA_ICONES[normalizado];
  if (icone) {
    return {
      titulo: icone.title,
      hex: `#${icone.hex}`,
      path: icone.path,
    };
  }

  return iconePadrao(idOuNome);
}

function iconePadrao(nome = 'Serviço'): IconeInfo {
  return {
    titulo: nome,
    hex: '#3b82f6',
    // Ícone genérico de Nuvem/Servidor
    path: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
  };
}
