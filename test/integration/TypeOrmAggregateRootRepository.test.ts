/**
 * @group integration
 */

import { HcTypeOrmModule } from '@/HcTypeOrmModule';
import { OK } from '@hexancore/common';
import { AggregateRootRepositoryManager, HcModule } from '@hexancore/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Author, AuthorId, Book } from '@test/Module/Test/Domain/test_entities';
import { AuthorRepository, TestDataSourceContextIdProvider } from '@test/Module/Test/Domain/test_repositories';
import { PrivateTestInfraModule } from '@test/Module/Test/Infrastructure/PrivateTestInfraModule';

describe('TypeOrmAggregateRootRepository', () => {
  let module: TestingModule;
  let authorRepository: AuthorRepository;

  describe.each([{driver: 'mysql'}, {driver: 'postgres'}])("$driver", ({driver}) => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          HcModule,
          HcTypeOrmModule.forRoot({ dataSourceContextIdProvider: new TestDataSourceContextIdProvider(), configPath: 'core.typeorm-'+driver }),
          PrivateTestInfraModule,
        ],
      }).compile();

      authorRepository = await module.get(AggregateRootRepositoryManager).get<AuthorRepository>(Author);
    });

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    describe('persist', () => {
      test('when new entity, then insert', async () => {
        const author = new Author();
        const book = new Book('test');
        author.books.add(book);

        let r: any = await authorRepository.persist(author);

        expect(r).toMatchSuccessResult(true);

        r = await authorRepository.getAllAsArray();
        expect(r.v[0].id).toEqual(author.id);
        const abr = await r.v[0].books.getAllAsArray();
        expect(abr.isSuccess()).toBeTruthy();
        const ab = abr.v;
        expect(ab.length).toBe(1);
        expect(ab[0]).toEqual(book);
        const currentBookById = await r.v[0].books.getById(ab[0].id);
        expect(currentBookById).toEqual(OK(book));
      });

      test('when updated entity, then update', async () => {
        const author = new Author();

        const book = new Book('test');
        author.books.add(book);

        await authorRepository.persist(author);
        let r = await authorRepository.getAllAsArray();
        const abr = await r.v[0].books.getAllAsArray();
        const ab = abr.v;
        ab[0].name = 'test_new_name';
        r.v[0].books.update(ab[0]);

        await authorRepository.persist(r.v[0]);

        r = await authorRepository.getAllAsArray();
        expect((await r.v[0].books.getAllAsArray()).v[0].name).toEqual('test_new_name');
      });
    });

    test('getById() when not exists', async () => {
      const id = AuthorId.cs(1);
      const r = await authorRepository.getById(id);

      const expectedError = {
        type: 'test.domain.entity.author.not_found',
        code: 404,
        data: {
          searchCriteria: {
            id,
          },
        },
      };
      expect(r).toMatchAppError(expectedError);
    });
  });
});
