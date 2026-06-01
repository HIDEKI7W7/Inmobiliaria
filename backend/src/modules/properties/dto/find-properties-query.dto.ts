import {
  IsOptional,
  IsString,
  IsNumberString,
  IsIn,
  IsUUID,
} from 'class-validator';

/**
 * TSK-3.2 — DTO de Query para Paginación por Cursor (Cursor-based Pagination)
 *
 * La paginación por cursor es superior a la paginación por offset para conjuntos
 * de datos grandes (>10k registros) porque:
 * 1. No sufre del problema de "filas saltadas" cuando se insertan nuevos registros.
 * 2. Es O(1) en lugar de O(offset) para la base de datos.
 * 3. Es consistente bajo carga concurrente alta.
 *
 * El cliente recibe un `nextCursor` opaco en cada página y lo envía en la
 * siguiente petición para continuar la iteración.
 *
 * Arquitectura: Capa de Aplicación (DTO de Query / Input Validation)
 */
export class FindPropertiesQueryDto {
  // ── Paginación por Cursor ──────────────────────────────────────────────────

  /**
   * Cursor opaco para la página siguiente (ID de la última propiedad recibida).
   * Si está ausente, se devuelve la primera página.
   */
  @IsOptional()
  @IsString()
  cursor?: string;

  /**
   * Número de propiedades por página. Default: 20. Máximo: 100.
   */
  @IsOptional()
  @IsNumberString()
  limit?: string;

  // ── Filtros de Búsqueda ───────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @IsOptional()
  @IsString()
  verifiedOnly?: string;

  @IsOptional()
  @IsString()
  offerType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  // ── Filtros Zillow Avanzados ──────────────────────────────────────────────

  @IsOptional()
  @IsString()
  tipoTransaccion?: string;

  @IsOptional()
  @IsString()
  precioMin?: string;

  @IsOptional()
  @IsString()
  precioMax?: string;

  @IsOptional()
  @IsString()
  modoPrecio?: string;

  @IsOptional()
  @IsString()
  dormitorios?: string;

  @IsOptional()
  @IsString()
  coincidenciaExactaDorms?: string;

  @IsOptional()
  @IsString()
  banos?: string;

  @IsOptional()
  @IsString()
  tiposCasa?: string;

  @IsOptional()
  @IsString()
  piesCuadradosMin?: string;

  @IsOptional()
  @IsString()
  piesCuadradosMax?: string;

  @IsOptional()
  @IsString()
  loteMin?: string;

  @IsOptional()
  @IsString()
  loteMax?: string;

  @IsOptional()
  @IsString()
  anoConstruccionMin?: string;

  @IsOptional()
  @IsString()
  anoConstruccionMax?: string;

  @IsOptional()
  @IsString()
  tieneSotano?: string;

  @IsOptional()
  @IsString()
  unSoloPiso?: string;

  @IsOptional()
  @IsString()
  aireAcondicionado?: string;

  @IsOptional()
  @IsString()
  piscina?: string;

  @IsOptional()
  @IsString()
  frenteAlAgua?: string;

  // ── Ordenamiento ──────────────────────────────────────────────────────────

  /**
   * Campo por el que se ordena el catálogo.
   * Por defecto: 'createdAt' (más recientes primero).
   */
  @IsOptional()
  @IsIn(['createdAt', 'price', 'area'])
  sortBy?: 'createdAt' | 'price' | 'area';

  /**
   * Dirección del ordenamiento.
   */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';
}
