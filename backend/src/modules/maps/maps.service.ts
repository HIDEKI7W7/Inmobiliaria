import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);
  private readonly userAgent = 'MarsTechInmobiliariaApp/1.0 (contact@marstech.com)';
  private readonly photonUrl = process.env.PHOTON_URL || 'https://photon.komoot.io';

  async reverseGeocode(lat: number, lng: number) {
    this.logger.log(`[ReverseGeocode] Coordenadas: lat=${lat}, lng=${lng} usando URL: ${this.photonUrl}`);
    try {
      const response = await axios.get(`${this.photonUrl}/reverse`, {
        params: { lat, lon: lng },
        headers: {
          'Accept-Language': 'es',
          'User-Agent': this.userAgent,
        },
      });

      const feature = response.data?.features?.[0];
      if (!feature) {
        return { success: false, message: 'No se encontraron resultados' };
      }

      const props = feature.properties || {};
      const street = props.street || props.name || '';
      const city = props.city || props.town || props.state || '';
      
      const parts = [
        street,
        props.district,
        city,
        props.country,
      ].filter(Boolean);
      const formattedAddress = parts.join(', ');

      return {
        success: true,
        street,
        city,
        formattedAddress,
        raw: props,
      };
    } catch (error: any) {
      this.logger.error(`Error in reverseGeocode: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async autocomplete(query: string, lat?: number, lng?: number) {
    this.logger.log(`[Autocomplete] Consulta: "${query}" (bias: lat=${lat}, lng=${lng})`);
    try {
      const params: any = {
        q: query,
        limit: 10,
      };

      if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
        params.lat = lat;
        params.lon = lng;
      }

      const response = await axios.get(`${this.photonUrl}/api`, {
        params,
        headers: {
          'Accept-Language': 'es',
          'User-Agent': this.userAgent,
        },
      });

      const features = response.data?.features || [];
      const results = features.map((feature: any) => {
        const props = feature.properties || {};
        const geom = feature.geometry || {};
        const [lon, latitude] = geom.coordinates || [0, 0];

        const street = props.street || props.name || '';
        const city = props.city || props.town || props.state || '';
        
        const parts = [
          street,
          props.district,
          city,
          props.country,
        ].filter(Boolean);
        const formattedAddress = parts.join(', ');

        return {
          street,
          city,
          formattedAddress,
          lat: latitude,
          lng: lon,
          raw: props,
        };
      });

      return { success: true, results };
    } catch (error: any) {
      this.logger.error(`Error in autocomplete: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
