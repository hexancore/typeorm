/**
 * @group integration
 */

import { AccountDataSourceContext, DataSourceManager } from '@';
import { HcTypeOrmModule } from '@/HcTypeOrmModule';
import { OK, AccountId } from '@hexancore/common';
import { AccountContext, AggregateRootRepositoryManager, HcModule } from '@hexancore/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IdentityPrimaryKeyAuthor } from '@test/Module/Test/Domain/IdentityPrimaryKeyAuthor';
import { Author, AuthorId, AuthorRepository, Book } from '@test/Module/Test/Domain/test_entities';
import type { TypeOrmAuthorIdentityPrimaryKeyRepository } from '@test/Module/Test/Infrastructure/Persistance/TypeOrm';
import { PrivateTestInfraModule } from '@test/Module/Test/Infrastructure/PrivateTestInfraModule';
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
    test('when new entity, then insert',
      runInAccountContext('hexancore_dev', async () => {
        const dataSourceManager = await module.get(AccountDataSourceContext).getEntityManager();
    const d = dataSourceManager.v;
        const author = new IdentityPrimaryKeyAuthor("test");
        let r: any = await authorRepository.persist(author);
        expect(r).toMatchSuccessResult(true);
        r = await authorRepository.getAllAsArray();

        expect(r.v[0].id).toEqual(author.id);
      }),
    );
  });
});
