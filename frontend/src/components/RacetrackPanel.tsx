import { Plus, Save, Trash2 } from 'lucide-react';
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
  onDelete: () => void;
  onDraftChange: (draft: RacetrackDraft) => void;
  onRemoveMark: (index: number) => void;
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
  onRemoveMark
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
            <button
              key={track.id}
              className={`w-full rounded-md border p-3 text-left transition ${
                selectedId === track.id ? 'border-harbor bg-teal-50' : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onSelect(track.id)}
            >
              <div className="font-medium text-slate-950">{track.name}</div>
              <div className="text-sm text-slate-500">{track.marks.length} marks</div>
            </button>
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
                  <button className="primary-button" onClick={onSave} disabled={saving || draft.marks.length === 0}>
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

        {showEditor && !isAddingTrack && (
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Racetrack Details</h2>
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
            <div className="flex gap-2">
              <button className="primary-button flex-1" onClick={onSave} disabled={saving || draft.marks.length === 0}>
                <Save size={16} />
                {saving ? 'Saving' : 'Save'}
              </button>
              <button className="danger-button" onClick={onDelete} disabled={!selectedId} title="Delete selected racetrack">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}

        {showEditor && (
          <>
            <h2 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Marks</h2>
            <div className="space-y-2">
              {draft.marks.map((mark, index) => (
                <div key={`${mark.id ?? 'draft'}-${index}`} className="rounded-md border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-950">Mark {index + 1}</span>
                    <button className="text-sm text-red-600" onClick={() => onRemoveMark(index)}>
                      Remove
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
