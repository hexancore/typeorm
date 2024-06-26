/**
 * @group integration
 */

import { AccountDataSourceContext } from '@';
import { HcTypeOrmModule } from '@/HcTypeOrmModule';
import { OK, AccountId } from '@hexancore/common';
import { AccountContext, AggregateRootRepositoryManager, HcModule } from '@hexancore/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IdentityPrimaryKeyAuthor } from '@testhelper/src/Test/Domain/IdentityPrimaryKeyAuthor';
import type { TypeOrmAuthorIdentityPrimaryKeyRepository } from '@testhelper/src/Test/Infrastructure/Persistence/TypeOrm';
import { PrivateTestInfraModule } from '@testhelper/src/Test/Infrastructure/PrivateTestInfraModule';
import { ClsService } from 'nestjs-cls';

describe('IdentityPrimaryKey', () => {
  let module: TestingModule;
  let authorRepository: TypeOrmAuthorIdentityPrimaryKeyRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        HcModule.forRoot({ cls: true, accountContext: { useCls: true, currentAccountId: AccountId.cs("test") } }),
        HcTypeOrmModule.forRoot({
          configPath: 'core.typeorm-postgres',
          accountContext: true,
        }),
        PrivateTestInfraModule,
      ],
    }).compile();

    authorRepository = await module.get(AggregateRootRepositoryManager).get<TypeOrmAuthorIdentityPrimaryKeyRepository>(IdentityPrimaryKeyAuthor);

  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  function runInAccountContext(accountId: string, fn: () => Promise<void>) {
    return () => {
      return module.get(ClsService).run(() => {
        module.get(AccountContext).set(AccountId.cs(accountId));
        return fn();
      });
    };
  }

  describe('persist', () => {
    test('when new entity, then insert', runInAccountContext('hexancore_dev', async () => {
      const author = new IdentityPrimaryKeyAuthor("test");
      let r: any = await authorRepository.persist(author);
      expect(r).toMatchSuccessResult(true);
      r = await authorRepository.getAllAsArray();

      expect(r.v[0].id).toEqual(author.id);
    }), 50000
    );
  });
});
