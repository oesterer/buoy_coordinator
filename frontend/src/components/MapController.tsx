import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { Racetrack } from '../types';

interface Props {
  center: [number, number];
  selectedTrack: Racetrack | null;
}

export function MapController({ center, selectedTrack }: Props) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);

  useEffect(() => {
    if (!selectedTrack || selectedTrack.marks.length === 0) return;

    const bounds = selectedTrack.marks.map((mark) => [mark.latitude, mark.longitude] as [number, number]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
  }, [map, selectedTrack]);

  return null;
}
