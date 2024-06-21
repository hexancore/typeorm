/**
 * @group integration
 */

import { AccountId } from '@hexancore/common';
import { HcTypeOrmModule} from '@';
import { AccountContext, AggregateRootRepositoryManager, HcModule } from '@hexancore/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorId, BookId, CompositeAuthor, CompositeAuthorRepository, CompositeBook } from '@testhelper/src/Test/Domain/test_entities';
import { PrivateTestInfraModule } from '@testhelper/src/Test/Infrastructure/PrivateTestInfraModule';
import { ClsService } from 'nestjs-cls';

describe('CompositePrimaryKey', () => {
  let module: TestingModule;
  let authorRepository: CompositeAuthorRepository;

  describe.each([{ driver: 'mysql' }, { driver: 'postgres' }])('$driver', ({ driver }) => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          HcModule.forRoot({ cls: true, accountContext: {useCls: true, currentAccountId: AccountId.cs("test")} }),
          HcTypeOrmModule.forRoot({
            configPath: 'core.typeorm-' + driver,
            accountContext: true,
          }),
          PrivateTestInfraModule,
        ],
      }).compile();

      authorRepository = (await module.get(AggregateRootRepositoryManager)).get<CompositeAuthorRepository>(CompositeAuthor);
    });

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    test('persist()', async () => {
      await module.get(ClsService).run(async () => {
        module.get(AccountContext).set(AccountId.cs('hexancore_dev'));
        const author = new CompositeAuthor();
        const book1 = new CompositeBook(BookId.cs(1), 'test_1ęął');
        author.books.add(book1);
        const book2 = new CompositeBook(BookId.cs(2), 'test_2');
        author.books.add(book2);

        const rp = await authorRepository.persist(author);
        expect(rp).toMatchSuccessResult(true);

        const r = await authorRepository.getAllAsArray();
        expect(r.v[0].id).toEqual(author.id);

        const abr = await r.v[0].books.getAllAsArray();
        const ab = abr.v;
        expect(ab.length).toBe(2);
        expect(ab).toEqual([book1, book2]);

        const currentBookById = await r.v[0].books.getById(ab[0].id!);
        expect(currentBookById).toMatchSuccessResult(book1);
      });
    });

    test('getById() when not exists', async () => {
      await module.get(ClsService).run(async () => {
        module.get(AccountContext).set(AccountId.cs('hexancore_dev'));
        const id = AuthorId.cs(1);
        const r = await authorRepository.getById(id);

        const expectedError = {
          type: 'test.domain.entity.composite_author.not_found',
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
});
