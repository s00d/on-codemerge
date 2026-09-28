export interface Template {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTemplateData {
  name: string;
  content: string;
}
