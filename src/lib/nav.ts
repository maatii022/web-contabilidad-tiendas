import {
  BanknoteArrowUp,
  ChartSpline,
  FileSpreadsheet,
  HandCoins,
  LayoutDashboard,
  Settings
} from 'lucide-react';

export const navigationItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    href: '/gastos',
    label: 'Gastos',
    icon: HandCoins
  },
  {
    href: '/facturas',
    label: 'Facturas',
    icon: FileSpreadsheet
  },
  {
    href: '/caja',
    label: 'Caja y banco',
    icon: BanknoteArrowUp
  },
  {
    href: '/analisis',
    label: 'Análisis',
    icon: ChartSpline
  },
  {
    href: '/configuracion',
    label: 'Configuración',
    icon: Settings
  }
] as const;
