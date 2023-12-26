import { AR, AsyncResult, INTERNAL_ERR, INTERNAL_ERRA, P, RetryHelper } from '@hexancore/common';
import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export type ConnectionOptions = MysqlConnectionOptions | PostgresConnectionOptions;

export interface DataSourceFactoryOptions {
  common: Omit<ConnectionOptions, 'database'>;
  dbPrefix: string;
}

export class DataSourceFactory {
  public constructor(private options: DataSourceFactoryOptions) {}

  public create(id: string): AR<DataSource> {
    const options: ConnectionOptions | any = { ...this.options.common, database: this.options.dbPrefix + id };

    return new AsyncResult(
      RetryHelper.retryAsync(
        () => {
          let ds: DataSource = null;
          try {
            ds = new DataSource(options);
            return P(ds.initialize());
          } catch (e) {
            if (ds && ds.isInitialized) {
              return P(ds.destroy()).onOk(() => INTERNAL_ERR(e)).onErr(() => INTERNAL_ERR(e));
            }

            return INTERNAL_ERRA(e);
          }
        },
        { id: 'create_typeorm_data_source', retryDelay: 5000, maxAttempts: 10 },
      ),
    );
  }
}
