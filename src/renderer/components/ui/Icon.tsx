import {
  Aperture,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FolderOpen,
  Home,
  Image,
  Info,
  LayoutGrid,
  LayoutTemplate,
  Maximize2,
  Pencil,
  Play,
  Plus,
  Power,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  Save,
  Scissors,
  Settings,
  Trash2,
  TriangleAlert,
  Upload,
  Video,
  CircleDot,
  Globe,
  Square,
  X,
  Zap,
  type LucideIcon,
  type LucideProps
} from 'lucide-react';

/**
 * Unambiguous, semantic icon registry (gold line style via `currentColor`).
 * Components reference icons by intent, never by raw glyph — and the UI always
 * pairs an icon with a text label (DESIGN_BRAND §6).
 */
const ICONS = {
  dashboard: Home,
  events: Calendar,
  templates: LayoutTemplate,
  session: Aperture, // shutter = take photo / start session
  history: Clock,
  print: Printer,
  reprint: RotateCcw, // circular arrow = reprint
  settings: Settings,
  diagnostics: Zap,
  gallery: LayoutGrid,
  camera: Camera,
  qr: QrCode,
  savePaper: Scissors, // paper-saving on the print sheet
  start: Play,
  retry: RefreshCw,
  add: Plus,
  delete: Trash2,
  edit: Pencil,
  duplicate: Copy,
  save: Save,
  check: Check,
  success: CheckCircle2,
  close: X,
  warning: TriangleAlert,
  info: Info,
  image: Image,
  folder: FolderOpen,
  next: ChevronRight,
  export: Download,
  import: Upload,
  fullscreen: Maximize2,
  power: Power,
  video: Video,
  record: CircleDot,
  stop: Square,
  web: Globe
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 20, strokeWidth = 1.75, ...rest }: IconProps) {
  const Glyph = ICONS[name];
  return <Glyph size={size} strokeWidth={strokeWidth} aria-hidden {...rest} />;
}
