import { useState } from 'react';
import {
  Button,
  PrimaryButton,
  DangerButton,
  Card,
  Modal,
  StatusBadge,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Toggle,
  Stepper,
  CameraPreview,
  CountdownDisplay,
  PoseCard,
  TemplatePreview,
  PrintPreview,
  SessionThumbnail,
  useToast
} from '@renderer/components/ui';
import './screens.css';

const COLOR_TOKENS = [
  '--green-900',
  '--green-700',
  '--green-500',
  '--green-400',
  '--gold-700',
  '--gold-500',
  '--gold-300',
  '--gold-100',
  '--cream',
  '--success',
  '--warning',
  '--danger'
];

/**
 * Internal design-QA gallery. Every control here is live (Modal, Toast and
 * Toggle actually work) so reviewers can verify states — not a static mockup.
 */
export function GalleryScreen() {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [count, setCount] = useState(3);

  return (
    <div className="pb-gallery">
      <Card title="Tokens de color" icon="gallery">
        <div className="pb-gallery__swatches">
          {COLOR_TOKENS.map((token) => (
            <div className="pb-swatch" key={token}>
              <span className="pb-swatch__chip" style={{ background: `var(${token})` }} />
              <code>{token}</code>
            </div>
          ))}
        </div>
        <p className="pb-gallery__note">
          Tipografía: <span style={{ fontFamily: 'var(--font-display)' }}>Cinzel display</span> ·{' '}
          <span style={{ fontFamily: 'var(--font-ui)' }}>Inter UI</span> ·{' '}
          <span style={{ fontFamily: 'var(--font-script)' }}>Pinyon script</span>
        </p>
      </Card>

      <Card title="Botones" icon="session">
        <div className="pb-gallery__row">
          <PrimaryButton icon="start">Iniciar</PrimaryButton>
          <Button variant="secondary" icon="settings">
            Secundario
          </Button>
          <DangerButton icon="delete">Eliminar</DangerButton>
          <Button variant="ghost" icon="info">
            Ghost
          </Button>
          <PrimaryButton icon="print" disabled>
            Deshabilitado
          </PrimaryButton>
        </div>
        <div className="pb-gallery__row" style={{ marginTop: 'var(--space-4)' }}>
          <Button size="sm" icon="add">
            Pequeño
          </Button>
          <Button size="md" icon="add">
            Mediano
          </Button>
          <Button size="lg" icon="add">
            Grande (evento)
          </Button>
        </div>
      </Card>

      <Card title="Superficies" icon="templates">
        <div className="pb-gallery__row">
          <Card>
            <strong>Card base</strong>
            <p className="pb-gallery__note">Panel de fieltro con hairline de oro.</p>
          </Card>
          <Card elevated>
            <strong>Card elevada</strong>
            <p className="pb-gallery__note">Una elevación por encima.</p>
          </Card>
          <Button icon="image" onClick={() => setModalOpen(true)}>
            Abrir modal
          </Button>
        </div>
      </Card>

      <Card title="Estados y avisos" icon="diagnostics">
        <div className="pb-gallery__row">
          <StatusBadge tone="success">Cámara lista</StatusBadge>
          <StatusBadge tone="active" pulse>
            Capturando
          </StatusBadge>
          <StatusBadge tone="warning">Sin impresora</StatusBadge>
          <StatusBadge tone="danger">Error de captura</StatusBadge>
          <StatusBadge tone="info">Offline</StatusBadge>
          <StatusBadge tone="neutral">Pendiente</StatusBadge>
        </div>
        <div className="pb-gallery__row" style={{ marginTop: 'var(--space-4)' }}>
          <Button icon="info" onClick={() => notify({ tone: 'info', title: 'Aviso', message: 'Toast informativo.' })}>
            Toast info
          </Button>
          <Button
            icon="success"
            onClick={() => notify({ tone: 'success', title: 'Listo', message: 'Acción completada.' })}
          >
            Toast éxito
          </Button>
          <Button
            icon="warning"
            onClick={() => notify({ tone: 'danger', title: 'Error', message: 'Algo falló.' })}
          >
            Toast error
          </Button>
        </div>
        <div className="pb-gallery__col" style={{ marginTop: 'var(--space-4)' }}>
          <EmptyState
            icon="events"
            title="Sin eventos"
            description="Ejemplo de estado vacío honesto."
          />
          <ErrorState
            userMessage="No se encontró la cámara seleccionada."
            action="Conecta la cámara o selecciona otra desde Configuración."
            code="CAMERA_NOT_FOUND"
            retry={
              <Button size="sm" variant="secondary" icon="retry">
                Reintentar
              </Button>
            }
          />
        </div>
      </Card>

      <Card title="Controles" icon="settings">
        <div className="pb-gallery__col">
          <Input label="Nombre del evento" placeholder="XV de ejemplo" hint="Texto de ayuda" />
          <Input label="Campo con error" defaultValue="" error="Este campo es obligatorio." />
          <Select
            label="Número de fotos"
            value={String(count)}
            onChange={(e) => setCount(Number(e.target.value))}
            options={[
              { value: '2', label: '2 fotos' },
              { value: '3', label: '3 fotos' },
              { value: '4', label: '4 fotos' }
            ]}
          />
          <Toggle checked={soundOn} onChange={setSoundOn} label={`Sonido ${soundOn ? 'activado' : 'desactivado'}`} />
          <Stepper steps={['Evento', 'Plantilla', 'Sesión', 'Impresión']} current={2} />
        </div>
      </Card>

      <Card title="Componentes de dominio" icon="camera">
        <div className="pb-gallery__row" style={{ alignItems: 'flex-start' }}>
          <div style={{ width: 260 }}>
            <CameraPreview caption="Preview (sin señal)" />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)'
            }}
          >
            <CountdownDisplay value={count} caption="¡Sonrían!" />
          </div>
          <PoseCard pose="La festejada al centro" index={1} total={count} />
        </div>
        <div className="pb-gallery__row" style={{ alignItems: 'flex-start', marginTop: 'var(--space-4)' }}>
          <TemplatePreview widthPx={1200} heightPx={1800} />
          <PrintPreview paperLabel="4x6 · Vertical" />
          <div style={{ width: 140 }}>
            <SessionThumbnail label="Sesión demo" timestamp="—" />
          </div>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal de ejemplo"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <PrimaryButton
              icon="check"
              onClick={() => {
                setModalOpen(false);
                notify({ tone: 'success', title: 'Confirmado' });
              }}
            >
              Aceptar
            </PrimaryButton>
          </>
        }
      >
        <p>
          Diálogo skeuomórfico con marco de latón. Cierra con Escape, clic fuera o el botón
          superior. Las acciones del footer son reales.
        </p>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <DangerButton icon="delete" onClick={() => setConfirmOpen(true)}>
            Acción destructiva
          </DangerButton>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Confirmar?"
        size="sm"
        closeOnBackdrop={false}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              No
            </Button>
            <DangerButton
              icon="delete"
              onClick={() => {
                setConfirmOpen(false);
                notify({ tone: 'danger', title: 'Elemento eliminado (demo)' });
              }}
            >
              Sí, eliminar
            </DangerButton>
          </>
        }
      >
        <p>Confirmación destructiva: no se cierra al hacer clic fuera.</p>
      </Modal>
    </div>
  );
}
