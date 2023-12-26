import { AggregateRootRepository, AnyAggregateRoot, AnyEntity, EntityRepository } from '@hexancore/core';
import { Injectable, applyDecorators } from '@nestjs/common';
import { EntitySchema } from 'typeorm';
import { AbstractTypeOrmAggregateRootRepository } from './AbstractTypeOrmAggregateRootRepository';
import { AbstractTypeOrmEntityRepository } from './AbstractTypeOrmEntityRepository';

export const TYPEORM_PERSISTER_TYPE = 'typeorm';

export type AnyTypeOrmEntityRepository = AbstractTypeOrmEntityRepository<any, any>;
export type TypeOrmEntityRepositoryConstructor<T extends AnyTypeOrmEntityRepository> = new (...args: any[]) => T;

/**
 * Decorator for entity repository
 * @param entitySchema Schema of entity
 */

export function TypeOrmEntityRepository<T extends AnyEntity, R extends AbstractTypeOrmEntityRepository<T>>(
  schema: EntitySchema<T>,
): (constructor: TypeOrmEntityRepositoryConstructor<R>) => void {
  return function (constructor) {
    EntityRepository(schema.options.target as any, TYPEORM_PERSISTER_TYPE)(constructor);
  };
}

export type AnyTypeOrmAggregateRootRepository = AbstractTypeOrmAggregateRootRepository<any, any>;
export type TypeOrmAggregateRootRepositoryConstructor<T extends AnyTypeOrmAggregateRootRepository> = new (...args: any[]) => T;

/**
 * Decorator for Aggregate root repository
 * @param aggregateRoot Aggregate root class
 * @param entitySchema Schema of entity
 */
export function TypeOrmAggregateRootRepository<T extends AnyAggregateRoot, R extends AbstractTypeOrmAggregateRootRepository<T>>(
  schema: EntitySchema<T>,
): (constructor: TypeOrmAggregateRootRepositoryConstructor<R>) => void {
  return applyDecorators(AggregateRootRepository(schema.options.target as any, TYPEORM_PERSISTER_TYPE), Injectable());
}
