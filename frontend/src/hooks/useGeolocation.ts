import { useEffect, useState } from 'react';

const SAN_FRANCISCO: [number, number] = [37.7749, -122.4194];

export function useGeolocation() {
  const [position, setPosition] = useState<[number, number]>(SAN_FRANCISCO);
  const [located, setLocated] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition([result.coords.latitude, result.coords.longitude]);
        setLocated(true);
      },
      () => setLocated(false),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  return { position, located };
}
