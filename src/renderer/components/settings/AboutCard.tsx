import { useEffect, useState } from 'react';
import { Card, StatusBadge } from '@renderer/components/ui';
import type { AppInfo } from '@shared/types/app';
import type { LicenseStatus } from '@shared/types/license';
import './settings-extra.css';

export function AboutCard() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [dataRoot, setDataRoot] = useState('');

  useEffect(() => {
    void window.photoBooth.app.getInfo().then((r) => r.ok && setInfo(r.data));
    void window.photoBooth.license.status().then((r) => r.ok && setLicense(r.data));
    void window.photoBooth.storage.getDataRoot().then((r) => r.ok && setDataRoot(r.data));
  }, []);

  return (
    <Card title="Acerca de" icon="info">
      <dl className="pb-about">
        <div>
          <dt>Producto</dt>
          <dd>{info?.productName ?? 'MH Photo Booth Studio'}</dd>
        </div>
        <div>
          <dt>Versión</dt>
          <dd>v{info?.version ?? '—'}</dd>
        </div>
        <div>
          <dt>Ambiente</dt>
          <dd>{info?.environment ?? '—'}</dd>
        </div>
        <div>
          <dt>Plataforma · Electron</dt>
          <dd>
            {info?.platform ?? '—'} · {info?.electronVersion ?? '—'}
          </dd>
        </div>
        <div>
          <dt>Ruta de datos</dt>
          <dd className="pb-about__path">{dataRoot || '—'}</dd>
        </div>
        {license && (
          <>
            <div>
              <dt>Licencia</dt>
              <dd>
                {license.edition} · <StatusBadge tone="success" icon="check">No bloqueante</StatusBadge>
              </dd>
            </div>
            <div>
              <dt>Instalación</dt>
              <dd>{license.installationName}</dd>
            </div>
          </>
        )}
      </dl>
    </Card>
  );
}
