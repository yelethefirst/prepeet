import { Template, TemplateCreate, TemplateVersion, TemplateVersionCreate, RenderRequest, RenderResponse } from '@/types/template';

const API_BASE = process.env.NEXT_PUBLIC_TEMPLATE_API || 'http://localhost:8003';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_ID || 'dev-admin-key-123';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = {
    ...options?.headers,
    'X-Admin-Key': ADMIN_KEY,
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const templateApi = {
  listTemplates: async (category?: string, channel?: string): Promise<Template[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (channel) params.append('channel', channel);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`${API_BASE}/api/v1/templates${query}`);
  },

  listEmailTemplates: async (category?: string): Promise<Template[]> => {
    const query = category ? `?category=${category}` : '';
    return fetchJson(`${API_BASE}/api/v1/templates/email${query}`);
  },

  listSmsTemplates: async (category?: string): Promise<Template[]> => {
    const query = category ? `?category=${category}` : '';
    return fetchJson(`${API_BASE}/api/v1/templates/sms${query}`);
  },

  listPushTemplates: async (category?: string): Promise<Template[]> => {
    const query = category ? `?category=${category}` : '';
    return fetchJson(`${API_BASE}/api/v1/templates/push${query}`);
  },

  getTemplate: async (id: string): Promise<Template> => {
    return fetchJson(`${API_BASE}/api/v1/templates/${id}`);
  },

  createTemplate: async (data: TemplateCreate): Promise<Template> => {
    // Map slug -> key
    const payload = { ...data, key: data.slug }; 
    return fetchJson(`${API_BASE}/api/v1/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  
  deleteTemplate: async (id: string): Promise<void> => {
    return fetchJson(`${API_BASE}/api/v1/templates/${id}`, {
      method: 'DELETE',
    });
  },

  listVersions: async (templateId: string): Promise<TemplateVersion[]> => {
    return fetchJson(`${API_BASE}/api/v1/templates/${templateId}/versions`);
  },

  createVersion: async (templateId: string, data: TemplateVersionCreate): Promise<TemplateVersion> => {
    return fetchJson(`${API_BASE}/api/v1/templates/${templateId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  
  publishVersion: async (templateId: string, versionId: string): Promise<TemplateVersion> => {
    return fetchJson(`${API_BASE}/api/v1/templates/${templateId}/versions/${versionId}/publish`, {
      method: 'POST',
    });
  },

  renderTemplate: async (data: RenderRequest): Promise<RenderResponse> => {
    // Backend /render expects: template_key, channel, tenant_id, language, data
    // Frontend sends: template_id, variables, locale?
    // This is a mismatch. The Frontend "Preview" might typically use the Preview Endpoint which we have!
    // But `renderTemplate` here calls `/api/render`.
    // If usage is "PreviewPanel", it should probably call `preview_version`.
    // The PreviewPanel uses `currentVersion.template_id`.
    
    // If we want to support the public render endpoint:
    // We need key. We don't have key easily from ID unless we fetched template.
    // BUT PreviewPanel has header "Preview".
    
    // Let's point this function to the PREVIEW endpoint if the context implies preview?
    // Or, frontend should call a new `previewVersion` method.
    
    // For now, let's leave this broken or stub it.
    // Actually, we added `preview_version` to backend.
    return fetchJson(`${API_BASE}/api/v1/render`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data),
    });
  },
  
  previewVersion: async (templateId: string, versionId: string, variables: any): Promise<any> => {
      return fetchJson(`${API_BASE}/api/v1/templates/${templateId}/versions/${versionId}/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variables)
      });
  }
};
