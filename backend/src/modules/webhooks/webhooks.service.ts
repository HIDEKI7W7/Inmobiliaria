import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly httpService: HttpService) {}

  async triggerWebhook(event: string, payload: any): Promise<void> {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      this.logger.warn(`N8N_WEBHOOK_URL no configurada — evento "${event}" no despachado (modo dev)`);
      this.logger.debug(`Payload: ${JSON.stringify({ event, payload })}`);
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, {
          event,
          timestamp: new Date().toISOString(),
          source: 'propio-backend',
          data: payload,
        }),
      );
      this.logger.log(`✅ Webhook "${event}" despachado correctamente a n8n`);
    } catch (error) {
      this.logger.error(`❌ Error al despachar webhook "${event}": ${error.message}`);
    }
  }
}
