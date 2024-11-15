import * as Location from 'expo-location';
import { Alert } from 'react-native';

export function useLocation() {
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación');
      return null;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    try {
      const [placeDetails] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (placeDetails) {
        const ubicacion = `${placeDetails.city || ''}, ${placeDetails.country || ''}`.trim();
        return { ...location, ubicacion };
      } else {
        throw new Error('No se pudo obtener la información de la ubicación');
      }
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la información de la ubicación');
      return null;
    }
  };

  return { requestLocationPermission };
}
