import { AR, ERRA, LogicError, OKA, R } from '@hexancore/common';
import { AbstractEntity, EntityCollectionImpl, EntityCollectionQueriesImpl, EntityIdTypeOf } from '@hexancore/core';
import { AbstractTypeOrmEntityRepository } from './AbstractTypeOrmEntityRepository';

/**
 * TypeOrm queries for entity collection
 */
export class TypeOrmEntityCollectionQueries<T extends AbstractEntity<any, any>, RepositoryType extends AbstractTypeOrmEntityRepository<T, any>>
  implements EntityCollectionQueriesImpl<T>
{
  public collection: EntityCollectionImpl<T>;

  public constructor(private r: RepositoryType) {}

  public all(): AsyncGenerator<R<T>, void, void> {
    if (this.collection === undefined) {
      throw new LogicError('Collection is not sets');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    async function* g() {
      const entities = await that.r.getByRootId(that.collection.rootId);

      if (entities.isError()) {
        yield ERRA<T>(entities.e).promise;
      }

      for (const entity of entities.v) {
        yield OKA(entity);
      }

      return;
    }

    return g();
  }

  public getById(id: EntityIdTypeOf<T>): AR<T> {
    return this.r.getById(id, this.collection.rootId);
  }
}
