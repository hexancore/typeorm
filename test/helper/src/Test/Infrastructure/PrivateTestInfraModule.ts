import { HcInfraDomainModule } from '@hexancore/core';
import { Module } from '@nestjs/common';

@Module({
  imports: [HcInfraDomainModule.forFeature({ moduleInfraDir: __dirname })],
  exports: [HcInfraDomainModule],
})
export class PrivateTestInfraModule {}
