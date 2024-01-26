import { AR, AsyncResult, INTERNAL_ERR, INTERNAL_ERRA, P, RetryHelper } from '@hexancore/common';
import { DataSource, EntitySchema } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DataSourceContextConfig } from './DataSourceContextConfig';
import { TypeOrmGlobalSchemaManager } from '@/Schema/TypeOrmSchemaManager';
export type ConnectionOptions = MysqlConnectionOptions | PostgresConnectionOptions;

export interface DataSourceFactoryOptions {
  common: Omit<ConnectionOptions, 'database'>;
  dbPrefix?: string;
  retryDelay?: number;
  maxRetryAttempts?: number;
}

export class DataSourceFactory {
  public constructor(private options: DataSourceFactoryOptions) {
    options.dbPrefix = options.dbPrefix ?? '';
    this.options.retryDelay = this.options.retryDelay ?? 5000;
    this.options.maxRetryAttempts = this.options.maxRetryAttempts ?? 10;
  }

  public create(config: DataSourceContextConfig): AR<DataSource> {
    const database = this.getDatabase(config.id);
    const entities = TypeOrmGlobalSchemaManager.getByPersisterType(config.persisterType);
    const options: ConnectionOptions | any = {
      ...this.options.common,
      database,
      entities,
    };

    return new AsyncResult(
      RetryHelper.retryAsync(
        () => {
          let ds: DataSource = null;
          try {
            ds = new DataSource(options);
            return P(ds.initialize());
          } catch (e) {
            if (ds && ds.isInitialized) {
              return P(ds.destroy())
                .onOk(() => INTERNAL_ERR(e))
                .onErr(() => INTERNAL_ERR(e));
            }

            return INTERNAL_ERRA(e);
          }
        },
        {
          id: 'create_typeorm_data_source_' + config.id,
          retryDelay: this.options.retryDelay,
          maxAttempts: this.options.maxRetryAttempts,
        },
      ),
    );
  }

  private getDatabase(id: string): string {
    return this.options.dbPrefix + id;
  }
}
