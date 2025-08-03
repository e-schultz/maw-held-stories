import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Upload, Database, ChevronDown, ChevronRight } from 'lucide-react';

interface Entry {
  id: string;
  content: string;
  timestamp: Date;
  updatedAt?: Date;
  indent: number;
  parentId?: string;
  type: string; // log, ctx, abc, xyz, etc.
  isCollapsed?: boolean;
}

interface HybridNotesProps {}

// Demo floatAST data
const DEMO_FLOAT_AST = {
  "floatAST": {
    "version": "1.0",
    "type": "ConsultingEvolutionSynthesis",
    "metadata": {
      "bridge_id": "CB-20250721-1700-EXEC",
      "timestamp": "2025-07-21T17:00:00Z",
      "ritual_type": "strategic_paradigm_shift",
      "consciousness_transmission": true
    },
    "sections": [
      {
        "id": "knowledge_asymmetry_death",
        "type": "epistemological_collapse",
        "content": {
          "observation": "The priesthood of Angular and React has lost its power",
          "timeline": "6 years of client confidence building",
          "implication": "Traditional consulting influence structures evaporating",
          "nick_quote": "there's no path to influence anymore because we can't leverage that unique sort of being the priesthood"
        },
        "metadata": {
          "timestamp": "17:00",
          "speaker": "nick",
          "revolutionary_potential": "high"
        }
      },
      {
        "id": "antic_driven_subversion",
        "type": "methodological_resistance",
        "content": {
          "framework": "antic-driven development",
          "etymology": "antics + schematics = playful infrastructure",
          "structure": {
            "unit": "job story",
            "increment": "shippable antic",
            "rhythm": "refactor every 4 antics",
            "total_antics": 16
          },
          "subversion": "Replaces user stories with user antics - what people actually do vs what they claim"
        },
        "metadata": {
          "timestamp": "17:26",
          "revolutionary_act": "naming_as_resistance",
          "undefined_as_strength": true
        }
      },
      {
        "id": "personal_saas_inversion",
        "type": "business_model_heresy",
        "content": {
          "concept": "Software as a Service for One",
          "economics": {
            "rate": "$200/hr for agentic engineers",
            "structure": "2 devs × 4 weeks + 12 month support",
            "total": "$128k",
            "evolution": "L1 → L2 → L3 support as agents improve"
          },
          "heresy": "Individual infrastructure over mass market",
          "validation": "Friday CRM demo - 80% functionality in <1 week"
        },
        "metadata": {
          "disrupts": "traditional_saas_economics",
          "enables": "bespoke_at_scale"
        }
      }
    ],
    "connections": [
      {
        "from": "knowledge_asymmetry_death",
        "to": "personal_saas_inversion",
        "type": "enables",
        "strength": "paradigm_shift"
      },
      {
        "from": "antic_driven_subversion", 
        "to": "personal_saas_inversion",
        "type": "supports",
        "strength": "methodological"
      }
    ]
  }
};

// Type color mapping for visual clarity
const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'synthesis': 'text-terminal-green border-l-terminal-green',
    'collapse': 'text-red-400 border-l-red-400',
    'epistemological': 'text-red-400 border-l-red-400',
    'resistance': 'text-yellow-400 border-l-yellow-400',
    'methodological': 'text-yellow-400 border-l-yellow-400',
    'heresy': 'text-purple-400 border-l-purple-400',
    'business': 'text-purple-400 border-l-purple-400',
    'debug': 'text-blue-400 border-l-blue-400',
    'debugging': 'text-blue-400 border-l-blue-400',
    'praxis': 'text-terminal-green border-l-terminal-green',
    'consciousness': 'text-terminal-green border-l-terminal-green',
    'ritual': 'text-cyan-400 border-l-cyan-400',
    'knowledge': 'text-cyan-400 border-l-cyan-400',
    'bridge': 'text-orange-400 border-l-orange-400',
    'connection': 'text-orange-400 border-l-orange-400',
    'meta': 'text-terminal-gray border-l-terminal-gray',
    'metadata': 'text-terminal-gray border-l-terminal-gray',
    'structure': 'text-terminal-gray border-l-terminal-gray',
    'log': 'text-terminal-fg border-l-terminal-gray',
    'ctx': 'text-terminal-blue border-l-terminal-blue',
  };
  
  // Check for partial matches
  for (const [key, color] of Object.entries(colorMap)) {
    if (type.toLowerCase().includes(key)) {
      return color;
    }
  }
  
  return 'text-terminal-fg border-l-terminal-gray'; // default
};

export const HybridNotes: React.FC<HybridNotesProps> = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<'chat' | 'edit'>('chat');
  const [inputValue, setInputValue] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [currentIndent, setCurrentIndent] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [multiSelectIds, setMultiSelectIds] = useState<Set<string>>(new Set());
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const entriesRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

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
    return selectedEntry ? selectedEntry.indent : 0; // Same level, not +1
  }, [selectedEntryId, entries]);

  // Generate unique ID
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Parse floatAST into HybridNotes entries
  const parseFloatAST = (floatAST: any): Entry[] => {
    const entries: Entry[] = [];
    
    // Add main header
    entries.push({
      id: generateId(),
      content: `${floatAST.floatAST.type} - ${floatAST.floatAST.metadata.bridge_id}`,
      timestamp: new Date(floatAST.floatAST.metadata.timestamp),
      indent: 0,
      type: 'synthesis'
    });

    // Process sections
    floatAST.floatAST.sections.forEach((section: any) => {
      // Section header
      entries.push({
        id: generateId(),
        content: section.id.replace(/_/g, ' '),
        timestamp: new Date(),
        indent: 1,
        type: section.type.split('_')[0] // collapse, resistance, heresy, etc.
      });

      // Content entries
      Object.entries(section.content).forEach(([key, value]: [string, any]) => {
        if (typeof value === 'object') {
          entries.push({
            id: generateId(),
            content: `${key}:: ${JSON.stringify(value, null, 2)}`,
            timestamp: new Date(),
            indent: 2,
            type: 'structure'
          });
        } else {
          entries.push({
            id: generateId(),
            content: `${key}:: ${value}`,
            timestamp: new Date(),
            indent: 2,
            type: key
          });
        }
      });

      // Metadata
      if (section.metadata) {
        entries.push({
          id: generateId(),
          content: 'metadata',
          timestamp: new Date(),
          indent: 2,
          type: 'meta'
        });

        Object.entries(section.metadata).forEach(([key, value]: [string, any]) => {
          entries.push({
            id: generateId(),
            content: `${key}:: ${value}`,
            timestamp: new Date(),
            indent: 3,
            type: 'metadata'
          });
        });
      }
    });

    // Connections
    if (floatAST.floatAST.connections) {
      entries.push({
        id: generateId(),
        content: 'connections',
        timestamp: new Date(),
        indent: 1,
        type: 'bridge'
      });

      floatAST.floatAST.connections.forEach((conn: any) => {
        entries.push({
          id: generateId(),
          content: `${conn.from} → ${conn.to} [${conn.type}]`,
          timestamp: new Date(),
          indent: 2,
          type: 'connection'
        });
      });
    }

    return entries;
  };

  // Load demo content
  const loadDemoContent = useCallback(() => {
    const demoEntries = parseFloatAST(DEMO_FLOAT_AST);
    setEntries(demoEntries);
    setSelectedEntryId(null);
  }, []);

  // Parse entry type and content
  const parseEntryInput = (input: string) => {
    const trimmed = input.trim();
    const typeMatch = trimmed.match(/^(\w+)::\s*(.*)/s);
    
    if (typeMatch) {
      return {
        type: typeMatch[1],
        content: typeMatch[2] || trimmed
      };
    }
    
    return {
      type: 'log',
      content: trimmed
    };
  };

  // Toggle collapse state of an entry
  const toggleCollapse = useCallback((entryId: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return { ...entry, isCollapsed: !entry.isCollapsed };
      }
      return entry;
    }));
  }, []);

  // Check if an entry should be hidden due to collapsed parent
  const isEntryVisible = useCallback((entry: Entry, index: number): boolean => {
    // Find all ancestors and check if any are collapsed
    let currentIndent = entry.indent;
    for (let i = index - 1; i >= 0; i--) {
      const potentialParent = entries[i];
      if (potentialParent.indent < currentIndent) {
        if (potentialParent.isCollapsed) {
          return false;
        }
        currentIndent = potentialParent.indent;
      }
    }
    return true;
  }, [entries]);

  // Check if entry has children
  const hasChildren = useCallback((entry: Entry, index: number): boolean => {
    if (index === entries.length - 1) return false;
    return entries[index + 1]?.indent > entry.indent;
  }, [entries]);

  // Add new entry
  const addEntry = useCallback(() => {
    if (!inputValue.trim()) return;

    const { type, content } = parseEntryInput(inputValue);

    const newEntry: Entry = {
      id: generateId(),
      content,
      timestamp: new Date(),
      indent: getInsertIndent(),
      parentId: selectedEntryId || undefined,
      type
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

  // Get filtered entries for display
  const getFilteredEntries = useCallback(() => {
    let filtered = entries;
    
    if (searchQuery) {
      filtered = filtered.filter(entry => 
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (typeFilter) {
      filtered = filtered.filter(entry => entry.type === typeFilter);
    }
    
    return filtered;
  }, [entries, searchQuery, typeFilter]);

  // Navigation utilities
  const getVisibleEntries = useCallback(() => {
    return getFilteredEntries().filter((entry, index, array) => 
      isEntryVisible(entry, entries.indexOf(entry))
    );
  }, [getFilteredEntries, isEntryVisible, entries]);

  const navigateToEntry = useCallback((direction: 'up' | 'down' | 'first' | 'last' | 'parent' | 'child') => {
    const visibleEntries = getVisibleEntries();
    if (visibleEntries.length === 0) return;

    const currentIndex = selectedEntryId 
      ? visibleEntries.findIndex(e => e.id === selectedEntryId)
      : -1;

    let newIndex = currentIndex;

    switch (direction) {
      case 'up':
        newIndex = currentIndex <= 0 ? visibleEntries.length - 1 : currentIndex - 1;
        break;
      case 'down':
        newIndex = currentIndex >= visibleEntries.length - 1 ? 0 : currentIndex + 1;
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = visibleEntries.length - 1;
        break;
      case 'parent':
        if (selectedEntryId) {
          const selectedEntry = entries.find(e => e.id === selectedEntryId);
          if (selectedEntry && selectedEntry.indent > 0) {
            const entryIndex = entries.indexOf(selectedEntry);
            for (let i = entryIndex - 1; i >= 0; i--) {
              if (entries[i].indent < selectedEntry.indent) {
                setSelectedEntryId(entries[i].id);
                return;
              }
            }
          }
        }
        return;
      case 'child':
        if (selectedEntryId) {
          const selectedEntry = entries.find(e => e.id === selectedEntryId);
          if (selectedEntry) {
            const entryIndex = entries.indexOf(selectedEntry);
            if (entryIndex < entries.length - 1 && entries[entryIndex + 1].indent > selectedEntry.indent) {
              setSelectedEntryId(entries[entryIndex + 1].id);
              return;
            }
          }
        }
        return;
    }

    if (newIndex >= 0 && newIndex < visibleEntries.length) {
      setSelectedEntryId(visibleEntries[newIndex].id);
    }
  }, [selectedEntryId, getVisibleEntries, entries]);

  // Entry operations
  const deleteSelectedEntry = useCallback(() => {
    if (!selectedEntryId) return;
    setEntries(prev => prev.filter(e => e.id !== selectedEntryId));
    setSelectedEntryId(null);
  }, [selectedEntryId]);

  const duplicateSelectedEntry = useCallback(() => {
    if (!selectedEntryId) return;
    const selectedEntry = entries.find(e => e.id === selectedEntryId);
    if (!selectedEntry) return;

    const newEntry: Entry = {
      ...selectedEntry,
      id: generateId(),
      timestamp: new Date(),
      content: selectedEntry.content + ' (copy)'
    };

    const selectedIndex = entries.findIndex(e => e.id === selectedEntryId);
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries.splice(selectedIndex + 1, 0, newEntry);
      return newEntries;
    });
    setSelectedEntryId(newEntry.id);
  }, [selectedEntryId, entries]);

  const copySelectedEntryContent = useCallback(() => {
    if (!selectedEntryId) return;
    const selectedEntry = entries.find(e => e.id === selectedEntryId);
    if (selectedEntry) {
      navigator.clipboard.writeText(selectedEntry.content);
    }
  }, [selectedEntryId, entries]);

  const moveSelectedEntry = useCallback((direction: 'up' | 'down') => {
    if (!selectedEntryId) return;
    const selectedIndex = entries.findIndex(e => e.id === selectedEntryId);
    if (selectedIndex === -1) return;

    const newIndex = direction === 'up' ? selectedIndex - 1 : selectedIndex + 1;
    if (newIndex < 0 || newIndex >= entries.length) return;

    setEntries(prev => {
      const newEntries = [...prev];
      [newEntries[selectedIndex], newEntries[newIndex]] = [newEntries[newIndex], newEntries[selectedIndex]];
      return newEntries;
    });
  }, [selectedEntryId, entries]);

  // Tree operations
  const expandCollapseAll = useCallback((expand: boolean) => {
    setEntries(prev => prev.map(entry => ({ ...entry, isCollapsed: !expand })));
  }, []);

  const expandCollapseSelected = useCallback(() => {
    if (!selectedEntryId) return;
    toggleCollapse(selectedEntryId);
  }, [selectedEntryId, toggleCollapse]);

  // Export functionality
  const exportEntries = useCallback(() => {
    const exportData = JSON.stringify(entries, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hybrid-notes-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  // Handle global keyboard shortcuts
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't interfere with input if user is typing (except for global shortcuts)
    const activeElement = document.activeElement;
    const isTyping = activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT';
    
    // Global shortcuts that work everywhere
    if (e.key === '?') {
      e.preventDefault();
      setShowKeyboardHelp(!showKeyboardHelp);
      return;
    }

    // Mode switching
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      setMode(prev => prev === 'chat' ? 'edit' : 'chat');
      return;
    }

    // Load demo content
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      loadDemoContent();
      return;
    }

    // Search functionality
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      setSearchMode(!searchMode);
      return;
    }

    // Clear filters
    if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      setTypeFilter(null);
      setSearchQuery('');
      return;
    }

    // Type filters (Ctrl + 1-9)
    if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const typeFilters = ['synthesis', 'resistance', 'heresy', 'debug', 'ritual', 'bridge', 'meta', 'log', 'ctx'];
      const filterIndex = parseInt(e.key) - 1;
      if (filterIndex < typeFilters.length) {
        setTypeFilter(typeFilter === typeFilters[filterIndex] ? null : typeFilters[filterIndex]);
      }
      return;
    }

    // Export functionality
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      exportEntries();
      return;
    }

    // Expand/collapse all
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      expandCollapseAll(true);
      return;
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      expandCollapseAll(false);
      return;
    }

    // Don't handle navigation shortcuts if actively typing
    if (isTyping && activeElement !== inputRef.current) return;

    // Focus input
    if (e.key === 'i' && !e.ctrlKey && !e.altKey && mode === 'chat') {
      e.preventDefault();
      inputRef.current?.focus();
      return;
    }

    // Toggle details
    if (e.key === 'd' && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      setShowDetails(!showDetails);
      return;
    }

    // Navigation shortcuts (work when not typing)
    if (entries.length > 0 && !isTyping) {
      // Arrow navigation
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        navigateToEntry(e.key === 'ArrowUp' ? 'up' : 'down');
        return;
      }

      // Ctrl + Arrow for parent/child navigation
      if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        navigateToEntry(e.key === 'ArrowUp' ? 'parent' : 'child');
        return;
      }

      // Home/End navigation
      if (e.key === 'Home') {
        e.preventDefault();
        navigateToEntry('first');
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        navigateToEntry('last');
        return;
      }

      // Space/Enter for expand/collapse
      if ((e.key === ' ' || e.key === 'Enter') && selectedEntryId) {
        e.preventDefault();
        expandCollapseSelected();
        return;
      }

      // Edit selected entry
      if (e.key === 'e' && !e.ctrlKey && !e.altKey && selectedEntryId) {
        e.preventDefault();
        setEditingEntryId(selectedEntryId);
        return;
      }

      // Delete selected entry
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEntryId && !isTyping) {
        e.preventDefault();
        deleteSelectedEntry();
        return;
      }

      // Duplicate selected entry
      if (e.ctrlKey && e.key === 'd' && selectedEntryId) {
        e.preventDefault();
        duplicateSelectedEntry();
        return;
      }

      // Copy selected entry content
      if (e.ctrlKey && e.key === 'c' && selectedEntryId) {
        e.preventDefault();
        copySelectedEntryContent();
        return;
      }

      // Move selected entry
      if (e.ctrlKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        moveSelectedEntry(e.key === 'ArrowUp' ? 'up' : 'down');
        return;
      }
    }
  }, [
    showKeyboardHelp, setShowKeyboardHelp, setMode, loadDemoContent, searchMode, setSearchMode,
    setTypeFilter, setSearchQuery, typeFilter, exportEntries, expandCollapseAll, inputRef,
    mode, setShowDetails, showDetails, entries.length, navigateToEntry, selectedEntryId,
    expandCollapseSelected, deleteSelectedEntry, duplicateSelectedEntry, copySelectedEntryContent,
    moveSelectedEntry, setEditingEntryId
  ]);

  // Set up global keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Handle input-specific key events
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Allow normal input behavior unless it's a specific shortcut
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addEntry();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedEntryId(null);
      inputRef.current?.blur();
      return;
    }
    // Arrow keys for navigation (when input is empty)
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && inputValue === '') {
      e.preventDefault();
      navigateToEntry(e.key === 'ArrowUp' ? 'up' : 'down');
      return;
    }
  }, [addEntry, setSelectedEntryId, inputRef, inputValue, navigateToEntry]);

  // Format entry content for display
  const formatEntryContent = (entry: Entry) => {
    const displayContent = showDetails && entry.type !== 'log' 
      ? `${entry.type}:: ${entry.content}`
      : entry.content;
      
    const lines = displayContent.split('\n');
    if (lines.length === 1) return displayContent;
    
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
    
    const indent = selectedEntry.indent;
    const indentStr = "  ".repeat(indent);
    return `${indentStr}├─ Same level as selected entry`;
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
            <Button
              variant={showDetails ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs"
            >
              Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDemoContent}
              className="text-xs"
            >
              <Database className="w-4 h-4 mr-1" />
              Demo
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
                 <div className="space-y-1">
                   {getFilteredEntries().map((entry, index) => {
                     const originalIndex = entries.indexOf(entry);
                     if (!isEntryVisible(entry, originalIndex)) return null;
                    
                     const typeColors = getTypeColor(entry.type);
                     const entryHasChildren = hasChildren(entry, originalIndex);
                    
                    return (
                      <div
                        key={entry.id}
                        className={`cursor-pointer transition-colors rounded p-2 ${
                          selectedEntryId === entry.id
                            ? 'bg-terminal-selection/20 border-l-2 border-terminal-selection'
                            : `hover:bg-terminal-gray/10 border-l-2 ${typeColors.split(' ')[1]}`
                        }`}
                        style={{ marginLeft: `${entry.indent * 20}px` }}
                        onClick={() => setSelectedEntryId(entry.id)}
                      >
                        <div className="flex items-start gap-2">
                          {/* Collapse/Expand button */}
                          {entryHasChildren ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCollapse(entry.id);
                              }}
                              className="text-terminal-gray hover:text-terminal-fg mt-1 transition-colors"
                            >
                              {entry.isCollapsed ? (
                                <ChevronRight className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            <span className="w-3 h-3 mt-1"></span>
                          )}
                          
                          <span className={`text-xs mt-1 ${typeColors.split(' ')[0]}`}>➤</span>
                          <div className="flex-1">
                            <div className={`${typeColors.split(' ')[0]}`}>
                              {formatEntryContent(entry)}
                            </div>
                            <div className="flex items-center gap-2 text-terminal-gray text-xs mt-1">
                              <span>{entry.timestamp.toLocaleTimeString()}</span>
                              {entry.type !== 'log' && !showDetails && (
                                <span className={`px-1.5 py-0.5 rounded text-xs border ${
                                  typeColors.includes('terminal-green') ? 'bg-terminal-green/20 border-terminal-green/30' :
                                  typeColors.includes('red-400') ? 'bg-red-400/20 border-red-400/30' :
                                  typeColors.includes('yellow-400') ? 'bg-yellow-400/20 border-yellow-400/30' :
                                  typeColors.includes('purple-400') ? 'bg-purple-400/20 border-purple-400/30' :
                                  typeColors.includes('blue-400') ? 'bg-blue-400/20 border-blue-400/30' :
                                  typeColors.includes('cyan-400') ? 'bg-cyan-400/20 border-cyan-400/30' :
                                  typeColors.includes('orange-400') ? 'bg-orange-400/20 border-orange-400/30' :
                                  'bg-terminal-gray/20 border-terminal-gray/30'
                                }`}>
                                  {entry.type}
                                </span>
                              )}
                              {entry.updatedAt && (
                                <span className="text-yellow-400">
                                  ↻ {entry.updatedAt.toLocaleTimeString()}
                                </span>
                              )}
                              {entryHasChildren && (
                                <span className="text-terminal-gray text-xs">
                                  [{entry.isCollapsed ? 'collapsed' : 'expanded'}]
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Bar */}
            {searchMode && (
              <div className="border-t border-terminal-gray/20 p-4 bg-terminal-bg/50">
                <div className="flex items-center gap-2">
                  <span className="text-terminal-blue text-sm">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search entries... (Escape to close)"
                    className="flex-1 bg-transparent border border-terminal-gray/30 rounded px-2 py-1 text-terminal-fg placeholder-terminal-gray text-sm"
                    autoFocus
                  />
                  {typeFilter && (
                    <span className="px-2 py-1 rounded text-xs border border-terminal-blue/30 bg-terminal-blue/20 text-terminal-blue">
                      {typeFilter}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-terminal-gray/20 p-4">
              <div className="text-terminal-gray text-xs mb-2">
                {getInsertionIndicator()} • ↑/↓ navigate • ? for help • type:: content for custom types
              </div>
              
              <div className="flex items-end gap-2">
                <span className="text-terminal-green">➤</span>
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="log:: What's on your mind? or ctx:: some context"
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
                    {entries.map((entry, index) => {
                      if (!isEntryVisible(entry, index)) return null;
                      
                      const typeColors = getTypeColor(entry.type);
                      const entryHasChildren = hasChildren(entry, index);
                      
                      return (
                        <div
                          key={entry.id}
                          className="flex items-start gap-4"
                          style={{ marginLeft: `${entry.indent * 20}px` }}
                        >
                          {/* Collapse/Expand button */}
                          {entryHasChildren ? (
                            <button
                              onClick={() => toggleCollapse(entry.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {entry.isCollapsed ? (
                                <ChevronRight className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            <span className="w-3 h-3"></span>
                          )}
                          
                          <div className="flex items-center gap-2 text-muted-foreground text-xs whitespace-nowrap">
                            <span>{entry.timestamp.toLocaleTimeString()}</span>
                            {entry.type !== 'log' && (
                              <span className={`px-1.5 py-0.5 rounded text-xs border ${
                                typeColors.includes('terminal-green') ? 'bg-primary/20 border-primary/30' :
                                typeColors.includes('red-400') ? 'bg-red-500/20 border-red-500/30' :
                                typeColors.includes('yellow-400') ? 'bg-yellow-500/20 border-yellow-500/30' :
                                typeColors.includes('purple-400') ? 'bg-purple-500/20 border-purple-500/30' :
                                typeColors.includes('blue-400') ? 'bg-blue-500/20 border-blue-500/30' :
                                typeColors.includes('cyan-400') ? 'bg-cyan-500/20 border-cyan-500/30' :
                                typeColors.includes('orange-400') ? 'bg-orange-500/20 border-orange-500/30' :
                                'bg-muted border-muted'
                              }`}>
                                {entry.type}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-foreground whitespace-pre-wrap">
                              {showDetails && entry.type !== 'log' ? `${entry.type}:: ${entry.content}` : entry.content}
                            </div>
                            {entry.updatedAt && (
                              <div className="text-yellow-600 text-xs mt-1">
                                Updated: {entry.updatedAt.toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Keyboard Help Overlay */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-terminal-bg border border-terminal-gray rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-terminal-green">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-terminal-gray hover:text-terminal-fg"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-mono">
              <div>
                <h4 className="text-terminal-blue font-bold mb-2">Navigation</h4>
                <div className="space-y-1 text-terminal-gray">
                  <div><kbd className="text-terminal-green">↑/↓</kbd> Navigate entries</div>
                  <div><kbd className="text-terminal-green">Home/End</kbd> First/Last entry</div>
                  <div><kbd className="text-terminal-green">PgUp/PgDn</kbd> Page up/down</div>
                  <div><kbd className="text-terminal-green">Ctrl+↑/↓</kbd> Parent/Child</div>
                </div>
              </div>

              <div>
                <h4 className="text-terminal-blue font-bold mb-2">Entry Operations</h4>
                <div className="space-y-1 text-terminal-gray">
                  <div><kbd className="text-terminal-green">Space/Enter</kbd> Expand/Collapse</div>
                  <div><kbd className="text-terminal-green">e</kbd> Edit entry</div>
                  <div><kbd className="text-terminal-green">Del/Backspace</kbd> Delete</div>
                  <div><kbd className="text-terminal-green">Ctrl+D</kbd> Duplicate</div>
                  <div><kbd className="text-terminal-green">Ctrl+C</kbd> Copy content</div>
                </div>
              </div>

              <div>
                <h4 className="text-terminal-blue font-bold mb-2">Tree Operations</h4>
                <div className="space-y-1 text-terminal-gray">
                  <div><kbd className="text-terminal-green">Tab/Shift+Tab</kbd> Indent/Outdent</div>
                  <div><kbd className="text-terminal-green">Ctrl+Shift+E</kbd> Expand all</div>
                  <div><kbd className="text-terminal-green">Ctrl+Shift+C</kbd> Collapse all</div>
                  <div><kbd className="text-terminal-green">Ctrl+Shift+↑/↓</kbd> Move entry</div>
                </div>
              </div>

              <div>
                <h4 className="text-terminal-blue font-bold mb-2">Search & Filter</h4>
                <div className="space-y-1 text-terminal-gray">
                  <div><kbd className="text-terminal-green">Ctrl+F</kbd> Search</div>
                  <div><kbd className="text-terminal-green">Ctrl+1-9</kbd> Filter by type</div>
                  <div><kbd className="text-terminal-green">Ctrl+0</kbd> Clear filters</div>
                  <div><kbd className="text-terminal-green">Escape</kbd> Clear selection</div>
                </div>
              </div>

              <div>
                <h4 className="text-terminal-blue font-bold mb-2">Global Actions</h4>
                <div className="space-y-1 text-terminal-gray">
                  <div><kbd className="text-terminal-green">Ctrl+E</kbd> Toggle mode</div>
                  <div><kbd className="text-terminal-green">i</kbd> Focus input</div>
                  <div><kbd className="text-terminal-green">d</kbd> Toggle details</div>
                  <div><kbd className="text-terminal-green">Ctrl+S</kbd> Export data</div>
                </div>
              </div>

              <div>
                <h4 className="text-terminal-blue font-bold mb-2">Special</h4>
                <div className="space-y-1 text-terminal-gray">
                  <div><kbd className="text-terminal-green">Ctrl+Shift+D</kbd> Load demo</div>
                  <div><kbd className="text-terminal-green">?</kbd> Show/hide help</div>
                  <div><kbd className="text-terminal-green">Enter</kbd> Add entry</div>
                  <div><kbd className="text-terminal-green">f</kbd> Focus mode (TODO)</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-terminal-gray/10 rounded border border-terminal-gray/20">
              <p className="text-xs text-terminal-gray">
                <span className="text-terminal-green">Tip:</span> Use <kbd className="text-terminal-green">type::</kbd> prefix to categorize entries 
                (e.g., "synthesis:: key insight" or "debug:: found issue")
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
