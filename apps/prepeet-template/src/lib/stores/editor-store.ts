import { create } from 'zustand';
import { Template, TemplateVersion } from '@/types/template';

interface DraftState {
  subject: string;
  body_html: string;
  body_text: string;
  variables_schema: Record<string, any>;
}


interface EditorState {
  // Server State
  template: Template | null;
  originalVersion: TemplateVersion | null;

  // Local State
  draft: DraftState;
  
  // UI State
  isDirty: boolean;
  testVariables: Record<string, any>;
  isSaving: boolean;
  isPublishing: boolean;
  language: string;
  view: 'code' | 'preview';
  
  // Actions
  initialize: (template: Template, version: TemplateVersion | null) => void;
  updateDraft: <K extends keyof DraftState>(field: K, value: DraftState[K]) => void;
  saveSuccess: (newVersion: TemplateVersion) => void;
  setTestVariable: (key: string, value: any) => void;
  reset: () => void;
  
  // UI Actions
  setIsSaving: (isSaving: boolean) => void;
  setIsPublishing: (isPublishing: boolean) => void;
  setLanguage: (language: string) => void;
  setView: (view: 'code' | 'preview') => void;
}

const INITIAL_DRAFT: DraftState = {
  subject: '',
  body_html: '',
  body_text: '',
  variables_schema: {}
};

export const useEditorStore = create<EditorState>((set, get) => ({
  template: null,
  originalVersion: null,
  draft: INITIAL_DRAFT,
  isDirty: false,
  testVariables: {},
  isSaving: false,
  isPublishing: false,
  language: 'en-US',
  view: 'code',
  
  initialize: (template, version) => {
    set({
      template,
      originalVersion: version,
      draft: version ? {
        subject: version.subject || '',
        body_html: version.body_html || '',
        body_text: version.body_text || '',
        variables_schema: version.variables_schema || {}
      } : { ...INITIAL_DRAFT },
      isDirty: false,
      testVariables: {},
      language: version?.language || 'en-US',
    });
  },

  updateDraft: (field, value) => {
    set((state) => {
      const newDraft = { ...state.draft, [field]: value };
      const isDirty = true; 
      return {
        draft: newDraft,
        isDirty
      };
    });
  },

  saveSuccess: (newVersion) => {
    set({
      originalVersion: newVersion,
      draft: {
         subject: newVersion.subject || '',
         body_html: newVersion.body_html || '',
         body_text: newVersion.body_text || '',
         variables_schema: newVersion.variables_schema || {}
      },
      isDirty: false,
      // Update language if it changed (though usually saving uses current language)
      language: newVersion.language || 'en-US'
    });
  },

  setTestVariable: (key, value) => set((state) => ({
    testVariables: { ...state.testVariables, [key]: value }
  })),

  reset: () => {
    const { originalVersion } = get();
    if (originalVersion) {
        set({
            draft: {
                subject: originalVersion.subject || '',
                body_html: originalVersion.body_html || '',
                body_text: originalVersion.body_text || '',
                variables_schema: originalVersion.variables_schema || {}
            },
            isDirty: false,
            language: originalVersion.language || 'en-US'
        })
    }
  },
  
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsPublishing: (isPublishing) => set({ isPublishing }),
  setLanguage: (language) => set({ language }),
  setView: (view) => set({ view })
}));
