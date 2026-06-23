/**
 * Вычисляет расстояние между двумя точками по формуле гаверсинуса (по прямой).
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Радиус Земли в км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return Math.round(d * 100) / 100;
}

/**
 * Получает расстояние между точками через OSRM API.
 */
export async function getOSRMDistance(lat1: number, lon1: number, lat2: number, lon2: number): Promise<{ distance: number, duration: number }> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`
    );
    const data = await response.json() as any;
    if (data.code === 'Ok' && data.routes?.length > 0) {
      return {
        distance: Math.round(data.routes[0].distance / 1000 * 100) / 100, // в км
        duration: Math.round(data.routes[0].duration / 60) // в минутах
      };
    }
  } catch (err) {
    console.error('OSRM Error, falling back to Haversine', err);
  }

  // Fallback к расчету по прямой с коэффициентом дорог 1.25
  const directDist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  return {
    distance: Math.round(directDist * 1.25 * 100) / 100,
    duration: Math.round(directDist * 1.5) // Примерно 1.5 мин на км
  };
}
