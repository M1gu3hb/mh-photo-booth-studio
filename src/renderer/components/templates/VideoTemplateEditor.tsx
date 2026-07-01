import { useEffect, useRef, useState } from 'react';
import { Button, PrimaryButton, Input, Select, useToast } from '@renderer/components/ui';
import {
  parseVideoTemplateConfig,
  type VideoOverlayItem,
  type OverlayFont
} from '@shared/types/videoTemplates';
import './videoTemplates.css';

const FONT_OPTIONS: { value: OverlayFont; label: string }[] = [
  { value: 'display', label: 'Elegante (Cinzel)' },
  { value: 'script', label: 'Caligráfica (Pinyon)' },
  { value: 'ui', label: 'Moderna (Inter)' }
];

const FONT_FAMILIES: Record<OverlayFont, string> = {
  display: 'Cinzel, "Times New Roman", serif',
  script: '"Pinyon Script", "Segoe Script", cursive',
  ui: 'Inter, system-ui, sans-serif'
};

const TEXT_COLORS = [
  { value: '#f4efe2', label: 'Crema' },
  { value: '#e8ce84', label: 'Oro claro' },
  { value: '#c9a24a', label: 'Oro' },
  { value: '#ffffff', label: 'Blanco' },
  { value: '#08130d', label: 'Tinta' }
];

interface VideoTemplateEditorProps {
  editId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

let nextId = 1;
const genId = () => `ov_${Date.now().toString(36)}_${nextId++}`;

/**
 * Overlay editor (Fase 17): design the logo/text layer that gets burned into
 * every recorded video. Normalized 0..1 coordinates over a 16:9 stage.
 */
export function VideoTemplateEditor({ editId, onClose, onSaved }: VideoTemplateEditorProps) {
  const { notify } = useToast();
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('Plantilla de video');
  const [items, setItems] = useState<VideoOverlayItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editId !== null);

  useEffect(() => {
    if (!editId) return;
    let on = true;
    void window.photoBooth.videoTemplates.get(editId).then((res) => {
      if (on && res.ok) {
        setName(res.data.name);
        setItems(parseVideoTemplateConfig(res.data.configJson).items);
      }
      if (on) setLoading(false);
    });
    return () => {
      on = false;
    };
  }, [editId]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  function updateItem(id: string, patch: Partial<VideoOverlayItem>): void {
    setItems((prev) => prev.map((i) => (i.id === id ? ({ ...i, ...patch } as VideoOverlayItem) : i)));
  }

  function addText(): void {
    const item: VideoOverlayItem = {
      kind: 'text',
      id: genId(),
      text: 'Tu texto',
      x: 0.08,
      y: 0.08,
      size: 0.08,
      font: 'display',
      color: '#e8ce84',
      opacity: 1
    };
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
  }

  function addImageFromFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const probe = new window.Image();
      probe.onload = () => {
        const aspect = probe.naturalHeight > 0 ? probe.naturalWidth / probe.naturalHeight : 1;
        const width = 0.22;
        // Normalized height that preserves the image's real aspect on a 16:9
        // frame: (W·16)/(H·9) = aspect → H = 16W / (9·aspect).
        const item: VideoOverlayItem = {
          kind: 'image',
          id: genId(),
          dataUrl,
          x: 0.06,
          y: 0.72,
          width,
          height: (16 * width) / (9 * aspect),
          opacity: 1
        };
        setItems((prev) => [...prev, item]);
        setSelectedId(item.id);
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removeSelected(): void {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  }

  function startDrag(id: string, mode: 'move' | 'resize', e: React.PointerEvent): void {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    const stage = stageRef.current;
    const origin = items.find((i) => i.id === id);
    if (!stage || !origin) return;
    const rect = stage.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / rect.width;
      const dy = (ev.clientY - startY) / rect.height;
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i;
          if (mode === 'move') {
            return { ...i, x: Math.min(0.98, Math.max(0, origin.x + dx)), y: Math.min(0.98, Math.max(0, origin.y + dy)) };
          }
          if (i.kind === 'image' && origin.kind === 'image') {
            const width = Math.min(1, Math.max(0.04, origin.width + dx));
            const height = origin.width > 0 ? (origin.height / origin.width) * width : origin.height;
            return { ...i, width, height };
          }
          if (i.kind === 'text' && origin.kind === 'text') {
            return { ...i, size: Math.min(0.4, Math.max(0.02, origin.size + dy)) };
          }
          return i;
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

  async function handleSave(): Promise<void> {
    setBusy(true);
    const input = { name, config: { items } };
    const res = editId
      ? await window.photoBooth.videoTemplates.save(editId, input)
      : await window.photoBooth.videoTemplates.create(input);
    setBusy(false);
    if (res.ok) {
      notify({ tone: 'success', title: 'Plantilla de video guardada', message: res.data.name });
      onSaved();
    } else {
      notify({ tone: 'danger', title: 'No se pudo guardar', message: res.error.userMessage });
    }
  }

  if (loading) return <p className="pb-vt__hint">Cargando plantilla…</p>;

  return (
    <div className="pb-vt">
      <div className="pb-vt__form">
        <Input label="Nombre" value={name} maxLength={90} onChange={(e) => setName(e.target.value)} />

        <div className="pb-vt__tools">
          <Button size="sm" icon="add" variant="secondary" onClick={addText}>
            Agregar texto
          </Button>
          <Button size="sm" icon="image" variant="secondary" onClick={() => fileRef.current?.click()}>
            Agregar imagen/logo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addImageFromFile(file);
              e.target.value = '';
            }}
          />
          {selected && (
            <Button size="sm" icon="delete" variant="ghost" onClick={removeSelected}>
              Quitar elemento
            </Button>
          )}
        </div>

        {selected?.kind === 'text' && (
          <div className="pb-vt__props">
            <Input
              label="Texto"
              value={selected.text}
              onChange={(e) => updateItem(selected.id, { text: e.target.value })}
            />
            <Select
              label="Tipografía"
              value={selected.font}
              onChange={(e) => updateItem(selected.id, { font: e.target.value as OverlayFont })}
              options={FONT_OPTIONS}
            />
            <Select
              label="Color"
              value={selected.color}
              onChange={(e) => updateItem(selected.id, { color: e.target.value })}
              options={TEXT_COLORS}
            />
          </div>
        )}

        <div className="pb-vt__actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <PrimaryButton icon="save" onClick={() => void handleSave()} disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar plantilla'}
          </PrimaryButton>
        </div>
      </div>

      <div className="pb-vt__stagewrap">
        <div ref={stageRef} className="pb-vt__stage" onPointerDown={() => setSelectedId(null)}>
          {items.map((item) => (
            <div
              key={item.id}
              className={`pb-vt__item ${selectedId === item.id ? 'pb-vt__item--on' : ''}`.trim()}
              style={
                item.kind === 'image'
                  ? {
                      left: `${item.x * 100}%`,
                      top: `${item.y * 100}%`,
                      width: `${item.width * 100}%`,
                      height: `${item.height * 100}%`,
                      opacity: item.opacity
                    }
                  : { left: `${item.x * 100}%`, top: `${item.y * 100}%`, opacity: item.opacity }
              }
              onPointerDown={(e) => startDrag(item.id, 'move', e)}
            >
              {item.kind === 'image' ? (
                <img src={item.dataUrl} alt="" draggable={false} />
              ) : (
                <span
                  className="pb-vt__text"
                  style={{
                    fontFamily: FONT_FAMILIES[item.font],
                    color: item.color,
                    fontSize: `calc(${item.size} * var(--vt-stage-h, 220px))`
                  }}
                >
                  {item.text}
                </span>
              )}
              {selectedId === item.id && (
                <span className="pb-vt__resize" onPointerDown={(e) => startDrag(item.id, 'resize', e)} />
              )}
            </div>
          ))}
          <span className="pb-vt__watermark">Vista del video (16:9)</span>
        </div>
        <p className="pb-vt__hint">
          Arrastra para mover; esquina para redimensionar. Todo lo que pongas aquí sale grabado
          encima del video.
        </p>
      </div>
    </div>
  );
}
