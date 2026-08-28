export type FieldType = 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox';

export interface FormFieldSchema {
  id: string;
  label: string;
  name: string;
  type: FieldType;
  placeholder?: string;
  options?: string[]; // For select dropdowns
  required: boolean;
}

export interface DynamicFormSchema {
  id: string;
  slug: string; // e.g. 'bulk-wholesale', 'delivery-partner-app', 'customer-feedback'
  title: string;
  description: string;
  submitButtonText: string;
  fields: FormFieldSchema[];
  isPublished: boolean;
}

export interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
  data: Record<string, any>;
}
