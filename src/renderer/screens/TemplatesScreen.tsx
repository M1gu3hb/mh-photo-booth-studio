import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Button,
  DangerButton,
  Modal,
  EmptyState,
  ErrorState,
  TemplatePreview,
  StatusBadge,
  useToast
} from '@renderer/components/ui';
import { TemplateEditor } from '@renderer/components/templates/TemplateEditor';
import { VideoTemplateEditor } from '@renderer/components/templates/VideoTemplateEditor';
import type { TemplateRecord, VideoTemplateRecord } from '@shared/types/entities';
import '@renderer/components/templates/templates.css';

interface TemplateMeta {
  imageUrl: string | null;
  slotCount: number;
  photoCount: number;
}

export function TemplatesScreen() {
  const { notify } = useToast();
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [meta, setMeta] = useState<Map<string, TemplateMeta>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TemplateRecord | null>(null);
  const [videoTemplates, setVideoTemplates] = useState<VideoTemplateRecord[]>([]);
  const [editingVideo, setEditingVideo] = useState<{ id: string | null } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await window.photoBooth.templates.list();
    if (!res.ok) {
      setError(res.error.userMessage);
      setLoading(false);
      return;
    }
    setTemplates(res.data);
    const entries = await Promise.all(
      res.data.map(async (t) => {
        const [g, img] = await Promise.all([
          window.photoBooth.templates.get(t.id),
          window.photoBooth.templates.getImage(t.id)
        ]);
        const slots = g.ok ? g.data.slots : [];
        return [
          t.id,
          {
            imageUrl: img.ok ? img.data : null,
            slotCount: slots.length,
            photoCount: slots.filter((s) => s.slotType === 'photo').length
          }
        ] as const;
      })
    );
    const vt = await window.photoBooth.videoTemplates.list();
    if (vt.ok) setVideoTemplates(vt.data);
    setMeta(new Map(entries));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleNew() {
    setBusy(true);
    const res = await window.photoBooth.templates.create();
    setBusy(false);
    if (res.ok && res.data) {
      setEditingId(res.data.id);
    } else if (!res.ok) {
      notify({ tone: 'danger', title: 'No se pudo importar', message: res.error.userMessage });
    }
  }

  async function handleImport() {
    setBusy(true);
    const res = await window.photoBooth.templates.import();
    setBusy(false);
    if (res.ok && res.data) {
      notify({ tone: 'success', title: 'Plantilla importada', message: res.data.name });
      await load();
    } else if (!res.ok) {
      notify({ tone: 'danger', title: 'No se pudo importar', message: res.error.userMessage });
    }
  }

  async function handleDuplicate(id: string) {
    const res = await window.photoBooth.templates.duplicate(id);
    if (res.ok) {
      notify({ tone: 'success', title: 'Plantilla duplicada', message: res.data.name });
      await load();
    } else {
      notify({ tone: 'danger', title: 'No se pudo duplicar', message: res.error.userMessage });
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    const res = await window.photoBooth.templates.delete(pendingDelete.id);
    setDeleteBusy(false);
    if (res.ok) {
      const affected = res.data.affectedEvents;
      notify({
        tone: 'success',
        title: 'Plantilla borrada',
        message:
          affected > 0
            ? `Se quitó de ${affected} evento(s); vuelve a asignarles una plantilla.`
            : pendingDelete.name
      });
      setPendingDelete(null);
      await load();
    } else {
      notify({ tone: 'danger', title: 'No se pudo borrar', message: res.error.userMessage });
    }
  }

  async function handleExport(id: string) {
    const res = await window.photoBooth.templates.export(id);
    if (res.ok && res.data) {
      notify({ tone: 'success', title: 'Plantilla exportada', message: res.data });
    } else if (!res.ok) {
      notify({ tone: 'danger', title: 'No se pudo exportar', message: res.error.userMessage });
    }
  }

  if (editingVideo) {
    return (
      <Card title={editingVideo.id ? 'Editar plantilla de video' : 'Nueva plantilla de video'} icon="video">
        <VideoTemplateEditor
          editId={editingVideo.id}
          onClose={() => setEditingVideo(null)}
          onSaved={() => {
            setEditingVideo(null);
            void load();
          }}
        />
      </Card>
    );
  }

  if (editingId) {
    return (
      <Card>
        <TemplateEditor
          templateId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            void load();
          }}
        />
      </Card>
    );
  }

  let body;
  if (loading) {
    body = (
      <Card>
        <EmptyState icon="templates" title="Cargando plantillas…" />
      </Card>
    );
  } else if (error && templates.length === 0) {
    body = (
      <Card>
        <ErrorState userMessage={error} action="Verifica la carpeta de datos." />
      </Card>
    );
  } else if (templates.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon="templates"
          title="Aún no hay plantillas"
          description="Importa un PNG o JPG (hecho en Canva/Photoshop) y marca dónde van las fotos y el QR."
          action={
            <Button icon="add" onClick={() => void handleNew()} disabled={busy}>
              Nueva plantilla
            </Button>
          }
        />
      </Card>
    );
  } else {
    body = (
      <div className="pb-templates__grid">
        {templates.map((t) => {
          const m = meta.get(t.id);
          const incomplete = (m?.photoCount ?? 0) < 2;
          return (
            <Card key={t.id} className="pb-tplcard">
              <TemplatePreview imageUrl={m?.imageUrl ?? undefined} widthPx={t.widthPx} heightPx={t.heightPx} />
              <div className="pb-tplcard__name">{t.name}</div>
              <div className="pb-tplcard__meta">
                <span>
                  {t.widthPx}×{t.heightPx} px{t.formatLabel ? ` · ${t.formatLabel}` : ''}
                </span>
                {incomplete ? (
                  <StatusBadge tone="warning">Faltan slots de foto</StatusBadge>
                ) : (
                  <span>{m?.photoCount} fotos · {(m?.slotCount ?? 0) - (m?.photoCount ?? 0)} extra</span>
                )}
              </div>
              <div className="pb-tplcard__actions">
                <Button size="sm" icon="edit" onClick={() => setEditingId(t.id)}>
                  Editar
                </Button>
                <Button size="sm" variant="secondary" icon="duplicate" onClick={() => void handleDuplicate(t.id)}>
                  Duplicar
                </Button>
                <Button size="sm" variant="ghost" icon="export" onClick={() => void handleExport(t.id)}>
                  Exportar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="delete"
                  onClick={() => setPendingDelete(t)}
                  aria-label={`Borrar ${t.name}`}
                >
                  Borrar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="pb-templates">
      <div className="pb-templates__toolbar">
        <p className="pb-tplcard__meta">
          {templates.length} {templates.length === 1 ? 'plantilla' : 'plantillas'}
        </p>
        <div className="pb-templates__toolbarActions">
          <Button variant="secondary" icon="import" onClick={() => void handleImport()} disabled={busy}>
            Importar .zip
          </Button>
          <Button icon="add" onClick={() => void handleNew()} disabled={busy}>
            Nueva plantilla
          </Button>
        </div>
      </div>
      {body}

      <Card title="Plantillas de video (superposición)" icon="video">
        <div className="pb-templates__toolbar">
          <p className="pb-tplcard__meta">
            {videoTemplates.length} {videoTemplates.length === 1 ? 'plantilla' : 'plantillas'} de video
          </p>
          <Button icon="add" variant="secondary" onClick={() => setEditingVideo({ id: null })}>
            Nueva plantilla de video
          </Button>
        </div>
        {videoTemplates.length === 0 ? (
          <EmptyState
            compact
            icon="video"
            title="Sin plantillas de video"
            description="Crea una para poner tu logo o texto encima de los videos grabados."
          />
        ) : (
          <ul className="pb-templates__videolist">
            {videoTemplates.map((vt) => (
              <li key={vt.id} className="pb-templates__videoitem">
                <span className="pb-templates__videoname">{vt.name}</span>
                <div className="pb-tplcard__actions">
                  <Button size="sm" icon="edit" onClick={() => setEditingVideo({ id: vt.id })}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="delete"
                    onClick={() =>
                      void window.photoBooth.videoTemplates.delete(vt.id).then((r) => {
                        if (r.ok) void load();
                      })
                    }
                  >
                    Borrar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Modal
        open={pendingDelete !== null}
        onClose={() => {
          if (!deleteBusy) setPendingDelete(null);
        }}
        closeOnBackdrop={false}
        size="sm"
        title="Borrar plantilla"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleteBusy}>
              Cancelar
            </Button>
            <DangerButton icon="delete" onClick={() => void handleConfirmDelete()} disabled={deleteBusy}>
              {deleteBusy ? 'Borrando…' : 'Borrar definitivamente'}
            </DangerButton>
          </>
        }
      >
        <p>
          ¿Seguro que quieres borrar <strong>{pendingDelete?.name}</strong>? Esta acción no se puede
          deshacer. Las fotos y resultados ya guardados de eventos pasados se conservan.
        </p>
      </Modal>
    </div>
  );
}
