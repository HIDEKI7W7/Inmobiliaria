import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { LeadsModule } from './modules/leads/leads.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PropertiesModule,
    LeadsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
