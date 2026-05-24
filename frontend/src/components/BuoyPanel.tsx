import { Anchor, Battery, LocateFixed, Octagon, Pause, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { getBuoyColor } from '../lib/buoyColors';
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
  onCommandAll: (command: BuoyCommand, target?: { latitude: number; longitude: number }) => void;
  onAddBuoy: (input: { name: string; latitude?: number | null; longitude?: number | null }) => void;
}

const commandButtons: Array<{ command: BuoyCommand; title: string; icon: typeof LocateFixed; target: 'firstMark' | 'home' | 'none' }> = [
  { command: 'MOVE_TO', title: 'Move to first mark', icon: LocateFixed, target: 'firstMark' },
  { command: 'HOLD_POSITION', title: 'Hold position', icon: Pause, target: 'none' },
  { command: 'RETURN_HOME', title: 'Return home', icon: RotateCcw, target: 'home' },
  { command: 'STOP', title: 'Stop', icon: Octagon, target: 'none' }
];

export function BuoyPanel({ buoys, draft, onCommand, onCommandAll, onAddBuoy }: Props) {
  const firstMark = draft.marks[0];
  const home =
    draft.homeLatitude !== null && draft.homeLongitude !== null
      ? { latitude: draft.homeLatitude, longitude: draft.homeLongitude }
      : null;
  const [isAddingBuoy, setIsAddingBuoy] = useState(false);
  const [newBuoyName, setNewBuoyName] = useState('');
  const [newBuoyLatitude, setNewBuoyLatitude] = useState('');
  const [newBuoyLongitude, setNewBuoyLongitude] = useState('');

  function handleAddBuoy() {
    const name = newBuoyName.trim();
    if (!name) return;

    onAddBuoy({
      name,
      latitude: newBuoyLatitude ? Number(newBuoyLatitude) : null,
      longitude: newBuoyLongitude ? Number(newBuoyLongitude) : null
    });
    setNewBuoyName('');
    setNewBuoyLatitude('');
    setNewBuoyLongitude('');
    setIsAddingBuoy(false);
  }

  function getTarget(target: 'firstMark' | 'home' | 'none') {
    if (target === 'firstMark') return firstMark;
    if (target === 'home') return home ?? undefined;
    return undefined;
  }

  return (
    <section className="border-t border-slate-200 bg-white p-3 lg:border-l lg:border-t-0">
      <div className="mb-3 flex items-center gap-2">
        <Anchor size={18} className="text-harbor" />
        <h2 className="font-semibold text-slate-950">Live Buoys</h2>
      </div>
      <div className="mb-3 rounded-md border border-slate-200 p-3">
        <div className="mb-2 text-sm font-semibold text-slate-950">All Buoys</div>
        <div className="grid grid-cols-4 gap-2">
          {commandButtons.map(({ command, title, icon: Icon, target }) => {
            const commandTarget = getTarget(target);
            const disabled = (target === 'firstMark' && !commandTarget) || (target === 'home' && !commandTarget) || buoys.length === 0;
            return (
              <button
                key={command}
                className="icon-button"
                title={`${title} for all buoys`}
                disabled={disabled}
                onClick={() => onCommandAll(command, commandTarget)}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {buoys.map((buoy, index) => {
          const color = getBuoyColor(index);
          return (
            <article key={buoy.id} className="rounded-md border border-slate-200 p-3">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 font-medium text-slate-950">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    {buoy.name}
                  </h3>
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
                {commandButtons.map(({ command, title, icon: Icon, target }) => {
                  const active = buoy.pendingCommand === command;
                  const commandTarget = getTarget(target);
                  const disabled = (target === 'firstMark' && !commandTarget) || (target === 'home' && !commandTarget);
                  return (
                    <button
                      key={command}
                      className={`icon-button ${active ? 'border-harbor bg-teal-50 text-harbor ring-2 ring-teal-100' : ''}`}
                      title={active ? `${title} is active` : title}
                      disabled={disabled}
                      onClick={() => onCommand(buoy.id, command, commandTarget)}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
      {buoys.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">No buoys registered.</div>}
      <div className="mt-3">
        {isAddingBuoy ? (
          <div className="rounded-md border border-slate-200 p-3">
            <div className="mb-2 text-sm font-semibold text-slate-950">Add Buoy</div>
            <div className="grid gap-2">
              <label className="field compact">
                <span>Name</span>
                <input value={newBuoyName} onChange={(event) => setNewBuoyName(event.target.value)} placeholder="Buoy 04" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="field compact">
                  <span>Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={newBuoyLatitude}
                    onChange={(event) => setNewBuoyLatitude(event.target.value)}
                    placeholder="optional"
                  />
                </label>
                <label className="field compact">
                  <span>Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={newBuoyLongitude}
                    onChange={(event) => setNewBuoyLongitude(event.target.value)}
                    placeholder="optional"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="primary-button" onClick={handleAddBuoy} disabled={!newBuoyName.trim()}>
                  <Plus size={16} />
                  Add
                </button>
                <button className="secondary-button" onClick={() => setIsAddingBuoy(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button className="secondary-button w-full" onClick={() => setIsAddingBuoy(true)}>
            <Plus size={16} />
            Add Buoy
          </button>
        )}
      </div>
    </section>
  );
}
