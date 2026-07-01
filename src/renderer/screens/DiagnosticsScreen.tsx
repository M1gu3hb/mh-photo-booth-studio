import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, StatusBadge, EmptyState, Icon, useToast } from '@renderer/components/ui';
import { useEvents } from '@renderer/state/EventsProvider';
import type { DiagnosticsReport, CheckStatus } from '@shared/types/diagnostics';
import './diagnostics.css';

const STATUS_LABEL: Record<CheckStatus, string> = { ok: 'OK', warn: 'Atención', error: 'Error' };

export function DiagnosticsScreen() {
  const navigate = useNavigate();
  const { activeEvent } = useEvents();
  const { notify } = useToast();
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [ready, setReady] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    const res = await window.photoBooth.diagnostics.run();
    if (res.ok) setReport(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (!activeEvent) return;
    void window.photoBooth.events.isReady(activeEvent.id).then((r) => {
      if (r.ok) setReady(r.data);
    });
  }, [activeEvent]);

  async function exportDiagnostics() {
    const res = await window.photoBooth.diagnostics.export();
    if (res.ok && res.data) notify({ tone: 'success', title: 'Diagnóstico exportado', message: res.data });
    else if (!res.ok) notify({ tone: 'danger', title: 'No se pudo exportar', message: res.error.userMessage });
  }

  async function markReady() {
    if (!activeEvent) return;
    const res = await window.photoBooth.events.markReady(activeEvent.id);
    if (res.ok) {
      setReady(true);
      notify({ tone: 'success', title: 'Evento marcado como listo', message: activeEvent.name });
    }
  }

  return (
    <div className="pb-diag">
      <div className="pb-diag__head">
        <StatusBadge tone={online ? 'success' : 'info'} icon={online ? 'success' : 'info'}>
          {online ? 'Conectado' : 'Sin conexión (no es necesaria)'}
        </StatusBadge>
        <Button size="sm" variant="secondary" icon="retry" onClick={() => void run()}>
          Actualizar
        </Button>
      </div>

      <Card title="Estado del tablero" icon="diagnostics">
        {loading ? (
          <EmptyState icon="diagnostics" title="Ejecutando diagnóstico…" />
        ) : report ? (
          <ul className="pb-diag__checks">
            {report.checks.map((c) => (
              <li key={c.key} className={`pb-check pb-check--${c.status}`}>
                <span className="pb-check__light" aria-hidden />
                <span className="pb-check__body">
                  <strong>{c.label}</strong>
                  <span className="pb-check__detail">{c.detail}</span>
                </span>
                <span className="pb-check__status">{STATUS_LABEL[c.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="diagnostics" title="Sin datos de diagnóstico" />
        )}
      </Card>

      {report && (
        <Card title="Sistema" icon="settings">
          <dl className="pb-diag__info">
            <div>
              <dt>Versión</dt>
              <dd>v{report.version} · {report.environment}</dd>
            </div>
            <div>
              <dt>Plataforma</dt>
              <dd>{report.platform}</dd>
            </div>
            <div>
              <dt>Carpeta de datos</dt>
              <dd className="pb-diag__path">{report.dataRoot}</dd>
            </div>
            <div>
              <dt>Disco libre</dt>
              <dd>{(report.diskFreeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB</dd>
            </div>
            <div>
              <dt>Eventos / Plantillas / Sesiones</dt>
              <dd>
                {report.counts.events} / {report.counts.templates} / {report.counts.sessions}
              </dd>
            </div>
            <div>
              <dt>Impresoras</dt>
              <dd>{report.printers.length > 0 ? report.printers.join(', ') : 'Ninguna'}</dd>
            </div>
          </dl>
        </Card>
      )}

      <Card title="Preparar evento" icon="events">
        {activeEvent ? (
          <div className="pb-diag__ready">
            <p>
              Evento activo: <strong>{activeEvent.name}</strong>{' '}
              {ready && <StatusBadge tone="success" icon="check">Listo</StatusBadge>}
            </p>
            <div className="pb-diag__readyBtns">
              <Button variant="secondary" icon="camera" onClick={() => navigate('/configuracion')}>
                Probar cámara
              </Button>
              <Button variant="secondary" icon="print" onClick={() => navigate('/impresion')}>
                Probar impresión
              </Button>
              <Button icon="check" onClick={() => void markReady()}>
                Marcar evento listo
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState compact icon="events" title="Sin evento activo" description="Selecciona un evento para prepararlo." />
        )}
      </Card>

      <Card title="Últimos errores" icon="warning">
        <Button size="sm" variant="secondary" icon="export" onClick={() => void exportDiagnostics()}>
          Exportar diagnóstico (.zip)
        </Button>
        {report && report.recentErrors.length > 0 ? (
          <ul className="pb-diag__errors">
            {report.recentErrors.map((line, i) => (
              <li key={i}>
                <Icon name="warning" size={13} /> {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pb-diag__noerrors">Sin errores recientes.</p>
        )}
      </Card>
    </div>
  );
}
