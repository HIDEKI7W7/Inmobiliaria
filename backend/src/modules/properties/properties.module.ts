import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { AdminPropertiesController } from './admin-properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  controllers: [PropertiesController, AdminPropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
