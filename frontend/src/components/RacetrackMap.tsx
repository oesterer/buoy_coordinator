import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMapEvents } from 'react-leaflet';
import type { Buoy, Racetrack, RacetrackDraft } from '../types';
import { getBuoyColor } from '../lib/buoyColors';
import { MapController } from './MapController';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl
});

const buoyIcon = new L.Icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const homeDragIcon = L.divIcon({
  className: 'home-drag-icon',
  html: '<div class="home-drag-icon__inner">⌂</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

interface Props {
  center: [number, number];
  searchTarget: [number, number] | null;
  buoys: Buoy[];
  draft: RacetrackDraft;
  selectedTrack: Racetrack | null;
  isSettingHome: boolean;
  onAddMark: (latitude: number, longitude: number) => void;
  onMoveMark: (index: number, latitude: number, longitude: number) => void;
  onSetHome: (latitude: number, longitude: number) => void;
}

function MapClickHandler({ isSettingHome, onAddMark, onSetHome }: Pick<Props, 'isSettingHome' | 'onAddMark' | 'onSetHome'>) {
  useMapEvents({
    click(event) {
      if (isSettingHome) {
        onSetHome(event.latlng.lat, event.latlng.lng);
      }
    },
    dblclick(event) {
      if (!isSettingHome) {
        onAddMark(event.latlng.lat, event.latlng.lng);
      }
    }
  });
  return null;
}

export function RacetrackMap({ center, searchTarget, buoys, draft, selectedTrack, isSettingHome, onAddMark, onMoveMark, onSetHome }: Props) {
  const trackLine = draft.marks.map((mark) => [mark.latitude, mark.longitude] as [number, number]);
  const closedLine = trackLine.length > 2 ? [...trackLine, trackLine[0]] : trackLine;
  const homePosition =
    draft.homeLatitude !== null && draft.homeLongitude !== null
      ? ([draft.homeLatitude, draft.homeLongitude] as [number, number])
      : null;

  return (
    <MapContainer center={center} zoom={13} className="h-full min-h-[420px] w-full" doubleClickZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={center} selectedTrack={selectedTrack} searchTarget={searchTarget} />
      <MapClickHandler isSettingHome={isSettingHome} onAddMark={onAddMark} onSetHome={onSetHome} />

      {closedLine.length > 1 && <Polyline positions={closedLine} pathOptions={{ color: '#0f766e', weight: 3 }} />}

      {homePosition && (
        <CircleMarker
          center={homePosition}
          radius={13}
          pathOptions={{ color: '#111827', fillColor: '#ffffff', fillOpacity: 1, weight: 3 }}
        >
          <Tooltip permanent direction="right">
            HOME
          </Tooltip>
          <Popup>
            <div className="space-y-1">
              <strong>Home</strong>
              <div>Lat {homePosition[0].toFixed(5)}</div>
              <div>Lng {homePosition[1].toFixed(5)}</div>
            </div>
          </Popup>
        </CircleMarker>
      )}

      {homePosition && (
        <Marker
          position={homePosition}
          draggable
          icon={homeDragIcon}
          eventHandlers={{
            dragend(event) {
              const marker = event.target as L.Marker;
              const position = marker.getLatLng();
              onSetHome(position.lat, position.lng);
            }
          }}
        />
      )}

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
        .map((buoy, index) => {
          const color = getBuoyColor(index);
          return (
            <CircleMarker
              key={buoy.id}
              center={[buoy.latitude!, buoy.longitude!]}
              radius={10}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }}
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
          );
        })}

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
