import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import type { AnalysisResult } from './detector.js';
import type { ResultadoLeituraConfig } from './configReader.js';
import type { ServicoFicha, VariavelFicha, SinalFicha, AlertaFicha } from '../../../schemas/ficha.js';

export interface SinaisCatalogo {
  configuracao?: string[];
  dependencias?: string[];
  dependenciasObsoletas?: Array<string | { nome: string; data?: string; motivo?: string }>;
  variaveis?: string[];
  hosts?: string[];
  chaves?: string[];
}

export interface EntradaCatalogo {
  id: string;
  nome: string;
  categoria: string;
  subcategoria: string;
  site: string;
  cadastro: string;
  icone: string;
  sinais: SinaisCatalogo;
  alternativas?: string[];
  verificadoEm?: string;
  fontes?: string[];
}

export interface ServicoCruzado extends ServicoFicha {
  detalheConfianca: string;
}

export interface ResultadoCruzamento {
  servicos: ServicoCruzado[];
  variaveis: VariavelFicha[];
  naoCatalogados: Array<{
    tech: string;
    sinais: SinalFicha[];
  }>;
  alertas: AlertaFicha[];
}

/**
 * Resolve o diretório raiz 'catalog/' subindo até 6 níveis a partir do local atual.
 */
export function resolverDiretorioCatalogo(): string {
  let dirAtual = path.resolve('.');
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dirAtual, 'catalog');
    if (fsSync.existsSync(candidate)) {
      return candidate;
    }
    dirAtual = path.dirname(dirAtual);
  }
  return path.resolve('catalog');
}

/**
 * Carrega recursivamente todos os arquivos YAML da pasta do catálogo.
 */
export async function carregarCatalogo(catalogDir: string): Promise<EntradaCatalogo[]> {
  const entries: EntradaCatalogo[] = [];

  async function lerDiretorio(dir: string) {
    const itens = await fs.readdir(dir, { withFileTypes: true });
    for (const item of itens) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        await lerDiretorio(fullPath);
      } else if (item.isFile() && (item.name.endsWith('.yaml') || item.name.endsWith('.yml'))) {
        try {
          const raw = await fs.readFile(fullPath, 'utf-8');
          const parsed = yaml.parse(raw) as EntradaCatalogo;
          if (parsed && parsed.id && parsed.nome) {
            entries.push(parsed);
          }
        } catch (err) {
          console.warn(`[carregarCatalogo] Erro ao ler YAML ${fullPath}:`, err);
        }
      }
    }
  }

  await lerDiretorio(catalogDir);
  return entries;
}

/**
 * Cruza os resultados da detecção e dos arquivos/variáveis de ambiente
 * com as definições do catálogo, aplicando as regras de confiança de 2 sinais independentes.
 */
export async function cruzarComCatalogo(
  detectorResult: AnalysisResult,
  configResult: ResultadoLeituraConfig,
  catalogDir: string
): Promise<ResultadoCruzamento> {
  const catalogo = await carregarCatalogo(catalogDir);
  const servicosCruzados: ServicoCruzado[] = [];
  const variaveisMapeadas: VariavelFicha[] = [];
  const servicosIdentificadosIds = new Set<string>();
  const alertasMapeados: AlertaFicha[] = [];

  // Coleta todas as dependências extraídas dos package.json
  const todasDependencias = detectorResult.packageJsons.flatMap((p) => p.dependencies);

  for (const entrada of catalogo) {
    const sinaisEncontrados: SinalFicha[] = [];

    // 1. Cruzamento de Dependências Atuais
    if (entrada.sinais.dependencias) {
      for (const depPattern of entrada.sinais.dependencias) {
        for (const dep of todasDependencias) {
          if (dep.name === depPattern || (depPattern.endsWith('*') && dep.name.startsWith(depPattern.slice(0, -1)))) {
            sinaisEncontrados.push({
              tipo: 'dependencia',
              valor: `${dep.name}@${dep.version}`,
              arquivo: dep.file,
            });
          }
        }
      }
    }

    // 1.1 Cruzamento de Dependências Obsoletas (SPEC.md Seções 5.3 e 9)
    if (entrada.sinais.dependenciasObsoletas) {
      for (const itemObsoleto of entrada.sinais.dependenciasObsoletas) {
        const nomeObsoleto = typeof itemObsoleto === 'string' ? itemObsoleto : itemObsoleto.nome;
        const dataDescontinuacao = typeof itemObsoleto === 'object' ? itemObsoleto.data : undefined;
        const motivo = typeof itemObsoleto === 'object' ? itemObsoleto.motivo : undefined;

        for (const dep of todasDependencias) {
          if (dep.name === nomeObsoleto || (nomeObsoleto.endsWith('*') && dep.name.startsWith(nomeObsoleto.slice(0, -1)))) {
            sinaisEncontrados.push({
              tipo: 'dependencia',
              valor: `${dep.name}@${dep.version} (obsoleto)`,
              arquivo: dep.file,
            });
            alertasMapeados.push({
              tipo: 'obsoleto',
              servico: entrada.id,
              mensagem: `Usa pacote obsoleto/descontinuado '${dep.name}'${dataDescontinuacao ? ` (descontinuado em ${dataDescontinuacao})` : ''}${motivo ? `: ${motivo}` : '.'}`,
            });
          }
        }
      }
    }

    // Também verifica se o detector Specfy encontrou a tecnologia pelo id ou nome
    const matchDetector = detectorResult.itensDetectados.find(
      (item) => item.tech.toLowerCase() === entrada.id.toLowerCase()
    );
    if (matchDetector && sinaisEncontrados.filter((s) => s.tipo === 'dependencia').length === 0) {
      sinaisEncontrados.push({
        tipo: 'dependencia',
        valor: `detectado por regra [${matchDetector.tech}]`,
        arquivo: matchDetector.sinais[0]?.arquivo || 'package.json',
      });
    }

    // 2. Cruzamento de Arquivos de Configuração
    if (entrada.sinais.configuracao) {
      for (const configPattern of entrada.sinais.configuracao) {
        const found = configResult.configuracoes.find(
          (c) => c.presente && (c.arquivo === configPattern || c.arquivo.endsWith(configPattern))
        );
        if (found) {
          sinaisEncontrados.push({
            tipo: 'configuracao',
            valor: found.arquivo,
            arquivo: found.arquivo,
          });
        }
      }
    }

    // 3. Cruzamento de Variáveis de Ambiente
    const variaveisDoServico: VariavelFicha[] = [];
    if (entrada.sinais.variaveis) {
      for (const vPattern of entrada.sinais.variaveis) {
        const isPrefix = vPattern.endsWith('_');
        for (const v of configResult.variaveis) {
          const match = isPrefix ? v.nome.startsWith(vPattern) : v.nome === vPattern;
          if (match) {
            sinaisEncontrados.push({
              tipo: 'variavel',
              valor: v.nome,
              arquivo: v.arquivo,
            });
            variaveisDoServico.push({
              nome: v.nome,
              idServico: entrada.id,
              arquivo: v.arquivo,
              obrigatoria: null,
              descricao: `Variável do serviço ${entrada.nome}`,
            });
          }
        }
      }
    }

    // Se encontramos ao menos um sinal, avalia a confiança
    if (sinaisEncontrados.length > 0) {
      servicosIdentificadosIds.add(entrada.id);

      // Regra de confiança: conta tipos de sinais independentes
      // Tipos independentes: 'dependencia', 'configuracao', 'variavel', 'host'
      const tiposIndependentes = new Set(sinaisEncontrados.map((s) => s.tipo));
      const qtdTiposIndependentes = tiposIndependentes.size;

      // Se houver 2 ou mais tipos de sinais independentes -> 'certo'
      // Se houver apenas 1 tipo de sinal (ex: apenas dependência @libsql/client) -> 'provavel'
      const confianca: 'certo' | 'provavel' = qtdTiposIndependentes >= 2 ? 'certo' : 'provavel';

      const detalheConfianca =
        confianca === 'certo'
          ? `Confiança CERTA: ${qtdTiposIndependentes} sinais independentes encontrados (${Array.from(tiposIndependentes).join(' + ')})`
          : `Confiança PROVÁVEL: Apenas 1 sinal independente encontrado (${Array.from(tiposIndependentes)[0]}). Exige 2 sinais para ser certo.`;

      // Deduplica sinais
      const sinaisUnicos = Array.from(
        new Map(sinaisEncontrados.map((s) => [`${s.tipo}:${s.valor}:${s.arquivo}`, s])).values()
      );

      servicosCruzados.push({
        id: entrada.id,
        nome: entrada.nome,
        categoria: entrada.categoria,
        subcategoria: entrada.subcategoria,
        confianca,
        catalogado: true,
        sinais: sinaisUnicos,
        detalheConfianca,
      });

      variaveisMapeadas.push(...variaveisDoServico);
    }
  }

  // Identifica tecnologias detectadas que não estão no catálogo da v1
  const naoCatalogados: Array<{ tech: string; sinais: SinalFicha[] }> = [];
  for (const item of detectorResult.itensDetectados) {
    if (!servicosIdentificadosIds.has(item.tech.toLowerCase())) {
      naoCatalogados.push({
        tech: item.tech,
        sinais: item.sinais.map((s) => ({
          tipo: s.tipo,
          valor: s.valor,
          arquivo: s.arquivo,
        })),
      });
    }
  }

  return {
    servicos: servicosCruzados,
    variaveis: variaveisMapeadas,
    naoCatalogados,
    alertas: alertasMapeados,
  };
}
