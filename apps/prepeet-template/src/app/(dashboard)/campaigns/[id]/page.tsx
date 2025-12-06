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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Send, Eye, Code, ArrowLeft, Settings2, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
      toast.success('Saved successfully');
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!originalVersion || !template) return;
    if (isDirty) {
        toast.warning("Please save your changes before publishing.", {
          action: {
            label: "Save & Publish",
            onClick: async () => {
               await handleSave();
            }
          }
        });
        return;
    }
    
    setIsPublishing(true);
    try {
      await templateApi.publishVersion(template.id, originalVersion.id);
      toast.success('Version published!');
      // Ideally refetch versions to update status
    } catch (error) {
       console.error('Failed to publish:', error);
       toast.error('Failed to publish');
    } finally {
       setIsPublishing(false);
    }
  };

  if (isTemplateLoading || isVersionsLoading) {
    return (
       <div className="h-screen flex flex-col bg-background p-4 gap-4">
          <div className="flex justify-between items-center h-16 border-b pb-2">
             <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8" />
                <div className="space-y-2">
                   <Skeleton className="h-4 w-48" />
                   <Skeleton className="h-4 w-24" />
                </div>
             </div>
             <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
             </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
             <Skeleton className="h-8 w-32" />
             <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex-1 flex gap-4 h-full overflow-hidden">
             <Skeleton className="flex-1 h-full rounded-md" />
          </div>
       </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur z-10 shrink-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-2 md:px-4 md:h-16 gap-2">
          
          {/* Top/Left Section: Back, Title, Subject */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
             <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
               <Link href={template?.channel ? `/campaigns/${template.channel}` : '/campaigns'}>
                 <ArrowLeft className="h-4 w-4" />
               </Link>
             </Button>
             
             <div className="flex flex-1 md:flex-initial flex-col md:flex-row md:items-center gap-1 md:gap-4 overflow-hidden">
                <div className="flex items-center gap-2">
                   <h1 className="font-semibold text-lg leading-none truncate max-w-[150px] md:max-w-none">{template?.name}</h1>
                   <Badge variant="outline" className="text-xs py-0 h-5 shrink-0">v{originalVersion?.version || 1}</Badge>
                </div>
                
                <div className="flex items-center gap-2 flex-1 min-w-0">

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
                     <Input 
                        className="h-6 w-16 text-xs bg-transparent border-none focus-visible:ring-0 px-0 shadow-none"
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
      <Tabs value={view} onValueChange={(v) => setView(v as 'code' | 'preview')} className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 border-b flex items-center justify-between px-2 md:px-4 bg-muted/10 shrink-0">
          <TabsList className="h-8">
            <TabsTrigger value="code" className="h-7 text-xs">
              <Code className="h-3.5 w-3.5 mr-2" />
              Code
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-7 text-xs">
              <Eye className="h-3.5 w-3.5 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
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
          <TabsContent value="code" className="h-full mt-0 border-0 p-0 data-[state=active]:flex flex-col">
              <div className="flex-1 relative bg-muted/5 p-4 overflow-auto">
                {template?.channel === 'email' ? (
                  <div className="h-full border rounded-md overflow-hidden bg-background">
                     <CodeEditor />
                  </div>
                ) : (
                  <div className="h-full max-w-3xl mx-auto flex flex-col gap-2">
                      <label className="text-sm font-medium text-muted-foreground">
                          {template?.channel === 'push' ? 'Message Body' : 'SMS Content'}
                      </label>
                      <Textarea 
                          className="flex-1 w-full bg-background resize-none font-mono text-sm"
                          value={draft.body_text}
                          onChange={(e) => updateDraft('body_text', e.target.value)}
                          placeholder={template?.channel === 'push' ? "Enter notification message..." : "Enter SMS content..."} 
                      />
                      <div className="text-xs text-muted-foreground text-right">
                          {draft.body_text?.length || 0} characters
                      </div>
                  </div>
                )}
              </div>
          </TabsContent>
          <TabsContent value="preview" className="h-full mt-0 border-0 p-0 transform-none data-[state=active]:flex flex-col overflow-hidden">
             <PreviewPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
