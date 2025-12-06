'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { templateApi } from '@/lib/api/templates';
import { renderJinja2 } from '@/lib/utils/jinja2-renderer';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Smartphone, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PreviewPanel() {
  const { draft, testVariables, template } = useEditorStore();
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [renderedSubject, setRenderedSubject] = useState<string>('');
  const [renderedText, setRenderedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');


  const handleRender = async () => {
    setIsLoading(true);
    try {
        if (template?.channel === 'email') {
             const html = renderJinja2(draft.body_html, testVariables);
             const subject = renderJinja2(draft.subject, testVariables);
             setRenderedHtml(html);
             setRenderedSubject(subject);
        } else {
             // For SMS and Push, we use body_text and subject (for push title)
             const text = renderJinja2(draft.body_text, testVariables);
             const subject = renderJinja2(draft.subject, testVariables);
             setRenderedText(text);
             setRenderedSubject(subject);
        }
    } catch (error) {
      console.error('Failed to render:', error);
      setRenderedHtml('<div class="text-red-500">Failed to render template</div>');
      setRenderedSubject('Error rendering subject');
      setRenderedText('Error rendering text');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-render when content or variables change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRender();
    }, 500);
    return () => clearTimeout(timer);
  }, [draft.body_html, draft.body_text, draft.subject, testVariables, template?.channel]);

  // If SMS or Push, force mobile view mostly
  useEffect(() => {
    if (template?.channel === 'sms' || template?.channel === 'push') {
        setDevice('mobile');
    }
  }, [template?.channel]);

  return (
    <div className="flex flex-col h-full border-l bg-background">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Preview</h3>
          <div className="flex gap-2">
            <Tabs value={device} onValueChange={(v) => setDevice(v as 'mobile' | 'desktop')}>
                <TabsList>
                    <TabsTrigger value="mobile">
                        <Smartphone className="h-4 w-4" />
                    </TabsTrigger>
                    {template?.channel === 'email' && (
                        <TabsTrigger value="desktop">
                            <Monitor className="h-4 w-4" />
                        </TabsTrigger>
                    )}
                </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className={cn(
        "flex-1 overflow-auto flex flex-col items-center",
        device === 'mobile' ? "bg-muted/10 p-8 pt-4 items-center justify-start" : "bg-white"
      )}>
        
        {/* Email Header Preview */}


        <div 
          className={cn(
            "bg-white transition-all duration-300 origin-top relative overflow-hidden",
            device === 'mobile' && "shadow-xl border-border/50",
            // Device styles
             device === 'mobile' ? "bg-zinc-100" : "bg-white"
          )}
          style={{ 
            width: device === 'mobile' ? '375px' : '100%',
            height: device === 'mobile' ? '667px' : '100%',
            minHeight: device === 'mobile' ? '667px' : 'calc(100% - 80px)',
            borderRadius: device === 'mobile' ? '32px' : '0',
            border: device === 'mobile' ? '8px solid #222' : 'none' 
          }}
        >
          {/* Status Bar simulation for Mobile */}
          {device === 'mobile' && (
              <div className="h-6 w-full bg-black/90 flex justify-between px-6 items-center absolute top-0 left-0 z-20 text-[10px] text-white font-medium">
              </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className={cn("h-full w-full overflow-auto", template?.channel !== 'email' && "bg-zinc-100")}>
                
                {template?.channel === 'email' && (
                    <iframe
                        srcDoc={renderedHtml}
                        className="w-full h-full border-none bg-white"
                        title="Preview" 
                    />
                )}

                {template?.channel === 'sms' && (
                    <div className="p-4 flex flex-col gap-4 mt-8">
                        <div className="text-center text-xs text-muted-foreground mb-4">Today 9:41 AM</div>
                        <div className="self-start max-w-[85%] bg-zinc-200 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-foreground">
                             <p className="whitespace-pre-wrap">{renderedText || <span className="text-muted-foreground italic">Empty message</span>}</p>
                        </div>
                    </div>
                )}

                {template?.channel === 'push' && (
                     <div className="p-4 mt-8">
                        {/* Lock Screen Notification Style */}
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-sm mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="size-5 bg-blue-500 rounded flex items-center justify-center text-[10px] text-white font-bold">A</div>
                                    <span className="text-xs font-semibold text-foreground/80">APP NAME</span>
                                </div>
                                <span className="text-xs text-muted-foreground">now</span>
                            </div>
                            <div className="px-0.5">
                                <div className="text-sm font-semibold text-foreground mb-0.5">{renderedSubject || 'Notification Title'}</div>
                                <div className="text-sm text-foreground/90 leading-tight">{renderedText || 'Notification message...'}</div>
                            </div>
                        </div>
                     </div>
                )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
