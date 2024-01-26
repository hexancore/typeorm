import { EntitySchema } from 'typeorm';
import { getHcPersisterTypeFromSchema } from './TypeOrmEntitySchema';

export class TypeOrmSchemaManager {
  private persisterTypeSchemaMap: Map<string, EntitySchema[]>;

  public constructor() {
    this.persisterTypeSchemaMap = new Map();
  }

  public getByPersisterType(persisterType: string): EntitySchema[] {
    const schemas = this.persisterTypeSchemaMap.get(persisterType);
    return schemas ?? [];
  }

  public register(schema: EntitySchema): void {
    const persisterType = getHcPersisterTypeFromSchema(schema);
    const schemas = this.persisterTypeSchemaMap.get(persisterType);
    if (!schemas) {
      this.persisterTypeSchemaMap.set(persisterType, [schema]);
    } else {
      schemas.push(schema);
    }
  }
}

export const TypeOrmGlobalSchemaManager = new TypeOrmSchemaManager();
