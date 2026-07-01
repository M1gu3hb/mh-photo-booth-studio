import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, PrimaryButton, Select, Input, Icon, useToast } from '@renderer/components/ui';
import { computeStripGrid } from '@shared/lib/sheet';
import { paperByKey, PAPER_SIZES, SHEET_LAYOUTS } from '@shared/constants/print';
import type { TemplateRecord, PrintTemplateMode } from '@shared/types/entities';
import type { PrintTemplateSlotInput } from '@shared/types/printTemplates';
import './printTemplates.css';

interface NormSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PrintTemplateEditorProps {
  eventId: string;
  /** Existing print-template id to edit, or null to create a new one. */
  editId: string | null;
  /** Universal photo templates (for the "uses which template" picker). */
  templates: TemplateRecord[];
  onClose: () => void;
  onSaved: () => void;
}

const MODE_LABELS: Record<PrintTemplateMode, string> = {
  grid: 'Auto (rejilla)',
  custom: 'Manual',
  full: 'Hoja completa'
};

function sheetPx(paperKey: string, orientation: 'portrait' | 'landscape'): { w: number; h: number } {
  const paper = paperByKey(paperKey);
  let w = paper.widthPx;
  let h = paper.heightPx;
  if (orientation === 'landscape') [w, h] = [h, w];
  return { w, h };
}

/** Editor for a per-event print template: paper, which photo template it uses,
 * and the strip layout (auto grid, manual slots, or full sheet). */
export function PrintTemplateEditor({ eventId, editId, templates, onClose, onSaved }: PrintTemplateEditorProps) {
  const { notify } = useToast();
  const stageRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState('Plantilla de impresión');
  const [paperKey, setPaperKey] = useState('4x6');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [mode, setMode] = useState<PrintTemplateMode>('grid');
  const [cellCount, setCellCount] = useState(2);
  const [photoTemplateId, setPhotoTemplateId] = useState<string | null>(templates[0]?.id ?? null);
  const [slots, setSlots] = useState<NormSlot[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoAspect, setPhotoAspect] = useState(0.4);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editId !== null);

  // Load an existing template's fields + slots.
  useEffect(() => {
    if (!editId) return;
    let on = true;
    void (async () => {
      const res = await window.photoBooth.printTemplates.get(editId);
      if (on && res.ok) {
        const t = res.data.template;
        setName(t.name);
        setPaperKey(t.paperKey);
        setOrientation(t.orientation);
        setMode(t.mode);
        setCellCount(t.cellCount);
        setPhotoTemplateId(t.photoTemplateId);
        setSlots(res.data.slots.map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height })));
      }
      if (on) setLoading(false);
    })();
    return () => {
      on = false;
    };
  }, [editId]);

  // Load the chosen photo template's image + aspect (drives strip shape).
  useEffect(() => {
    if (!photoTemplateId) {
      setPhotoUrl(null);
      return;
    }
    let on = true;
    void (async () => {
      const [img, meta] = await Promise.all([
        window.photoBooth.templates.getImage(photoTemplateId),
        window.photoBooth.templates.get(photoTemplateId)
      ]);
      if (!on) return;
      setPhotoUrl(img.ok ? img.data : null);
      if (meta.ok && meta.data.template.heightPx > 0) {
        setPhotoAspect(meta.data.template.widthPx / meta.data.template.heightPx);
      }
    })();
    return () => {
      on = false;
    };
  }, [photoTemplateId]);

  const autoArrange = useCallback(
    (count: number): NormSlot[] => {
      const { w, h } = sheetPx(paperKey, orientation);
      const margin = Math.round(Math.min(w, h) * 0.02);
      const gap = Math.round(Math.min(w, h) * 0.012);
      const { cells } = computeStripGrid(w, h, count, photoAspect, margin, gap);
      return cells.map((c) => ({ x: c.x / w, y: c.y / h, width: c.width / w, height: c.height / h }));
    },
    [paperKey, orientation, photoAspect]
  );

  // Cells shown in the preview for the current mode.
  const previewCells: NormSlot[] =
    mode === 'custom'
      ? slots
      : mode === 'full'
        ? [{ x: 0.02, y: 0.02, width: 0.96, height: 0.96 }]
        : autoArrange(cellCount);

  const paper = sheetPx(paperKey, orientation);

  // Normalized height that keeps a strip's REAL aspect (photoAspect = w/h in px)
  // for the current sheet, so the slot box always equals the strip footprint
  // (no "extra space" padding) and resizing stays proportional.
  const heightForWidth = useCallback(
    (widthN: number): number => {
      const asp = photoAspect > 0 ? photoAspect : 0.5;
      return (widthN * paper.w) / (asp * paper.h);
    },
    [photoAspect, paper.w, paper.h]
  );

  // ----- Custom-mode pointer drag / resize -----
  function startDrag(index: number, mode2: 'move' | 'resize', e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = slots[index]!;
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / rect.width;
      const dy = (ev.clientY - startY) / rect.height;
      setSlots((prev) =>
        prev.map((s, i) => {
          if (i !== index) return s;
          if (mode2 === 'move') {
            return {
              ...s,
              x: Math.min(1 - s.width, Math.max(0, origin.x + dx)),
              y: Math.min(1 - s.height, Math.max(0, origin.y + dy))
            };
          }
          // Resize keeps the strip aspect: width follows the drag, height derived.
          const width = Math.min(1 - s.x, Math.max(0.08, origin.width + dx));
          let height = heightForWidth(width);
          if (s.y + height > 1) height = 1 - s.y;
          return { ...s, width, height };
        })
      );
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function addSlot() {
    const width = 0.3;
    setSlots((prev) => [...prev, { x: 0.06, y: 0.06, width, height: heightForWidth(width) }]);
  }
  function duplicateSlot(index: number) {
    setSlots((prev) => {
      const src = prev[index];
      if (!src) return prev;
      const copy: NormSlot = {
        x: Math.min(1 - src.width, src.x + 0.04),
        y: Math.min(1 - src.height, src.y + 0.04),
        width: src.width,
        height: src.height
      };
      return [...prev, copy];
    });
  }
  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setBusy(true);
    const slotInputs: PrintTemplateSlotInput[] =
      mode === 'custom'
        ? slots.map((s, i) => ({ x: s.x, y: s.y, width: s.width, height: s.height, rotation: 0, zIndex: i }))
        : [];
    const payload = {
      name,
      photoTemplateId,
      paperKey,
      orientation,
      mode,
      cellCount,
      slots: slotInputs
    };
    let id = editId;
    if (!id) {
      const created = await window.photoBooth.printTemplates.create(eventId, {
        name,
        photoTemplateId,
        paperKey,
        orientation,
        mode,
        cellCount
      });
      if (!created.ok) {
        setBusy(false);
        notify({ tone: 'danger', title: 'No se pudo crear', message: created.error.userMessage });
        return;
      }
      id = created.data.id;
    }
    const res = await window.photoBooth.printTemplates.save(id, payload);
    setBusy(false);
    if (res.ok) {
      notify({ tone: 'success', title: 'Plantilla de impresión guardada', message: res.data.template.name });
      onSaved();
    } else {
      notify({ tone: 'danger', title: 'No se pudo guardar', message: res.error.userMessage });
    }
  }

  if (loading) {
    return <p className="pb-pt-editor__hint">Cargando plantilla…</p>;
  }

  return (
    <div className="pb-pt-editor">
      <div className="pb-pt-editor__form">
        <Input label="Nombre" value={name} maxLength={90} onChange={(e) => setName(e.target.value)} />

        <Select
          label="Plantilla de foto que usa"
          value={photoTemplateId ?? ''}
          onChange={(e) => setPhotoTemplateId(e.target.value || null)}
          options={[
            { value: '', label: 'Ninguna (forma genérica)' },
            ...templates.map((t) => ({ value: t.id, label: t.name }))
          ]}
        />

        <Select
          label="Tamaño de papel"
          value={paperKey}
          onChange={(e) => setPaperKey(e.target.value)}
          options={PAPER_SIZES.map((p) => ({ value: p.key, label: p.label }))}
        />

        <Select
          label="Orientación"
          value={orientation}
          onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
          options={[
            { value: 'portrait', label: 'Vertical' },
            { value: 'landscape', label: 'Horizontal' }
          ]}
        />

        <div className="pb-field">
          <span className="pb-field__label">Acomodo</span>
          <div className="pb-pt-editor__modes">
            {(Object.keys(MODE_LABELS) as PrintTemplateMode[]).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? 'primary' : 'secondary'}
                onClick={() => {
                  if (m === 'custom' && slots.length === 0) setSlots(autoArrange(cellCount));
                  setMode(m);
                }}
              >
                {MODE_LABELS[m]}
              </Button>
            ))}
          </div>
        </div>

        {mode !== 'full' && (
          <Select
            label="Tiras por hoja"
            value={String(cellCount)}
            onChange={(e) => setCellCount(Number(e.target.value))}
            options={SHEET_LAYOUTS.map((n) => ({ value: String(n), label: `${n} por hoja` }))}
          />
        )}

        {mode === 'custom' && (
          <div className="pb-pt-editor__customtools">
            <Button size="sm" icon="add" variant="secondary" onClick={addSlot}>
              Agregar tira
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSlots(autoArrange(cellCount))}>
              Auto-acomodar {cellCount}
            </Button>
          </div>
        )}

        <div className="pb-pt-editor__actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <PrimaryButton icon="save" onClick={() => void handleSave()} disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar plantilla'}
          </PrimaryButton>
        </div>
      </div>

      <div className="pb-pt-editor__stagewrap">
        <div
          ref={stageRef}
          className="pb-pt-editor__stage"
          style={{ aspectRatio: `${paper.w} / ${paper.h}` }}
        >
          {previewCells.map((c, i) => (
            <div
              key={i}
              className={`pb-pt-slot ${mode === 'custom' ? 'pb-pt-slot--edit' : ''}`.trim()}
              style={{
                left: `${c.x * 100}%`,
                top: `${c.y * 100}%`,
                width: `${c.width * 100}%`,
                height: `${c.height * 100}%`
              }}
              onPointerDown={mode === 'custom' ? (e) => startDrag(i, 'move', e) : undefined}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="" draggable={false} />
              ) : (
                <span className="pb-pt-slot__num">{i + 1}</span>
              )}
              {mode === 'custom' && (
                <>
                  <button
                    type="button"
                    className="pb-pt-slot__dup"
                    aria-label="Duplicar tira"
                    title="Duplicar (mismo tamaño)"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => duplicateSlot(i)}
                  >
                    <Icon name="duplicate" size={14} />
                  </button>
                  <button
                    type="button"
                    className="pb-pt-slot__remove"
                    aria-label="Quitar tira"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => removeSlot(i)}
                  >
                    ×
                  </button>
                  <span
                    className="pb-pt-slot__resize"
                    onPointerDown={(e) => startDrag(i, 'resize', e)}
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <p className="pb-pt-editor__hint">
          {mode === 'custom'
            ? 'Arrastra para mover, esquina para redimensionar (mantiene la proporción). Usa el botón duplicar de cada tira para copiarla al mismo tamaño.'
            : mode === 'full'
              ? 'Una tira ocupa toda la hoja.'
              : 'Las tiras se acomodan solas para llenar la hoja.'}
        </p>
      </div>
    </div>
  );
}
