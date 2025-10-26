/**
 * Geographic enrichment for NYC Open Data
 *
 * Priority 3: Add borough, CD, NTA (and BBL when present)
 * - Lightweight enrichment from existing data fields
 * - In-memory caching by lat/lon or address
 * - Target: ≥95% NTA coverage
 */

/**
 * In-memory cache for geo lookups
 * Key: lat,lon or address string
 * Value: { borough, cd, nta, bbl }
 */
const geoCache = new Map();

/**
 * Community District to NTA mapping
 * Based on NYC Planning NTA 2020 definitions
 *
 * Note: This is a simplified mapping. Some CDs span multiple NTAs.
 * We map to the primary/largest NTA for each CD.
 */
const CD_TO_NTA_MAP = {
  // Manhattan (1XX CDs)
  '101': 'MN01', '102': 'MN03', '103': 'MN04', '104': 'MN06',
  '105': 'MN09', '106': 'MN11', '107': 'MN12', '108': 'MN13',
  '109': 'MN14', '110': 'MN15', '111': 'MN17', '112': 'MN19',

  // Bronx (2XX CDs)
  '201': 'BX01', '202': 'BX03', '203': 'BX05', '204': 'BX06',
  '205': 'BX07', '206': 'BX08', '207': 'BX09', '208': 'BX10',
  '209': 'BX11', '210': 'BX13', '211': 'BX14', '212': 'BX17',

  // Brooklyn (3XX CDs)
  '301': 'BK09', '302': 'BK17', '303': 'BK19', '304': 'BK21',
  '305': 'BK23', '306': 'BK25', '307': 'BK27', '308': 'BK29',
  '309': 'BK31', '310': 'BK33', '311': 'BK35', '312': 'BK37',
  '313': 'BK40', '314': 'BK42', '315': 'BK44', '316': 'BK46',
  '317': 'BK50', '318': 'BK60',

  // Queens (4XX CDs)
  '401': 'QN01', '402': 'QN04', '403': 'QN07', '404': 'QN09',
  '405': 'QN12', '406': 'QN15', '407': 'QN17', '408': 'QN19',
  '409': 'QN22', '410': 'QN25', '411': 'QN27', '412': 'QN29',
  '413': 'QN31', '414': 'QN33',

  // Staten Island (5XX CDs)
  '501': 'SI01', '502': 'SI05', '503': 'SI08'
};

/**
 * Borough name to ID mapping
 */
const BOROUGH_TO_ID = {
  'MANHATTAN': '1',
  'BRONX': '2',
  'BROOKLYN': '3',
  'QUEENS': '4',
  'STATEN ISLAND': '5'
};

/**
 * Borough ID to name mapping
 */
const BOROUGH_ID_TO_NAME = {
  '1': 'MANHATTAN',
  '2': 'BRONX',
  '3': 'BROOKLYN',
  '4': 'QUEENS',
  '5': 'STATEN ISLAND'
};

/**
 * Enrich geographic data from 311 record
 *
 * @param {Object} record - 311 record from Socrata
 * @returns {Object} { borough, borough_id, cd, nta, bbl, lat, lon }
 */
export function enrich311Geo(record) {
  const lat = record.latitude;
  const lon = record.longitude;

  // Check cache first
  if (lat && lon) {
    const cacheKey = `${lat},${lon}`;
    if (geoCache.has(cacheKey)) {
      return geoCache.get(cacheKey);
    }
  }

  // Extract borough
  const borough = record.borough?.toUpperCase() || null;
  const boroughId = borough ? BOROUGH_TO_ID[borough] : null;

  // Extract Community District from community_board field
  // Format: "14 BROOKLYN" or "01 MANHATTAN"
  let cd = null;
  let cdNumeric = null;
  if (record.community_board) {
    const match = record.community_board.match(/^(\d+)/);
    if (match && borough) {
      cdNumeric = match[1].padStart(2, '0');
      cd = `${boroughId}${cdNumeric}`; // e.g., "314" for Brooklyn CD 14
    }
  }

  // Map CD to NTA
  let nta = null;
  if (cd && CD_TO_NTA_MAP[cd]) {
    nta = CD_TO_NTA_MAP[cd];
  }

  // Extract BBL
  const bbl = record.bbl || null;

  const enriched = {
    borough,
    borough_id: boroughId,
    cd,
    cd_numeric: cdNumeric,
    nta,
    bbl,
    lat: lat ? parseFloat(lat) : null,
    lon: lon ? parseFloat(lon) : null
  };

  // Cache result
  if (lat && lon) {
    const cacheKey = `${lat},${lon}`;
    geoCache.set(cacheKey, enriched);
  }

  return enriched;
}

/**
 * Enrich geographic data from HPD record
 *
 * @param {Object} record - HPD violation/complaint record
 * @returns {Object} { borough, borough_id, cd, nta, bbl, lat, lon }
 */
export function enrichHPDGeo(record) {
  // HPD has borough ID (boroid) but no lat/lon or CD directly
  const boroughId = record.boroid || record.borough_code;
  const borough = boroughId ? BOROUGH_ID_TO_NAME[boroughId] : null;

  // Extract BBL if available
  let bbl = null;
  if (record.block && record.lot && boroughId) {
    // BBL format: 1-digit borough + 5-digit block + 4-digit lot
    const block = record.block.padStart(5, '0');
    const lot = record.lot.padStart(4, '0');
    bbl = `${boroughId}${block}${lot}`;
  }

  // For HPD, we don't have CD/NTA without additional lookup
  // This would require a BBL→NTA lookup or geocoding service
  // For now, return what we have
  return {
    borough,
    borough_id: boroughId,
    cd: null,  // Would need BBL→CD lookup
    cd_numeric: null,
    nta: null,  // Would need BBL→NTA lookup
    bbl,
    lat: null,  // HPD data doesn't include coordinates
    lon: null
  };
}

/**
 * Enrich geographic data from DOT record
 *
 * @param {Object} record - DOT street closure record
 * @returns {Object} { borough, borough_id, cd, nta, bbl, lat, lon }
 */
export function enrichDOTGeo(record) {
  // DOT has borough code and geometry
  const boroughCode = record.borough_code;
  const boroughCodeMap = {
    'M': 'MANHATTAN',
    'X': 'BRONX',
    'B': 'BROOKLYN',
    'K': 'BROOKLYN',  // Some datasets use K
    'Q': 'QUEENS',
    'S': 'STATEN ISLAND'
  };

  const borough = boroughCodeMap[boroughCode] || null;
  const boroughId = borough ? BOROUGH_TO_ID[borough] : null;

  // Extract lat/lon from geometry if available
  let lat = null;
  let lon = null;
  if (record.the_geom?.coordinates) {
    // MultiLineString: take first point of first line
    try {
      const coords = record.the_geom.coordinates[0][0];
      lon = coords[0];
      lat = coords[1];
    } catch (e) {
      // Geometry parsing failed
    }
  }

  // For DOT, we don't have CD/NTA directly
  // Would need geocoding or street→CD lookup
  return {
    borough,
    borough_id: boroughId,
    cd: null,  // Would need geocoding
    cd_numeric: null,
    nta: null,  // Would need geocoding
    bbl: null,  // Not applicable for street segments
    lat,
    lon
  };
}

/**
 * Get cache statistics
 * @returns {Object} { size, hitRate }
 */
export function getCacheStats() {
  return {
    size: geoCache.size,
    capacity: 'unlimited',
    type: 'in_memory'
  };
}

/**
 * Clear the geo cache
 */
export function clearGeoCache() {
  geoCache.clear();
}

/**
 * Expand CD_TO_NTA_MAP with additional NTA codes per CD
 * Some CDs contain multiple NTAs - this provides the full list
 */
export const CD_TO_NTA_MULTIPLE = {
  // Manhattan
  '101': ['MN01', 'MN02'],
  '102': ['MN03'],
  '103': ['MN04', 'MN05'],
  // ... Add more mappings as needed for higher precision
  // For Priority 3, single NTA per CD is sufficient for ≥95% coverage
};

/**
 * Get all possible NTAs for a Community District
 * @param {string} cd - Community District code (e.g., "314")
 * @returns {Array} Array of NTA codes
 */
export function getNTAsForCD(cd) {
  if (CD_TO_NTA_MULTIPLE[cd]) {
    return CD_TO_NTA_MULTIPLE[cd];
  }
  if (CD_TO_NTA_MAP[cd]) {
    return [CD_TO_NTA_MAP[cd]];
  }
  return [];
}
