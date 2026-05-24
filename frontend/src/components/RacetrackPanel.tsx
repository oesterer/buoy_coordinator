import { Home, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Buoy, Racetrack, RacetrackDraft } from '../types';

interface Props {
  racetracks: Racetrack[];
  buoys: Buoy[];
  selectedId: string | null;
  draft: RacetrackDraft;
  saving: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onDraftChange: (draft: RacetrackDraft) => void;
  onRemoveMark: (index: number) => void;
  onStartSetHome: () => void;
  isSettingHome: boolean;
}

export function RacetrackPanel({
  racetracks,
  buoys,
  selectedId,
  draft,
  saving,
  onSelect,
  onNew,
  onSave,
  onDelete,
  onDraftChange,
  onRemoveMark,
  onStartSetHome,
  isSettingHome
}: Props) {
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const showEditor = Boolean(selectedId) || isAddingTrack;

  useEffect(() => {
    if (selectedId) {
      setIsAddingTrack(false);
    }
  }, [selectedId]);

  function handleStartNewTrack() {
    onNew();
    setIsAddingTrack(true);
  }

  function handleCancelNewTrack() {
    setIsAddingTrack(false);
    if (racetracks[0]) {
      onSelect(racetracks[0].id);
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Buoy Coordinator</h1>
          <p className="text-sm text-slate-500">RC sailing racetrack planner</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Saved Racetracks</h2>
        <div className="space-y-2">
          {racetracks.map((track) => (
            <div
              key={track.id}
              className={`flex items-center gap-2 rounded-md border p-2 transition ${
                selectedId === track.id ? 'border-harbor bg-teal-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(track.id)}>
                <div className="truncate font-medium text-slate-950">{track.name}</div>
                <div className="text-sm text-slate-500">{track.marks.length} marks</div>
              </button>
              <button className="danger-button h-9 w-9" onClick={() => onDelete(track.id)} title={`Delete ${track.name}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3">
          {isAddingTrack ? (
            <div className="rounded-md border border-slate-200 p-3">
              <div className="mb-3 text-sm font-semibold text-slate-950">Add Racetrack</div>
              <div className="space-y-3">
                <label className="field">
                  <span>Name</span>
                  <input value={draft.name} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} />
                </label>
                <label className="field">
                  <span>Description</span>
                  <textarea
                    rows={2}
                    value={draft.description}
                    onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="primary-button"
                    onClick={onSave}
                    disabled={saving || draft.marks.length === 0 || draft.homeLatitude === null || draft.homeLongitude === null}
                  >
                    <Save size={16} />
                    {saving ? 'Saving' : 'Save'}
                  </button>
                  <button className="secondary-button" onClick={handleCancelNewTrack}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button className="secondary-button w-full" onClick={handleStartNewTrack}>
              <Plus size={16} />
              Add Racetrack
            </button>
          )}
        </div>

        {showEditor && (
          <>
            <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-200 pt-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Marks</h2>
                <div className="text-xs text-slate-500">{saving && !isAddingTrack ? 'Autosaving changes' : 'Changes update the selected racetrack'}</div>
              </div>
              <button
                className={`icon-button h-9 w-9 ${isSettingHome ? 'border-harbor bg-teal-50 text-harbor' : ''}`}
                onClick={onStartSetHome}
                title="Set home location"
              >
                <Home size={16} />
              </button>
            </div>
            <div className="mb-3 mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Home:{' '}
              {draft.homeLatitude !== null && draft.homeLongitude !== null
                ? `${draft.homeLatitude.toFixed(5)}, ${draft.homeLongitude.toFixed(5)}`
                : 'not set'}
            </div>
            <div className="space-y-2">
              {draft.marks.map((mark, index) => (
                <div key={`${mark.id ?? 'draft'}-${index}`} className="rounded-md border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-950">Mark {index + 1}</span>
                    <button className="danger-button h-8 w-8" onClick={() => onRemoveMark(index)} title={`Delete mark ${index + 1}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="field compact">
                      <span>Type</span>
                      <input
                        value={mark.markType}
                        onChange={(event) => {
                          const marks = draft.marks.map((item, markIndex) =>
                            markIndex === index ? { ...item, markType: event.target.value } : item
                          );
                          onDraftChange({ ...draft, marks });
                        }}
                      />
                    </label>
                    <label className="field compact">
                      <span>Buoy</span>
                      <select
                        value={mark.assignedBuoyId ?? ''}
                        onChange={(event) => {
                          const marks = draft.marks.map((item, markIndex) =>
                            markIndex === index ? { ...item, assignedBuoyId: event.target.value || null } : item
                          );
                          onDraftChange({ ...draft, marks });
                        }}
                      >
                        <option value="">Unassigned</option>
                        {buoys.map((buoy) => (
                          <option key={buoy.id} value={buoy.id}>
                            {buoy.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {mark.latitude.toFixed(5)}, {mark.longitude.toFixed(5)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
