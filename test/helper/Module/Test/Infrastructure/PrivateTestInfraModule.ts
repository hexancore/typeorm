import { HcInfraDomainModule } from '@hexancore/core';
import { Module } from '@nestjs/common';

import * as typeorm from '@test/Module/Test/Infrastructure/Persistance/TypeOrm';
const t = typeorm;

@Module({
  imports: [HcInfraDomainModule.forFeature({ moduleInfraDir: __dirname })],
})
export class PrivateTestInfraModule {}
