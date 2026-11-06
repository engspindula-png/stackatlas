export type TipoSinal = 'configuracao' | 'dependencia' | 'variavel' | 'host';

export interface SinalFicha {
  tipo: TipoSinal;
  valor: string;
  arquivo: string;
}

export interface ServicoFicha {
  id: string | null;
  nome: string;
  categoria: string;
  subcategoria: string;
  confianca: 'certo' | 'provavel';
  catalogado: boolean;
  sinais: SinalFicha[];
}

export interface VariavelFicha {
  nome: string;
  idServico: string | null;
  arquivo: string;
  obrigatoria: boolean | null;
  descricao: string;
}

export interface ConexaoFicha {
  de: string;
  para: string;
  rotulo: string;
}

export interface NaoIdentificadoFicha {
  sinal: string;
  arquivo: string;
  motivo: string;
}

export interface AlertaFicha {
  tipo: 'obsoleto' | 'local' | 'duplicado';
  servico: string;
  mensagem: string;
}

export interface Ficha {
  schemaVersion: number;
  repo: {
    url: string;
    commit: string;
    branch: string;
    visibilidade: 'publico' | 'privado';
  };
  analisadoEm: string;
  detector: {
    nome: string;
    versao: string;
    versaoRegrasProprias: string;
  };
  servicos: ServicoFicha[];
  variaveis: VariavelFicha[];
  conexoes?: ConexaoFicha[];
  naoIdentificados: NaoIdentificadoFicha[];
  modulosInternos: number;
  alertas: AlertaFicha[];
}

export interface ItemFichaSalva {
  arquivo: string;
  dono: string;
  repo: string;
  commit: string;
  analisadoEm: string;
  servicosQtd: number;
  tecnologiasQtd: number;
  ficha: Ficha;
}

export interface RespostaFichasApi {
  total: number;
  diretorio: string;
  fichas: ItemFichaSalva[];
}

export type ResultadoTesteStatus =
  | 'ok'
  | 'chave_invalida'
  | 'sem_permissao'
  | 'limite'
  | 'sem_alcance'
  | 'nao_testado'
  | 'erro';

export interface ItemTesteResultado {
  servicoId: string;
  servicoNome: string;
  nivel: 1 | 2 | 3;
  resultado: ResultadoTesteStatus;
  data: string;
  detalhe: string;
}

export interface RespostaTesteApi {
  total: number;
  resultados: ItemTesteResultado[];
  estado?: {
    schemaVersion: number;
    chaveFicha: string;
    atualizadoEm: string;
    testes: Record<string, { nivel: number; resultado: ResultadoTesteStatus; data: string; detalhe: string }>;
  };
}

export interface EntradaCatalogoInfo {
  id: string;
  nome: string;
  categoria: string;
  subcategoria: string;
  site: string;
  cadastro: string;
  icone: string;
  sinais: {
    configuracao?: string[];
    dependencias?: string[];
    dependenciasObsoletas?: Array<string | { nome: string; data?: string; motivo?: string }>;
    variaveis?: string[];
    hosts?: string[];
    chaves?: string[];
  };
  alternativas?: string[];
  verificadoEm?: string;
  fontes?: string[];
}

export interface ConexaoDetalheInfo {
  de: string;
  para: string;
  rotulo: string;
  descricao: string;
  confianca: 'certo' | 'provavel';
  obsoleto: boolean;
}


