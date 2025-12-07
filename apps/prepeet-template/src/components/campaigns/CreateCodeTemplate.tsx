'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/lib/stores/editor-store';
import { templateApi } from '@/lib/api/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, ArrowRight, Settings2, LayoutTemplate, Send } from 'lucide-react';
import { Link } from 'lucide-react'; // Wait, standard Next Link better? No, icon.
import CodeEditor from '@/components/editor/CodeEditor';
import PreviewPanel from '@/components/editor/PreviewPanel';
import VariablePanel from '@/components/editor/VariablePanel';
import { Template } from '@/types/template';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { DEFAULT_EMAIL_HTML } from '@/lib/constants/templates';

interface CreateCodeTemplateProps {
    templateId?: string;
}

export function CreateCodeTemplate({ templateId }: CreateCodeTemplateProps) {
  const router = useRouter();
  const { 
    initialize, 
    updateDraft, 
    draft, 
    language, 
    setLanguage, 
    template, 
    originalVersion, 
    isDirty,
    isSaving,
    setIsSaving,
    saveSuccess
  } = useEditorStore();
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [name, setName] = useState('Untitled Template');
  const [slug, setSlug] = useState('');
  
  // Local state for "Save & Exit" in creation mode
  const [defaultHtml, setDefaultHtml] = useState(DEFAULT_EMAIL_HTML);

  useEffect(() => {
    // Only initialize mock if NO templateId is provided (Creation Mode)
    // AND we haven't already initialized (check template.id to avoid overwrite loops if desirable, 
    // but typically creation starts fresh).
    if (!templateId && !template?.id) {
        initialize({
            id: 'new',
            name: 'Untitled Template',
            slug: 'untitled-template',
            channel: 'email',
            category: 'marketing',
            description: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as Template, null);
        
        updateDraft('body_html', defaultHtml);
        updateDraft('subject', '*|MC:SUBJECT|*');
    }
  }, [initialize, updateDraft, defaultHtml, templateId, template?.id]);

  // Sync local name/slug with loaded template if in edit mode
  useEffect(() => {
      if (template && template.id !== 'new') {
          setName(template.name);
          setSlug(template.slug);
      }
  }, [template]);

  const handleSave = async (exit: boolean = false) => {
    if (!template) return;

    // Validation for new templates
    if (!templateId && (!name || !slug)) {
        setShowSaveDialog(true);
        return;
    }

    // Optimization: If exiting and no changes for existing template, just exit
    if (templateId && !isDirty && exit) {
        router.push('/campaigns/email');
        return;
    }

    setIsSaving(true);
    try {
        let currentTemplateId = template.id;

        // If creating new (via dialog flow mostly, but handle direct call safe-guard)
        if (!templateId && template.id === 'new') {
             // actually this flow is handled by handleCreateNew in dialog
             setShowSaveDialog(true);
             setIsSaving(false);
             return;
        }

        // Updating existing
        await templateApi.createVersion(currentTemplateId, {
            body_html: draft.body_html,
            body_text: draft.body_text || '',
            subject: draft.subject,
            variables_schema: draft.variables_schema || {},
            language: language
        });

        toast.success("Saved successfully");
        if (exit) {
            router.push('/campaigns/email');
        }
    } catch (error: any) {
        console.error("Failed to save:", error);
        toast.error("Failed to save template");
    } finally {
        setIsSaving(false);
    }
  };

  const handleCreateNew = async () => {
       if (!name || !slug) {
          toast.error("Please enter a name and slug");
          return;
       }

       setIsSaving(true);
       try {
           const newTemplate = await templateApi.createTemplate({
               name,
               slug,
               channel: 'email',
               category: 'marketing'
           });

           await templateApi.createVersion(newTemplate.id, {
               body_html: draft.body_html,
               body_text: draft.body_text || '',
               subject: draft.subject,
               variables_schema: draft.variables_schema || {},
               language: language
           });

           toast.success("Template created successfully!");
           router.push('/campaigns/email');
       } catch (error: any) {
           console.error("Failed to create:", error);
           toast.error(error.message || "Failed to create template");
       } finally {
           setIsSaving(false);
       }
  };

  return (
    <div className="h-full max-h-screen overflow-hidden flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => router.back()}>
                 <ArrowLeft className="h-4 w-4" />
             </Button>
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-lg">{template?.name || name}</h1>
                    {templateId && <Badge variant="outline" className="text-xs py-0 h-5">v{originalVersion?.version || 1}</Badge>}
                </div>
                {templateId && (
                     <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {isDirty ? <span className="text-yellow-600 font-medium">Unsaved changes</span> : "Saved"}
                     </span>
                )}
             </div>
        </div>
        <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded mr-2">
                <span className="text-xs text-muted-foreground px-1">Lang:</span>
                <Input 
                   className="h-6 w-16 text-xs bg-transparent border-none focus-visible:ring-0 px-0 shadow-none"
                   value={language} 
                   onChange={(e) => setLanguage(e.target.value)}
                   placeholder="en-US"
                />
            </div>

            <Button variant="outline" size="sm" className="h-8">
                <Send className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Test</span>
            </Button>
            
            {templateId && (
                <Button size="sm" variant="secondary" className="h-8">
                    <LayoutTemplate className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Publish</span>
                </Button>
            )}
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
            {/* Left: Preview Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full flex flex-col bg-muted/30">
                     <div className="flex-1 overflow-hidden relative">
                         <PreviewPanel />
                     </div>
                </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Right: Code Editor */}
            <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full flex flex-col">
                    <div className="h-14 bg-muted flex items-center justify-between px-4 border-b">
                        <span className="text-base font-medium">Edit code</span>
                        
                        {/* Variables Sheet Trigger */}
                        <Sheet>
                           <SheetTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-8 px-2">
                               <Settings2 className="h-4 w-4 mr-2" />
                               Variables
                             </Button>
                           </SheetTrigger>
                           <SheetContent className="w-[400px]">
                             <SheetHeader>
                               <SheetTitle>Template Variables</SheetTitle>
                             </SheetHeader>
                             <div className="mt-4 h-full overflow-auto pb-8">
                               <VariablePanel />
                             </div>
                           </SheetContent>
                        </Sheet>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <CodeEditor />
                    </div>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Footer */}
      <footer className="h-14 border-t flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
           <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent hover:text-foreground">Edit Design</Button>
           <span className="h-4 w-px bg-border" />
           <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-foreground hover:bg-transparent">Edit Code</Button>
        </div>
        <Button 
            onClick={() => handleSave(true)}
        >
            <span className="hidden sm:inline mr-2">Save and Exit</span>
            <ArrowRight className="h-4 w-4" />
        </Button>
      </footer>

      {/* Create New Dialog (only for new templates) */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Give your template a name and slug to save it to your library.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                }}
                placeholder="My Awesome Template"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-awesome-template"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleCreateNew} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
