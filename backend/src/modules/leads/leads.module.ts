import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { AgentLeadsController } from './agent-leads.controller';
import { LeadsService } from './leads.service';

@Module({
  controllers: [LeadsController, AgentLeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
