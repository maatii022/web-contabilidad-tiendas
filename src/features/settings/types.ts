export type SettingsProviderItem = {
  id: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  expenseCount: number;
  invoiceCount: number;
};

export type SettingsCategoryItem = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  expenseCount: number;
};

export type SettingsWorkspaceData = {
  providers: SettingsProviderItem[];
  categories: SettingsCategoryItem[];
};

export type SettingsFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
  entityId?: string;
};

export const settingsFormInitialState: SettingsFormState = {
  status: 'idle'
};
