import { CurrentTime, INTERNAL_ERROR, OK, getLogger } from '@hexancore/common';
import { AppConfig, EntityPersisterFactoryManager } from '@hexancore/core';
import { ConfigurableModuleBuilder, Module, OnApplicationShutdown } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AccountDataSourceContext } from './DataSource';
import { DataSourceFactory } from './DataSource/DataSourceFactory';
import { DataSourceManager } from './DataSource/DataSourceManager';
import { SystemDataSourceContext } from './DataSource/SystemDataSourceContext';
import { CONFIG_TOKEN, HcTypeOrmModuleConfigProvider } from './HcTypeOrmModuleConfigProvider';
import type { HcTypeOrmModuleOptions } from './HcTypeOrmModuleOptions';
import { TYPEORM_ACCOUNT_PERSISTER_TYPE, TYPEORM_SYSTEM_PERSISTER_TYPE } from './Repository';
import { TypeOrmEntityPersisterFactory } from './Repository/Persister/TypeOrmEntityPersisterFactory';

const SYSTEM_ENTITY_PERSISTER_FACTORY_TOKEN = 'HC_SystemEntityPersisterFactory';
const ACCOUNT_ENTITY_PERSISTER_FACTORY_TOKEN = 'HC_AccountEntityPersisterFactory';

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<HcTypeOrmModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras({ accountContext: false }, (def, extras) => {
    def.providers = def.providers ?? [];

    if (extras.accountContext) {
      def.providers.push(AccountDataSourceContext);
      def.providers.push({
        provide: ACCOUNT_ENTITY_PERSISTER_FACTORY_TOKEN,
        inject: [AccountDataSourceContext, EntityPersisterFactoryManager],
        useFactory: (context: AccountDataSourceContext, manager: EntityPersisterFactoryManager) => {
          const factory = new TypeOrmEntityPersisterFactory(context);
          manager.registerFactory(TYPEORM_ACCOUNT_PERSISTER_TYPE, factory);
          return factory;
        }
      });
    }

    def.providers.push(SystemDataSourceContext);
    def.providers.push({
      provide: SYSTEM_ENTITY_PERSISTER_FACTORY_TOKEN,
      inject: [SystemDataSourceContext, EntityPersisterFactoryManager],
      useFactory: (context: SystemDataSourceContext, manager: EntityPersisterFactoryManager) => {
        const factory = new TypeOrmEntityPersisterFactory(context);
        manager.registerFactory(TYPEORM_SYSTEM_PERSISTER_TYPE, factory);
        return factory;
      },
    });
    return def;
  })
  .build();

@Module({
  providers: [
    HcTypeOrmModuleConfigProvider(MODULE_OPTIONS_TOKEN),
    {
      provide: DataSourceFactory,
      inject: [CONFIG_TOKEN, AppConfig],
      useFactory: (typeOrmConfig: any, config: AppConfig) => {
        const secret = config.secrets.getAsBasicAuth(typeOrmConfig.authSecretKey);
        secret.panicIfError();
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
  ],
  exports: [DataSourceManager, SYSTEM_ENTITY_PERSISTER_FACTORY_TOKEN, ACCOUNT_ENTITY_PERSISTER_FACTORY_TOKEN],
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
      logger.log(INTERNAL_ERROR(e as any));
    }
  }
}
