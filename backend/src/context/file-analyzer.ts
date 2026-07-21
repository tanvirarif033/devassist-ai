

import * as fs from 'fs/promises';
import * as path from 'path';
import { parse } from '@typescript-eslint/typescript-estree';
import { FileContext } from './types';

export interface ImportInfo {
  moduleName: string;
  importedItems: string[];
  sourceFile: string;
}

export interface FileAnalysis {
  imports: ImportInfo[];
  exports: string[];
  dependencies: string[];
  functions: string[];
  classes: string[];
  interfaces: string[];
  types: string[];
}

export class FileAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      const ext = path.extname(filePath);
      
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        return this.analyzeTypeScript(content, filePath);
      } else if (['.py'].includes(ext)) {
        return this.analyzePython(content);
      } else if (['.go'].includes(ext)) {
        return this.analyzeGo(content);
      } else {
        return {
          imports: [],
          exports: [],
          dependencies: [],
          functions: [],
          classes: [],
          interfaces: [],
          types: [],
        };
      }
    } catch (error) {
      console.warn(`⚠️ Could not analyze file: ${filePath}`, error);
      return {
        imports: [],
        exports: [],
        dependencies: [],
        functions: [],
        classes: [],
        interfaces: [],
        types: [],
      };
    }
  }

  private analyzeTypeScript(content: string, filePath: string): FileAnalysis {
    const analysis: FileAnalysis = {
      imports: [],
      exports: [],
      dependencies: [],
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
    };

    try {
      const ast = parse(content, {
        loc: true,
        range: true,
        tokens: true,
        comment: true,
        jsx: filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
      });

      for (const node of ast.body) {
        if (node.type === 'ImportDeclaration') {
          const importInfo: ImportInfo = {
            moduleName: node.source.value as string,
            importedItems: [],
            sourceFile: filePath,
          };

          if (node.specifiers) {
            for (const specifier of node.specifiers) {
              // ✅ Fix: Handle different import specifier types correctly
              if (specifier.type === 'ImportSpecifier') {
                // For named imports: import { something } from 'module'
                // Check if imported is an Identifier or Literal
                if (specifier.imported.type === 'Identifier') {
                  importInfo.importedItems.push(specifier.imported.name);
                } else if (specifier.imported.type === 'Literal') {
                  // For string literal imports: import { "something" as alias } from 'module'
                  importInfo.importedItems.push(String(specifier.imported.value));
                } else {
                  // Fallback: use the local name if available
                  if (specifier.local && specifier.local.type === 'Identifier') {
                    importInfo.importedItems.push(specifier.local.name);
                  }
                }
              } else if (specifier.type === 'ImportDefaultSpecifier') {
                // For default imports: import something from 'module'
                if (specifier.local && specifier.local.type === 'Identifier') {
                  importInfo.importedItems.push(specifier.local.name);
                } else {
                  importInfo.importedItems.push('default');
                }
              } else if (specifier.type === 'ImportNamespaceSpecifier') {
                // For namespace imports: import * as something from 'module'
                if (specifier.local && specifier.local.type === 'Identifier') {
                  importInfo.importedItems.push(`* as ${specifier.local.name}`);
                } else {
                  importInfo.importedItems.push('*');
                }
              }
            }
          }

          analysis.imports.push(importInfo);
          analysis.dependencies.push(node.source.value as string);
        }

        // Analyze exports
        if (node.type === 'ExportNamedDeclaration') {
          if (node.declaration) {
            if (node.declaration.type === 'FunctionDeclaration') {
              if (node.declaration.id && node.declaration.id.type === 'Identifier') {
                analysis.exports.push(node.declaration.id.name);
              }
            } else if (node.declaration.type === 'ClassDeclaration') {
              if (node.declaration.id && node.declaration.id.type === 'Identifier') {
                analysis.exports.push(node.declaration.id.name);
              }
            } else if (node.declaration.type === 'VariableDeclaration') {
              for (const decl of node.declaration.declarations) {
                if (decl.id && decl.id.type === 'Identifier') {
                  analysis.exports.push(decl.id.name);
                }
              }
            }
          } else if (node.specifiers) {
            for (const specifier of node.specifiers) {
              if (specifier.type === 'ExportSpecifier') {
                if (specifier.exported && specifier.exported.type === 'Identifier') {
                  analysis.exports.push(specifier.exported.name);
                }
              }
            }
          }
        }

        // Analyze functions
        this.findFunctions(ast.body, analysis.functions);

        // Analyze classes
        this.findClasses(ast.body, analysis.classes);

        // Analyze interfaces and types
        this.findInterfacesAndTypes(ast.body, analysis);
      }

    } catch (error) {
      console.warn(`⚠️ TypeScript analysis error for ${filePath}:`, error);
    }

    return analysis;
  }

  private findFunctions(nodes: any[], functions: string[]) {
    for (const node of nodes) {
      if (node.type === 'FunctionDeclaration' && node.id && node.id.type === 'Identifier') {
        functions.push(node.id.name);
      } else if (node.type === 'VariableDeclaration') {
        for (const decl of node.declarations) {
          if (decl.init && 
              (decl.init.type === 'ArrowFunctionExpression' || 
               decl.init.type === 'FunctionExpression') &&
              decl.id && 
              decl.id.type === 'Identifier') {
            functions.push(decl.id.name);
          }
        }
      } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        this.findFunctions([node.declaration], functions);
      } else if (node.type === 'ClassDeclaration' && node.body) {
        for (const member of node.body.body) {
          if (member.type === 'MethodDefinition' && 
              member.key && 
              member.key.type === 'Identifier') {
            functions.push(member.key.name);
          }
        }
      }
    }
  }

  private findClasses(nodes: any[], classes: string[]) {
    for (const node of nodes) {
      if (node.type === 'ClassDeclaration' && node.id && node.id.type === 'Identifier') {
        classes.push(node.id.name);
      } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        this.findClasses([node.declaration], classes);
      }
    }
  }

  private findInterfacesAndTypes(nodes: any[], analysis: FileAnalysis) {
    for (const node of nodes) {
      if (node.type === 'TSInterfaceDeclaration' && node.id && node.id.type === 'Identifier') {
        analysis.interfaces.push(node.id.name);
      } else if (node.type === 'TSTypeAliasDeclaration' && node.id && node.id.type === 'Identifier') {
        analysis.types.push(node.id.name);
      } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        this.findInterfacesAndTypes([node.declaration], analysis);
      }
    }
  }

  private analyzePython(content: string): FileAnalysis {
    const analysis: FileAnalysis = {
      imports: [],
      exports: [],
      dependencies: [],
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
    };

    const lines = content.split('\n');
    for (const line of lines) {
      // Import detection
      const importMatch = line.match(/^(?:from\s+(\S+)\s+import|import\s+(\S+))/);
      if (importMatch) {
        const module = importMatch[1] || importMatch[2];
        if (module) {
          analysis.dependencies.push(module);
          analysis.imports.push({
            moduleName: module,
            importedItems: ['*'],
            sourceFile: 'unknown',
          });
        }
      }

      // Function detection
      const funcMatch = line.match(/^def\s+(\w+)\s*\(/);
      if (funcMatch) {
        analysis.functions.push(funcMatch[1]);
      }

      // Class detection
      const classMatch = line.match(/^class\s+(\w+)/);
      if (classMatch) {
        analysis.classes.push(classMatch[1]);
      }
    }

    return analysis;
  }

  private analyzeGo(content: string): FileAnalysis {
    const analysis: FileAnalysis = {
      imports: [],
      exports: [],
      dependencies: [],
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
    };

    const lines = content.split('\n');
    for (const line of lines) {
      // Import detection
      const importMatch = line.match(/^import\s+"([^"]+)"/);
      if (importMatch) {
        analysis.dependencies.push(importMatch[1]);
        analysis.imports.push({
          moduleName: importMatch[1],
          importedItems: ['*'],
          sourceFile: 'unknown',
        });
      }

      // Function detection
      const funcMatch = line.match(/^func\s+(\w+)\s*\(/);
      if (funcMatch) {
        analysis.functions.push(funcMatch[1]);
      }

      // Type detection
      const typeMatch = line.match(/^type\s+(\w+)\s+struct/);
      if (typeMatch) {
        analysis.types.push(typeMatch[1]);
      }
    }

    return analysis;
  }

  async getDependencyGraph(filePath: string): Promise<Map<string, string[]>> {
    const graph = new Map<string, string[]>();
    const analysis = await this.analyzeFile(filePath);
    
    graph.set(filePath, analysis.dependencies);
    
    for (const dep of analysis.dependencies.slice(0, 5)) {
      try {
        const depPath = this.resolveImportPath(filePath, dep);
        if (depPath) {
          const depAnalysis = await this.analyzeFile(depPath);
          graph.set(depPath, depAnalysis.dependencies);
        }
      } catch (error) {
        // Skip if dependency can't be resolved
      }
    }
    
    return graph;
  }

  private resolveImportPath(currentFile: string, importPath: string): string | null {
    const baseDir = path.dirname(currentFile);
    
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go'];
    
    if (importPath.startsWith('.')) {
      const resolvedPath = path.join(baseDir, importPath);
      for (const ext of extensions) {
        const testPath = resolvedPath + ext;
        try {
          require('fs').accessSync(path.join(this.projectRoot, testPath));
          return testPath;
        } catch {}
      }
      
      // Try index files
      const indexPaths = [
        path.join(resolvedPath, 'index.ts'),
        path.join(resolvedPath, 'index.js'),
        path.join(resolvedPath, 'index.tsx'),
        path.join(resolvedPath, 'index.jsx'),
      ];
      for (const indexPath of indexPaths) {
        try {
          require('fs').accessSync(path.join(this.projectRoot, indexPath));
          return indexPath;
        } catch {}
      }
    }
    
    // For node_modules imports
    try {
      const resolved = require.resolve(importPath, { paths: [this.projectRoot] });
      return path.relative(this.projectRoot, resolved);
    } catch {
      return null;
    }
  }
}