import { Module } from '@nestjs/common';
import { SalesCompanyController } from './controllers/sales-company.controller';
import { SalesCompanyImpl } from './implements/sales-company.repository.impl';
import { SalesCompanyService } from './service/sales-company.service';

@Module({
  controllers: [SalesCompanyController],
  providers: [
    SalesCompanyService,
    {
      provide: 'SALES_COMPANY',
      useClass: SalesCompanyImpl,
    },
  ],
})
export class SalesCompanyModule {}
