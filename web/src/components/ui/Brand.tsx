import { Truck } from "lucide-react";

export function Brand({ size = 22 }: { size?: number }) {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Truck size={size} />
      </div>
      <div>
        <strong>Маршрутные листы</strong>
        <span>Панель менеджера</span>
      </div>
    </div>
  );
}

export function BrandLogo({ size = 24 }: { size?: number }) {
  return (
    <div className="brand-mark">
      <Truck size={size} />
    </div>
  );
}
