import { z } from 'zod';

export const RegraTesteCatalogoSchema = z.object({
  metodo: z.enum(['GET', 'POST', 'HEAD']).optional().default('GET'),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  dominiosPermitidos: z.array(z.string()).optional().default([]),
  regra: z.string().optional(),
});

export const TesteCatalogoSchema = z.object({
  nivel1: RegraTesteCatalogoSchema.optional(),
  nivel2: RegraTesteCatalogoSchema.optional(),
  nivel3: RegraTesteCatalogoSchema.optional(),
});

export const SinaisCatalogoSchema = z.object({
  configuracao: z.array(z.string()).default([]),
  dependencias: z.array(z.string()).default([]),
  dependenciasObsoletas: z.array(z.union([
    z.string(),
    z.object({
      nome: z.string(),
      data: z.string().optional(),
      motivo: z.string().optional(),
    }),
  ])).default([]),
  variaveis: z.array(z.string()).default([]),
  hosts: z.array(z.string()).default([]),
  chaves: z.array(z.string()).default([]),
});

export const EntradaCatalogoSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9_-]+$/),
  nome: z.string().min(1),
  categoria: z.string().min(1),
  subcategoria: z.string().min(1),
  site: z.string().url(),
  cadastro: z.string().url(),
  icone: z.string().min(1),
  sinais: SinaisCatalogoSchema,
  teste: TesteCatalogoSchema.optional(),
  alternativas: z.array(z.string()).optional().default([]),
  verificadoEm: z.string().min(4),
  fontes: z.array(z.string().url()).min(1),
});

export type EntradaCatalogoValidada = z.infer<typeof EntradaCatalogoSchema>;
