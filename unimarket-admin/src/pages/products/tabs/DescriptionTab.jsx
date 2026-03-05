// components/admin/products/tabs/DescriptionTab.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { createEditor, Transforms, Editor, Range } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  FiBold, 
  FiItalic, 
  FiUnderline, 
  FiMinus, 
  FiType, 
  FiList, 
  FiGrid,
  FiLink,
  FiImage,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiChevronDown,
  FiPlus,
  FiTrash2,
  FiInfo,
  FiFileText,
  FiCheck,
  FiLayers,
  FiBookmark,
  FiEdit3
} from 'react-icons/fi';

const DescriptionTab = ({ formData, onInputChange, errors }) => {
  // Initialize Slate editor
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  
  // Convert HTML to plain text for Slate (schema stores plain text in description)
  const initialValue = useMemo(() => {
    // Strip HTML tags from description if it contains HTML
    const plainText = formData.description ? formData.description.replace(/<[^>]*>/g, '') : '';
    
    if (plainText) {
      return [
        {
          type: 'paragraph',
          children: [{ text: plainText }],
        },
      ];
    }
    return [
      {
        type: 'paragraph',
        children: [{ text: '' }],
      },
    ];
  }, []);

  const [editorValue, setEditorValue] = useState(initialValue);
  const [showSpecGroups, setShowSpecGroups] = useState(false);
  const [activeSpecGroup, setActiveSpecGroup] = useState('all');

  const handleEditorChange = (value) => {
    setEditorValue(value);
    // Extract plain text from Slate value (schema expects plain text, not HTML)
    const plainText = value.map(node => 
      node.children.map(child => child.text).join('')
    ).join('\n\n');
    
    onInputChange('description', plainText);
  };

  const handleHighlightChange = (index, value) => {
    const newHighlights = [...(formData.highlights || [])];
    newHighlights[index] = value;
    // Filter out empty highlights
    onInputChange('highlights', newHighlights.filter(h => h.trim() !== ''));
  };

  const addHighlight = () => {
    const newHighlights = [...(formData.highlights || []), ''];
    onInputChange('highlights', newHighlights);
  };

  const removeHighlight = (index) => {
    const newHighlights = (formData.highlights || []).filter((_, i) => i !== index);
    onInputChange('highlights', newHighlights);
  };

  const addSpecification = () => {
    onInputChange('specifications', [
      ...(formData.specifications || []),
      { 
        name: '', 
        value: '', 
        unit: '', 
        group: 'General', 
        isHighlighted: false, 
        sortOrder: (formData.specifications || []).length 
      }
    ]);
  };

  const updateSpecification = (index, field, value) => {
    const newSpecs = [...(formData.specifications || [])];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    onInputChange('specifications', newSpecs);
  };

  const removeSpecification = (index) => {
    const newSpecs = (formData.specifications || []).filter((_, i) => i !== index);
    onInputChange('specifications', newSpecs);
  };

  // Get unique spec groups
  const specGroups = useMemo(() => {
    const specs = formData.specifications || [];
    const groups = specs
      .map(spec => spec.group || 'General')
      .filter((value, index, self) => self.indexOf(value) === index);
    return ['all', ...groups];
  }, [formData.specifications]);

  // Filter specifications by group
  const filteredSpecs = useMemo(() => {
    const specs = formData.specifications || [];
    if (activeSpecGroup === 'all') {
      return specs;
    }
    return specs.filter(spec => (spec.group || 'General') === activeSpecGroup);
  }, [formData.specifications, activeSpecGroup]);

  // Slate toolbar button component
  const ToolbarButton = ({ format, icon, children, title }) => {
    const isMark = ['bold', 'italic', 'underline', 'strike'].includes(format);
    
    const isActive = () => {
      if (isMark) {
        const marks = Editor.marks(editor);
        return marks ? marks[format] === true : false;
      } else {
        const [match] = Editor.nodes(editor, {
          match: n => n.type === format,
        });
        return !!match;
      }
    };

    const toggleFormat = (event) => {
      event.preventDefault();
      
      if (isMark) {
        // Text marks
        const isActive = Editor.marks(editor)?.[format] === true;
        if (isActive) {
          Editor.removeMark(editor, format);
        } else {
          Editor.addMark(editor, format, true);
        }
      } else {
        // Block elements
        const [match] = Editor.nodes(editor, {
          match: n => n.type === format,
        });
        
        const isActive = !!match;
        
        Transforms.setNodes(
          editor,
          { type: isActive ? 'paragraph' : format },
          { match: n => Editor.isBlock(editor, n) }
        );
      }
    };

    return (
      <button
        type="button"
        onMouseDown={toggleFormat}
        className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
          isActive() ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:text-gray-900'
        }`}
        title={title || format}
      >
        {icon || children || format}
      </button>
    );
  };

  // Render element based on type
  const renderElement = useCallback((props) => {
    switch (props.element.type) {
      case 'heading-one':
        return <h1 {...props.attributes} className="text-3xl font-bold mb-4">{props.children}</h1>;
      case 'heading-two':
        return <h2 {...props.attributes} className="text-2xl font-bold mb-3">{props.children}</h2>;
      case 'heading-three':
        return <h3 {...props.attributes} className="text-xl font-bold mb-2">{props.children}</h3>;
      case 'bulleted-list':
        return <ul {...props.attributes} className="list-disc list-inside mb-4 space-y-1">{props.children}</ul>;
      case 'numbered-list':
        return <ol {...props.attributes} className="list-decimal list-inside mb-4 space-y-1">{props.children}</ol>;
      case 'list-item':
        return <li {...props.attributes} className="text-gray-700">{props.children}</li>;
      default:
        return <p {...props.attributes} className="mb-2 text-gray-700">{props.children}</p>;
    }
  }, []);

  // Render leaf (text with marks)
  const renderLeaf = useCallback((props) => {
    let { children, leaf, attributes } = props;
    
    if (leaf.bold) {
      children = <strong className="font-bold">{children}</strong>;
    }
    if (leaf.italic) {
      children = <em className="italic">{children}</em>;
    }
    if (leaf.underline) {
      children = <u className="underline">{children}</u>;
    }
    if (leaf.strike) {
      children = <del className="line-through">{children}</del>;
    }
    
    return <span {...attributes}>{children}</span>;
  }, []);

  // Add link
  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      const { selection } = editor;
      const isCollapsed = selection && Range.isCollapsed(selection);
      
      if (isCollapsed) {
        // Insert link text
        const text = window.prompt('Enter link text:') || url;
        // Note: Links won't be preserved in plain text output
        Transforms.insertText(editor, text);
      } else {
        // Just keep the selection as text (links not preserved)
      }
    }
  };

  // Set text alignment
  const setAlignment = (alignment) => {
    const [match] = Editor.nodes(editor, {
      match: n => n.align === alignment,
    });
    
    const isActive = !!match;
    
    Transforms.setNodes(
      editor,
      { align: isActive ? undefined : alignment },
      { match: n => Editor.isBlock(editor, n) }
    );
  };

  // Check if alignment is active
  const isAlignActive = (alignment) => {
    const [match] = Editor.nodes(editor, {
      match: n => n.align === alignment,
    });
    return !!match;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiFileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Description & Content</h3>
            <p className="text-sm text-gray-600">
              Create compelling product descriptions and add technical specifications to help customers make informed decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Full Description with Slate */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiEdit3 className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Full Description</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                Required
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {(formData.description || '').length}/5000 chars
            </span>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
          <div className="flex items-center space-x-1 px-2 border-r border-gray-200">
            <ToolbarButton format="bold" icon={<FiBold className="w-4 h-4" />} title="Bold" />
            <ToolbarButton format="italic" icon={<FiItalic className="w-4 h-4" />} title="Italic" />
            <ToolbarButton format="underline" icon={<FiUnderline className="w-4 h-4" />} title="Underline" />
            <ToolbarButton format="strike" icon={<FiMinus className="w-4 h-4" />} title="Strikethrough" />
          </div>
          
          <div className="flex items-center space-x-1 px-2 border-r border-gray-200">
            <ToolbarButton format="heading-one" icon={<span className="font-bold text-sm">H1</span>} title="Heading 1" />
            <ToolbarButton format="heading-two" icon={<span className="font-bold text-sm">H2</span>} title="Heading 2" />
            <ToolbarButton format="heading-three" icon={<span className="font-bold text-sm">H3</span>} title="Heading 3" />
          </div>
          
          <div className="flex items-center space-x-1 px-2 border-r border-gray-200">
            <ToolbarButton format="bulleted-list" icon={<FiList className="w-4 h-4" />} title="Bullet List" />
            <ToolbarButton format="numbered-list" icon={<FiGrid className="w-4 h-4" />} title="Numbered List" />
          </div>
          
          <div className="flex items-center space-x-1 px-2 border-r border-gray-200">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setAlignment('left');
              }}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
                isAlignActive('left') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
              }`}
              title="Align Left"
            >
              <FiAlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setAlignment('center');
              }}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
                isAlignActive('center') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
              }`}
              title="Align Center"
            >
              <FiAlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setAlignment('right');
              }}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
                isAlignActive('right') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
              }`}
              title="Align Right"
            >
              <FiAlignRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setAlignment('justify');
              }}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
                isAlignActive('justify') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
              }`}
              title="Justify"
            >
              <FiAlignJustify className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-1 px-2">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addLink();
              }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              title="Add Link"
            >
              <FiLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="p-6 min-h-[300px] prose max-w-none bg-white">
          <Slate
            editor={editor}
            initialValue={editorValue}
            onChange={handleEditorChange}
          >
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder="Enter detailed product description..."
              className="outline-none min-h-[250px] text-gray-700"
            />
          </Slate>
        </div>

        {errors?.description && (
          <div className="px-6 pb-4">
            <p className="text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-lg">
              <FiInfo className="w-4 h-4 mr-2" />
              {errors.description}
            </p>
          </div>
        )}
      </div>

      {/* Short Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center mb-4">
          <FiType className="w-5 h-5 text-indigo-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Short Description</h4>
        </div>
        
        <div>
          <textarea
            id="shortDescription"
            rows={3}
            value={formData.shortDescription || ''}
            onChange={(e) => onInputChange('shortDescription', e.target.value)}
            className={`block w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 ${
              errors?.shortDescription ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Brief summary of the product that appears in search results and listings..."
            maxLength={500}
          />
          <div className="mt-2 flex justify-between items-center">
            <p className="text-xs text-gray-500 flex items-center">
              <FiInfo className="w-3 h-3 mr-1" />
              Appears in search results and product cards
            </p>
            <span className="text-xs font-medium text-gray-600">
              {(formData.shortDescription || '').length}/500
            </span>
          </div>
          {errors?.shortDescription && (
            <p className="mt-1 text-xs text-red-600">{errors.shortDescription}</p>
          )}
        </div>
      </div>

      {/* Highlights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FiBookmark className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Product Highlights</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
              Optional
            </span>
          </div>
          <button
            type="button"
            onClick={addHighlight}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-1" />
            Add Highlight
          </button>
        </div>

        <div className="space-y-3">
          {(formData.highlights || []).map((highlight, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => handleHighlightChange(index, e.target.value)}
                  className="block w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  placeholder="e.g., 100% Organic Cotton"
                  maxLength={200}
                />
              </div>
              {(formData.highlights || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHighlight(index)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove highlight"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {(!formData.highlights || formData.highlights.length === 0) && (
          <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            Click "Add Highlight" to add key selling points
          </p>
        )}
      </div>

      {/* Specifications */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiLayers className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Technical Specifications</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                Optional
              </span>
            </div>
            <button
              type="button"
              onClick={addSpecification}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-1" />
              Add Specification
            </button>
          </div>
        </div>

        {/* Group Filter */}
        {(formData.specifications || []).length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {specGroups.map(group => (
                <button
                  key={group}
                  onClick={() => setActiveSpecGroup(group)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeSpecGroup === group
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {group === 'all' ? 'All Groups' : group}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="space-y-4">
            {filteredSpecs.map((spec, index) => {
              const originalIndex = (formData.specifications || []).findIndex(s => s === spec);
              return (
                <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={spec.name || ''}
                        onChange={(e) => updateSpecification(originalIndex, 'name', e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Material"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Value <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={spec.value || ''}
                        onChange={(e) => updateSpecification(originalIndex, 'value', e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Cotton"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={spec.unit || ''}
                        onChange={(e) => updateSpecification(originalIndex, 'unit', e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., cm, kg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Group
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={spec.group || ''}
                          onChange={(e) => updateSpecification(originalIndex, 'group', e.target.value)}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., Dimensions"
                        />
                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={spec.isHighlighted || false}
                        onChange={(e) => updateSpecification(originalIndex, 'isHighlighted', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        spec.isHighlighted 
                          ? 'bg-indigo-600 border-indigo-600' 
                          : 'border-gray-300 group-hover:border-indigo-400'
                      }`}>
                        {spec.isHighlighted && <FiCheck className="w-4 h-4 text-white" />}
                      </div>
                      <span className="ml-2 text-sm text-gray-700">Highlight this specification</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => removeSpecification(originalIndex)}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {(!formData.specifications || formData.specifications.length === 0) && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FiLayers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No specifications added yet</p>
              <p className="text-xs text-gray-400">Click the button above to add technical details about your product</p>
            </div>
          )}
        </div>
      </div>

      {/* Character Count Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiInfo className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm text-gray-700">Content summary</span>
          </div>
          <span className="text-sm font-medium text-indigo-700">
            {(formData.description || '').length + (formData.shortDescription || '').length} total characters
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Description</span>
              <span>{(formData.description || '').length}/5000</span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${Math.min(((formData.description || '').length) / 5000 * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Short desc</span>
              <span>{(formData.shortDescription || '').length}/500</span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${Math.min(((formData.shortDescription || '').length) / 500 * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DescriptionTab;