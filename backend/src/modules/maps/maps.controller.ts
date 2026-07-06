import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('reverse-geocode')
  async reverseGeocode(
    @Query('lat') latStr: string,
    @Query('lng') lngStr: string,
  ) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException('Parámetros lat y lng deben ser números válidos');
    }

    return this.mapsService.reverseGeocode(lat, lng);
  }

  @Get('autocomplete')
  async autocomplete(
    @Query('query') query: string,
    @Query('lat') latStr?: string,
    @Query('lng') lngStr?: string,
  ) {
    if (!query) {
      throw new BadRequestException('El parámetro query es obligatorio');
    }

    const lat = latStr ? parseFloat(latStr) : undefined;
    const lng = lngStr ? parseFloat(lngStr) : undefined;

    return this.mapsService.autocomplete(query, lat, lng);
  }
}
