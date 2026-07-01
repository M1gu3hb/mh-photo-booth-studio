import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  PrimaryButton,
  Select,
  Input,
  StatusBadge,
  EmptyState,
  PrintPreview,
  Icon,
  useToast,
  type StatusTone
} from '@renderer/components/ui';
import { useEvents } from '@renderer/state/EventsProvider';
import { buildSheet } from '@renderer/lib/composition/buildSheet';
import { PrintTemplateEditor } from '@renderer/components/print/PrintTemplateEditor';
import { PAPER_SIZES, PRINT_METHODS, SHEET_LAYOUTS, MAX_PRINT_COPIES } from '@shared/constants/print';
import type { PrinterInfo, PrintMethod, Orientation } from '@shared/types/print';
import type {
  SessionRecord,
  PrintJobRecord,
  PrintJobStatus,
  TemplateRecord,
  PrintTemplateRecord
} from '@shared/types/entities';
import type { PrintTemplateWithSlots } from '@shared/types/printTemplates';
import type { PrintLayoutMode, NormalizedSlot } from '@shared/lib/printLayout';
import './print.css';

const STATUS_TONE: Record<PrintJobStatus, StatusTone> = {
  pending: 'neutral',
  rendering: 'active',
  ready: 'active',
  sent: 'active',
  completed: 'success',
  failed: 'danger',
  canceled: 'warning'
};

export function PrintScreen() {
  const navigate = useNavigate();
  const { activeEvent } = useEvents();
  const { notify } = useToast();

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [jobs, setJobs] = useState<PrintJobRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [printerName, setPrinterName] = useState<string>('');
  const [method, setMethod] = useState<PrintMethod>('image');
  const [paperKey, setPaperKey] = useState('4x6');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [cellCount, setCellCount] = useState(1);
  const [copies, setCopies] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  // Print templates (per event) + universal photo templates for the editor.
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [printTemplates, setPrintTemplates] = useState<PrintTemplateRecord[]>([]);
  const [selectedPtId, setSelectedPtId] = useState<string>('');
  const [selectedPt, setSelectedPt] = useState<PrintTemplateWithSlots | null>(null);
  const [editingPt, setEditingPt] = useState<{ id: string | null } | null>(null);

  const finalsRef = useRef<Map<string, string>>(new Map());

  const eventId = activeEvent?.id ?? null;

  const refreshJobs = useCallback(async () => {
    if (!eventId) return;
    const r = await window.photoBooth.print.listJobs(eventId);
    if (r.ok) setJobs(r.data);
  }, [eventId]);

  const refreshPrintTemplates = useCallback(async () => {
    if (!eventId) return;
    const r = await window.photoBooth.printTemplates.list(eventId);
    if (r.ok) setPrintTemplates(r.data);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    let on = true;
    void (async () => {
      const [sess, prn, tpls] = await Promise.all([
        window.photoBooth.sessions.listForEvent(eventId),
        window.photoBooth.print.listPrinters(),
        window.photoBooth.templates.list()
      ]);
      if (!on) return;
      if (tpls.ok) setTemplates(tpls.data);
      await refreshPrintTemplates();
      if (sess.ok) {
        setSessions(sess.data);
        setSelectedIds(sess.data[0] ? [sess.data[0].id] : []);
        const entries = await Promise.all(
          sess.data.map(async (s) => {
            const t = await window.photoBooth.sessions.getThumbnail(s.id);
            return [s.id, t.ok ? t.data : ''] as const;
          })
        );
        if (on) setThumbs(new Map(entries));
      }
      if (prn.ok) {
        setPrinters(prn.data);
        const def = prn.data.find((p) => p.isDefault) ?? prn.data[0];
        if (def) setPrinterName(def.name);
      }
      await refreshJobs();
      if (on) {
        setCopies(activeEvent?.defaultCopies ?? 1);
        setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [eventId, activeEvent?.defaultCopies, refreshJobs, refreshPrintTemplates]);

  // Load the selected print template's full record + slots.
  useEffect(() => {
    if (!selectedPtId) {
      setSelectedPt(null);
      return;
    }
    let on = true;
    void (async () => {
      const r = await window.photoBooth.printTemplates.get(selectedPtId);
      if (on) setSelectedPt(r.ok ? r.data : null);
    })();
    return () => {
      on = false;
    };
  }, [selectedPtId]);

  const ensureFinal = useCallback(async (id: string): Promise<string | null> => {
    const cached = finalsRef.current.get(id);
    if (cached) return cached;
    const r = await window.photoBooth.sessions.getFinal(id);
    if (r.ok) {
      finalsRef.current.set(id, r.data);
      return r.data;
    }
    return null;
  }, []);

  // Effective layout: a selected print template overrides the manual controls.
  const pt = selectedPt?.template ?? null;
  const layoutPaper = pt?.paperKey ?? paperKey;
  const layoutOrientation: Orientation = pt?.orientation ?? orientation;
  const layoutMode: PrintLayoutMode = pt?.mode ?? 'grid';
  const layoutCellCount = pt ? pt.cellCount : cellCount;
  const layoutCustomSlots: NormalizedSlot[] | undefined = useMemo(
    () =>
      pt && pt.mode === 'custom' && selectedPt
        ? selectedPt.slots.map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height }))
        : undefined,
    [pt, selectedPt]
  );
  const effectiveCount =
    layoutMode === 'full' ? 1 : layoutMode === 'custom' ? (layoutCustomSlots?.length ?? 0) : layoutCellCount;

  const composeSheet = useCallback(
    (finals: string[]) => {
      const count = Math.max(1, effectiveCount);
      const cells = Array.from({ length: count }, (_, i) => finals[i % finals.length] ?? finals[0]!);
      return buildSheet({
        finalUrls: cells,
        paperKey: layoutPaper,
        orientation: layoutOrientation,
        cellCount: layoutCellCount,
        mode: layoutMode,
        customSlots: layoutCustomSlots
      });
    },
    [effectiveCount, layoutPaper, layoutOrientation, layoutCellCount, layoutMode, layoutCustomSlots]
  );

  // Rebuild the sheet preview when selection / layout / paper / template changes.
  useEffect(() => {
    let active = true;
    void (async () => {
      if (selectedIds.length === 0) {
        setPreview(null);
        return;
      }
      const finals: string[] = [];
      for (const id of selectedIds) {
        const url = await ensureFinal(id);
        if (url) finals.push(url);
      }
      if (finals.length === 0) {
        setPreview(null);
        return;
      }
      const sheet = await composeSheet(finals);
      if (active) setPreview(sheet.previewDataUrl);
    })();
    return () => {
      active = false;
    };
  }, [selectedIds, ensureFinal, composeSheet]);

  function toggleSession(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= Math.max(1, effectiveCount)) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  async function handlePrint() {
    if (!eventId || selectedIds.length === 0) return;
    setPrinting(true);
    try {
      const finals: string[] = [];
      for (const id of selectedIds) {
        const url = await ensureFinal(id);
        if (url) finals.push(url);
      }
      const sheet = await composeSheet(finals);
      const result = await window.photoBooth.print.print({
        eventId,
        sessionId: selectedIds.length === 1 ? (selectedIds[0] ?? null) : null,
        sheetSessions: selectedIds,
        printerName: printerName || null,
        method,
        paperSize: layoutPaper,
        orientation: layoutOrientation,
        layout: pt ? `pt:${pt.name}` : `${layoutMode === 'full' ? 'full' : `${effectiveCount}-up`}`,
        copies,
        sheetBytes: sheet.png,
        sheetWidth: sheet.width,
        sheetHeight: sheet.height
      });
      if (result.ok) {
        const job = result.data;
        if (job.status === 'completed') notify({ tone: 'success', title: 'Impresión enviada', message: `${job.copies} copia(s) · ${job.method}` });
        else notify({ tone: 'danger', title: 'La impresión falló', message: job.errorMessage ?? 'Reintenta desde la cola.' });
      } else {
        notify({ tone: 'danger', title: 'No se pudo imprimir', message: result.error.userMessage });
      }
      await refreshJobs();
    } finally {
      setPrinting(false);
    }
  }

  async function handleDeletePt(id: string) {
    const res = await window.photoBooth.printTemplates.delete(id);
    if (res.ok) {
      notify({ tone: 'success', title: 'Plantilla de impresión borrada', message: '' });
      if (selectedPtId === id) setSelectedPtId('');
      await refreshPrintTemplates();
    } else {
      notify({ tone: 'danger', title: 'No se pudo borrar', message: res.error.userMessage });
    }
  }

  async function handleRetry(jobId: string) {
    const r = await window.photoBooth.print.retry(jobId);
    if (r.ok) {
      notify({
        tone: r.data.status === 'completed' ? 'success' : 'danger',
        title: r.data.status === 'completed' ? 'Reintento exitoso' : 'El reintento falló',
        message: r.data.errorMessage ?? undefined
      });
    }
    await refreshJobs();
  }

  if (!activeEvent) {
    return (
      <Card>
        <EmptyState
          icon="events"
          title="Sin evento activo"
          description="Selecciona un evento para imprimir sus sesiones."
          action={<Button icon="events" onClick={() => navigate('/eventos')}>Ir a Eventos</Button>}
        />
      </Card>
    );
  }

  if (editingPt) {
    return (
      <Card
        title={editingPt.id ? 'Editar plantilla de impresión' : 'Nueva plantilla de impresión'}
        icon="print"
      >
        <PrintTemplateEditor
          eventId={activeEvent.id}
          editId={editingPt.id}
          templates={templates}
          onClose={() => setEditingPt(null)}
          onSaved={() => {
            setEditingPt(null);
            void refreshPrintTemplates();
          }}
        />
      </Card>
    );
  }

  return (
    <div className="pb-print-screen">
      <div className="pb-print-screen__main">
        <Card title="Sesiones del evento" icon="history">
          {loading ? (
            <EmptyState icon="history" title="Cargando sesiones…" />
          ) : sessions.length === 0 ? (
            <EmptyState
              icon="session"
              title="Aún no hay sesiones para imprimir"
              description="Captura una sesión para poder imprimirla aquí."
              action={<Button icon="session" onClick={() => navigate('/sesion')}>Ir a Sesión</Button>}
            />
          ) : (
            <div className="pb-print-screen__sessions">
              {sessions.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`pb-printsess ${selectedIds.includes(s.id) ? 'pb-printsess--on' : ''}`.trim()}
                  onClick={() => toggleSession(s.id)}
                >
                  <span className="pb-printsess__frame">
                    {thumbs.get(s.id) ? <img src={thumbs.get(s.id)} alt={`Sesión ${i + 1}`} /> : <Icon name="image" size={22} />}
                  </span>
                  <span className="pb-printsess__label">
                    {selectedIds.includes(s.id) ? `✓ ${selectedIds.indexOf(s.id) + 1}` : 'Sesión'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Hoja de impresión" icon="print">
          <PrintPreview
            sheetUrl={preview ?? undefined}
            orientation={layoutOrientation}
            paperLabel={
              pt
                ? `${pt.name} · ${layoutPaper} · ${layoutMode === 'full' ? 'hoja completa' : `${effectiveCount}-up`}`
                : `${layoutPaper} · ${effectiveCount}-up`
            }
          />
        </Card>
      </div>

      <aside className="pb-print-screen__side">
        <Card title="Plantilla de impresión" icon="templates">
          <div className="pb-printcfg">
            <Select
              label="Plantilla del evento"
              value={selectedPtId}
              onChange={(e) => setSelectedPtId(e.target.value)}
              options={[
                { value: '', label: 'Manual (sin plantilla)' },
                ...printTemplates.map((p) => ({ value: p.id, label: p.name }))
              ]}
            />
            {pt && (
              <p className="pb-printcfg__hint">
                <Icon name="info" size={14} /> Usa{' '}
                {templates.find((t) => t.id === pt.photoTemplateId)?.name ?? 'forma genérica'}. Define
                papel, orientación y acomodo.
              </p>
            )}
            <div className="pb-printcfg__row">
              <Button size="sm" icon="add" variant="secondary" onClick={() => setEditingPt({ id: null })}>
                Crear
              </Button>
              <Button
                size="sm"
                icon="edit"
                variant="ghost"
                disabled={!selectedPtId}
                onClick={() => setEditingPt({ id: selectedPtId })}
              >
                Editar
              </Button>
              <Button
                size="sm"
                icon="delete"
                variant="ghost"
                disabled={!selectedPtId}
                onClick={() => void handleDeletePt(selectedPtId)}
              >
                Borrar
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Configuración" icon="settings">
          <div className="pb-printcfg">
            <Select
              label="Impresora"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              options={
                printers.length > 0
                  ? printers.map((p) => ({ value: p.name, label: p.displayName }))
                  : [{ value: '', label: 'Sin impresoras detectadas' }]
              }
            />
            <Select
              label="Método"
              value={method}
              onChange={(e) => setMethod(e.target.value as PrintMethod)}
              options={PRINT_METHODS.map((m) => ({ value: m.key, label: m.label }))}
            />
            <Select
              label="Tamaño de papel"
              value={layoutPaper}
              disabled={pt !== null}
              onChange={(e) => setPaperKey(e.target.value)}
              options={PAPER_SIZES.map((p) => ({ value: p.key, label: p.label }))}
            />
            <Select
              label="Orientación"
              value={layoutOrientation}
              disabled={pt !== null}
              onChange={(e) => setOrientation(e.target.value as Orientation)}
              options={[
                { value: 'portrait', label: 'Vertical' },
                { value: 'landscape', label: 'Horizontal' }
              ]}
            />
            <Select
              label="Tiras por hoja"
              value={String(layoutCellCount)}
              disabled={pt !== null}
              onChange={(e) => setCellCount(Number(e.target.value))}
              options={SHEET_LAYOUTS.map((n) => ({ value: String(n), label: `${n} por hoja` }))}
            />
            <Input
              label="Copias"
              type="number"
              min={1}
              max={MAX_PRINT_COPIES}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
            />
            <PrimaryButton
              icon="print"
              fullWidth
              disabled={printing || selectedIds.length === 0}
              onClick={() => void handlePrint()}
            >
              Imprimir ({selectedIds.length} sel.)
            </PrimaryButton>
            <p className="pb-printcfg__hint">
              <Icon name="savePaper" size={14} /> Selecciona varias sesiones o sube las tiras por hoja para ahorrar papel.
            </p>
          </div>
        </Card>

        <Card title="Cola de impresión" icon="reprint">
          {jobs.length === 0 ? (
            <EmptyState compact icon="print" title="Sin trabajos todavía" />
          ) : (
            <ul className="pb-jobs">
              {jobs.map((job) => (
                <li key={job.id} className="pb-jobs__item">
                  <div className="pb-jobs__meta">
                    <StatusBadge tone={STATUS_TONE[job.status]}>{job.status}</StatusBadge>
                    <span>
                      {job.paperSize} · {job.layout} · {job.copies}× · {job.method}
                    </span>
                  </div>
                  {job.status === 'failed' && (
                    <Button size="sm" variant="secondary" icon="retry" onClick={() => void handleRetry(job.id)}>
                      Reintentar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>
    </div>
  );
}
