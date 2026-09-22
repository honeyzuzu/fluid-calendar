import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

interface SettingRowProps {
  label: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] md:items-start md:gap-5">
      <div className="min-w-0 space-y-1">
        <div className="text-sm font-medium leading-none">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
