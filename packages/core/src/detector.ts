import path from 'node:path';
import { analyser, FSProvider, flatten } from '@specfy/stack-analyser';
import '@specfy/stack-analyser/dist/autoload.js';
import {
  readAllPackageJsons,
  type ExtractedPackageJson,
  type PackageDependency,
} from './packageJsonReader.js';

export interface DetectedSignal {
  tipo: 'configuracao' | 'dependencia' | 'variavel' | 'host';
  valor: string;
  arquivo: string;
}

export interface DetectedTech {
  tech: string;
  sinais: DetectedSignal[];
  origem: 'specfy' | 'leitor_proprio' | 'ambos';
}

export interface AnalysisResult {
  analisadoEm: string;
  repoPath: string;
  detector: {
    nome: string;
    versao: string;
    versaoRegrasProprias: string;
  };
  tecnologias: string[];
  linguagens: Record<string, number>;
  itensDetectados: DetectedTech[];
  packageJsons: ExtractedPackageJson[];
}

/**
 * Executa a análise completa de um repositório:
 * 1. Executa o leitor próprio de package.json (garantindo que arquivos sem name sejam lidos).
 * 2. Executa o @specfy/stack-analyser com o provider de sistema de arquivos.
 * 3. Une e consolida as tecnologias detectadas por ambas as camadas.
 */
export async function analyzeRepository(repoPath: string): Promise<AnalysisResult> {
  const absolutePath = path.resolve(repoPath);

  // 1. Leitura direta própria de todos os package.json
  const extractedPackageJsons = await readAllPackageJsons(absolutePath);

  // 2. Análise do Specfy
  const provider = new FSProvider({ path: absolutePath });
  const rawResult = await analyser({ provider });

  // Pegadinha do flatten: passar o objeto bruto (rawResult), nunca o JSON!
  const flatResult = flatten(rawResult);
  const jsonResult = rawResult.toJson();
  const flatJson = flatResult.toJson();

  // Coleta tecnologias do Specfy
  const specfyTechs = new Set<string>();
  if (jsonResult.techs) {
    for (const t of jsonResult.techs) {
      if (t) specfyTechs.add(String(t));
    }
  }
  if (jsonResult.tech) {
    specfyTechs.add(String(jsonResult.tech));
  }
  if (flatJson.childs) {
    for (const child of flatJson.childs) {
      if (child.tech) {
        specfyTechs.add(String(child.tech));
      }
      if (child.techs) {
        for (const t of child.techs) {
          if (t) specfyTechs.add(String(t));
        }
      }
    }
  }

  // Coleta tecnologias do leitor próprio
  const customTechs = new Set<string>();
  const techSignalsMap = new Map<string, DetectedSignal[]>();

  for (const pkg of extractedPackageJsons) {
    for (const tech of pkg.techsMatched) {
      customTechs.add(tech);
      if (!techSignalsMap.has(tech)) {
        techSignalsMap.set(tech, []);
      }
      techSignalsMap.get(tech)!.push({
        tipo: 'dependencia',
        valor: `package.json [${pkg.filePath}]`,
        arquivo: pkg.filePath,
      });
    }
  }

  // União consolidada de todas as tecnologias detectadas
  const allTechNames = new Set<string>([...specfyTechs, ...customTechs]);
  const itensDetectados: DetectedTech[] = [];

  for (const tech of Array.from(allTechNames).sort()) {
    const fromSpecfy = specfyTechs.has(tech);
    const fromCustom = customTechs.has(tech);

    let origem: DetectedTech['origem'] = 'ambos';
    if (fromSpecfy && !fromCustom) origem = 'specfy';
    if (!fromSpecfy && fromCustom) origem = 'leitor_proprio';

    const sinais = techSignalsMap.get(tech) || [];
    if (fromSpecfy && sinais.length === 0) {
      sinais.push({
        tipo: 'configuracao',
        valor: 'detectado por regras do Specfy',
        arquivo: 'repositório',
      });
    }

    itensDetectados.push({
      tech,
      sinais,
      origem,
    });
  }

  return {
    analisadoEm: new Date().toISOString(),
    repoPath: absolutePath,
    detector: {
      nome: '@specfy/stack-analyser + leitor-proprio-stackatlas',
      versao: '1.27.6',
      versaoRegrasProprias: '0.1.0',
    },
    tecnologias: Array.from(allTechNames).sort(),
    linguagens: jsonResult.languages || {},
    itensDetectados,
    packageJsons: extractedPackageJsons,
  };
}
