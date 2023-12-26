import { AppMeta, CurrentTime, INTERNAL_ERROR, LogicError, OK, getLogger } from '@hexancore/common';
import { ConfigurableModuleBuilder, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { DataSourceContext, DataSourceContextIdProvider } from './DataSource/DataSourceContext';
import { DataSourceFactory } from './DataSource/DataSourceFactory';
import { DataSourceManager } from './DataSource/DataSourceManager';
import { TypeOrmEntityPersisterFactory } from './Repository/Persister/TypeOrmEntityPersisterFactory';
import { SnakeNamingStrategy } from './DataSource/SnakeNamingStrategy';
import { ModuleRef } from '@nestjs/core';
import { EntityPersisterFactoryManager } from '@hexancore/core';
import { TYPEORM_PERSISTER_TYPE } from './Repository';

export interface HcTypeOrmModuleOptions {
  configPath?: string;
  dbPrefix?: string;
  maxDataSourceIdleSecs?: number;
  dataSourceContextIdProvider: DataSourceContextIdProvider;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<HcTypeOrmModuleOptions>()
  .setClassMethodName('forRoot')
  .build();

@Module({
  providers: [
    {
      provide: DataSourceFactory,
      inject: [ConfigService, MODULE_OPTIONS_TOKEN],
      useFactory: (config: ConfigService, options: HcTypeOrmModuleOptions) => {
        const configPath = options.configPath ?? 'core.typeorm';
        const c = config.get(configPath);
        if (!c) {
          throw new LogicError('Empty config key for typeorm: '+configPath);
        }

        const isProd = AppMeta.get().isProd();
        const dropSchema = c.drop_schema == true && !isProd;
        const synchronizeSchema = c.synchronize_schema == true && !isProd;

        if (['mysql', 'postgres'].indexOf(c.type) === -1) {
          throw new LogicError('HcTypeOrmModule supports only mysql and postgres drivers');
        }

        const common: DataSourceOptions = {
          type: c.type,
          host: c.host,
          port: Number.parseInt(c.port),
          username: c.username,
          password: c.password,
          database: c.database,
          charset: c.charset,
          synchronize: synchronizeSchema,
          namingStrategy: new SnakeNamingStrategy(),
          cache: c.cache == true ? true : false,
          entities: c.entities,
          dropSchema: dropSchema,
        };

        return new DataSourceFactory({ common, dbPrefix: options.dbPrefix ?? '' });
      },
    },
    {
      provide: DataSourceManager,
      inject: [DataSourceFactory, CurrentTime, MODULE_OPTIONS_TOKEN],
      useFactory: (factory: DataSourceFactory, ct: CurrentTime, options: HcTypeOrmModuleOptions) => {
        return new DataSourceManager(factory, options.maxDataSourceIdleSecs ?? 60 * 60, ct);
      },
    },
    {
      provide: DataSourceContext,
      inject: [DataSourceManager, MODULE_OPTIONS_TOKEN],
      useFactory: (manager: DataSourceManager, options: HcTypeOrmModuleOptions) => {
        return new DataSourceContext(manager, options.dataSourceContextIdProvider);
      },
    },
    {
      provide: TypeOrmEntityPersisterFactory,
      inject: [DataSourceContext, EntityPersisterFactoryManager],
      useFactory: (context: DataSourceContext, factoryManager: EntityPersisterFactoryManager) => {
        const factory = new TypeOrmEntityPersisterFactory(context);
        factoryManager.registerFactory(TYPEORM_PERSISTER_TYPE, factory);
        return factory;
      },
    },
  ],
  exports: [TypeOrmEntityPersisterFactory, DataSourceManager, DataSourceContext, DataSourceFactory],
})
export class HcTypeOrmModule extends ConfigurableModuleClass implements OnApplicationShutdown {
  public constructor(private moduleRef: ModuleRef) {
    super();
  }

  public async onApplicationShutdown(): Promise<void> {
    const manager = this.moduleRef.get<DataSourceManager>(DataSourceManager);

    try {
      (await manager.closeAll()).onErr((e) => {
        getLogger('core.typeorm').log(e);
        return OK(true);
      });
    } catch (e) {
      getLogger('core.typeorm').log(INTERNAL_ERROR(e));
    }
  }
}
