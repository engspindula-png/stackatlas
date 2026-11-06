import { z } from 'zod';

export const SinalFichaSchema = z.object({
  tipo: z.enum(['configuracao', 'dependencia', 'variavel', 'host']),
  valor: z.string(),
  arquivo: z.string(),
});

export const ServicoFichaSchema = z.object({
  id: z.string().nullable(),
  nome: z.string(),
  categoria: z.string(),
  subcategoria: z.string(),
  confianca: z.enum(['certo', 'provavel']),
  catalogado: z.boolean(),
  sinais: z.array(SinalFichaSchema),
});

export const VariavelFichaSchema = z.object({
  nome: z.string(),
  idServico: z.string().nullable(),
  arquivo: z.string(),
  obrigatoria: z.boolean().nullable(),
  descricao: z.string(),
});

export const ConexaoFichaSchema = z.object({
  de: z.string(),
  para: z.string(),
  rotulo: z.string(),
});

export const NaoIdentificadoFichaSchema = z.object({
  sinal: z.string(),
  arquivo: z.string(),
  motivo: z.string(),
});

export const AlertaFichaSchema = z.object({
  tipo: z.enum(['obsoleto', 'local', 'duplicado']),
  servico: z.string(),
  mensagem: z.string(),
});

export const RepoInfoSchema = z.object({
  url: z.string(),
  commit: z.string(),
  branch: z.string(),
  visibilidade: z.enum(['publico', 'privado']),
});

export const DetectorInfoSchema = z.object({
  nome: z.string(),
  versao: z.string(),
  versaoRegrasProprias: z.string(),
});

export const FichaSchema = z.object({
  schemaVersion: z.number().int().positive().default(1),
  repo: RepoInfoSchema,
  analisadoEm: z.string().datetime(),
  detector: DetectorInfoSchema,
  servicos: z.array(ServicoFichaSchema),
  variaveis: z.array(VariavelFichaSchema),
  conexoes: z.array(ConexaoFichaSchema).optional().default([]),
  naoIdentificados: z.array(NaoIdentificadoFichaSchema).default([]),
  modulosInternos: z.number().int().nonnegative().default(0),
  alertas: z.array(AlertaFichaSchema).default([]),
});

export type SinalFicha = z.infer<typeof SinalFichaSchema>;
export type ServicoFicha = z.infer<typeof ServicoFichaSchema>;
export type VariavelFicha = z.infer<typeof VariavelFichaSchema>;
export type ConexaoFicha = z.infer<typeof ConexaoFichaSchema>;
export type NaoIdentificadoFicha = z.infer<typeof NaoIdentificadoFichaSchema>;
export type AlertaFicha = z.infer<typeof AlertaFichaSchema>;
export type RepoInfo = z.infer<typeof RepoInfoSchema>;
export type DetectorInfo = z.infer<typeof DetectorInfoSchema>;
export type Ficha = z.infer<typeof FichaSchema>;
