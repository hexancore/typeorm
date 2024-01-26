import { TYPEORM_ACCOUNT_PERSISTER_TYPE, TYPEORM_SYSTEM_PERSISTER_TYPE } from '@/Repository';
import { AbstractEntityCommon, ENTITY_META, ENTITY_META_PROPERTY } from '@hexancore/core';
import { EntitySchema, EntitySchemaColumnOptions, EntitySchemaEmbeddedColumnOptions, EntitySchemaIndexOptions } from 'typeorm';
import { EntitySchemaUniqueOptions } from 'typeorm/entity-schema/EntitySchemaUniqueOptions';
import { TypeOrmGlobalSchemaManager } from './TypeOrmSchemaManager';

type SchemaOmitEntityProps = '__modified' | '__modifiedProperties' | '__track' | '__tracked';
type TypeOrmEntitySchemaOptions<T> = {
  columns: {
    [P in keyof Omit<T, SchemaOmitEntityProps>]?: EntitySchemaColumnOptions;
  };
  indices?: EntitySchemaIndexOptions[];
  uniques?: EntitySchemaUniqueOptions[];
  embeddeds?: {
    [P in keyof Partial<Omit<T, SchemaOmitEntityProps>>]: EntitySchemaEmbeddedColumnOptions;
  };
};

export const TypeOrmSystemEntitySchema = <T extends AbstractEntityCommon<any>>(
  entityClass: new (...args: any[]) => T,
  options: TypeOrmEntitySchemaOptions<T>,
): EntitySchema<T> => {
  return TypeOrmEntitySchema(entityClass, options, TYPEORM_SYSTEM_PERSISTER_TYPE);
};

export const TypeOrmAccountEntitySchema = <T extends AbstractEntityCommon<any>>(
  entityClass: new (...args: any[]) => T,
  options: TypeOrmEntitySchemaOptions<T>,
): EntitySchema<T> => {
  return TypeOrmEntitySchema(entityClass, options, TYPEORM_ACCOUNT_PERSISTER_TYPE);
};

const TypeOrmEntitySchema = <T extends AbstractEntityCommon<any>>(
  entityClass: new (...args: any[]) => T,
  options: TypeOrmEntitySchemaOptions<T>,
  persisterType: string,
): EntitySchema<T> => {
  if (!entityClass[ENTITY_META_PROPERTY]) {
    throw new ReferenceError(`Missing Entity or AggregateRoot decorator on entity class: ${entityClass.name}`);
  }

  const schema = new EntitySchema<T>({
    name: entityClass.name,
    target: entityClass,
    hcPersisterType: persisterType,
    tableName: ENTITY_META(entityClass as any).module + '_' + entityClass.name,
    ...(options as any),
  });

  TypeOrmGlobalSchemaManager.register(schema as any);

  return schema;
};

export function getHcPersisterTypeFromSchema(schema: EntitySchema): string {
  const options = schema.options as any;
  return options.hcPersisterType;
}
