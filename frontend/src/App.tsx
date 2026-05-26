import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBuoy, createRacetrack, deleteRacetrack, getBuoys, getRacetracks, sendBuoyCommand, updateRacetrack } from './api';
import { AddressSearch } from './components/AddressSearch';
import { BuoyPanel } from './components/BuoyPanel';
import { RacetrackMap } from './components/RacetrackMap';
import { RacetrackPanel } from './components/RacetrackPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { useRealtime } from './hooks/useRealtime';
import type { Buoy, BuoyCommand, Racetrack, RacetrackDraft } from './types';

const emptyDraft: RacetrackDraft = {
  name: 'New Racetrack',
  description: '',
  homeLatitude: null,
  homeLongitude: null,
  marks: []
};

function normalizeDraft(track: Racetrack): RacetrackDraft {
  return {
    id: track.id,
    name: track.name,
    description: track.description,
    homeLatitude: track.homeLatitude,
    homeLongitude: track.homeLongitude,
    marks: track.marks.map((mark, index) => ({ ...mark, orderIndex: index }))
  };
}

function serializeDraft(draft: RacetrackDraft) {
  return JSON.stringify({
    name: draft.name,
    description: draft.description,
    homeLatitude: draft.homeLatitude,
    homeLongitude: draft.homeLongitude,
    marks: draft.marks.map((mark, orderIndex) => ({
      latitude: mark.latitude,
      longitude: mark.longitude,
      markType: mark.markType,
      orderIndex,
      assignedBuoyId: mark.assignedBuoyId ?? null
    }))
  });
}

export default function App() {
  const { position, located } = useGeolocation();
  const [racetracks, setRacetracks] = useState<Racetrack[]>([]);
  const [buoys, setBuoys] = useState<Buoy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RacetrackDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingHome, setIsSettingHome] = useState(false);
  const [searchTarget, setSearchTarget] = useState<[number, number] | null>(null);

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
    if (message.type === 'buoy.created') {
      setBuoys((current) => [...current.filter((buoy) => buoy.id !== message.buoy.id), message.buoy].sort((a, b) => a.name.localeCompare(b.name)));
    }
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

  useEffect(() => {
    if (!selectedId || !selectedTrack || draft.marks.length === 0) return;
    if (serializeDraft(draft) === serializeDraft(normalizeDraft(selectedTrack))) return;

    const timeout = window.setTimeout(() => {
      setSaving(true);
      updateRacetrack(selectedId, {
        ...draft,
        marks: draft.marks.map((mark, orderIndex) => ({ ...mark, orderIndex }))
      })
        .then((saved) => {
          setRacetracks((current) => [saved, ...current.filter((track) => track.id !== saved.id)]);
          setDraft(normalizeDraft(saved));
        })
        .catch(() => setError('Unable to update racetrack.'))
        .finally(() => setSaving(false));
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [draft, selectedId, selectedTrack]);

  function handleSelect(id: string) {
    const track = racetracks.find((item) => item.id === id);
    if (!track) return;
    setSelectedId(id);
    setDraft(normalizeDraft(track));
  }

  function handleNew() {
    setSelectedId(null);
    setDraft({ ...emptyDraft, marks: [] });
    setIsSettingHome(false);
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

  function handleSetHome(latitude: number, longitude: number) {
    setDraft((current) => ({ ...current, homeLatitude: latitude, homeLongitude: longitude }));
    setIsSettingHome(false);
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

  async function handleDelete(id: string) {
    try {
      await deleteRacetrack(id);
      setRacetracks((current) => current.filter((track) => track.id !== id));
      if (selectedId === id) {
        handleNew();
      }
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

  async function handleCommandAll(command: BuoyCommand, target?: { latitude: number; longitude: number }) {
    try {
      const updatedBuoys = await Promise.all(buoys.map((buoy) => sendBuoyCommand(buoy.id, command, target)));
      setBuoys((current) =>
        current.map((buoy) => updatedBuoys.find((updatedBuoy) => updatedBuoy.id === buoy.id) ?? buoy)
      );
    } catch {
      setError('Unable to send command to all buoys.');
    }
  }

  async function handleAddBuoy(input: { name: string; latitude?: number | null; longitude?: number | null }) {
    try {
      const buoy = await createBuoy(input);
      setBuoys((current) => [...current.filter((item) => item.id !== buoy.id), buoy].sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setError('Unable to add buoy.');
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
        onStartSetHome={() => setIsSettingHome(true)}
        isSettingHome={isSettingHome}
      />

      <main className="relative min-h-[55vh]">
        <RacetrackMap
          center={position}
          searchTarget={searchTarget}
          buoys={buoys}
          draft={draft}
          selectedTrack={selectedTrack}
          isSettingHome={isSettingHome}
          onAddMark={handleAddMark}
          onMoveMark={handleMoveMark}
          onSetHome={handleSetHome}
        />
        <AddressSearch onSelect={setSearchTarget} onError={setError} />
        <div className="absolute bottom-3 left-3 z-[500] max-w-[calc(100%-1.5rem)] rounded-md bg-white px-3 py-2 text-sm shadow">
          {isSettingHome ? 'Click map to set home' : located ? 'Using browser location' : 'Using San Francisco fallback'}
          {!isSettingHome && <span className="ml-2 text-slate-500">Double-click map to add marks</span>}
        </div>
        {error && <div className="absolute bottom-14 left-3 z-[500] rounded-md bg-red-600 px-3 py-2 text-sm text-white shadow">{error}</div>}
      </main>

      <BuoyPanel buoys={buoys} draft={draft} onCommand={handleCommand} onCommandAll={handleCommandAll} onAddBuoy={handleAddBuoy} />
    </div>
  );
}
