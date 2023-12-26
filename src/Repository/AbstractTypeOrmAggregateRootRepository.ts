import { AbstractAggregateRoot, AbstractAggregateRootRepository, AggregateRootMeta, EntityIdTypeOf } from '@hexancore/core';
import { TypeOrmEntityPersister } from './Persister/TypeOrmEntityPersister';
import { AR } from '@hexancore/common';

export abstract class AbstractTypeOrmAggregateRootRepository<
  T extends AbstractAggregateRoot<any>,
  P extends TypeOrmEntityPersister<T, AggregateRootMeta<T>> = TypeOrmEntityPersister<T, AggregateRootMeta<T>>,
> extends AbstractAggregateRootRepository<T, P> {
  public getById(id: EntityIdTypeOf<T>): AR<T> {
    return this.persister.getById(id).map((entity) => {
      this.injectCollectionQueries(entity);
      return entity;
    });
  }
}
