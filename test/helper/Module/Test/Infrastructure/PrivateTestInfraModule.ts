import { HcInfraDomainModule } from '@hexancore/core';
import { Module } from '@nestjs/common';

@Module({
  imports: [HcInfraDomainModule.forFeature({ moduleInfraFilePath: __dirname })],
})
export class PrivateTestInfraModule {}
