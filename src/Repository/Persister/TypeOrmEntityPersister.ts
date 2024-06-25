import type { AbstractDataSourceContext } from '@/DataSource';
import { AR, ARW, ERR, GetQueryOptions, IGNORE_ERROR, INTERNAL_ERROR, OK, OKA, P, isIgnoreError, wrapToArray } from '@hexancore/common';
import { AbstractEntityCommon, AbstractEntityPersister, AbstractEntityRepositoryCommon, EntityIdTypeOf, EntityMetaCommon } from '@hexancore/core';
import { DataSource, EntityManager, EntityMetadata, FindManyOptions, FindOneOptions, Repository, UpdateValuesMissingError } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';

const SAVE_ERROR_HANDLER = (e: unknown) => (e instanceof UpdateValuesMissingError ? IGNORE_ERROR() : INTERNAL_ERROR(e as Error));

const ID_TO_WHERE_HELPER = {
  one: (id: any) => OKA({ id }),
  multiple: (id: any) => OKA({ ...id }),
};

/**
 * Executes all operations for selected repository on database.
 */
export class TypeOrmEntityPersister<T extends AbstractEntityCommon<any>, M extends EntityMetaCommon<T>> extends AbstractEntityPersister<T, M> {
  protected typeOrmMeta!: EntityMetadata;
  protected idToWhereFn!: (id: EntityIdTypeOf<T>) => AR<Record<string, any>>;

  public constructor(
    repository: AbstractEntityRepositoryCommon<T, TypeOrmEntityPersister<T, M>, any>,
    protected context: AbstractDataSourceContext,
  ) {
    super(repository);
  }

  protected doPersist(entities: T[]): AR<boolean> {
    return this.getTypeOrmRepository()
      .onOk((r) =>
        ARW(r.save(entities), SAVE_ERROR_HANDLER).onErr((e) => {
          if (!isIgnoreError(e)) {
            if (e.message.startsWith('Duplicate entry')) {
              return this.DUPLICATE<boolean>({ message: e.message });
            }
            return ERR<boolean>(e);
          }
          return true;
        }),
      )
      .mapToTrue();
  }

  public getById(id: EntityIdTypeOf<T>): AR<T> {
    return this.prepareIdToWhere(id).onOk((idWhere) => {
      return this.getOneBy({
        where: idWhere,
      });
    });
  }

  public getAll(options?: GetQueryOptions<T>): AR<Iterable<T>> {
    const findOptions: FindManyOptions = {};
    if (options) {
      findOptions.order = options.orderBy;
      findOptions.take = options.limit;
      findOptions.skip = options.offset;
    }
    return this.getBy(findOptions);
  }

  public getOneBy(options: FindOneOptions<T>): AR<T> {
    return this.getTypeOrmRepository().onOk((r) => {
      return ARW(r.findOne(options)).onOk((entity) => {
        if (!entity) {
          return this.NOT_FOUND<T>(options.where!);
        }
        this.markAsTracked([entity]);
        return entity;
      });
    });
  }

  public getBy(options?: FindManyOptions<T>): AR<Iterable<T>> {
    return this.getTypeOrmRepository().onOk((r) =>
      P(r.find(options)).onOk((entities: T[]) => {
        this.markAsTracked(entities);
        return OK(entities);
      }),
    );
  }

  public getByAsArray(options?: FindManyOptions<T>): AR<T[]> {
    return this.getBy(options) as any;
  }

  public delete(entity: T | T[]): AR<number> {
    return this.getEntityManager().onOk((em) => {
      const entities = wrapToArray(entity);
      return P(em.remove(entities)).onOk(() => entities.length);
    });
  }

  public prepareIdToWhere(id: EntityIdTypeOf<T>): AR<Record<string, any>> {
    if (this.idToWhereFn === undefined) {
      return this.getTypeOrmEntityMetadata().onOk((m) => {
        this.idToWhereFn = m.hasMultiplePrimaryKeys ? ID_TO_WHERE_HELPER.multiple : ID_TO_WHERE_HELPER.one;
        return this.idToWhereFn(id);
      });
    }

    return this.idToWhereFn(id);
  }

  protected loadPropertiesToFillWithNow(): AR<string[]> {
    return this.getTypeOrmEntityMetadata().onOk((meta) => {
      const list: string[] = [];
      meta.columns.forEach((c: ColumnMetadata) => {
        if (c.type === 'timestamp' && !c.isNullable) {
          list.push(c.propertyName);
        }
      });

      return OK(list);
    });
  }

  public getTypeOrmEntityMetadata(): AR<EntityMetadata> {
    if (this.typeOrmMeta === undefined) {
      return this.getTypeOrmRepository().onOk((r) => {
        this.typeOrmMeta = r.metadata;
        return OK(this.typeOrmMeta);
      });
    }

    return OKA(this.typeOrmMeta);
  }

  protected getTypeOrmRepository(): AR<Repository<T>> {
    return this.getEntityManager().onOk((em) => em.getRepository(this.entityMeta.entityClass));
  }

  protected getEntityManager(): AR<EntityManager> {
    return this.context.getEntityManager();
  }

  protected getDataSource(): AR<DataSource> {
    return this.context.getDataSource();
  }
}
