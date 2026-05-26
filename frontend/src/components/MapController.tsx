import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { Racetrack } from '../types';

interface Props {
  center: [number, number];
  selectedTrack: Racetrack | null;
  searchTarget: [number, number] | null;
}

export function MapController({ center, selectedTrack, searchTarget }: Props) {
  const map = useMap();
  const fittedTrackId = useRef<string | null>(null);

  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);

  useEffect(() => {
    if (!searchTarget) return;
    map.setView(searchTarget, 15);
  }, [map, searchTarget]);

  useEffect(() => {
    if (!selectedTrack) {
      fittedTrackId.current = null;
      return;
    }
    if (selectedTrack.marks.length === 0 || fittedTrackId.current === selectedTrack.id) return;

    const bounds = selectedTrack.marks.map((mark) => [mark.latitude, mark.longitude] as [number, number]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    fittedTrackId.current = selectedTrack.id;
  }, [map, selectedTrack]);

  return null;
}
