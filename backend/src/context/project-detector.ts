
import fs from 'fs/promises';
import path from 'path';
import { ProjectContext } from './types';
import { FileCollector } from './file-collector';

export class ProjectDetector {
  private projectRoot: string;
  private fileCollector: FileCollector;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.fileCollector = new FileCollector(projectRoot);
  }

  async detect(): Promise<ProjectContext> {
    const context: ProjectContext = {
      name: 'DevAssist AI',
      language: 'TypeScript',
    };

    try {
      // Read package.json
      const packageJson = await this.readPackageJson();
      if (packageJson) {
        context.name = packageJson.name || 'DevAssist AI';
        context.packageManager = this.detectPackageManager();
        context.version = packageJson.version;
        context.dependencies = packageJson.dependencies || {};
        context.devDependencies = packageJson.devDependencies || {};
        context.scripts = packageJson.scripts || {};

        // Detect frameworks
        this.detectFrameworks(packageJson, context);

        // Detect ORM
        this.detectORM(packageJson, context);

        // Detect database
        this.detectDatabase(packageJson, context);
      }

      // Get project structure
      context.structure = await this.fileCollector.getProjectStructure(2);

      // Detect additional frameworks from config files
      await this.detectFrameworksFromConfig(context);

    } catch (error) {
      console.warn('⚠️ Project detection incomplete:', error);
    }

    return context;
  }

  private async readPackageJson(): Promise<any> {
    try {
      const content = await fs.readFile(
        path.join(this.projectRoot, 'package.json'),
        'utf-8'
      );
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private detectPackageManager(): string {
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    for (const lockFile of lockFiles) {
      try {
        if (require('fs').existsSync(path.join(this.projectRoot, lockFile))) {
          if (lockFile === 'package-lock.json') return 'npm';
          if (lockFile === 'yarn.lock') return 'yarn';
          if (lockFile === 'pnpm-lock.yaml') return 'pnpm';
        }
      } catch {}
    }
    return 'unknown';
  }

  private detectFrameworks(packageJson: any, context: ProjectContext) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Frontend frameworks
    if (deps.react) {
      context.frontend = 'React';
      if (deps.next) {
        context.frontend = 'Next.js';
      } else if (deps['react-router-dom']) {
        context.frontend = 'React + React Router';
      }
    } else if (deps.vue) {
      context.frontend = 'Vue';
      if (deps.nuxt) {
        context.frontend = 'Nuxt';
      }
    } else if (deps.angular) {
      context.frontend = 'Angular';
    } else if (deps.svelte) {
      context.frontend = 'Svelte';
    }

    // Backend frameworks
    if (deps.express) {
      context.backend = 'Express';
      if (deps.nestjs) {
        context.backend = 'NestJS';
      }
    } else if (deps.fastify) {
      context.backend = 'Fastify';
    } else if (deps.koa) {
      context.backend = 'Koa';
    } else if (deps['@nestjs/core']) {
      context.backend = 'NestJS';
    }
  }

  private detectORM(packageJson: any, context: ProjectContext) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.prisma) {
      context.orm = 'Prisma';
    } else if (deps.typeorm) {
      context.orm = 'TypeORM';
    } else if (deps.sequelize) {
      context.orm = 'Sequelize';
    } else if (deps.mongoose) {
      context.orm = 'Mongoose';
    } else if (deps.knex) {
      context.orm = 'Knex';
    }
  }

  private detectDatabase(packageJson: any, context: ProjectContext) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.pg || deps.postgres) {
      context.database = 'PostgreSQL';
    } else if (deps.mysql || deps.mysql2) {
      context.database = 'MySQL';
    } else if (deps.mongodb) {
      context.database = 'MongoDB';
    } else if (deps.sqlite3) {
      context.database = 'SQLite';
    } else if (deps.oracledb) {
      context.database = 'Oracle';
    } else if (deps.mssql) {
      context.database = 'SQL Server';
    }
  }

  private async detectFrameworksFromConfig(context: ProjectContext) {
    try {
      const files = await fs.readdir(this.projectRoot);

      // Next.js
      if (files.includes('next.config.js') || files.includes('next.config.ts')) {
        context.frontend = 'Next.js';
      }

      // Vite
      if (files.includes('vite.config.ts') || files.includes('vite.config.js')) {
        if (context.frontend && !context.frontend.includes('Vite')) {
          context.frontend = `Vite + ${context.frontend}`;
        } else if (!context.frontend) {
          context.frontend = 'Vite';
        }
      }

      // Tailwind
      if (files.includes('tailwind.config.js') || files.includes('tailwind.config.ts')) {
        if (context.frontend) {
          context.frontend = `${context.frontend} + Tailwind CSS`;
        }
      }

      // Prisma
      if (files.includes('prisma')) {
        context.orm = 'Prisma';
        try {
          const schema = await fs.readFile(
            path.join(this.projectRoot, 'prisma', 'schema.prisma'),
            'utf-8'
          );
          const match = schema.match(/provider\s*=\s*"(\w+)"/);
          if (match) {
            context.database = match[1].charAt(0).toUpperCase() + match[1].slice(1);
          }
        } catch {}
      }

      // Docker
      if (files.includes('docker-compose.yml') || files.includes('docker-compose.yaml')) {
        context.metadata = context.metadata || {};
        context.metadata.hasDocker = true;
      }

      // GraphQL
      if (files.some(f => f.includes('graphql') || f.includes('gql'))) {
        context.metadata = context.metadata || {};
        context.metadata.hasGraphQL = true;
      }

    } catch (error) {
      // Silently fail
    }
  }

  async detectProjectType(): Promise<string> {
    try {
      const files = await fs.readdir(this.projectRoot);

      if (files.includes('package.json')) {
        const pkg = await this.readPackageJson();
        if (pkg) {
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (deps.react && deps.next) return 'nextjs';
          if (deps.react) return 'react';
          if (deps.vue) return 'vue';
          if (deps.angular) return 'angular';
          if (deps.express) return 'express';
          if (deps['@nestjs/core']) return 'nestjs';
        }
      }

      if (files.includes('requirements.txt') || files.includes('setup.py')) {
        return 'python';
      }

      if (files.includes('go.mod')) {
        return 'go';
      }

      if (files.includes('Cargo.toml')) {
        return 'rust';
      }

      if (files.includes('pom.xml')) {
        return 'java-maven';
      }

      if (files.includes('build.gradle')) {
        return 'java-gradle';
      }

      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
}