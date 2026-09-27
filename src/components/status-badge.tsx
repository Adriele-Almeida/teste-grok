import { STATUS_LABEL, statusTone, type Status } from "@/lib/pauta";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: Status }) {
  const tone = statusTone(status);
  return (
    <Badge className={cn(tone.bg, tone.fg)}>
      <span className={cn("mr-1.5 size-1.5 rounded-full", tone.dot)} />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
