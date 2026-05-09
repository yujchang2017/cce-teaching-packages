// Approximate % coordinates (x, y) for Taiwan cities/counties inside a 0-100
// viewBox. Used by the FamilyTree mini Taiwan map to place pins.
// These are intentionally rough — POC只要有地理感即可，不求地圖學精度。

export type CityCoords = { x: number; y: number };

export const CITY_COORDS: Record<string, CityCoords> = {
  基隆市: { x: 72, y: 15 },
  台北市: { x: 68, y: 18 },
  新北市: { x: 65, y: 22 },
  桃園市: { x: 60, y: 24 },
  新竹市: { x: 55, y: 28 },
  新竹縣: { x: 52, y: 30 },
  宜蘭縣: { x: 75, y: 35 },
  台中市: { x: 40, y: 45 },
  彰化縣: { x: 38, y: 50 },
  南投縣: { x: 48, y: 52 },
  花蓮縣: { x: 70, y: 55 },
  雲林縣: { x: 35, y: 58 },
  嘉義市: { x: 40, y: 62 },
  嘉義縣: { x: 38, y: 63 },
  台南市: { x: 35, y: 72 },
  台東縣: { x: 65, y: 72 },
  高雄市: { x: 40, y: 80 },
  屏東縣: { x: 45, y: 85 },
};

/**
 * Look up % coordinates for a city. Falls back to the island's geometric
 * centre so callers never have to null-check.
 */
export function getCityCoords(cityName: string): CityCoords {
  return CITY_COORDS[cityName] ?? { x: 50, y: 50 };
}

/**
 * Two-character abbreviation shown inside a pin (e.g. 台北市 → 台北, 高雄市 → 高雄).
 * Keeps the pin label compact on the mini map.
 */
export function getCityShortName(cityName: string): string {
  // Strip trailing 市 / 縣 suffix for the pin label.
  return cityName.replace(/[市縣]$/u, '');
}
