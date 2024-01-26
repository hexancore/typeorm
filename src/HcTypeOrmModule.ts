import { AppMeta, CurrentTime, INTERNAL_ERROR, LogicError, OK, getLogger } from '@hexancore/common';
import { AppConfig, EntityPersisterFactoryManager } from '@hexancore/core';
import { ConfigurableModuleBuilder, Module, OnApplicationShutdown } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AccountDataSourceContext } from './DataSource';
import { DataSourceFactory } from './DataSource/DataSourceFactory';
import { DataSourceManager } from './DataSource/DataSourceManager';
import { SnakeNamingStrategy } from './DataSource/SnakeNamingStrategy';
import { SystemDataSourceContext } from './DataSource/SystemDataSourceContext';
import { TYPEORM_ACCOUNT_PERSISTER_TYPE, TYPEORM_SYSTEM_PERSISTER_TYPE } from './Repository';
import { TypeOrmEntityPersisterFactory } from './Repository/Persister/TypeOrmEntityPersisterFactory';

export interface HcTypeOrmModuleOptions {
  configPath?: string;
  accountContext: boolean;
}

const CONFIG_TOKEN = 'HC_TYPEORM_CONFIG';

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<HcTypeOrmModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras({ accountContext: false }, (def, extras) => {
    def.providers = def.providers ?? [];
    if (extras.accountContext) {
      def.providers.push(AccountDataSourceContext);
      def.providers.push({
        provide: 'AccountEntityPersisterFactory',
        inject: [AccountDataSourceContext, EntityPersisterFactoryManager],
        useFactory: (account: AccountDataSourceContext, factoryManager: EntityPersisterFactoryManager) => {
          const accountFactory = new TypeOrmEntityPersisterFactory(account);
          factoryManager.registerFactory(TYPEORM_ACCOUNT_PERSISTER_TYPE, accountFactory);
          return accountFactory;
        },
      });
    }
    return def;
  })
  .build();

@Module({
  providers: [
    {
      provide: CONFIG_TOKEN,
      inject: [AppConfig, MODULE_OPTIONS_TOKEN],
      useFactory: (config: AppConfig, options: HcTypeOrmModuleOptions) => {
        const configPath = options.configPath ?? 'core.typeorm';
        const c = config.config.get(configPath);
        if (!c) {
          throw new LogicError('Empty config key for typeorm: ' + configPath);
        }

        const supportedDrivers = ['mysql', 'postgres', 'mariadb'];
        if (['mysql', 'postgres', 'mariadb'].indexOf(c.type) === -1) {
          throw new LogicError(`HcTypeOrmModule supports only [${supportedDrivers.join(", ")}] drivers`);
        }

        const isProd = AppMeta.get().isProd();
        const dropSchema = c.dropSchema == true && !isProd;
        const synchronizeSchema = c.synchronizeSchema == true && !isProd;

        const common: MysqlConnectionOptions | PostgresConnectionOptions = {
          type: c.type,
          host: c.host,
          port: Number.parseInt(c.port),
          charset: c.charset ?? (c.type === 'postgres' ? 'utf8' : 'utf8mb4'),
          applicationName: AppMeta.get().id,
          useUTC: true,
          timezone: 'Z',
          synchronize: synchronizeSchema,
          namingStrategy: new SnakeNamingStrategy(),
          cache: c.cache == true ? true : false,
          dropSchema: dropSchema,
        };

        return {
          maxDataSourceIdleSecs: c.maxDataSourceIdleSecs ?? 60 * 60,
          commonDataSourceConfig: common,
          dbPrefix: c.dbPrefix ?? '',
          authSecretKey: c.authSecretKey ?? 'core.typeorm',
          retryDelay: c.retryDelay,
          maxRetryAttempts: c.maxRetryAttempts,
        };
      },
    },
    {
      provide: DataSourceFactory,
      inject: [CONFIG_TOKEN, AppConfig],
      useFactory: (typeOrmConfig: any, config: AppConfig) => {
        const secret = config.secrets.getAsBasicAuth(typeOrmConfig.authSecretKey);
        if (secret.isError()) {
          secret.e.panic();
        }

        typeOrmConfig.commonDataSourceConfig.username = secret.v.username;
        typeOrmConfig.commonDataSourceConfig.password = secret.v.password;

        return new DataSourceFactory({
          common: typeOrmConfig.commonDataSourceConfig,
          dbPrefix: typeOrmConfig.dbPrefix,
          retryDelay: typeOrmConfig.retryDelay,
          maxRetryAttempts: typeOrmConfig.maxRetryAttempts,
        });
      },
    },
    {
      provide: DataSourceManager,
      inject: [DataSourceFactory, CurrentTime, CONFIG_TOKEN],
      useFactory: (factory: DataSourceFactory, ct: CurrentTime, typeOrmConfig: any) => {
        return new DataSourceManager(factory, typeOrmConfig.maxDataSourceIdleSecs, ct);
      },
    },
    SystemDataSourceContext,
    {
      provide: 'SystemEntityPersisterFactory',
      inject: [SystemDataSourceContext, EntityPersisterFactoryManager],
      useFactory: (system: SystemDataSourceContext, factoryManager: EntityPersisterFactoryManager) => {
        const systemFactory = new TypeOrmEntityPersisterFactory(system);
        factoryManager.registerFactory(TYPEORM_SYSTEM_PERSISTER_TYPE, systemFactory);
        return systemFactory;
      },
    },
  ],
  exports: [DataSourceManager],
})
export class HcTypeOrmModule extends ConfigurableModuleClass implements OnApplicationShutdown {
  public constructor(private moduleRef: ModuleRef) {
    super();
  }

  public async onApplicationShutdown(): Promise<void> {
    const manager = this.moduleRef.get<DataSourceManager>(DataSourceManager);
    const logger = getLogger('core.typeorm');
    try {
      (await manager.closeAll()).onErr((e) => {
        logger.log(e);
        return OK(true);
      });
    } catch (e) {
      logger.log(INTERNAL_ERROR(e));
    }
  }
}
