import { AggregateRootRepository, AnyAggregateRoot, AnyEntity, EntityRepository } from '@hexancore/core';
import { Injectable, applyDecorators } from '@nestjs/common';
import { EntitySchema } from 'typeorm';
import { AbstractTypeOrmAggregateRootRepository } from './AbstractTypeOrmAggregateRootRepository';
import { AbstractTypeOrmEntityRepository } from './AbstractTypeOrmEntityRepository';
import * as path from 'path';
import { LogicError } from '@hexancore/common';
import { getHcPersisterTypeFromSchema } from '@/Schema/TypeOrmEntitySchema';

export const TYPEORM_SYSTEM_PERSISTER_TYPE = 'typeorm_system';
export const TYPEORM_ACCOUNT_PERSISTER_TYPE = 'typeorm_account';

export type AnyTypeOrmEntityRepository = AbstractTypeOrmEntityRepository<any, any>;
export type TypeOrmEntityRepositoryConstructor<T extends AnyTypeOrmEntityRepository> = new (...args: any[]) => T;

function extractPersisterTypeFromPath(p: string): string {
  p = p.split(path.sep).join(path.posix.sep);

  const matches = p.match(/TypeOrm\/(System|Account)\/.+/);
  if (matches) {
    const type = matches[1];
    switch (type) {
      case 'System':
        return TYPEORM_SYSTEM_PERSISTER_TYPE;
      case 'Account':
        return TYPEORM_ACCOUNT_PERSISTER_TYPE;
    }
  }

  throw new LogicError('Wrong entity repository path: ' + p);
}

/**
 * Decorator for entity repository
 * @param entitySchema Schema of entity
 */

export function TypeOrmEntityRepository<T extends AnyEntity, R extends AbstractTypeOrmEntityRepository<T>>(
  schema: EntitySchema<T>,
): (constructor: TypeOrmEntityRepositoryConstructor<R>) => void {
  return function (constructor) {
    EntityRepository(schema.options.target as any, getHcPersisterTypeFromSchema(schema))(constructor);
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
  const repositoryDecorator: ClassDecorator = AggregateRootRepository(schema.options.target as any, getHcPersisterTypeFromSchema(schema)) as any;
  return applyDecorators(repositoryDecorator, Injectable());
}
