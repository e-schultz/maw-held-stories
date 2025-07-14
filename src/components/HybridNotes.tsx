import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Upload } from 'lucide-react';

interface Entry {
  id: string;
  content: string;
  timestamp: Date;
  indent: number;
  parentId?: string;
}

interface HybridNotesProps {}

export const HybridNotes: React.FC<HybridNotesProps> = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<'chat' | 'edit'>('chat');
  const [inputValue, setInputValue] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [currentIndent, setCurrentIndent] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const entriesRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on mount and mode switch
  useEffect(() => {
    if (mode === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  // Calculate indent level for new entry
  const getInsertIndent = useCallback(() => {
    if (!selectedEntryId) return 0;
    
    const selectedEntry = entries.find(e => e.id === selectedEntryId);
    return selectedEntry ? selectedEntry.indent + 1 : 0;
  }, [selectedEntryId, entries]);

  // Generate unique ID
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Add new entry
  const addEntry = useCallback(() => {
    if (!inputValue.trim()) return;

    const newEntry: Entry = {
      id: generateId(),
      content: inputValue.trim(),
      timestamp: new Date(),
      indent: getInsertIndent(),
      parentId: selectedEntryId || undefined
    };

    setEntries(prev => {
      if (!selectedEntryId) {
        // Append to bottom
        return [...prev, newEntry];
      }

      // Insert after selected entry
      const selectedIndex = prev.findIndex(e => e.id === selectedEntryId);
      if (selectedIndex === -1) return [...prev, newEntry];

      const newEntries = [...prev];
      newEntries.splice(selectedIndex + 1, 0, newEntry);
      return newEntries;
    });

    setInputValue('');
    setSelectedEntryId(newEntry.id); // Auto-select the new entry
  }, [inputValue, selectedEntryId, getInsertIndent]);

  // Handle key navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+E: Toggle mode
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      setMode(prev => prev === 'chat' ? 'edit' : 'chat');
      return;
    }

    // Only handle navigation in chat mode
    if (mode !== 'chat') return;

    // Enter: Add entry
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addEntry();
      return;
    }

    // Escape: Clear selection
    if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedEntryId(null);
      setCurrentIndent(0);
      return;
    }

    // Alt + Arrow navigation
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      if (entries.length === 0) return;

      const currentIndex = selectedEntryId 
        ? entries.findIndex(e => e.id === selectedEntryId)
        : -1;

      let newIndex;
      if (e.key === 'ArrowUp') {
        newIndex = currentIndex <= 0 ? entries.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex >= entries.length - 1 ? 0 : currentIndex + 1;
      }

      setSelectedEntryId(entries[newIndex]?.id || null);
      return;
    }

    // Tab: Indent (when entry is selected)
    if (e.key === 'Tab' && selectedEntryId) {
      e.preventDefault();
      const maxIndent = 6; // Reasonable limit
      
      setEntries(prev => prev.map(entry => {
        if (entry.id === selectedEntryId) {
          const newIndent = e.shiftKey 
            ? Math.max(0, entry.indent - 1)
            : Math.min(maxIndent, entry.indent + 1);
          return { ...entry, indent: newIndent };
        }
        return entry;
      }));
      return;
    }
  }, [mode, addEntry, entries, selectedEntryId]);

  // Format entry content for display
  const formatEntryContent = (content: string) => {
    const lines = content.split('\n');
    if (lines.length === 1) return content;
    
    return (
      <div>
        <div className="font-medium">{lines[0]}</div>
        {lines.slice(1).map((line, idx) => (
          <div key={idx} className="ml-4 text-terminal-gray">
            {line}
          </div>
        ))}
      </div>
    );
  };

  // Get visual indicator for where next entry will be inserted
  const getInsertionIndicator = () => {
    if (!selectedEntryId) {
      return "Appending to bottom";
    }
    
    const selectedEntry = entries.find(e => e.id === selectedEntryId);
    if (!selectedEntry) return "Appending to bottom";
    
    const indent = selectedEntry.indent + 1;
    const indentStr = "  ".repeat(indent);
    return `${indentStr}└─ Child of selected entry`;
  };

  return (
    <div className="h-screen bg-terminal-bg text-terminal-fg font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-terminal-gray/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-terminal-green">Hybrid Notes</h1>
            <p className="text-terminal-gray text-sm">
              Chat mode for quick logging • Edit mode for full control
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={mode === 'chat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('chat')}
              className="bg-terminal-green hover:bg-terminal-green/80 text-black"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Log
            </Button>
            <Button
              variant={mode === 'edit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('edit')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {mode === 'chat' && (
        <>
          {/* Chat Mode */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Terminal Window Header */}
            <div className="border-b border-terminal-gray/20 bg-terminal-bg/50">
              <div className="flex items-center gap-2 p-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-terminal-gray text-sm ml-2">hybrid-notes.md</span>
              </div>
            </div>

            {/* Entries Display */}
            <div 
              ref={entriesRef}
              className="flex-1 p-4 overflow-y-auto"
            >
              {entries.length === 0 ? (
                <div className="text-terminal-gray">
                  <span className="text-terminal-green">➤</span> Start logging your thoughts...
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`cursor-pointer transition-colors rounded p-2 ${
                        selectedEntryId === entry.id
                          ? 'bg-terminal-selection/20 border-l-2 border-terminal-selection'
                          : 'hover:bg-terminal-gray/10'
                      }`}
                      style={{ marginLeft: `${entry.indent * 20}px` }}
                      onClick={() => setSelectedEntryId(entry.id)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-terminal-green text-xs mt-1">➤</span>
                        <div className="flex-1">
                          <div className="text-terminal-fg">
                            {formatEntryContent(entry.content)}
                          </div>
                          <div className="text-terminal-gray text-xs mt-1">
                            {entry.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-terminal-gray/20 p-4">
              <div className="text-terminal-gray text-xs mb-2">
                {getInsertionIndicator()} • Alt+↑/↓ to select entry
              </div>
              
              <div className="flex items-end gap-2">
                <span className="text-terminal-green">➤</span>
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What's on your mind?"
                    className="w-full bg-transparent border-none outline-none resize-none text-terminal-fg placeholder-terminal-gray"
                    rows={1}
                    style={{ 
                      minHeight: '24px',
                      maxHeight: '120px',
                      overflow: 'hidden'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={addEntry}
                  disabled={!inputValue.trim()}
                  className="bg-terminal-green hover:bg-terminal-green/80 text-black"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {mode === 'edit' && (
        <>
          {/* Edit Mode */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Structured View</h3>
                
                {entries.length === 0 ? (
                  <p className="text-muted-foreground">No entries yet. Switch to Chat mode to start logging thoughts.</p>
                ) : (
                  <div className="space-y-3 font-mono text-sm">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-4"
                        style={{ marginLeft: `${entry.indent * 20}px` }}
                      >
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                        <div className="flex-1">
                          <div className="text-foreground whitespace-pre-wrap">
                            {entry.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};