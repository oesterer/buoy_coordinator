import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRacetrack, deleteRacetrack, getBuoys, getRacetracks, sendBuoyCommand, updateRacetrack } from './api';
import { BuoyPanel } from './components/BuoyPanel';
import { RacetrackMap } from './components/RacetrackMap';
import { RacetrackPanel } from './components/RacetrackPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { useRealtime } from './hooks/useRealtime';
import type { Buoy, BuoyCommand, Racetrack, RacetrackDraft } from './types';

const emptyDraft: RacetrackDraft = {
  name: 'New Racetrack',
  description: '',
  marks: []
};

function normalizeDraft(track: Racetrack): RacetrackDraft {
  return {
    id: track.id,
    name: track.name,
    description: track.description,
    marks: track.marks.map((mark, index) => ({ ...mark, orderIndex: index }))
  };
}

export default function App() {
  const { position, located } = useGeolocation();
  const [racetracks, setRacetracks] = useState<Racetrack[]>([]);
  const [buoys, setBuoys] = useState<Buoy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RacetrackDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTrack = useMemo(() => racetracks.find((track) => track.id === selectedId) ?? null, [racetracks, selectedId]);

  useEffect(() => {
    Promise.all([getRacetracks(), getBuoys()])
      .then(([tracks, liveBuoys]) => {
        setRacetracks(tracks);
        setBuoys(liveBuoys);
        if (tracks[0]) {
          setSelectedId(tracks[0].id);
          setDraft(normalizeDraft(tracks[0]));
        }
      })
      .catch(() => setError('Unable to load backend data.'));
  }, []);

  const handleRealtime = useCallback((message: Parameters<typeof useRealtime>[0] extends (message: infer T) => void ? T : never) => {
    if (message.type === 'buoy.updated') {
      setBuoys((current) => current.map((buoy) => (buoy.id === message.buoy.id ? message.buoy : buoy)));
    }
    if (message.type === 'racetrack.created') {
      setRacetracks((current) => [message.racetrack, ...current.filter((track) => track.id !== message.racetrack.id)]);
    }
    if (message.type === 'racetrack.updated') {
      setRacetracks((current) => current.map((track) => (track.id === message.racetrack.id ? message.racetrack : track)));
    }
    if (message.type === 'racetrack.deleted') {
      setRacetracks((current) => current.filter((track) => track.id !== message.id));
    }
  }, []);

  useRealtime(handleRealtime);

  function handleSelect(id: string) {
    const track = racetracks.find((item) => item.id === id);
    if (!track) return;
    setSelectedId(id);
    setDraft(normalizeDraft(track));
  }

  function handleNew() {
    setSelectedId(null);
    setDraft({ ...emptyDraft, marks: [] });
  }

  function handleAddMark(latitude: number, longitude: number) {
    setDraft((current) => ({
      ...current,
      marks: [
        ...current.marks,
        {
          latitude,
          longitude,
          markType: current.marks.length === 0 ? 'start' : 'mark',
          orderIndex: current.marks.length,
          assignedBuoyId: null
        }
      ]
    }));
  }

  function handleMoveMark(index: number, latitude: number, longitude: number) {
    setDraft((current) => ({
      ...current,
      marks: current.marks.map((mark, markIndex) => (markIndex === index ? { ...mark, latitude, longitude } : mark))
    }));
  }

  function handleRemoveMark(index: number) {
    setDraft((current) => ({
      ...current,
      marks: current.marks
        .filter((_mark, markIndex) => markIndex !== index)
        .map((mark, orderIndex) => ({ ...mark, orderIndex }))
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...draft,
        marks: draft.marks.map((mark, orderIndex) => ({ ...mark, orderIndex }))
      };
      const saved = selectedId ? await updateRacetrack(selectedId, payload) : await createRacetrack(payload);
      setSelectedId(saved.id);
      setDraft(normalizeDraft(saved));
      setRacetracks((current) => [saved, ...current.filter((track) => track.id !== saved.id)]);
    } catch {
      setError('Unable to save racetrack.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    try {
      await deleteRacetrack(selectedId);
      setRacetracks((current) => current.filter((track) => track.id !== selectedId));
      handleNew();
    } catch {
      setError('Unable to delete racetrack.');
    }
  }

  async function handleCommand(id: string, command: BuoyCommand, target?: { latitude: number; longitude: number }) {
    try {
      const buoy = await sendBuoyCommand(id, command, target);
      setBuoys((current) => current.map((item) => (item.id === id ? buoy : item)));
    } catch {
      setError('Unable to send buoy command.');
    }
  }

  return (
    <div className="grid min-h-screen bg-slate-100 text-slate-900 lg:grid-cols-[360px_1fr_360px]">
      <RacetrackPanel
        racetracks={racetracks}
        buoys={buoys}
        selectedId={selectedId}
        draft={draft}
        saving={saving}
        onSelect={handleSelect}
        onNew={handleNew}
        onSave={handleSave}
        onDelete={handleDelete}
        onDraftChange={setDraft}
        onRemoveMark={handleRemoveMark}
      />

      <main className="relative min-h-[55vh]">
        <RacetrackMap
          center={position}
          buoys={buoys}
          draft={draft}
          selectedTrack={selectedTrack}
          onAddMark={handleAddMark}
          onMoveMark={handleMoveMark}
        />
        <div className="absolute left-3 top-3 z-[500] rounded-md bg-white px-3 py-2 text-sm shadow">
          {located ? 'Using browser location' : 'Using San Francisco fallback'}
          <span className="ml-2 text-slate-500">Double-click map to add marks</span>
        </div>
        {error && <div className="absolute bottom-3 left-3 z-[500] rounded-md bg-red-600 px-3 py-2 text-sm text-white shadow">{error}</div>}
      </main>

      <BuoyPanel buoys={buoys} draft={draft} onCommand={handleCommand} />
    </div>
  );
}
