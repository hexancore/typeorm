import { DataSource, EntityManager } from 'typeorm';
import { DataSourceManager, WeakDataSourceRef } from './DataSourceManager';
import { DataSourceContextConfig } from './DataSourceContextConfig';
import { AR } from '@hexancore/common';

export abstract class AbstractDataSourceContext {
  public constructor(private manager: DataSourceManager) { }

  public get(): AR<WeakDataSourceRef> {
    return this.getConfig().onOk((config) => {
      return this.manager.get(config);
    }) as any;
  }

  protected abstract getConfig(): AR<DataSourceContextConfig>;

  public getDataSource(): AR<DataSource> {
    return this.get().onOk((r) => r.ds!);
  }

  public getEntityManager(): AR<EntityManager> {
    return this.get().onOk((r) => r.em!);
  }
}
