import { TypeOrmGlobalSchemaManager } from '@/Schema/TypeOrmSchemaManager';
import { AR, ARW, INTERNAL_ERR, INTERNAL_ERRA, RetryHelper, RetryMaxAttemptsError } from '@hexancore/common';
import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DataSourceContextConfig } from './DataSourceContextConfig';
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

  public create(config: DataSourceContextConfig): AR<DataSource, RetryMaxAttemptsError> {
    const database = this.getDatabase(config.id);
    const entities = TypeOrmGlobalSchemaManager.getByPersisterType(config.persisterType);
    const options: ConnectionOptions & any = {
      ...this.options.common,
      database,
      entities,
    };

    return RetryHelper.retryAsync(() => {
      let ds: DataSource | null = null;
      try {
        ds = new DataSource(options);
        return ARW(ds.initialize());
      } catch (e) {
        if (ds && ds.isInitialized) {
          return ARW(ds.destroy())
            .onOk(() => INTERNAL_ERR<DataSource, any>(e))
            .onErr(() => INTERNAL_ERR<DataSource, any>(e));
        }

        return INTERNAL_ERRA(e as any);
      }
    },
      {
        id: 'create_typeorm_data_source_' + config.id,
        retryDelay: this.options.retryDelay,
        maxAttempts: this.options.maxRetryAttempts,
      },
    );
  }

  private getDatabase(id: string): string {
    return this.options.dbPrefix + id;
  }
}
