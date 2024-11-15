import * as Location from 'expo-location';

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
  };
  ubicacion: string;
  pais: string;
}

export const useLocation = () => {
  const requestLocationPermission = async (): Promise<LocationData | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode && geocode[0]) {
        const address = geocode[0];

        const ubicacion = [
          address.city,
          address.country
        ]
          .filter(Boolean)
          .join(', ');

        return {
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
          ubicacion: ubicacion,
          pais: address.country || ''
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  return { requestLocationPermission };
};
