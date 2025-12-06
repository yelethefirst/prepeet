'use client';

import React from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '@/lib/stores/editor-store';

export default function CodeEditor() {
  const { draft, updateDraft } = useEditorStore();

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateDraft('body_html', value);
    }
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="html"
        theme="vs-dark"
        value={draft.body_html}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          formatOnPaste: true,
          formatOnType: true,
          wordWrap: 'on',
          automaticLayout: true
        }}
      />
    </div>
  );
}
