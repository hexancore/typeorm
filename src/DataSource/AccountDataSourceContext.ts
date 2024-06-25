import { DataSourceManager } from './DataSourceManager';
import { AR, OKA } from '@hexancore/common';

import { AbstractDataSourceContext } from './AbstractDataSourceContext';
import { DataSourceContextConfig } from './DataSourceContextConfig';
import { Injectable } from '@nestjs/common';
import { AccountContext } from '@hexancore/core';
import { TYPEORM_ACCOUNT_PERSISTER_TYPE } from '@/Repository';

@Injectable()
export class AccountDataSourceContext extends AbstractDataSourceContext {
  public constructor(
    manager: DataSourceManager,
    protected ac: AccountContext,
  ) {
    super(manager);
  }

  protected getConfig(): AR<DataSourceContextConfig> {
    return OKA({
      id: this.ac.get().toString(),
      durable: false,
      persisterType: TYPEORM_ACCOUNT_PERSISTER_TYPE
    });
  }
}
