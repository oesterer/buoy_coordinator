import { Anchor, Battery, LocateFixed, Octagon, Pause, Play, RotateCcw } from 'lucide-react';
import type { Buoy, BuoyCommand, RacetrackDraft } from '../types';

const statusClass: Record<Buoy['status'], string> = {
  idle: 'bg-slate-100 text-slate-700',
  moving: 'bg-blue-100 text-blue-700',
  holding: 'bg-teal-100 text-teal-700',
  offline: 'bg-slate-200 text-slate-500',
  low_battery: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700'
};

interface Props {
  buoys: Buoy[];
  draft: RacetrackDraft;
  onCommand: (id: string, command: BuoyCommand, target?: { latitude: number; longitude: number }) => void;
}

export function BuoyPanel({ buoys, draft, onCommand }: Props) {
  const firstMark = draft.marks[0];

  return (
    <section className="border-t border-slate-200 bg-white p-3 lg:border-l lg:border-t-0">
      <div className="mb-3 flex items-center gap-2">
        <Anchor size={18} className="text-harbor" />
        <h2 className="font-semibold text-slate-950">Live Buoys</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {buoys.map((buoy) => (
          <article key={buoy.id} className="rounded-md border border-slate-200 p-3">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-slate-950">{buoy.name}</h3>
                <div className="text-xs text-slate-500">
                  {buoy.telemetryTimestamp ? new Date(buoy.telemetryTimestamp).toLocaleTimeString() : 'No telemetry'}
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass[buoy.status]}`}>{buoy.status}</span>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-slate-500">Battery</div>
                <div className="flex items-center gap-1 font-medium">
                  <Battery size={14} />
                  {buoy.batteryLevel ?? '-'}%
                </div>
              </div>
              <div>
                <div className="text-slate-500">Heading</div>
                <div className="font-medium">{buoy.heading ?? '-'} deg</div>
              </div>
              <div>
                <div className="text-slate-500">Command</div>
                <div className="font-medium">{buoy.pendingCommand ?? '-'}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                className="icon-button"
                title="Move to first mark"
                disabled={!firstMark}
                onClick={() => firstMark && onCommand(buoy.id, 'MOVE_TO', firstMark)}
              >
                <LocateFixed size={16} />
              </button>
              <button className="icon-button" title="Hold position" onClick={() => onCommand(buoy.id, 'HOLD_POSITION')}>
                <Pause size={16} />
              </button>
              <button className="icon-button" title="Return home" onClick={() => onCommand(buoy.id, 'RETURN_HOME')}>
                <RotateCcw size={16} />
              </button>
              <button className="icon-button" title="Stop" onClick={() => onCommand(buoy.id, 'STOP')}>
                <Octagon size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {buoys.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">No buoys registered.</div>}
      <div className="sr-only">
        <Play size={1} />
      </div>
    </section>
  );
}
