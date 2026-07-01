import { type ReactNode } from 'react';
import { Card, EmptyState, type IconName } from '@renderer/components/ui';

interface PlaceholderScreenProps {
  icon: IconName;
  title: string;
  description: string;
  /** Only ever a real action (navigation). Never a no-op. */
  action?: ReactNode;
}

/**
 * Shared shell for screens whose data/logic arrives in a later phase. Renders a
 * genuine EmptyState describing the current (empty) state — never fake data.
 */
export function PlaceholderScreen({ icon, title, description, action }: PlaceholderScreenProps) {
  return (
    <Card>
      <EmptyState icon={icon} title={title} description={description} action={action} />
    </Card>
  );
}
