import { AREAS } from './gazetteer';
export interface Point {
  lat: number;
  lng: number;
}
export function km(a: Point, b: Point): number {
  const r = Math.PI / 180,
    dLat = (b.lat - a.lat) * r,
    dLng = (b.lng - a.lng) * r;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}
export function nearestArea(point: Point) {
  return (
    AREAS.map((a) => ({ area: a, distance: km(a, point) }))
      .filter((a) => a.distance <= 4)
      .sort((a, b) => a.distance - b.distance)[0]?.area ?? null
  );
}
export function circlePolygon(point: Point, radius = 1.5) {
  const coordinates: number[][] = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    coordinates.push([
      point.lng +
        (radius / 111.32 / Math.cos((point.lat * Math.PI) / 180)) *
          Math.cos(angle),
      point.lat + (radius / 111.32) * Math.sin(angle),
    ]);
  }
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [coordinates] },
  };
}
