import { AbstractValueObject } from '@hexancore/common';
import { AbstractEntityCommon, ENTITY_META_PROPERTY } from '@hexancore/core';
import { EntitySchema, EntitySchemaColumnOptions, EntitySchemaEmbeddedColumnOptions, EntitySchemaIndexOptions, EntitySchemaOptions } from 'typeorm';
import { EntitySchemaUniqueOptions } from 'typeorm/entity-schema/EntitySchemaUniqueOptions';

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

export const TypeOrmEntitySchema = <T extends AbstractEntityCommon<any> | AbstractValueObject<any>>(
  entityClass: { new (...args: any[]): T },
  options: TypeOrmEntitySchemaOptions<T>,
): EntitySchema<T> => {
  if (!entityClass[ENTITY_META_PROPERTY]) {
    throw new ReferenceError(`Missing Entity or AggregateRoot decorator on entity class: ${entityClass.name}`);
  }

  return new EntitySchema<T>({
      name: entityClass.name,
      target: entityClass,
      tableName: entityClass[ENTITY_META_PROPERTY].module + '_' + entityClass.name,
      ...(options as any),
    });
};
