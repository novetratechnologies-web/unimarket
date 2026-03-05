// admin/src/pages/categories/components/CategoryContent.jsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  FiEdit2, 
  FiCode, 
  FiEye, 
  FiType,
  FiImage,
  FiLink,
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiList,
  FiHash,
  FiHelpCircle,
  FiCopy,
  FiCheck,
  FiAlertCircle,
  FiMaximize2,
  FiMinimize2,
  FiDownload,
  FiTrash2,
  FiFileText,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryContent = ({ formData, onNestedInputChange, errors, showToast }) => {
  const [activeEditor, setActiveEditor] = useState('header');
  const [previewMode, setPreviewMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [wordCount, setWordCount] = useState({ header: 0, footer: 0 });
  const [editorTheme, setEditorTheme] = useState('light');
  
  // FIXED: Use separate refs for each textarea to prevent cursor loss
  const headerTextareaRef = useRef(null);
  const footerTextareaRef = useRef(null);
  const cssTextareaRef = useRef(null);
  const jsTextareaRef = useRef(null);

  // Memoized editors list
  const editors = useMemo(() => [
    { id: 'header', name: 'Header Content', icon: FiEdit2, description: 'Appears at the top of category page' },
    { id: 'footer', name: 'Footer Content', icon: FiEdit2, description: 'Appears at the bottom of category page' },
    { id: 'banner', name: 'Banner Text', icon: FiType, description: 'Overlay text for category banner' },
    { id: 'custom', name: 'Custom CSS/JS', icon: FiCode, description: 'Advanced styling and functionality' }
  ], []);

  // Update word count
  useEffect(() => {
    setWordCount({
      header: formData.content?.header?.split(/\s+/).filter(Boolean).length || 0,
      footer: formData.content?.footer?.split(/\s+/).filter(Boolean).length || 0
    });
  }, [formData.content?.header, formData.content?.footer]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            showToast?.('Content saved', { type: 'success' });
            break;
          case 'p':
            e.preventDefault();
            setPreviewMode(prev => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  // FIXED: Markdown to HTML conversion with proper error handling
  const renderMarkdown = useCallback((text) => {
    if (!text) return '<p class="text-gray-400 italic">No content to preview</p>';
    
    try {
      let html = text
        // Headers
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
        
        // Bold and Italic
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 underline transition-colors">$1</a>')
        
        // Lists
        .replace(/^\s*-\s+(.*)/gm, '<li class="ml-4">$1</li>')
        .replace(/(<li.*<\/li>)\s*(?!<li)/g, '<ul class="list-disc mb-4">$1</ul>')
        .replace(/^\s*\d+\.\s+(.*)/gm, '<li class="ml-4">$1</li>')
        .replace(/(<li.*<\/li>)\s*(?!<li)/g, '<ol class="list-decimal mb-4">$1</ol>')
        
        // Blockquotes
        .replace(/^\s*>\s+(.*)/gm, '<blockquote class="border-l-4 border-indigo-300 pl-4 py-2 my-4 bg-indigo-50 italic">$1</blockquote>')
        
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm my-4"><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-indigo-800 px-1 py-0.5 rounded font-mono text-sm">$1</code>')
        
        // Horizontal rule
        .replace(/^\s*---\s*$/gm, '<hr class="my-6 border-t-2 border-gray-200" />')
        
        // Paragraphs (must be last)
        .replace(/^(?!<[a-z]|\s*$)(.*$)/gm, '<p class="mb-3">$1</p>');

      // Clean up empty paragraphs
      html = html.replace(/<p>\s*<\/p>/g, '');
      
      return html;
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return '<p class="text-red-500">Error rendering content</p>';
    }
  }, []);

  // FIXED: Insert formatting with proper cursor handling
  const insertFormat = useCallback((format, textareaRef) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const currentValue = textarea.value;
    
    let formattedText = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        newCursorPos = selectedText ? end + 4 : start + 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        newCursorPos = selectedText ? end + 2 : start + 1;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        newCursorPos = selectedText ? end + 7 : start + 3;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        newCursorPos = selectedText ? end + 2 : start + 2;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        newCursorPos = selectedText ? end + 3 : start + 3;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        newCursorPos = selectedText ? end + 4 : start + 4;
        break;
      case 'link': {
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          formattedText = `[${selectedText || 'link text'}](${url})`;
          newCursorPos = start + formattedText.length;
        } else {
          return;
        }
        break;
      }
      case 'image': {
        const url = prompt('Enter image URL:', 'https://');
        const alt = prompt('Enter alt text:', 'image description');
        if (url && alt) {
          formattedText = `![${alt}](${url})`;
          newCursorPos = start + formattedText.length;
        } else {
          return;
        }
        break;
      }
      case 'list':
        formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        newCursorPos = start + formattedText.length;
        break;
      case 'numbered-list':
        formattedText = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
        newCursorPos = start + formattedText.length;
        break;
      case 'code':
        if (selectedText.includes('\n')) {
          formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
          newCursorPos = start + formattedText.length;
        } else {
          formattedText = `\`${selectedText}\``;
          newCursorPos = selectedText ? end + 2 : start + 1;
        }
        break;
      case 'quote':
        formattedText = selectedText.split('\n').map(line => `> ${line}`).join('\n');
        newCursorPos = start + formattedText.length;
        break;
      default:
        return;
    }

    const newValue = currentValue.substring(0, start) + formattedText + currentValue.substring(end);
    
    // Update the content based on active editor
    if (activeEditor === 'header') {
      onNestedInputChange('content', 'header', newValue);
      // FIXED: Restore cursor after React updates
      setTimeout(() => {
        if (headerTextareaRef.current) {
          headerTextareaRef.current.focus();
          headerTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else if (activeEditor === 'footer') {
      onNestedInputChange('content', 'footer', newValue);
      setTimeout(() => {
        if (footerTextareaRef.current) {
          footerTextareaRef.current.focus();
          footerTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  }, [activeEditor, onNestedInputChange, headerTextareaRef, footerTextareaRef]);

  // Copy content to clipboard
  const copyToClipboard = useCallback(() => {
    let content = '';
    if (activeEditor === 'header') content = formData.content?.header || '';
    else if (activeEditor === 'footer') content = formData.content?.footer || '';
    else if (activeEditor === 'custom') {
      content = `/* CSS */\n${formData.content?.customCss || ''}\n\n// JavaScript\n${formData.content?.customJs || ''}`;
    }

    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      showToast?.('Content copied to clipboard', { type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast?.('Failed to copy content', { type: 'error' });
    });
  }, [activeEditor, formData.content, showToast]);

  // Clear content with confirmation
  const clearContent = useCallback(() => {
    if (window.confirm(`Are you sure you want to clear the ${activeEditor} content?`)) {
      if (activeEditor === 'header') {
        onNestedInputChange('content', 'header', '');
        showToast?.('Header content cleared', { type: 'info' });
      } else if (activeEditor === 'footer') {
        onNestedInputChange('content', 'footer', '');
        showToast?.('Footer content cleared', { type: 'info' });
      } else if (activeEditor === 'custom') {
        onNestedInputChange('content', 'customCss', '');
        onNestedInputChange('content', 'customJs', '');
        showToast?.('Custom code cleared', { type: 'info' });
      }
    }
  }, [activeEditor, onNestedInputChange, showToast]);

  // Export content
  const exportContent = useCallback(() => {
    let content = '';
    let filename = '';
    let type = 'text/plain';
    
    if (activeEditor === 'header') {
      content = formData.content?.header || '';
      filename = 'header-content.md';
    } else if (activeEditor === 'footer') {
      content = formData.content?.footer || '';
      filename = 'footer-content.md';
    } else if (activeEditor === 'custom') {
      content = `/* Custom CSS */\n${formData.content?.customCss || ''}\n\n// Custom JavaScript\n${formData.content?.customJs || ''}`;
      filename = 'custom-code.txt';
    }

    try {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast?.('Content exported successfully', { type: 'success' });
    } catch (error) {
      showToast?.('Failed to export content', { type: 'error' });
    }
  }, [activeEditor, formData.content, showToast]);

  // FIXED: RichTextEditor with stable refs
  const RichTextEditor = ({ value, onChange, placeholder, textareaRef, language }) => {
    // FIXED: Local state to prevent cursor loss
    const [localValue, setLocalValue] = useState(value || '');

    // Sync with parent when value changes externally
    useEffect(() => {
      setLocalValue(value || '');
    }, [value]);

    // FIXED: Handle change without losing cursor
    const handleChange = (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      onChange(newValue);
    };

    return (
      <div className={`border border-gray-300 rounded-lg overflow-hidden transition-all ${
        fullscreen ? 'fixed inset-4 z-50 bg-white shadow-2xl' : ''
      }`}>
        {/* Toolbar */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-2 flex flex-wrap gap-1 sticky top-0 z-10">
          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => insertFormat('bold', textareaRef)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Bold (Ctrl+B)"
            >
              <FiBold className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormat('italic', textareaRef)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Italic (Ctrl+I)"
            >
              <FiItalic className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormat('underline', textareaRef)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Underline"
            >
              <FiUnderline className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => insertFormat('h1', textareaRef)}
              className="px-2 py-1 hover:bg-gray-200 rounded transition-colors text-sm font-bold"
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => insertFormat('h2', textareaRef)}
              className="px-2 py-1 hover:bg-gray-200 rounded transition-colors text-sm font-bold"
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => insertFormat('h3', textareaRef)}
              className="px-2 py-1 hover:bg-gray-200 rounded transition-colors text-sm font-bold"
              title="Heading 3"
            >
              H3
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => insertFormat('list', textareaRef)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Bullet List"
            >
              <FiList className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormat('numbered-list', textareaRef)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Numbered List"
            >
              <FiHash className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => insertFormat('link', textareaRef)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Insert Link"
            >
              <FiLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormat('image', textareaRef)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Insert Image"
            >
              <FiImage className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => insertFormat('code', textareaRef)}
              className="p-2 hover:bg-gray-200 rounded transition-colors font-mono"
              title="Code Block"
            >
              <FiCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormat('quote', textareaRef)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Quote"
            >
              <FiAlignLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setEditorTheme(editorTheme === 'light' ? 'dark' : 'light')}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Toggle theme"
            >
              {editorTheme === 'light' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
            </button>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-200 rounded transition-colors relative"
              title="Copy to clipboard"
            >
              {copied ? <FiCheck className="w-4 h-4 text-green-600" /> : <FiCopy className="w-4 h-4" />}
            </button>
            <button
              onClick={clearContent}
              className="p-2 hover:bg-gray-200 rounded transition-colors text-red-600"
              title="Clear content"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
            <button
              onClick={exportContent}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Export content"
            >
              <FiDownload className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        {language === 'code' ? (
          <div className="grid grid-cols-2 gap-4 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CSS</label>
              <textarea
                ref={cssTextareaRef}
                value={localValue?.css || ''}
                onChange={(e) => {
                  const newCss = e.target.value;
                  setLocalValue(prev => ({ ...prev, css: newCss }));
                  onNestedInputChange('content', 'customCss', newCss);
                }}
                rows={12}
                className={`w-full px-4 py-3 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  editorTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                }`}
                placeholder="/* Custom CSS */"
                spellCheck="false"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">JavaScript</label>
              <textarea
                ref={jsTextareaRef}
                value={localValue?.js || ''}
                onChange={(e) => {
                  const newJs = e.target.value;
                  setLocalValue(prev => ({ ...prev, js: newJs }));
                  onNestedInputChange('content', 'customJs', newJs);
                }}
                rows={12}
                className={`w-full px-4 py-3 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  editorTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                }`}
                placeholder="// Custom JavaScript"
                spellCheck="false"
              />
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={handleChange}
            rows={fullscreen ? 20 : 10}
            className={`w-full px-4 py-3 focus:outline-none font-mono text-sm transition-colors ${
              fullscreen ? 'h-[calc(100vh-200px)]' : ''
            } ${
              editorTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
            }`}
            placeholder={placeholder}
          />
        )}
      </div>
    );
  };

  const PreviewPanel = ({ content, type }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`border rounded-lg p-6 min-h-[300px] overflow-auto ${
          editorTheme === 'dark' ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-200'
        }`}
      >
        {type === 'code' ? (
          <div className="space-y-4">
            {content?.css && (
              <div>
                <h4 className="text-sm font-medium mb-2">CSS:</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{content.css}</code>
                </pre>
              </div>
            )}
            {content?.js && (
              <div>
                <h4 className="text-sm font-medium mb-2">JavaScript:</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{content.js}</code>
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Help */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900">Content Management</h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
            title="Show help"
          >
            <FiHelpCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500">
            {previewMode ? 'Preview Mode' : 'Edit Mode'}
          </span>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              previewMode ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                previewMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="font-medium text-indigo-900 mb-2 flex items-center">
                <FiHelpCircle className="w-4 h-4 mr-2" />
                Markdown Formatting Guide
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-mono text-indigo-800"># Heading 1</p>
                  <p className="text-indigo-600 text-xs">Main heading</p>
                </div>
                <div>
                  <p className="font-mono text-indigo-800">## Heading 2</p>
                  <p className="text-indigo-600 text-xs">Subheading</p>
                </div>
                <div>
                  <p className="font-mono text-indigo-800">**bold**</p>
                  <p className="text-indigo-600 text-xs">Bold text</p>
                </div>
                <div>
                  <p className="font-mono text-indigo-800">*italic*</p>
                  <p className="text-indigo-600 text-xs">Italic text</p>
                </div>
                <div>
                  <p className="font-mono text-indigo-800">[link](url)</p>
                  <p className="text-indigo-600 text-xs">Hyperlink</p>
                </div>
                <div>
                  <p className="font-mono text-indigo-800">![alt](url)</p>
                  <p className="text-indigo-600 text-xs">Image</p>
                </div>
                <div>
                  <p className="font-mono text-indigo-800">- item</p>
                  <p className="text-indigo-600 text-xs">Bullet list</p>
                </div>
                <div>
                  <p className="font-mono text-indigo-800">1. item</p>
                  <p className="text-indigo-600 text-xs">Numbered list</p>
                </div>
              </div>
              <p className="text-xs text-indigo-700 mt-3">
                <strong>Pro tip:</strong> Use Ctrl/Cmd + B for bold, Ctrl/Cmd + I for italic, and Ctrl/Cmd + P to toggle preview.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-6" aria-label="Content Sections">
          {editors.map(editor => {
            const Icon = editor.icon;
            const isActive = activeEditor === editor.id;
            return (
              <button
                key={editor.id}
                onClick={() => setActiveEditor(editor.id)}
                className={`
                  py-3 border-b-2 font-medium text-sm flex items-center space-x-2
                  transition-all relative group
                  ${isActive 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{editor.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEditor + previewMode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {activeEditor === 'header' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Header Content</h3>
                <span className="text-xs text-gray-500">
                  {wordCount.header} words • {formData.content?.header?.length || 0} characters
                </span>
              </div>
              {previewMode ? (
                <PreviewPanel content={formData.content?.header} type="markdown" />
              ) : (
                <RichTextEditor
                  value={formData.content?.header}
                  onChange={(val) => onNestedInputChange('content', 'header', val)}
                  placeholder="Enter header content using markdown..."
                  textareaRef={headerTextareaRef}
                />
              )}
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                <FiAlertCircle className="w-3 h-3 mr-1" />
                This content will appear at the top of the category page
              </p>
            </div>
          )}

          {activeEditor === 'footer' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Footer Content</h3>
                <span className="text-xs text-gray-500">
                  {wordCount.footer} words • {formData.content?.footer?.length || 0} characters
                </span>
              </div>
              {previewMode ? (
                <PreviewPanel content={formData.content?.footer} type="markdown" />
              ) : (
                <RichTextEditor
                  value={formData.content?.footer}
                  onChange={(val) => onNestedInputChange('content', 'footer', val)}
                  placeholder="Enter footer content using markdown..."
                  textareaRef={footerTextareaRef}
                />
              )}
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                <FiAlertCircle className="w-3 h-3 mr-1" />
                This content will appear at the bottom of the category page
              </p>
            </div>
          )}

          {activeEditor === 'banner' && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Banner Content</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Text
                  </label>
                  <input
                    type="text"
                    value={formData.content?.bannerText || ''}
                    onChange={(e) => onNestedInputChange('content', 'bannerText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Special offer: 20% off!"
                    maxLength="100"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {formData.content?.bannerText?.length || 0}/100 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Link
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2 text-sm">/</span>
                    <input
                      type="text"
                      value={formData.content?.bannerLink || ''}
                      onChange={(e) => onNestedInputChange('content', 'bannerLink', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="sale/electronics"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeEditor === 'custom' && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Custom CSS/JS</h3>
              {previewMode ? (
                <PreviewPanel 
                  content={{ 
                    css: formData.content?.customCss, 
                    js: formData.content?.customJs 
                  }} 
                  type="code" 
                />
              ) : (
                <RichTextEditor
                  value={{
                    css: formData.content?.customCss,
                    js: formData.content?.customJs
                  }}
                  language="code"
                />
              )}
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                <FiAlertCircle className="w-3 h-3 mr-1 text-yellow-500" />
                Add custom CSS or JavaScript for this category only. Use with caution.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Content Statistics */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FiFileText className="w-4 h-4 mr-2 text-indigo-600" />
          Content Statistics
        </h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <p className="text-2xl font-semibold text-indigo-600">
              {wordCount.header + wordCount.footer}
            </p>
            <p className="text-xs text-gray-500">Total Words</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <p className="text-2xl font-semibold text-indigo-600">
              {(formData.content?.header?.length || 0) + (formData.content?.footer?.length || 0)}
            </p>
            <p className="text-xs text-gray-500">Characters</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <p className="text-2xl font-semibold text-indigo-600">
              {formData.content?.customCss?.split('\n').length || 0}
            </p>
            <p className="text-xs text-gray-500">CSS Lines</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <p className="text-2xl font-semibold text-indigo-600">
              {formData.content?.customJs?.split('\n').length || 0}
            </p>
            <p className="text-xs text-gray-500">JS Lines</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryContent;