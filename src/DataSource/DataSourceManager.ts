import { DataSource, EntityManager } from 'typeorm';
import { DataSourceFactory } from './DataSourceFactory';
import { AR, ARP, CurrentTime, DateTime, ERR, Logger, OK, OKA, P, getLogger } from '@hexancore/common';
import { DataSourceContextConfig } from './DataSourceContextConfig';

export interface WeakDataSourceRef {
  ds?: DataSource;
  em?: EntityManager;
  lastUsedTime: number;
  durable: boolean;
  initPromise?: AR<WeakDataSourceRef>;
}

export class DataSourceManager {
  private map: Map<string, WeakDataSourceRef>;
  private logger: Logger;

  public constructor(
    private factory: DataSourceFactory,
    private maxIdleSec: number,
    private ct: CurrentTime,
  ) {
    this.map = new Map();
    this.logger = getLogger('core.typeorm.infra.data_source');
  }

  public async get(context: DataSourceContextConfig): ARP<WeakDataSourceRef> {
    const id = context.id;
    let ref = this.map.get(id);
    if (!ref) {
      ref = { lastUsedTime: this.ct.now.t, durable: context.durable };
      this.map.set(id, ref);

      const initPromise = this.factory.create(context).onOk((ds: DataSource) => {
        ref.initPromise = null;
        ref.ds = ds;
        ref.em = ds.manager;
        this.logger.debug(`Opened data source for id: ${id}`);
        return OK(ref);
      });
      ref.initPromise = initPromise;
      return ref.initPromise;
    }

    if (ref.initPromise) {
      await ref.initPromise;
    }

    this.closeAllIdle();

    return OKA(ref);
  }

  public closeAll(): AR<boolean> {
    this.logger.info('CloseAll', { sourceIds: Array.from(this.map.keys()) });
    const listToClose = [];

    this.map.forEach((ref, id) => {
      this.map.delete(id);
      listToClose.push(this.close(id, ref));
    });

    return P(Promise.allSettled(listToClose)).mapToTrue();
  }

  public closeAllIdle(): AR<boolean> {
    const now = this.ct.now;
    this.logger.debug('Start close idle data sources...');
    const listToClose = [];

    this.map.forEach((ref, id) => {
      if (!ref.durable && (now.t - ref.lastUsedTime > this.maxIdleSec)) {
        this.map.delete(id);
        listToClose.push(this.close(id, ref));
      }
    });

    return P(Promise.allSettled(listToClose)).onOk(() => {
      this.logger.debug('End close idle data sources...');
      return OK(true);
    });
  }

  private close(id: string, ref: WeakDataSourceRef): AR<boolean> {
    if (!ref.ds.isInitialized) {
      return OKA(true);
    }

    return P(ref.ds.destroy())
      .onOk(() => {
        this.logger.debug('Closed data source: ' + id, { lastUsedTime: DateTime.fromTimestamp(ref.lastUsedTime) });
        return OK(true);
      })
      .onErr((e) => {
        this.logger.error('Error when closing idle data source: ' + id, e);
        return ERR(e);
      });
  }
}
