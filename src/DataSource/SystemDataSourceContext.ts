import { AR, OKA } from '@hexancore/common';
import { DataSource, EntityManager } from 'typeorm';
import { DataSourceContext } from './DataSourceContext';
import { DataSourceContextConfig } from './DataSourceContextConfig';
import { WeakDataSourceRef } from './DataSourceManager';
import { Injectable } from '@nestjs/common';
import { TYPEORM_SYSTEM_PERSISTER_TYPE } from '@/Repository';

@Injectable()
export class SystemDataSourceContext extends DataSourceContext {
  protected getConfig(): AR<DataSourceContextConfig> {
    return OKA({
      id: 'system',
      durable: true,
      persisterType: TYPEORM_SYSTEM_PERSISTER_TYPE,
    });
  }
  private ref: WeakDataSourceRef;

  public get(): AR<WeakDataSourceRef> {
    if (this.ref) {
      return OKA(this.ref);
    }

    return super.get().onOk((ref) => {
      this.ref = ref;
      return ref;
    });
  }

  public getDataSource(): AR<DataSource> {
    return this.get().onOk((r) => r.ds);
  }

  public getEntityManager(): AR<EntityManager> {
    return this.get().onOk((r) => r.em);
  }
}
