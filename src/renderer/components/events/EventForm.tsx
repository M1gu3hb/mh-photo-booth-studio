import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Select, Toggle, EmptyState, Icon } from '@renderer/components/ui';
import { EVENT_TYPES } from '@shared/constants/eventTypes';
import { PHOTO_COUNT_OPTIONS, MAX_DEFAULT_COPIES } from '@shared/constants/event';
import type { EventInput } from '@shared/types/events';
import type { EventRecord, TemplateRecord, VideoTemplateRecord } from '@shared/types/entities';
import type { MutationResult } from '@renderer/state/EventsProvider';
import './events.css';

interface EventFormProps {
  initial?: EventRecord;
  onSubmit: (input: EventInput) => Promise<MutationResult<EventRecord>>;
  onCancel: () => void;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function EventForm({ initial, onSubmit, onCancel }: EventFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [eventType, setEventType] = useState(initial?.eventType ?? EVENT_TYPES[0]?.key ?? 'otro');
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? '');
  const [clientReference, setClientReference] = useState(initial?.clientReference ?? '');
  const [photoCount, setPhotoCount] = useState(initial?.defaultPhotoCount ?? 3);
  const [copies, setCopies] = useState(initial?.defaultCopies ?? 1);
  const [qrEnabled, setQrEnabled] = useState(Boolean(initial?.qrEnabled));
  const [qrLink, setQrLink] = useState(initial?.qrLink ?? '');
  const [templateId, setTemplateId] = useState(initial?.templateId ?? '');
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  // Fase 17 — modes + web publishing.
  const [enablePhotos, setEnablePhotos] = useState(initial ? Boolean(initial.enablePhotos) : true);
  const [enableVideos, setEnableVideos] = useState(Boolean(initial?.enableVideos));
  const [webUploadEnabled, setWebUploadEnabled] = useState(Boolean(initial?.webUploadEnabled));
  const [videoTemplateId, setVideoTemplateId] = useState(initial?.videoTemplateId ?? '');
  const [videoTemplates, setVideoTemplates] = useState<VideoTemplateRecord[]>([]);
  const [webConfigured, setWebConfigured] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void window.photoBooth.templates.list().then((res) => {
      if (active && res.ok) setTemplates(res.data);
    });
    void window.photoBooth.videoTemplates.list().then((res) => {
      if (active && res.ok) setVideoTemplates(res.data);
    });
    void window.photoBooth.web.getConfig().then((res) => {
      if (active && res.ok) setWebConfigured(Boolean(res.data.siteUrl));
    });
    return () => {
      active = false;
    };
  }, []);

  function validate(): EventInput | null {
    const next: Record<string, string> = {};
    if (name.trim().length === 0) next.name = 'El nombre es obligatorio.';
    if (!Number.isInteger(copies) || copies < 1 || copies > MAX_DEFAULT_COPIES) {
      next.copies = `Entre 1 y ${MAX_DEFAULT_COPIES}.`;
    }
    if (!enablePhotos && !enableVideos) {
      next.modes = 'Activa al menos un modo (fotos o videos).';
    }
    if (qrEnabled) {
      if (qrLink.trim().length === 0) next.qrLink = 'Ingresa el link del QR.';
      else if (!isValidHttpUrl(qrLink.trim())) next.qrLink = 'Usa http:// o https://';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return null;
    return {
      name: name.trim(),
      eventType,
      eventDate: eventDate.trim() || null,
      clientReference: clientReference.trim() || null,
      templateId: templateId || null,
      defaultPhotoCount: photoCount,
      defaultCopies: copies,
      qrEnabled,
      qrLink: qrEnabled ? qrLink.trim() : null,
      enablePhotos,
      enableVideos,
      webUploadEnabled,
      videoTemplateId: videoTemplateId || null
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = validate();
    if (!input) return;
    setSubmitting(true);
    const result = await onSubmit(input);
    setSubmitting(false);
    if (!result.ok) {
      setErrors({ form: result.error.userMessage });
    }
  }

  return (
    <form className="pb-eventform" onSubmit={handleSubmit} noValidate>
      <Input
        label="Nombre del evento"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="XV de Ana Paula"
        autoFocus
      />

      <div className="pb-eventform__row">
        <Select
          label="Tipo de evento"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          options={EVENT_TYPES.map((t) => ({ value: t.key, label: t.label }))}
        />
        <Input
          label="Fecha"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
      </div>

      <Input
        label="Cliente / referencia (opcional)"
        value={clientReference}
        onChange={(e) => setClientReference(e.target.value)}
        placeholder="Salón principal"
      />

      {/* ---- Capture modes (Fase 17) ---- */}
      <div className="pb-eventform__modes">
        <span className="pb-field__label">¿Qué ofrece este evento?</span>
        <div className="pb-eventform__modeRow">
          <Toggle checked={enablePhotos} onChange={setEnablePhotos} label="Sesión de fotos" />
          <Toggle checked={enableVideos} onChange={setEnableVideos} label="Videos (cámara 360)" />
        </div>
        {errors.modes && <p className="pb-field__error">{errors.modes}</p>}
      </div>

      {enablePhotos && (
        <div className="pb-eventform__row">
          <Select
            label="Fotos por sesión"
            value={String(photoCount)}
            onChange={(e) => setPhotoCount(Number(e.target.value))}
            options={PHOTO_COUNT_OPTIONS.map((n) => ({ value: String(n), label: `${n} fotos` }))}
          />
          <Input
            label="Copias por defecto"
            type="number"
            min={1}
            max={MAX_DEFAULT_COPIES}
            value={copies}
            onChange={(e) => setCopies(Number(e.target.value))}
            error={errors.copies}
          />
        </div>
      )}

      {enablePhotos && (
        <div className="pb-eventform__template">
          {templates.length > 0 ? (
            <Select
              label="Plantilla de foto"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              options={[
                { value: '', label: 'Sin plantilla' },
                ...templates.map((t) => ({ value: t.id, label: t.name }))
              ]}
            />
          ) : (
            <>
              <span className="pb-field__label">Plantilla de foto</span>
              <EmptyState
                compact
                icon="templates"
                title="Aún no hay plantillas"
                description="Crea una plantilla en la sección Plantillas y luego asígnala al evento."
              />
            </>
          )}
        </div>
      )}

      {enableVideos && (
        <div className="pb-eventform__template">
          <Select
            label="Plantilla de video (superposición)"
            value={videoTemplateId}
            onChange={(e) => setVideoTemplateId(e.target.value)}
            options={[
              { value: '', label: 'Sin superposición' },
              ...videoTemplates.map((t) => ({ value: t.id, label: t.name }))
            ]}
            hint="Logo/texto que se graba encima del video. Se crean en Plantillas → Video."
          />
        </div>
      )}

      {enablePhotos && (
        <div className="pb-eventform__qr">
          <Toggle checked={qrEnabled} onChange={setQrEnabled} label="Incluir QR en los impresos" />
          {qrEnabled && (
            <Input
              label="Link del QR"
              value={qrLink}
              onChange={(e) => setQrLink(e.target.value)}
              error={errors.qrLink}
              placeholder="https://drive.google.com/…"
              hint="Apunta a la galería, Drive, web o red social del evento."
            />
          )}
        </div>
      )}

      {/* ---- Web gallery (Fase 17) ---- */}
      <div className="pb-eventform__qr">
        <Toggle
          checked={webUploadEnabled}
          onChange={setWebUploadEnabled}
          label="Subir fotos y videos a la página web (folio + QR)"
        />
        {webUploadEnabled && (
          <p className="pb-eventform__hint">
            <Icon name="info" size={14} />{' '}
            {webConfigured
              ? 'Al guardar se creará el folio del evento; cada foto/video recibirá su propio folio y QR.'
              : 'Configura primero la URL y clave en la sección "Página web"; las subidas quedarán pendientes hasta entonces.'}
          </p>
        )}
        {initial?.webEventFolio && (
          <p className="pb-eventform__hint">
            <Icon name="qr" size={14} /> Folio del evento: <strong>{initial.webEventFolio}</strong>
          </p>
        )}
      </div>

      {errors.form && <p className="pb-field__error">{errors.form}</p>}

      <div className="pb-eventform__actions">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" icon="save" disabled={submitting}>
          {initial ? 'Guardar cambios' : 'Crear evento'}
        </Button>
      </div>
    </form>
  );
}
