'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { templateApi } from '@/lib/api/templates';
import { useEditorStore } from '@/lib/stores/editor-store';
import CodeEditor from '@/components/editor/CodeEditor';
import PreviewPanel from '@/components/editor/PreviewPanel';
import VariablePanel from '@/components/editor/VariablePanel';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Save, Send, Eye, Code, ArrowLeft, Settings2, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { 
    initialize, 
    saveSuccess,
    updateDraft,
    isDirty,
    template,
    originalVersion,
    draft,
    // Global States
    isSaving,
    isPublishing,
    language,
    view,
    // Setters
    setIsSaving,
    setIsPublishing,
    setLanguage,
    setView
  } = useEditorStore();

  const { data: templateData, isLoading: isTemplateLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templateApi.getTemplate(id),
  });

  const { data: versionsData, isLoading: isVersionsLoading } = useQuery({
    queryKey: ['template', id, 'versions'],
    queryFn: () => templateApi.listVersions(id),
    enabled: !!templateData,
  });

  useEffect(() => {
    if (templateData && versionsData) {
      // Use the latest version or null if no versions
      const latest = versionsData.length > 0 ? versionsData[versionsData.length - 1] : null;
      initialize(templateData, latest);
    }
  }, [templateData, versionsData, initialize]);

  const handleSave = async () => {
    if (!template) return;
    
    setIsSaving(true);
    try {
      const newVersion = await templateApi.createVersion(template.id, {
        body_html: draft.body_html,
        body_text: draft.body_text,
        subject: draft.subject,
        variables_schema: draft.variables_schema || {}, 
        language: language,
      });
      
      saveSuccess(newVersion);
      alert('Saved successfully!');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!originalVersion || !template) return;
    if (isDirty) {
        alert("Please save your changes before publishing.");
        return;
    }
    
    setIsPublishing(true);
    try {
      await templateApi.publishVersion(template.id, originalVersion.id);
      alert('Version published!');
      // Ideally refetch versions to update status
    } catch (error) {
       console.error('Failed to publish:', error);
       alert('Failed to publish');
    } finally {
       setIsPublishing(false);
    }
  };

  if (isTemplateLoading || isVersionsLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur z-10 shrink-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-2 md:px-4 md:h-16 gap-2">
          
          {/* Top/Left Section: Back, Title, Subject */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
             <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
               <Link href="/templates">
                 <ArrowLeft className="h-4 w-4" />
               </Link>
             </Button>
             
             <div className="flex flex-1 md:flex-initial flex-col md:flex-row md:items-center gap-1 md:gap-4 overflow-hidden">
                <div className="flex items-center gap-2">
                   <h1 className="font-semibold text-lg leading-none truncate max-w-[150px] md:max-w-none">{template?.name}</h1>
                   <Badge variant="outline" className="text-xs py-0 h-5 shrink-0">v{originalVersion?.version || 1}</Badge>
                </div>
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline-block">Subject:</span>
                    <input 
                       className="h-6 text-sm bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus:border-primary focus:outline-none w-full md:w-[300px] lg:w-[400px] transition-colors"
                       value={draft.subject}
                       onChange={(e) => updateDraft('subject', e.target.value)}
                       placeholder="Enter email subject..."
                    />
                </div>
             </div>
          </div>

          {/* Right Section: Language, Status, Actions */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2">
             <div className="flex items-center gap-2 shrink-0">
                 <span className="text-xs text-muted-foreground truncate hidden lg:inline-block">
                   {isDirty ? <span className="text-yellow-600 font-medium">Unsaved</span> : <span className="opacity-50">Saved</span>}
                 </span>
                 
                 <div className="flex items-center gap-1 bg-muted/30 p-1 rounded">
                    <span className="text-xs text-muted-foreground px-1 sm:px-2">Lang:</span>
                    <input 
                       className="h-6 w-12 sm:w-16 text-xs bg-transparent border-none focus:ring-0" 
                       value={language} 
                       onChange={(e) => setLanguage(e.target.value)}
                       placeholder="en-US"
                    />
                 </div>
             </div>

             <div className="flex items-center gap-1 md:gap-2">
               <Button variant="outline" size="sm" className="h-8 px-2 md:px-3">
                 <Send className="h-4 w-4 md:mr-2" />
                 <span className="hidden md:inline">Test</span>
               </Button>
               <Button 
                 size="sm" 
                 variant="secondary"
                 disabled={isPublishing || isDirty} 
                 className="h-8 px-2 md:px-3"
                 onClick={handlePublish}
               >
                 <LayoutTemplate className="h-4 w-4 md:mr-2" />
                 <span className="hidden md:inline">{isPublishing ? '...' : 'Publish'}</span>
               </Button>
               <Button 
                 size="sm" 
                 disabled={!isDirty || isSaving} 
                 className="h-8 px-2 md:px-3"
                 onClick={handleSave}
               >
                 <Save className="h-4 w-4 md:mr-2" />
                 <span className="hidden md:inline">{isSaving ? '...' : 'Save'}</span>
               </Button>
             </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="h-12 border-b flex items-center justify-between px-2 md:px-4 bg-muted/10 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setView('code')}
            className={cn(
              "h-7 px-3 text-xs font-medium hover:bg-background hover:text-foreground",
              view === 'code' && "bg-background text-foreground shadow-sm"
            )}
          >
            <Code className="h-3.5 w-3.5 mr-2" />
            Code
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setView('preview')}
            className={cn(
              "h-7 px-3 text-xs font-medium hover:bg-background hover:text-foreground",
              view === 'preview' && "bg-background text-foreground shadow-sm"
            )}
          >
            <Eye className="h-3.5 w-3.5 mr-2" />
            Preview
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Add tablet/desktop specific toolbar items here if needed */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Settings2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Variables</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[85vw] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Template Variables</SheetTitle>
              </SheetHeader>
              <div className="mt-4 h-full overflow-auto pb-8">
                <VariablePanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        {view === 'code' ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 relative">
              <CodeEditor />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-hidden">
            <PreviewPanel />
          </div>
        )}
      </div>
    </div>
  );
}
