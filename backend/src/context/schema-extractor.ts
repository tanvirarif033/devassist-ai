

import { prisma } from '../database';

export class SchemaExtractor {
  private includeRelations: boolean = true;
  private includeIndexes: boolean = true;

  async extract(includeRelations: boolean = true, includeIndexes: boolean = true): Promise<string> {
    this.includeRelations = includeRelations;
    this.includeIndexes = includeIndexes;

    try {
      const tables = await this.getTablesFromPrisma();
      
      if (tables.length === 0) {
        return 'No database schema found. Please check your database connection.';
      }

      let schema = '### Database Schema\n\n';
      schema += `**Total Tables:** ${tables.length}\n\n`;

      // Add ER Diagram summary
      schema += '#### Entity Relationship Overview\n';
      const tableNames = tables.map(t => t.name).join(', ');
      schema += `Tables: ${tableNames}\n\n`;

      for (const table of tables) {
        schema += this.formatTableSchema(table);
      }

      return schema;
    } catch (error) {
      console.warn('⚠️ Could not extract schema:', error);
      return 'Database schema unavailable. Please ensure database is connected.';
    }
  }

  private async getTablesFromPrisma(): Promise<any[]> {
    try {
      const tables = await prisma.$queryRaw`
        SELECT 
          t.table_name,
          t.table_type
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `;

      const result = [];
      for (const row of tables as any[]) {
        const tableName = row.table_name;
        const columns = await prisma.$queryRaw`
          SELECT 
            c.column_name,
            c.data_type,
            c.column_default,
            c.is_nullable,
            c.character_maximum_length,
            c.numeric_precision
          FROM information_schema.columns c
          WHERE c.table_name = ${tableName}
          ORDER BY c.ordinal_position
        `;

        const primaryKey = await this.getPrimaryKey(tableName);
        const foreignKeys = this.includeRelations ? await this.getForeignKeys(tableName) : [];
        const indexes = this.includeIndexes ? await this.getIndexes(tableName) : [];

        result.push({
          name: tableName,
          columns: columns as any[],
          primaryKey,
          foreignKeys,
          indexes,
        });
      }

      return result;
    } catch (error) {
      console.warn('⚠️ Could not get schema from database:', error);
      return [];
    }
  }

  private async getPrimaryKey(tableName: string): Promise<string[]> {
    try {
      const result = await prisma.$queryRaw`
        SELECT kcu.column_name
        FROM information_schema.key_column_usage kcu
        WHERE kcu.table_name = ${tableName}
          AND kcu.constraint_name IN (
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = ${tableName}
              AND constraint_type = 'PRIMARY KEY'
          )
      `;
      return (result as any[]).map(r => r.column_name);
    } catch {
      return [];
    }
  }

  private async getForeignKeys(tableName: string): Promise<any[]> {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.constraint_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = kcu.constraint_name
        JOIN information_schema.referential_constraints rc
          ON rc.constraint_name = kcu.constraint_name
        WHERE kcu.table_name = ${tableName}
          AND kcu.constraint_name LIKE '%fk%'
      `;
      return result as any[];
    } catch {
      return [];
    }
  }

  private async getIndexes(tableName: string): Promise<any[]> {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          i.relname AS index_name,
          a.attname AS column_name,
          ix.indisunique AS is_unique
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid
        WHERE t.relname = ${tableName}
          AND a.attnum = ANY(ix.indkey)
          AND NOT ix.indisprimary
        ORDER BY i.relname, a.attnum
      `;
      return result as any[];
    } catch {
      return [];
    }
  }

  private formatTableSchema(table: any): string {
    let schema = `#### 📊 Table: \`${table.name}\`\n\n`;

    // Columns
    schema += '**Columns:**\n';
    schema += '| Column | Type | Nullable | Default |\n';
    schema += '|--------|------|----------|---------|\n';
    
    for (const col of table.columns) {
      const isPK = table.primaryKey.includes(col.column_name);
      const colName = isPK ? `${col.column_name} 🔑` : col.column_name;
      const type = col.data_type;
      const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
      const defaultVal = col.column_default || 'NULL';
      schema += `| ${colName} | ${type} | ${nullable} | ${defaultVal} |\n`;
    }
    schema += '\n';

    // Relations
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      schema += '**Relations:**\n';
      for (const fk of table.foreignKeys) {
        schema += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
      }
      schema += '\n';
    }

    // Indexes
    if (table.indexes && table.indexes.length > 0) {
      schema += '**Indexes:**\n';
      const indexMap = new Map<string, string[]>();
      for (const idx of table.indexes) {
        if (!indexMap.has(idx.index_name)) {
          indexMap.set(idx.index_name, []);
        }
        indexMap.get(idx.index_name)!.push(idx.column_name);
      }
      for (const [name, columns] of indexMap) {
        // ✅ Fix: Safely check if index exists and has is_unique property
        const indexEntry = table.indexes.find((i: any) => i.index_name === name);
        const unique = indexEntry?.is_unique ? ' (UNIQUE)' : '';
        schema += `- \`${name}\`: ${columns.join(', ')}${unique}\n`;
      }
      schema += '\n';
    }

    return schema;
  }

  async getTableRelationships(): Promise<string> {
    try {
      const tables = await this.getTablesFromPrisma();
      let relationships = '### Table Relationships\n\n';
      
      for (const table of tables) {
        if (table.foreignKeys && table.foreignKeys.length > 0) {
          relationships += `**${table.name}** → `;
          // ✅ Fix: Explicitly type the parameter as 'any'
          const rels = table.foreignKeys.map((fk: any) => 
            `${fk.foreign_table_name} (${fk.column_name} → ${fk.foreign_column_name})`
          );
          relationships += rels.join(', ');
          relationships += '\n';
        }
      }

      return relationships || 'No table relationships found.';
    } catch (error) {
      console.warn('⚠️ Could not get table relationships:', error);
      return 'Table relationships unavailable.';
    }
  }
}