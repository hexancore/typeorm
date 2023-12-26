import { DataSource, EntityManager } from 'typeorm';
import { DataSourceManager, WeakDataSourceRef } from './DataSourceManager';
import { AR, AsyncResult, PS } from '@hexancore/common';

export interface DataSourceContextIdProvider {
  get(): string;
}

export class DataSourceContext {
  public constructor(
    private manager: DataSourceManager,
    private idProvider: DataSourceContextIdProvider,
  ) {}

  public get(): AR<WeakDataSourceRef> {
    const id = this.idProvider.get();
    return new AsyncResult(this.manager.get(id));
  }

  public getDataSource(): AR<DataSource> {
    return this.get().map((r) => r.ds);
  }

  public getEntityManager(): AR<EntityManager> {
    return this.get().map((r) => r.em);
  }
}
