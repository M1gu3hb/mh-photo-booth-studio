import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent
} from 'react';
import { Button, Input, Select, Toggle, Icon, ErrorState, useToast } from '@renderer/components/ui';
import type { TemplateWithSlots, TemplateSlotInput } from '@shared/types/templates';
import type { FitMode } from '@shared/types/entities';
import { DEMO_PHOTO_SVG, DEMO_QR_SVG } from './demoAssets';
import './templates.css';

interface EditorSlot extends TemplateSlotInput {
  localId: string;
}

interface TemplateEditorProps {
  templateId: string;
  onClose: () => void;
  onSaved: () => void;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2];
const FIT_OPTIONS: { value: FitMode; label: string }[] = [
  { value: 'cover', label: 'Cubrir (recorta)' },
  { value: 'contain', label: 'Contener (bordes)' },
  { value: 'stretch', label: 'Estirar' }
];

let localCounter = 0;
function nextLocalId(): string {
  localCounter += 1;
  return `slot-${localCounter}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function TemplateEditor({ templateId, onClose, onSaved }: TemplateEditorProps) {
  const { notify } = useToast();
  const [data, setData] = useState<TemplateWithSlots | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [formatLabel, setFormatLabel] = useState<string>('vertical_strip');
  const [slots, setSlots] = useState<EditorSlot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gridOn, setGridOn] = useState(true);
  const [previewOn, setPreviewOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<
    | { mode: 'move' | 'resize'; localId: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number }
    | null
  >(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      window.photoBooth.templates.get(templateId),
      window.photoBooth.templates.getImage(templateId)
    ]).then(([getRes, imgRes]) => {
      if (!active) return;
      if (getRes.ok) {
        setData(getRes.data);
        setName(getRes.data.template.name);
        setFormatLabel(getRes.data.template.formatLabel ?? 'vertical_strip');
        setSlots(
          getRes.data.slots.map((s) => ({
            localId: nextLocalId(),
            slotType: s.slotType,
            slotKey: s.slotKey,
            x: s.x,
            y: s.y,
            width: s.width,
            height: s.height,
            rotation: s.rotation,
            zIndex: s.zIndex,
            fitMode: s.fitMode
          }))
        );
      } else {
        setLoadError(getRes.error.userMessage);
      }
      if (imgRes.ok) setImageUrl(imgRes.data);
    });
    return () => {
      active = false;
    };
  }, [templateId]);

  const template = data?.template ?? null;
  const baseScale = useMemo(() => {
    if (!template) return 1;
    return Math.min(560 / template.widthPx, 620 / template.heightPx);
  }, [template]);
  const scale = baseScale * zoom;

  const updateSlot = useCallback((localId: string, patch: Partial<EditorSlot>) => {
    setSlots((prev) => prev.map((s) => (s.localId === localId ? { ...s, ...patch } : s)));
  }, []);

  const selected = slots.find((s) => s.localId === selectedId) ?? null;

  function addSlot(type: 'photo' | 'qr' | 'text') {
    if (!template) return;
    const count = slots.filter((s) => s.slotType === type).length + 1;
    const maxZ = slots.reduce((m, s) => Math.max(m, s.zIndex), 0);
    let width: number;
    let height: number;
    let slotKey: string;
    if (type === 'qr') {
      width = Math.round(template.widthPx * 0.18);
      height = width;
      slotKey = `qr_${count}`;
    } else if (type === 'text') {
      width = Math.round(template.widthPx * 0.7);
      height = Math.round(template.heightPx * 0.08);
      slotKey = '{event_name}';
    } else {
      width = Math.round(template.widthPx * 0.45);
      height = Math.round(template.heightPx * 0.28);
      slotKey = `photo_${count}`;
    }
    const slot: EditorSlot = {
      localId: nextLocalId(),
      slotType: type,
      slotKey,
      x: Math.round((template.widthPx - width) / 2),
      y: Math.round((template.heightPx - height) / 2),
      width,
      height,
      rotation: 0,
      zIndex: maxZ + 1,
      fitMode: 'cover'
    };
    setSlots((prev) => [...prev, slot]);
    setSelectedId(slot.localId);
  }

  function duplicateSelected() {
    if (!selected || !template) return;
    const maxZ = slots.reduce((m, s) => Math.max(m, s.zIndex), 0);
    const baseKey = selected.slotType;
    const count = slots.filter((s) => s.slotType === baseKey).length + 1;
    const copy: EditorSlot = {
      ...selected,
      localId: nextLocalId(),
      slotKey: `${baseKey}_${count}`,
      x: clamp(selected.x + 24, 0, template.widthPx - selected.width),
      y: clamp(selected.y + 24, 0, template.heightPx - selected.height),
      zIndex: maxZ + 1
    };
    setSlots((prev) => [...prev, copy]);
    setSelectedId(copy.localId);
  }

  function deleteSelected() {
    if (!selected) return;
    setSlots((prev) => prev.filter((s) => s.localId !== selected.localId));
    setSelectedId(null);
  }

  function reorder(direction: 'front' | 'back') {
    if (!selected) return;
    const zs = slots.map((s) => s.zIndex);
    const target = direction === 'front' ? Math.max(...zs) + 1 : Math.min(...zs) - 1;
    updateSlot(selected.localId, { zIndex: target });
  }

  // ---- Pointer drag/resize ----
  function beginDrag(event: ReactPointerEvent, localId: string, mode: 'move' | 'resize') {
    if (previewOn) return;
    event.stopPropagation();
    const slot = slots.find((s) => s.localId === localId);
    if (!slot) return;
    setSelectedId(localId);
    dragRef.current = {
      mode,
      localId,
      startX: event.clientX,
      startY: event.clientY,
      origX: slot.x,
      origY: slot.y,
      origW: slot.width,
      origH: slot.height
    };
    stageRef.current?.setPointerCapture(event.pointerId);
  }

  function onStagePointerMove(event: ReactPointerEvent) {
    const drag = dragRef.current;
    if (!drag || !template) return;
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;
    if (drag.mode === 'move') {
      updateSlot(drag.localId, {
        x: Math.round(clamp(drag.origX + dx, 0, template.widthPx - drag.origW)),
        y: Math.round(clamp(drag.origY + dy, 0, template.heightPx - drag.origH))
      });
    } else {
      updateSlot(drag.localId, {
        width: Math.round(clamp(drag.origW + dx, 20, template.widthPx - drag.origX)),
        height: Math.round(clamp(drag.origH + dy, 20, template.heightPx - drag.origY))
      });
    }
  }

  function endDrag(event: ReactPointerEvent) {
    if (dragRef.current) {
      stageRef.current?.releasePointerCapture(event.pointerId);
      dragRef.current = null;
    }
  }

  // ---- Keyboard nudge ----
  function onStageKeyDown(event: ReactKeyboardEvent) {
    if (!selected || !template) return;
    const step = event.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    if (event.key === 'ArrowLeft') dx = -step;
    else if (event.key === 'ArrowRight') dx = step;
    else if (event.key === 'ArrowUp') dy = -step;
    else if (event.key === 'ArrowDown') dy = step;
    else if (event.key === 'Delete') {
      deleteSelected();
      event.preventDefault();
      return;
    } else return;
    event.preventDefault();
    updateSlot(selected.localId, {
      x: Math.round(clamp(selected.x + dx, 0, template.widthPx - selected.width)),
      y: Math.round(clamp(selected.y + dy, 0, template.heightPx - selected.height))
    });
  }

  async function handleSave() {
    if (!template) return;
    setSaving(true);
    setSaveError(null);
    const payload = {
      name,
      formatLabel,
      slots: slots.map(({ localId: _localId, ...rest }) => rest)
    };
    const result = await window.photoBooth.templates.save(templateId, payload);
    setSaving(false);
    if (result.ok) {
      notify({ tone: 'success', title: 'Plantilla guardada', message: result.data.template.name });
      onSaved();
    } else {
      setSaveError(`${result.error.userMessage} ${result.error.action}`.trim());
    }
  }

  if (loadError) {
    return (
      <ErrorState
        userMessage={loadError}
        action="Vuelve a la lista e intenta con otra plantilla."
        retry={
          <Button size="sm" variant="secondary" onClick={onClose}>
            Volver
          </Button>
        }
      />
    );
  }
  if (!template) {
    return <p className="pb-tpled__loading">Cargando editor…</p>;
  }

  const stageW = template.widthPx * scale;
  const stageH = template.heightPx * scale;
  const ordered = [...slots].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="pb-tpled">
      <header className="pb-tpled__header">
        <Input label="Nombre de la plantilla" value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label="Formato"
          value={formatLabel}
          onChange={(e) => setFormatLabel(e.target.value)}
          options={[
            { value: 'vertical_strip', label: 'Tira vertical' },
            { value: 'postcard', label: 'Postal' },
            { value: 'custom', label: 'Personalizada' }
          ]}
        />
        <div className="pb-tpled__headerActions">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button icon="save" onClick={() => void handleSave()} disabled={saving}>
            Guardar plantilla
          </Button>
        </div>
      </header>

      {saveError && (
        <div className="pb-tpled__saveError" role="alert">
          <Icon name="warning" size={18} /> {saveError}
        </div>
      )}

      <div className="pb-tpled__body">
        <div className="pb-tpled__canvasCol">
          <div className="pb-tpled__toolbar">
            <Button size="sm" icon="add" onClick={() => addSlot('photo')}>
              Slot foto
            </Button>
            <Button size="sm" variant="secondary" icon="qr" onClick={() => addSlot('qr')}>
              Slot QR
            </Button>
            <Button size="sm" variant="secondary" icon="edit" onClick={() => addSlot('text')}>
              Slot texto
            </Button>
            <span className="pb-tpled__sep" />
            <Toggle checked={gridOn} onChange={setGridOn} label="Cuadrícula" />
            <Toggle checked={previewOn} onChange={setPreviewOn} label="Vista previa" />
            <span className="pb-tpled__sep" />
            <div className="pb-tpled__zoom">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setZoom((z) => ZOOM_LEVELS[Math.max(0, ZOOM_LEVELS.indexOf(z) - 1)] ?? z)}
                aria-label="Reducir zoom"
              >
                −
              </Button>
              <span className="pb-tpled__zoomLabel">{Math.round(zoom * 100)}%</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setZoom((z) => ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, ZOOM_LEVELS.indexOf(z) + 1)] ?? z)
                }
                aria-label="Aumentar zoom"
              >
                +
              </Button>
            </div>
          </div>

          <div className="pb-tpled__stageWrap">
            <div
              ref={stageRef}
              className="pb-tpled__stage"
              style={{ width: stageW, height: stageH }}
              tabIndex={0}
              onPointerMove={onStagePointerMove}
              onPointerUp={endDrag}
              onKeyDown={onStageKeyDown}
              onPointerDown={() => setSelectedId(null)}
            >
              {imageUrl && <img className="pb-tpled__base" src={imageUrl} alt="" draggable={false} />}
              {gridOn && !previewOn && <div className="pb-tpled__grid" />}
              {ordered.map((slot) => {
                const isSelected = slot.localId === selectedId;
                return (
                  <div
                    key={slot.localId}
                    className={`pb-slot pb-slot--${slot.slotType} ${isSelected ? 'pb-slot--selected' : ''} ${previewOn ? 'pb-slot--preview' : ''}`.trim()}
                    style={{
                      left: slot.x * scale,
                      top: slot.y * scale,
                      width: slot.width * scale,
                      height: slot.height * scale,
                      zIndex: slot.zIndex
                    }}
                    onPointerDown={(e) => beginDrag(e, slot.localId, 'move')}
                  >
                    {previewOn ? (
                      slot.slotType === 'text' ? (
                        <span className="pb-slot__demotext">{slot.slotKey.replace(/[{}]/g, '')}</span>
                      ) : (
                        <img
                          className="pb-slot__demo"
                          src={slot.slotType === 'qr' ? DEMO_QR_SVG : DEMO_PHOTO_SVG}
                          alt=""
                          style={{ objectFit: slot.fitMode === 'stretch' ? 'fill' : slot.fitMode }}
                          draggable={false}
                        />
                      )
                    ) : (
                      <>
                        <span className="pb-slot__label">
                          <Icon
                            name={slot.slotType === 'qr' ? 'qr' : slot.slotType === 'text' ? 'edit' : 'image'}
                            size={14}
                          />{' '}
                          {slot.slotKey}
                        </span>
                        <button
                          type="button"
                          className="pb-slot__handle"
                          aria-label="Redimensionar"
                          onPointerDown={(e) => beginDrag(e, slot.localId, 'resize')}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="pb-tpled__hint">
            Arrastra para mover, usa la esquina para redimensionar, flechas para ajuste fino (Shift = 10px).
          </p>
        </div>

        <aside className="pb-tpled__props">
          {selected ? (
            <>
              <h3 className="pb-tpled__propsTitle">
                <Icon
                  name={selected.slotType === 'qr' ? 'qr' : selected.slotType === 'text' ? 'edit' : 'image'}
                  size={16}
                />{' '}
                {selected.slotKey}
              </h3>
              {selected.slotType === 'text' ? (
                <Select
                  label="Texto dinámico"
                  value={selected.slotKey}
                  onChange={(e) => updateSlot(selected.localId, { slotKey: e.target.value })}
                  options={[
                    { value: '{event_name}', label: 'Nombre del evento' },
                    { value: '{event_date}', label: 'Fecha del evento' },
                    { value: '{event_type}', label: 'Tipo de evento' }
                  ]}
                />
              ) : (
                <Input
                  label="Nombre / clave"
                  value={selected.slotKey}
                  onChange={(e) => updateSlot(selected.localId, { slotKey: e.target.value })}
                />
              )}
              <div className="pb-tpled__propRow">
                <Input
                  label="X (px)"
                  type="number"
                  value={selected.x}
                  onChange={(e) => updateSlot(selected.localId, { x: Number(e.target.value) })}
                />
                <Input
                  label="Y (px)"
                  type="number"
                  value={selected.y}
                  onChange={(e) => updateSlot(selected.localId, { y: Number(e.target.value) })}
                />
              </div>
              <div className="pb-tpled__propRow">
                <Input
                  label="Ancho (px)"
                  type="number"
                  value={selected.width}
                  onChange={(e) => updateSlot(selected.localId, { width: Number(e.target.value) })}
                />
                <Input
                  label="Alto (px)"
                  type="number"
                  value={selected.height}
                  onChange={(e) => updateSlot(selected.localId, { height: Number(e.target.value) })}
                />
              </div>
              {selected.slotType === 'photo' && (
                <Select
                  label="Ajuste de la foto"
                  value={selected.fitMode}
                  onChange={(e) => updateSlot(selected.localId, { fitMode: e.target.value as FitMode })}
                  options={FIT_OPTIONS}
                />
              )}
              <div className="pb-tpled__propRow">
                <Button size="sm" variant="secondary" onClick={() => reorder('front')}>
                  Traer al frente
                </Button>
                <Button size="sm" variant="secondary" onClick={() => reorder('back')}>
                  Enviar atrás
                </Button>
              </div>
              <div className="pb-tpled__propRow">
                <Button size="sm" variant="secondary" icon="duplicate" onClick={duplicateSelected}>
                  Duplicar
                </Button>
                <Button size="sm" variant="danger" icon="delete" onClick={deleteSelected}>
                  Eliminar
                </Button>
              </div>
            </>
          ) : (
            <div className="pb-tpled__propsEmpty">
              <Icon name="templates" size={28} />
              <p>Selecciona un slot para editar sus propiedades, o agrega uno nuevo.</p>
              <p className="pb-tpled__propsCount">
                {slots.filter((s) => s.slotType === 'photo').length} foto · {slots.filter((s) => s.slotType === 'qr').length} QR
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
