export class FindPropertiesQueryDto {
  limit?: string;
  sortBy?: string;
  sortDir?: string;
  ownerId?: string;
  agentId?: string;
  status?: string;
  offerType?: string;
  type?: string;
  verifiedOnly?: string;
  minPrice?: string;
  maxPrice?: string;
  tipoTransaccion?: string;
  precioMin?: string;
  precioMax?: string;
  dormitorios?: string;
  coincidenciaExactaDorms?: string;
  banos?: string;
  tiposCasa?: string;
  piesCuadradosMin?: string;
  piesCuadradosMax?: string;
  text?: string;
  cursor?: string;
}
