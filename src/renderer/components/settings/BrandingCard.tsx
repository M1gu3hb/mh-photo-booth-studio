import { useEffect, useState } from 'react';
import { Card, Button, Input, useToast } from '@renderer/components/ui';
import { useTheme } from '@renderer/theme/ThemeProvider';
import './settings-extra.css';

export function BrandingCard() {
  const { branding, setBranding, refresh } = useTheme();
  const { notify } = useToast();
  const [productName, setProductName] = useState(branding.productName);
  const [venueName, setVenueName] = useState(branding.venueName);
  const [welcomeText, setWelcomeText] = useState(branding.welcomeText);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    setProductName(branding.productName);
    setVenueName(branding.venueName);
    setWelcomeText(branding.welcomeText);
  }, [branding]);

  const loadLogo = async () => {
    const r = await window.photoBooth.branding.getLogo();
    setLogo(r.ok ? r.data : null);
  };
  useEffect(() => {
    void loadLogo();
  }, []);

  async function save() {
    const ok = await setBranding({ productName, venueName, welcomeText });
    notify(ok ? { tone: 'success', title: 'Marca actualizada' } : { tone: 'danger', title: 'No se pudo guardar' });
  }

  async function pickLogo() {
    const r = await window.photoBooth.branding.pickLogo();
    if (r.ok) {
      await refresh();
      await loadLogo();
      notify({ tone: 'success', title: 'Logo actualizado' });
    }
  }

  async function clearLogo() {
    await window.photoBooth.branding.clearLogo();
    await refresh();
    setLogo(null);
    notify({ tone: 'neutral', title: 'Logo quitado' });
  }

  return (
    <Card title="Marca (branding)" icon="image">
      <div className="pb-brand">
        <div className="pb-brand__fields">
          <Input label="Nombre visible del producto" value={productName} onChange={(e) => setProductName(e.target.value)} />
          <Input label="Nombre del lugar / venue" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
          <Input label="Texto de bienvenida" value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} />
          <Button icon="save" onClick={() => void save()}>
            Guardar marca
          </Button>
        </div>
        <div className="pb-brand__logo">
          <span className="pb-field__label">Logo</span>
          <div className="pb-brand__logoBox">
            {logo ? <img src={logo} alt="Logo" /> : <span className="pb-brand__logoEmpty">Sin logo</span>}
          </div>
          <div className="pb-brand__logoBtns">
            <Button size="sm" variant="secondary" icon="image" onClick={() => void pickLogo()}>
              Cambiar logo
            </Button>
            {logo && (
              <Button size="sm" variant="ghost" icon="delete" onClick={() => void clearLogo()}>
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="pb-camset__hint">
        El nombre y el logo se reflejan en la barra lateral, el Dashboard y el modo evento. El tema
        Esmeralda & Oro (Jardines) es el predeterminado.
      </p>
    </Card>
  );
}
