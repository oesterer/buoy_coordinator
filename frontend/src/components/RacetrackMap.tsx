import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMapEvents } from 'react-leaflet';
import type { Buoy, Racetrack, RacetrackDraft } from '../types';
import { MapController } from './MapController';

const buoyIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Props {
  center: [number, number];
  buoys: Buoy[];
  draft: RacetrackDraft;
  selectedTrack: Racetrack | null;
  onAddMark: (latitude: number, longitude: number) => void;
  onMoveMark: (index: number, latitude: number, longitude: number) => void;
}

function AddMarkHandler({ onAddMark }: Pick<Props, 'onAddMark'>) {
  useMapEvents({
    dblclick(event) {
      onAddMark(event.latlng.lat, event.latlng.lng);
    }
  });
  return null;
}

export function RacetrackMap({ center, buoys, draft, selectedTrack, onAddMark, onMoveMark }: Props) {
  const trackLine = draft.marks.map((mark) => [mark.latitude, mark.longitude] as [number, number]);
  const closedLine = trackLine.length > 2 ? [...trackLine, trackLine[0]] : trackLine;

  return (
    <MapContainer center={center} zoom={13} className="h-full min-h-[420px] w-full" doubleClickZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={center} selectedTrack={selectedTrack} />
      <AddMarkHandler onAddMark={onAddMark} />

      {closedLine.length > 1 && <Polyline positions={closedLine} pathOptions={{ color: '#0f766e', weight: 3 }} />}

      {draft.marks.map((mark, index) => (
        <Marker
          key={`${mark.id ?? 'draft'}-${index}`}
          position={[mark.latitude, mark.longitude]}
          draggable
          eventHandlers={{
            dragend(event) {
              const marker = event.target as L.Marker;
              const position = marker.getLatLng();
              onMoveMark(index, position.lat, position.lng);
            }
          }}
        >
          <Tooltip permanent direction="top">
            {index + 1}. {mark.markType}
          </Tooltip>
          <Popup>
            <div className="space-y-1">
              <strong>{mark.markType}</strong>
              <div>Lat {mark.latitude.toFixed(5)}</div>
              <div>Lng {mark.longitude.toFixed(5)}</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {buoys
        .filter((buoy) => buoy.latitude !== null && buoy.longitude !== null)
        .map((buoy) => (
          <CircleMarker
            key={buoy.id}
            center={[buoy.latitude!, buoy.longitude!]}
            radius={10}
            pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.85 }}
          >
            <Popup>
              <div className="space-y-1">
                <strong>{buoy.name}</strong>
                <div>Status {buoy.status}</div>
                <div>Battery {buoy.batteryLevel ?? '-'}%</div>
                <div>Heading {buoy.heading ?? '-'} deg</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

      {buoys
        .filter((buoy) => buoy.commandTargetLatitude !== null && buoy.commandTargetLongitude !== null)
        .map((buoy) => (
          <Marker
            key={`${buoy.id}-target`}
            position={[buoy.commandTargetLatitude!, buoy.commandTargetLongitude!]}
            icon={buoyIcon}
            opacity={0.55}
          >
            <Tooltip>{buoy.name} target</Tooltip>
          </Marker>
        ))}
    </MapContainer>
  );
}
