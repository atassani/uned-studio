import { useMemo, useState } from 'react';
import { AreaType } from '../types';
import { sanitizeConfiguredAreaShortNames } from '../areaConfig';

interface AreaConfigurationProps {
  areas: AreaType[];
  initialSelectedShortNames?: string[];
  onAccept: (selectedShortNames: string[]) => void;
  onCancel?: () => void;
  allowCancel?: boolean;
}

type DragState = {
  shortName: string;
  source: 'available' | 'selected';
} | null;

export function AreaConfiguration({
  areas,
  initialSelectedShortNames,
  onAccept,
  onCancel,
  allowCancel = true,
}: AreaConfigurationProps) {
  const [selectedShortNames, setSelectedShortNames] = useState<string[]>(() => {
    if (initialSelectedShortNames && initialSelectedShortNames.length > 0) {
      return sanitizeConfiguredAreaShortNames(initialSelectedShortNames, areas);
    }
    return areas.map((area) => area.shortName);
  });
  const [showEmptyError, setShowEmptyError] = useState(false);
  const [draggingItem, setDraggingItem] = useState<DragState>(null);

  const areaByShortName = useMemo(() => {
    return new Map(areas.map((area) => [area.shortName, area]));
  }, [areas]);

  const selectedSet = useMemo(() => new Set(selectedShortNames), [selectedShortNames]);

  const selectedAreas = selectedShortNames
    .map((shortName) => areaByShortName.get(shortName))
    .filter((area): area is AreaType => Boolean(area));

  const availableAreas = areas.filter((area) => !selectedSet.has(area.shortName));

  const addArea = (shortName: string) => {
    setShowEmptyError(false);
    setSelectedShortNames((prev) => {
      if (prev.includes(shortName)) return prev;
      return [...prev, shortName];
    });
  };

  const removeArea = (shortName: string) => {
    setSelectedShortNames((prev) => prev.filter((entry) => entry !== shortName));
  };

  const moveArea = (shortName: string, direction: 'up' | 'down') => {
    setSelectedShortNames((prev) => {
      const index = prev.indexOf(shortName);
      if (index < 0) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const reorderByTarget = (draggedShortName: string, targetShortName: string) => {
    if (draggedShortName === targetShortName) return;
    setSelectedShortNames((prev) => {
      const fromIndex = prev.indexOf(draggedShortName);
      const toIndex = prev.indexOf(targetShortName);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;

      const next = [...prev];
      const [dragged] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, dragged);
      return next;
    });
  };

  const insertSelectedBeforeTarget = (shortName: string, targetShortName: string) => {
    if (shortName === targetShortName) return;
    setSelectedShortNames((prev) => {
      const targetIndex = prev.indexOf(targetShortName);
      if (targetIndex < 0) return prev;
      if (prev.includes(shortName)) return prev;
      const next = [...prev];
      next.splice(targetIndex, 0, shortName);
      return next;
    });
  };

  const moveToAvailable = (shortName: string) => {
    removeArea(shortName);
  };

  const moveToSelected = (shortName: string) => {
    addArea(shortName);
  };

  const handleAccept = () => {
    if (selectedShortNames.length === 0) {
      setShowEmptyError(true);
      return;
    }
    setShowEmptyError(false);
    onAccept(selectedShortNames);
  };

  return (
    <div className="space-y-6" data-testid="area-configuration-view">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Configurar áreas</h2>
        <p className="text-sm text-gray-600 mt-2">
          Selecciona qué áreas quieres ver en &quot;Cambiar área&quot; y en qué orden.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section
          className="border border-gray-200 rounded-lg p-4 order-1 md:order-2"
          aria-label="Áreas seleccionadas"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (draggingItem?.source === 'available') {
              moveToSelected(draggingItem.shortName);
            }
            setDraggingItem(null);
          }}
        >
          <h3 className="text-lg font-semibold mb-3">Seleccionadas</h3>
          <div className="space-y-2" data-testid="selected-areas-list">
            {selectedAreas.map((area, index) => (
              <div
                key={area.shortName}
                className={`flex items-center justify-between gap-2 border rounded p-2 ${
                  draggingItem?.shortName === area.shortName
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-100'
                }`}
                draggable
                onDragStart={(event) => {
                  setDraggingItem({ shortName: area.shortName, source: 'selected' });
                  event.dataTransfer.setData('text/plain', area.shortName);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!draggingItem) return;
                  if (draggingItem.source === 'selected') {
                    reorderByTarget(draggingItem.shortName, area.shortName);
                  } else {
                    insertSelectedBeforeTarget(draggingItem.shortName, area.shortName);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDraggingItem(null);
                }}
                onDragEnd={() => setDraggingItem(null)}
              >
                <span className="text-sm">
                  {index + 1}. <strong>{area.shortName.toUpperCase()}</strong> - {area.area}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-sm px-1 select-none" aria-hidden="true">
                    ↕
                  </span>
                  <button
                    className="h-7 w-7 bg-gray-200 rounded text-sm font-bold"
                    onClick={() => moveArea(area.shortName, 'up')}
                    aria-label={`Subir ${area.area}`}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    className="h-7 w-7 bg-gray-200 rounded text-sm font-bold"
                    onClick={() => moveArea(area.shortName, 'down')}
                    aria-label={`Bajar ${area.area}`}
                    disabled={index === selectedAreas.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    className="h-7 w-7 bg-red-600 text-white rounded text-sm font-bold"
                    onClick={() => removeArea(area.shortName)}
                    aria-label={`Quitar ${area.area}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className="border border-gray-200 rounded-lg p-4 order-2 md:order-1"
          aria-label="Áreas disponibles"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (draggingItem?.source === 'selected') {
              moveToAvailable(draggingItem.shortName);
            }
            setDraggingItem(null);
          }}
        >
          <h3 className="text-lg font-semibold mb-3">Disponibles</h3>
          <div className="space-y-2">
            {availableAreas.length === 0 && (
              <p className="text-sm text-gray-500" data-testid="no-available-areas">
                No hay más áreas disponibles.
              </p>
            )}
            {availableAreas.map((area) => (
              <div
                key={area.shortName}
                className={`flex items-center justify-between gap-3 border rounded p-2 ${
                  draggingItem?.shortName === area.shortName
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-100'
                }`}
                draggable
                onDragStart={(event) => {
                  setDraggingItem({ shortName: area.shortName, source: 'available' });
                  event.dataTransfer.setData('text/plain', area.shortName);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => setDraggingItem(null)}
              >
                <span className="text-sm">
                  <strong>{area.shortName.toUpperCase()}</strong> - {area.area}
                </span>
                <button
                  className="h-8 w-8 bg-green-600 text-white rounded text-lg font-bold"
                  onClick={() => addArea(area.shortName)}
                  aria-label={`Agregar ${area.area}`}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showEmptyError && (
        <p className="text-sm text-red-600" data-testid="area-config-empty-error">
          Debes seleccionar al menos un área.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        {allowCancel && onCancel && (
          <button
            className="px-5 py-2 rounded bg-gray-500 text-white"
            onClick={onCancel}
            data-testid="area-config-cancel"
          >
            Cancelar
          </button>
        )}
        <button
          className="px-5 py-2 rounded bg-blue-600 text-white"
          onClick={handleAccept}
          data-testid="area-config-accept"
          aria-label="Aceptar configuración de áreas"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
