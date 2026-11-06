import type { EntradaCatalogoInfo } from "../types.js";

export const CATALOGO_FALLBACK: EntradaCatalogoInfo[] = [
  {
    "id": "appwrite",
    "nome": "Appwrite",
    "categoria": "backend",
    "subcategoria": "baas",
    "site": "https://appwrite.io",
    "cadastro": "https://cloud.appwrite.io",
    "icone": "appwrite",
    "sinais": {
      "configuracao": [
        "appwrite.json"
      ],
      "dependencias": [
        "appwrite",
        "node-appwrite"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "APPWRITE_ENDPOINT",
        "APPWRITE_PROJECT_ID",
        "NEXT_PUBLIC_APPWRITE_ENDPOINT",
        "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
        "APPWRITE_API_KEY",
        "APPWRITE_"
      ],
      "hosts": [
        "cloud.appwrite.io",
        "*.appwrite.io"
      ],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://cloud.appwrite.io/v1/health",
        "dominiosPermitidos": [
          "cloud.appwrite.io",
          "appwrite.io"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "supabase",
      "firebase",
      "pocketbase"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://appwrite.io/docs"
    ]
  },
  {
    "id": "convex",
    "nome": "Convex",
    "categoria": "backend",
    "subcategoria": "baas",
    "site": "https://www.convex.dev",
    "cadastro": "https://dashboard.convex.dev",
    "icone": "convex",
    "sinais": {
      "configuracao": [
        "convex.json"
      ],
      "dependencias": [
        "convex"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "CONVEX_DEPLOYMENT",
        "NEXT_PUBLIC_CONVEX_URL",
        "VITE_CONVEX_URL",
        "CONVEX_URL",
        "CONVEX_"
      ],
      "hosts": [
        "*.convex.cloud",
        "*.convex.site"
      ],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://www.convex.dev",
        "dominiosPermitidos": [
          "convex.dev",
          "convex.cloud"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "supabase",
      "firebase"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://docs.convex.dev"
    ]
  },
  {
    "id": "firebase",
    "nome": "Firebase",
    "categoria": "backend",
    "subcategoria": "baas",
    "site": "https://firebase.google.com",
    "cadastro": "https://console.firebase.google.com",
    "icone": "firebase",
    "sinais": {
      "configuracao": [
        "firebase.json",
        "google-services.json"
      ],
      "dependencias": [
        "firebase",
        "firebase-admin"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "FIREBASE_PROJECT_ID",
        "FIREBASE_AUTH_DOMAIN",
        "FIREBASE_STORAGE_BUCKET",
        "FIREBASE_"
      ],
      "hosts": [
        "*.firebaseio.com",
        "*.firebaseapp.com"
      ],
      "chaves": [
        "AIzaSy"
      ]
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://firebase.google.com",
        "dominiosPermitidos": [
          "firebase.google.com",
          "firebaseio.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "supabase",
      "appwrite",
      "convex"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://firebase.google.com/docs"
    ]
  },
  {
    "id": "pocketbase",
    "nome": "PocketBase",
    "categoria": "backend",
    "subcategoria": "baas",
    "site": "https://pocketbase.io",
    "cadastro": "https://pocketbase.io",
    "icone": "pocketbase",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "pocketbase"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "POCKETBASE_URL",
        "NEXT_PUBLIC_POCKETBASE_URL",
        "PB_URL",
        "POCKETBASE_"
      ],
      "hosts": [],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://pocketbase.io",
        "dominiosPermitidos": [
          "pocketbase.io"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "supabase",
      "appwrite",
      "firebase"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://pocketbase.io/docs"
    ]
  },
  {
    "id": "supabase",
    "nome": "Supabase",
    "categoria": "backend",
    "subcategoria": "baas",
    "site": "https://supabase.com",
    "cadastro": "https://supabase.com/dashboard",
    "icone": "supabase",
    "sinais": {
      "configuracao": [
        "supabase/config.toml"
      ],
      "dependencias": [
        "@supabase/supabase-js",
        "@supabase/ssr",
        "@supabase/auth-helpers-nextjs"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_"
      ],
      "hosts": [
        "*.supabase.co"
      ],
      "chaves": [
        "sbp_"
      ]
    },
    "teste": {
      "nivel1": {
        "metodo": "GET",
        "url": "https://supabase.com",
        "dominiosPermitidos": [
          "supabase.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "firebase",
      "appwrite",
      "nhost"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://supabase.com/docs"
    ]
  },
  {
    "id": "cloudflare-d1",
    "nome": "Cloudflare D1",
    "categoria": "bancos",
    "subcategoria": "sql-serverless",
    "site": "https://developers.cloudflare.com/d1/",
    "cadastro": "https://dash.cloudflare.com/sign-up",
    "icone": "cloudflare",
    "sinais": {
      "configuracao": [
        "wrangler.toml",
        "wrangler.jsonc",
        "wrangler.json"
      ],
      "dependencias": [
        "wrangler",
        "@cloudflare/workers-types"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [],
      "hosts": [],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://developers.cloudflare.com/d1/",
        "dominiosPermitidos": [
          "developers.cloudflare.com",
          "cloudflare.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "turso",
      "neon"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://developers.cloudflare.com/d1/"
    ]
  },
  {
    "id": "mongodb",
    "nome": "MongoDB",
    "categoria": "bancos",
    "subcategoria": "nosql-documento",
    "site": "https://www.mongodb.com",
    "cadastro": "https://account.mongodb.com/account/register",
    "icone": "mongodb",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "mongodb",
        "mongoose"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "MONGODB_URI",
        "MONGO_URI",
        "MONGODB_URL",
        "MONGO_URL",
        "MONGODB_"
      ],
      "hosts": [
        "*.mongodb.net"
      ],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://www.mongodb.com",
        "dominiosPermitidos": [
          "mongodb.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "supabase",
      "firebase"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://www.mongodb.com/docs/"
    ]
  },
  {
    "id": "neon",
    "nome": "Neon",
    "categoria": "bancos",
    "subcategoria": "sql-serverless",
    "site": "https://neon.tech",
    "cadastro": "https://console.neon.tech/signup",
    "icone": "neon",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "@neondatabase/serverless",
        "@neon/serverless"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "NEON_DATABASE_URL",
        "DATABASE_URL",
        "PGHOST",
        "NEON_"
      ],
      "hosts": [
        "*.neon.tech"
      ],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://neon.tech",
        "dominiosPermitidos": [
          "neon.tech"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "turso",
      "supabase"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://neon.tech/docs/introduction"
    ]
  },
  {
    "id": "turso",
    "nome": "Turso",
    "categoria": "bancos",
    "subcategoria": "sql",
    "site": "https://turso.tech",
    "cadastro": "https://turso.tech/app",
    "icone": "turso",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "@libsql/client",
        "@tursodatabase/api"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "TURSO_DATABASE_URL",
        "TURSO_AUTH_TOKEN",
        "TURSO_"
      ],
      "hosts": [
        "*.turso.io"
      ],
      "chaves": []
    },
    "teste": {
      "nivel1": {
        "metodo": "GET",
        "url": "https://api.turso.io",
        "dominiosPermitidos": [
          "api.turso.io"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "neon",
      "supabase"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://docs.turso.tech"
    ]
  },
  {
    "id": "upstash",
    "nome": "Upstash",
    "categoria": "bancos",
    "subcategoria": "serverless-cache",
    "site": "https://upstash.com",
    "cadastro": "https://console.upstash.com",
    "icone": "upstash",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "@upstash/redis",
        "@upstash/ratelimit",
        "@upstash/kafka",
        "@upstash/qstash",
        "@upstash/vector"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
        "UPSTASH_KAFKA_REST_URL",
        "UPSTASH_QSTASH_TOKEN",
        "UPSTASH_"
      ],
      "hosts": [
        "*.upstash.io"
      ],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://upstash.com",
        "dominiosPermitidos": [
          "upstash.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "redis"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://docs.upstash.com"
    ]
  },
  {
    "id": "amazon-ses",
    "nome": "Amazon SES",
    "categoria": "email",
    "subcategoria": "transacional",
    "site": "https://aws.amazon.com/ses/",
    "cadastro": "https://portal.aws.amazon.com/signup",
    "icone": "amazonses",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "@aws-sdk/client-ses",
        "aws-sdk"
      ],
      "dependenciasObsoletas": [
        "aws-sdk"
      ],
      "variaveis": [
        "AWS_SES_REGION",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_"
      ],
      "hosts": [
        "email.*.amazonaws.com"
      ],
      "chaves": [
        "AKIA"
      ]
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://aws.amazon.com/ses/",
        "dominiosPermitidos": [
          "aws.amazon.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "resend",
      "sendgrid",
      "postmark",
      "mailgun"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://docs.aws.amazon.com/ses/"
    ]
  },
  {
    "id": "mailgun",
    "nome": "Mailgun",
    "categoria": "email",
    "subcategoria": "transacional",
    "site": "https://www.mailgun.com",
    "cadastro": "https://signup.mailgun.com/new/signup",
    "icone": "mailgun",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "mailgun.js",
        "mailgun-js"
      ],
      "dependenciasObsoletas": [
        "mailgun-js"
      ],
      "variaveis": [
        "MAILGUN_API_KEY",
        "MAILGUN_DOMAIN",
        "MAILGUN_"
      ],
      "hosts": [
        "api.mailgun.net",
        "api.eu.mailgun.net"
      ],
      "chaves": [
        "key-"
      ]
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://www.mailgun.com",
        "dominiosPermitidos": [
          "mailgun.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "resend",
      "sendgrid",
      "postmark",
      "amazon-ses"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://documentation.mailgun.com"
    ]
  },
  {
    "id": "postmark",
    "nome": "Postmark",
    "categoria": "email",
    "subcategoria": "transacional",
    "site": "https://postmarkapp.com",
    "cadastro": "https://account.postmarkapp.com/sign_up",
    "icone": "postmark",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "postmark"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "POSTMARK_SERVER_TOKEN",
        "POSTMARK_API_KEY",
        "POSTMARK_"
      ],
      "hosts": [
        "api.postmarkapp.com"
      ],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://postmarkapp.com",
        "dominiosPermitidos": [
          "postmarkapp.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "resend",
      "sendgrid",
      "mailgun",
      "amazon-ses"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://postmarkapp.com/developer"
    ]
  },
  {
    "id": "resend",
    "nome": "Resend",
    "categoria": "email",
    "subcategoria": "transacional",
    "site": "https://resend.com",
    "cadastro": "https://resend.com/signup",
    "icone": "resend",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "resend"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "RESEND_API_KEY",
        "RESEND_"
      ],
      "hosts": [
        "api.resend.com"
      ],
      "chaves": [
        "re_"
      ]
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://resend.com",
        "dominiosPermitidos": [
          "resend.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "sendgrid",
      "postmark",
      "mailgun",
      "amazon-ses"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://resend.com/docs"
    ]
  },
  {
    "id": "sendgrid",
    "nome": "SendGrid",
    "categoria": "email",
    "subcategoria": "transacional",
    "site": "https://sendgrid.com",
    "cadastro": "https://signup.sendgrid.com",
    "icone": "sendgrid",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "@sendgrid/mail",
        "@sendgrid/client"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "SENDGRID_API_KEY",
        "SENDGRID_"
      ],
      "hosts": [
        "api.sendgrid.com",
        "api.eu.sendgrid.com"
      ],
      "chaves": [
        "SG."
      ]
    },
    "teste": {
      "nivel3": {
        "metodo": "GET",
        "url": "https://api.sendgrid.com/v3/scopes",
        "headers": {
          "Authorization": "Bearer {chave}"
        },
        "dominiosPermitidos": [
          "api.sendgrid.com",
          "api.eu.sendgrid.com"
        ],
        "regra": "status_200"
      }
    },
    "alternativas": [
      "resend",
      "postmark",
      "mailgun",
      "amazon-ses"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://docs.sendgrid.com/api-reference/scopes/get-a-list-of-an-api-keys-scopes"
    ]
  },
  {
    "id": "smtp-generico",
    "nome": "SMTP Genérico",
    "categoria": "email",
    "subcategoria": "transacional",
    "site": "https://www.rfc-editor.org/rfc/rfc5321",
    "cadastro": "https://www.rfc-editor.org/rfc/rfc5321",
    "icone": "mail",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "nodemailer"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASS",
        "SMTP_PASSWORD",
        "EMAIL_SERVER_HOST",
        "EMAIL_SERVER_PORT"
      ],
      "hosts": [],
      "chaves": []
    },
    "alternativas": [
      "resend",
      "sendgrid",
      "postmark",
      "mailgun",
      "amazon-ses"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://nodemailer.com/smtp/"
    ]
  },
  {
    "id": "anthropic",
    "nome": "Anthropic",
    "categoria": "ia",
    "subcategoria": "llm",
    "site": "https://www.anthropic.com",
    "cadastro": "https://console.anthropic.com",
    "icone": "anthropic",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "@anthropic-ai/sdk"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "ANTHROPIC_API_KEY",
        "ANTHROPIC_"
      ],
      "hosts": [
        "api.anthropic.com"
      ],
      "chaves": [
        "sk-ant-"
      ]
    },
    "teste": {
      "nivel3": {
        "metodo": "GET",
        "url": "https://api.anthropic.com/v1/models",
        "headers": {
          "x-api-key": "{chave}",
          "anthropic-version": "2023-06-01"
        },
        "dominiosPermitidos": [
          "api.anthropic.com"
        ],
        "regra": "status_200"
      }
    },
    "alternativas": [
      "openai",
      "gemini",
      "openrouter"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://docs.anthropic.com/en/api/getting-started"
    ]
  },
  {
    "id": "gemini",
    "nome": "Google Gemini",
    "categoria": "ia",
    "subcategoria": "llm",
    "site": "https://ai.google.dev",
    "cadastro": "https://aistudio.google.com",
    "icone": "googlegemini",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "@google/genai",
        "@google/generative-ai"
      ],
      "dependenciasObsoletas": [
        "@google/generative-ai"
      ],
      "variaveis": [
        "GEMINI_API_KEY",
        "GOOGLE_AI_API_KEY",
        "GOOGLE_API_KEY",
        "GEMINI_"
      ],
      "hosts": [
        "generativelanguage.googleapis.com"
      ],
      "chaves": [
        "AIzaSy"
      ]
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://ai.google.dev",
        "dominiosPermitidos": [
          "ai.google.dev",
          "generativelanguage.googleapis.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "anthropic",
      "openai",
      "openrouter"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://ai.google.dev/gemini-api/docs/quickstart"
    ]
  },
  {
    "id": "huggingface",
    "nome": "Hugging Face",
    "categoria": "ia",
    "subcategoria": "model-hub",
    "site": "https://huggingface.co",
    "cadastro": "https://huggingface.co/join",
    "icone": "huggingface",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "@huggingface/inference",
        "@huggingface/hub",
        "@huggingface/transformers"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "HF_TOKEN",
        "HUGGINGFACE_API_KEY",
        "HUGGINGFACE_TOKEN",
        "HF_API_KEY",
        "HUGGING_FACE_HUB_TOKEN"
      ],
      "hosts": [
        "huggingface.co",
        "api-inference.huggingface.co"
      ],
      "chaves": [
        "hf_"
      ]
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://huggingface.co",
        "dominiosPermitidos": [
          "huggingface.co",
          "api-inference.huggingface.co"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "together",
      "replicate"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://huggingface.co/docs/huggingface.js"
    ]
  },
  {
    "id": "openai",
    "nome": "OpenAI",
    "categoria": "ia",
    "subcategoria": "llm",
    "site": "https://openai.com",
    "cadastro": "https://platform.openai.com/signup",
    "icone": "openai",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "openai"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "OPENAI_API_KEY",
        "OPENAI_ORG_ID",
        "OPENAI_PROJECT_ID",
        "OPENAI_"
      ],
      "hosts": [
        "api.openai.com"
      ],
      "chaves": [
        "sk-"
      ]
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://api.openai.com",
        "dominiosPermitidos": [
          "api.openai.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "anthropic",
      "gemini",
      "openrouter"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://platform.openai.com/docs/api-reference"
    ]
  },
  {
    "id": "openrouter",
    "nome": "OpenRouter",
    "categoria": "ia",
    "subcategoria": "agregador-llm",
    "site": "https://openrouter.ai",
    "cadastro": "https://openrouter.ai/keys",
    "icone": "openrouter",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "@openrouter/ai-sdk-provider",
        "openrouter"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "OPENROUTER_API_KEY",
        "OPENROUTER_"
      ],
      "hosts": [
        "openrouter.ai"
      ],
      "chaves": [
        "sk-or-v1-"
      ]
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://openrouter.ai",
        "dominiosPermitidos": [
          "openrouter.ai"
        ],
        "regra": "alcance_dns"
      },
      "nivel3": {
        "metodo": "GET",
        "url": "https://openrouter.ai/api/v1/key",
        "headers": {
          "Authorization": "Bearer {chave}"
        },
        "dominiosPermitidos": [
          "openrouter.ai"
        ],
        "regra": "status_200"
      }
    },
    "alternativas": [
      "anthropic",
      "openai",
      "together"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://openrouter.ai/docs"
    ]
  },
  {
    "id": "together",
    "nome": "Together AI",
    "categoria": "ia",
    "subcategoria": "inferencia-cloud",
    "site": "https://www.together.ai",
    "cadastro": "https://api.together.ai/signin",
    "icone": "together",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "together-ai"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [
        "TOGETHER_API_KEY",
        "TOGETHERAI_API_KEY",
        "TOGETHER_"
      ],
      "hosts": [
        "api.together.xyz",
        "api.together.ai"
      ],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://api.together.ai",
        "dominiosPermitidos": [
          "api.together.ai",
          "api.together.xyz",
          "together.ai"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "huggingface",
      "openrouter",
      "openai"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://docs.together.ai"
    ]
  },
  {
    "id": "vercel-ai-sdk",
    "nome": "Vercel AI SDK",
    "categoria": "ia",
    "subcategoria": "sdk-framework",
    "site": "https://sdk.vercel.ai",
    "cadastro": "https://vercel.com/signup",
    "icone": "vercel",
    "sinais": {
      "configuracao": [],
      "dependencias": [
        "ai",
        "@ai-sdk/openai",
        "@ai-sdk/anthropic",
        "@ai-sdk/google",
        "@ai-sdk/azure",
        "@ai-sdk/mistral"
      ],
      "dependenciasObsoletas": [],
      "variaveis": [],
      "hosts": [
        "sdk.vercel.ai"
      ],
      "chaves": []
    },
    "teste": {
      "nivel2": {
        "metodo": "GET",
        "url": "https://sdk.vercel.ai",
        "dominiosPermitidos": [
          "sdk.vercel.ai",
          "vercel.com"
        ],
        "regra": "alcance_dns"
      }
    },
    "alternativas": [
      "langchain"
    ],
    "verificadoEm": "2026-11-06",
    "fontes": [
      "https://sdk.vercel.ai/docs/introduction"
    ]
  }
];
