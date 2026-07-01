import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Toggle,
  ErrorState,
  EmptyState,
  useToast
} from '@renderer/components/ui';
import { useSettings } from '@renderer/hooks/useSettings';
import { CameraSettingsCard } from '@renderer/components/settings/CameraSettingsCard';
import { BrandingCard } from '@renderer/components/settings/BrandingCard';
import { AboutCard } from '@renderer/components/settings/AboutCard';
import { playBeep } from '@renderer/lib/sound';
import { COUNTDOWN_OPTIONS } from '@shared/constants/settings';
import type { DbStatus } from '@shared/types/api';
import type { UpdatableSettings } from '@shared/types/settings';
import './screens.css';

export function SettingsScreen() {
  const { settings, loading, error, update, pickDataRoot, setDataRoot, reload } = useSettings();
  const { notify } = useToast();
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  useEffect(() => {
    let active = true;
    void window.photoBooth.db.status().then((result) => {
      if (active && result.ok) setDbStatus(result.data);
    });
    return () => {
      active = false;
    };
  }, [settings?.dataRoot]);

  async function applyUpdate(partial: UpdatableSettings, successMsg: string) {
    const result = await update(partial);
    if (result.ok) {
      notify({ tone: 'success', title: successMsg });
    } else {
      notify({ tone: 'danger', title: 'No se pudo guardar', message: result.error?.userMessage });
    }
  }

  async function handleChangeFolder() {
    const picked = await pickDataRoot();
    if (!picked) return;
    const result = await setDataRoot(picked);
    if (result.ok) {
      notify({
        tone: 'success',
        title: 'Carpeta de datos actualizada',
        message: 'Los archivos nuevos se guardarán en la nueva ubicación.'
      });
    } else {
      notify({ tone: 'danger', title: 'No se pudo cambiar la carpeta', message: result.error?.userMessage });
    }
  }

  if (loading) {
    return (
      <Card>
        <EmptyState icon="settings" title="Cargando configuración…" />
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <ErrorState
          userMessage={error ?? 'No se pudo cargar la configuración.'}
          action="Revisa que la carpeta de datos sea accesible."
          retry={
            <Button size="sm" variant="secondary" icon="retry" onClick={() => void reload()}>
              Reintentar
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="pb-settings">
      <Card title="Almacenamiento" icon="folder">
        <div className="pb-settings__row">
          <Input label="Carpeta de datos" value={settings.dataRoot} readOnly />
          <Button icon="folder" variant="secondary" onClick={() => void handleChangeFolder()}>
            Cambiar carpeta…
          </Button>
        </div>
        <p className="pb-settings__hint">
          Aquí se guardan base de datos, fotos, plantillas e impresiones. Al cambiarla, los
          archivos existentes permanecen en la carpeta anterior.
        </p>
      </Card>

      <Card title="Sesión" icon="session">
        <div className="pb-settings__control">
          <Toggle
            checked={settings.soundEnabled}
            onChange={(next) => void applyUpdate({ soundEnabled: next }, next ? 'Sonido activado' : 'Sonido desactivado')}
            label="Sonido de cuenta regresiva y obturador"
          />
          <Button
            size="sm"
            variant="secondary"
            icon="start"
            onClick={() =>
              settings.soundEnabled
                ? playBeep()
                : notify({ tone: 'warning', title: 'Activa el sonido para probarlo' })
            }
          >
            Probar sonido
          </Button>
        </div>
        <div className="pb-settings__control">
          <Select
            label="Cuenta regresiva por defecto"
            value={String(settings.defaultCountdownSeconds)}
            onChange={(e) =>
              void applyUpdate(
                { defaultCountdownSeconds: Number(e.target.value) },
                'Cuenta regresiva actualizada'
              )
            }
            options={COUNTDOWN_OPTIONS.map((n) => ({ value: String(n), label: `${n} segundos` }))}
          />
        </div>
      </Card>

      <CameraSettingsCard />

      <Card title="Pantalla" icon="fullscreen">
        <Toggle
          checked={settings.fullscreenDefault}
          onChange={(next) =>
            void applyUpdate(
              { fullscreenDefault: next },
              next ? 'Pantalla completa activada' : 'Pantalla completa desactivada'
            )
          }
          label="Pantalla completa"
        />
        <p className="pb-settings__hint">
          Se aplica de inmediato y será el modo por defecto para el evento. Puedes desactivarla
          desde aquí.
        </p>
      </Card>

      <Card title="Información del sistema" icon="diagnostics">
        {dbStatus ? (
          <dl className="pb-settings__info">
            <div>
              <dt>Versión de esquema</dt>
              <dd>v{dbStatus.schemaVersion}</dd>
            </div>
            <div>
              <dt>Paquetes de poses</dt>
              <dd>{dbStatus.posePackCount}</dd>
            </div>
            <div>
              <dt>Carpeta de datos</dt>
              <dd className="pb-settings__path">{dbStatus.dataRoot}</dd>
            </div>
          </dl>
        ) : (
          <EmptyState compact icon="diagnostics" title="Sin información de base de datos" />
        )}
      </Card>

      <BrandingCard />
      <AboutCard />
    </div>
  );
}
