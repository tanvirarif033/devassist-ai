

import fs from 'fs/promises';
import path from 'path';
import { FileContext } from './types';
import { FileAnalyzer } from './file-analyzer';

export class FileCollector {
  private projectRoot: string;
  private maxFileSize: number;
  private analyzer: FileAnalyzer;
  private maxFiles: number = 10;

  constructor(projectRoot: string = process.cwd(), maxFileSize: number = 1024 * 50) {
    this.projectRoot = projectRoot;
    this.maxFileSize = maxFileSize;
    this.analyzer = new FileAnalyzer(projectRoot);
  }

  async getFileContext(filePath: string, includeAnalysis: boolean = true): Promise<FileContext | null> {
    try {
      const fullPath = this.resolvePath(filePath);
      if (!fullPath) {
        console.warn(`⚠️ File not found: ${filePath}`);
        return null;
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      
      if (content.length > this.maxFileSize) {
        return {
          path: filePath,
          content: content.substring(0, this.maxFileSize) + '\n... (truncated)',
          language: this.detectLanguage(filePath),
          analysis: includeAnalysis ? await this.analyzer.analyzeFile(filePath) : undefined,
        };
      }

      // Find related files
      const relatedFiles = await this.findRelatedFiles(filePath, includeAnalysis);

      return {
        path: filePath,
        content,
        language: this.detectLanguage(filePath),
        relatedFiles,
        analysis: includeAnalysis ? await this.analyzer.analyzeFile(filePath) : undefined,
      };
    } catch (error) {
      console.warn(`⚠️ Could not read file: ${filePath}`, error);
      return null;
    }
  }

  async getMultipleFiles(filePaths: string[], includeAnalysis: boolean = true): Promise<FileContext[]> {
    const results: FileContext[] = [];
    let count = 0;
    
    for (const filePath of filePaths) {
      if (count >= this.maxFiles) break;
      const context = await this.getFileContext(filePath, includeAnalysis);
      if (context) {
        results.push(context);
        count++;
      }
    }
    
    return results;
  }

  async findRelatedFiles(filePath: string, includeAnalysis: boolean = true): Promise<FileContext[]> {
    const related: FileContext[] = [];
    const dir = path.dirname(path.join(this.projectRoot, filePath));
    const fileName = path.basename(filePath);
    const nameWithoutExt = path.parse(fileName).name;

    try {
      const files = await fs.readdir(dir);
      let count = 0;
      
      for (const file of files) {
        if (count >= 3) break; // Limit to 3 related files
        if (file === fileName) continue;
        
        // Related by name
        if (file.includes(nameWithoutExt)) {
          const context = await this.getFileContext(path.join(dir, file), includeAnalysis);
          if (context) {
            related.push(context);
            count++;
          }
        }
        
        // Related by extension patterns
        if (file.endsWith('.test.ts') || file.endsWith('.spec.ts') || file.endsWith('.d.ts')) {
          const baseFile = file.replace(/\.(test|spec|d)\.ts$/, '.ts');
          if (baseFile === fileName) {
            const context = await this.getFileContext(path.join(dir, file), includeAnalysis);
            if (context) {
              related.push(context);
              count++;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not find related files for: ${filePath}`, error);
    }

    return related;
  }

  private resolvePath(filePath: string): string | null {
    // If it's an absolute path, check if it exists
    if (path.isAbsolute(filePath)) {
      try {
        require('fs').accessSync(filePath);
        return filePath;
      } catch {
        return null;
      }
    }

    // Try relative to project root
    const fullPath = path.join(this.projectRoot, filePath);
    try {
      require('fs').accessSync(fullPath);
      return fullPath;
    } catch {}

    // Try with different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];
    for (const ext of extensions) {
      const testPath = fullPath + ext;
      try {
        require('fs').accessSync(testPath);
        return testPath;
      } catch {}
    }

    return null;
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript React',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript React',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.c': 'C',
      '.cpp': 'C++',
      '.h': 'C/C++ Header',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.sql': 'SQL',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.toml': 'TOML',
      '.xml': 'XML',
      '.md': 'Markdown',
      '.sh': 'Shell',
      '.bash': 'Bash',
      '.prisma': 'Prisma Schema',
    };
    return languageMap[ext] || 'Unknown';
  }

  async findFilesByPattern(pattern: RegExp | string): Promise<string[]> {
    const files: string[] = [];
    const searchDir = this.projectRoot;
    
    try {
      await this.walkDirectory(searchDir, files, pattern);
    } catch (error) {
      console.warn('⚠️ Error walking directory:', error);
    }
    
    return files;
  }

  private async walkDirectory(dir: string, files: string[], pattern: RegExp | string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules and hidden directories
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        await this.walkDirectory(fullPath, files, pattern);
      } else {
        const relativePath = path.relative(this.projectRoot, fullPath);
        if (typeof pattern === 'string') {
          if (relativePath.includes(pattern)) {
            files.push(relativePath);
          }
        } else if (pattern.test(relativePath)) {
          files.push(relativePath);
        }
      }
    }
  }

  async getProjectStructure(depth: number = 2): Promise<string> {
    let structure = '';
    
    try {
      const files = await fs.readdir(this.projectRoot);
      
      structure += '### Project Structure\n\n';
      structure += `\`\`\`\n${path.basename(this.projectRoot)}/\n`;
      
      for (const file of files) {
        if (file.startsWith('.') || file === 'node_modules') continue;
        const fullPath = path.join(this.projectRoot, file);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          structure += `├── ${file}/\n`;
          if (depth > 1) {
            const subFiles = await fs.readdir(fullPath);
            for (const subFile of subFiles.slice(0, 5)) {
              if (subFile.startsWith('.') || subFile === 'node_modules') continue;
              structure += `│   ├── ${subFile}\n`;
            }
            if (subFiles.length > 5) {
              structure += `│   └── ... (${subFiles.length - 5} more)\n`;
            }
          }
        } else {
          structure += `├── ${file}\n`;
        }
      }
      
      structure += '```\n\n';
    } catch (error) {
      console.warn('⚠️ Could not get project structure:', error);
    }
    
    return structure;
  }
}