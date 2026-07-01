import './domain.css';

interface PoseCardProps {
  pose: string;
  index?: number;
  total?: number;
}

/** Guest-facing pose suggestion shown before each shot (script accent). */
export function PoseCard({ pose, index, total }: PoseCardProps) {
  return (
    <div className="pb-pose">
      {index != null && total != null && (
        <span className="pb-pose__counter">
          Foto {index} de {total}
        </span>
      )}
      <p className="pb-pose__text">{pose}</p>
    </div>
  );
}
