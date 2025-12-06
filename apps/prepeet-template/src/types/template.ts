export interface Template {
  id: string;
  slug: string;
  name: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  current_version_id?: string;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  body_html: string;
  body_text: string;
  subject: string;
  variables_schema: Record<string, any>;
  created_at: string;
  created_by: string;
  is_published: boolean;
  published_at?: string;
  published_by?: string;
  language: string;
}

export interface TemplateCreate {
  slug: string;
  name: string;
  category: string;
  description?: string;
  channel: 'email' | 'sms' | 'push';
}

export interface TemplateVersionCreate {
  body_html: string;
  body_text: string;
  subject: string;
  variables_schema: Record<string, any>;
  language: string;
}

export interface RenderRequest {
  template_id: string;
  variables: Record<string, any>;
  locale?: string;
}

export interface RenderResponse {
  html: string;
  text: string;
  subject: string;
}
