import { AR, OK } from '@hexancore/common';
import {
  AbstractEntity,
  AbstractEntityRepository,
  AggregateRootIdTypeOf,
  EntityCollectionQueries,
  EntityIdTypeOf,
  EntityMeta,
} from '@hexancore/core';
import { TypeOrmEntityCollectionQueries } from './TypeOrmEntityCollectionQueries';
import { TypeOrmEntityPersister } from './Persister/TypeOrmEntityPersister';

export abstract class AbstractTypeOrmEntityRepository<
  T extends AbstractEntity<any, any>,
  P extends TypeOrmEntityPersister<T, EntityMeta<T>> = TypeOrmEntityPersister<T, EntityMeta<T>>,
> extends AbstractEntityRepository<T, P> {
  protected getByIdCallback!: (id: EntityIdTypeOf<T>, rootId: AggregateRootIdTypeOf<T>) => AR<T>;

  protected createCollectionQueries(): EntityCollectionQueries<T> {
    return new TypeOrmEntityCollectionQueries(this);
  }

  public getByRootId(rootId: AggregateRootIdTypeOf<T>): AR<Iterable<T>> {
    const rootIdProperty = this.ENTITY_META.rootIdProperty;
    return this.persister.getBy({ where: { [rootIdProperty]: rootId } as any });
  }

  public getById(id: EntityIdTypeOf<T>, rootId: AggregateRootIdTypeOf<T>): AR<T> {
    if (this.getByIdCallback === undefined) {
      return this.initGetById().onOk(() => {
        return this.getByIdCallback(id, rootId);
      });
    }

    return this.getByIdCallback(id, rootId);
  }

  protected initGetById(): AR<boolean> {
    const rootIdProperty = this.ENTITY_META.rootIdProperty;
    return this.persister.getTypeOrmEntityMetadata().onOk((m) => {
      const isRootIdPrimary = m.columns.find((c) => c.propertyName == rootIdProperty && c.isPrimary) !== undefined;
      if (isRootIdPrimary) {
        this.getByIdCallback = (id: EntityIdTypeOf<T>, rootId: AggregateRootIdTypeOf<T>): AR<T> => {
          return this.persister.getOneBy({ where: { [rootIdProperty]: rootId, id } as any });
        };
      } else {
        this.getByIdCallback = (id: EntityIdTypeOf<T>, _rootId: AggregateRootIdTypeOf<T>): AR<T> => {
          return this.persister.getById(id);
        };
      }

      return OK(true);
    });
  }
}
