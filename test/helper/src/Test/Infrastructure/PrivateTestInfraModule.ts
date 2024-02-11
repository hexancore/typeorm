import { HcInfraDomainModule } from '@hexancore/core';
import { Module } from '@nestjs/common';

@Module({
  imports: [HcInfraDomainModule.forFeature({ moduleInfraDir: __dirname })],
})
export class PrivateTestInfraModule {}
