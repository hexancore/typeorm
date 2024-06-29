import { AppConfig } from '@hexancore/core';
import type { HcTypeOrmModuleOptions } from './HcTypeOrmModuleOptions';
import type { Provider } from '@nestjs/common';
import { AppMeta } from '@hexancore/common';
import z from 'zod';
import { SnakeNamingStrategy } from './DataSource/SnakeNamingStrategy';
import type { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions.js';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

export const CONFIG_TOKEN = 'HC_TYPEORM_CONFIG';

function parseConfig(plain: any) {
  const configParser = z.object({
    type: z.enum(['postgres', 'mariadb']),
    dropSchema: z.boolean().default(false),
    synchronizeSchema: z.boolean().default(false),
    port: z.number().min(1024).max(65535),
    charset: z.string().default((plain?.type === 'postgres' ? 'utf8' : 'utf8mb4')),
    useUTC: z.boolean().default(true),
    timezone: z.string().default('Z'),
    cache: z.union([z.boolean().default(false), z.any()]).default(false), // TODO: replace any with typeorm config object
    connectTimeoutMs: z.number().default(5 * 1000),
    metadataTableName: z.string().default("hc_typeorm_metadata"),
    migrationsTableName: z.string().default("hc_typeorm_migrations"),
    poolSize: z.number().min(1).default(5),
    maxDataSourceIdleSecs: z.number().default(5 * 60),
    dbPrefix: z.string().default(''),
    authSecretKey: z.string().default('core.typeorm'),
    retryDelay: z.number().default(5000),
    maxRetryAttempts: z.number().default(5),
  }).describe("Hexancore TypeORM config");

  return configParser.parse(plain);
}

export const HcTypeOrmModuleConfigProvider = (moduleOptionsToken: string | symbol): Provider => {
  return {
    provide: CONFIG_TOKEN,
    inject: [AppConfig, moduleOptionsToken],
    useFactory: (config: AppConfig, options: HcTypeOrmModuleOptions) => {
      const configPath = options.configPath ?? 'core.typeorm';
      const c = config.getOrPanic(configPath);
      const parsedConfig = parseConfig(c);

      const isProd = AppMeta.get().isProd();
      const dropSchema = parsedConfig.dropSchema === true && !isProd;
      const synchronizeSchema = parsedConfig.synchronizeSchema === true && !isProd;

      const commonDataSourceConfig: MysqlConnectionOptions | PostgresConnectionOptions = {
        type: parsedConfig.type,
        port: parsedConfig.port,
        connectTimeout: parsedConfig.connectTimeoutMs,
        connectTimeoutMS: parsedConfig.connectTimeoutMs,
        poolSize: parsedConfig.poolSize,
        charset: parsedConfig.charset,
        useUTC: parsedConfig.useUTC,
        timezone: parsedConfig.timezone,
        metadataTableName: parsedConfig.metadataTableName,
        migrationsTableName: parsedConfig.migrationsTableName,
        applicationName: AppMeta.get().id,
        synchronize: synchronizeSchema,
        dropSchema: dropSchema,
        namingStrategy: new SnakeNamingStrategy(),
        cache: parsedConfig.cache
      };

      return {
        maxDataSourceIdleSecs: parsedConfig.maxDataSourceIdleSecs,
        commonDataSourceConfig,
        dbPrefix: parsedConfig.dbPrefix,
        authSecretKey: parsedConfig.authSecretKey,
        retryDelay: parsedConfig.retryDelay,
        maxRetryAttempts: parsedConfig.maxRetryAttempts,
      };
    },
  };
};