// components/admin/products/tabs/InventoryTab.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FiPackage, 
  FiAlertCircle, 
  FiClock, 
  FiTrendingUp, 
  FiTrendingDown,
  FiInfo,
  FiPlus,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiMapPin,
  FiHome,
  FiBell,
  FiMail,
  FiSettings,
  FiCheckCircle,
  FiXCircle,
  FiArchive,
  FiCalendar,
  FiPercent,
  FiBarChart2,
  FiLayers,
  FiRefreshCw,
  FiSave,
  FiEdit3,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

const InventoryTab = ({ formData, onInputChange, errors }) => {
  const [showAdvancedInventory, setShowAdvancedInventory] = useState(false);
  const [showWarehouseManagement, setShowWarehouseManagement] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  // Initialize default values if not present
  useEffect(() => {
    if (formData.quantity === undefined) {
      onInputChange('quantity', 0);
    }
    if (formData.lowStockThreshold === undefined) {
      onInputChange('lowStockThreshold', 5);
    }
    if (formData.trackQuantity === undefined) {
      onInputChange('trackQuantity', true);
    }
    if (formData.allowBackorder === undefined) {
      onInputChange('allowBackorder', false);
    }
    if (formData.backorderLimit === undefined) {
      onInputChange('backorderLimit', 0);
    }
    if (formData.inventoryTrackingMethod === undefined) {
      onInputChange('inventoryTrackingMethod', 'continuous');
    }
    if (formData.safetyStock === undefined) {
      onInputChange('safetyStock', 0);
    }
    if (formData.warehouses === undefined) {
      onInputChange('warehouses', []);
    }
    if (formData.stockStatusDisplay === undefined) {
      onInputChange('stockStatusDisplay', 'in_stock');
    }
    if (formData.inventoryAlerts === undefined) {
      onInputChange('inventoryAlerts', {
        enabled: false,
        thresholds: [5, 10],
        emailNotifications: true
      });
    }
  }, []);

  // Mock warehouses data since endpoint doesn't exist
  useEffect(() => {
    // Simulate loading
    setLoadingWarehouses(true);
    setTimeout(() => {
      // Mock warehouse data
      setWarehouses([
        { _id: 'wh1', name: 'Main Warehouse', location: 'Nairobi', isDefault: true },
        { _id: 'wh2', name: 'Secondary Warehouse', location: 'Mombasa', isDefault: false },
        { _id: 'wh3', name: 'Regional Warehouse', location: 'Kisumu', isDefault: false }
      ]);
      setLoadingWarehouses(false);
    }, 500);
  }, []);

  const loadInventoryHistory = () => {
    try {
      const saved = localStorage.getItem('inventoryHistory');
      if (saved) {
        setInventoryHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading inventory history:', error);
    }
  };

  useEffect(() => {
    loadInventoryHistory();
  }, []);

  const trackInventoryChange = (field, newValue, oldValue = null) => {
    const change = {
      id: Date.now(),
      field,
      oldValue: oldValue !== null ? oldValue : formData[field],
      newValue,
      timestamp: new Date().toISOString(),
      type: 'manual'
    };
    
    const updatedHistory = [change, ...inventoryHistory].slice(0, 50);
    setInventoryHistory(updatedHistory);
    localStorage.setItem('inventoryHistory', JSON.stringify(updatedHistory));
  };

  // Calculate total quantity from warehouses
  const calculateTotalQuantity = useCallback(() => {
    return (formData.warehouses || []).reduce((sum, w) => sum + (Number(w.quantity) || 0), 0);
  }, [formData.warehouses]);

  const totalQuantity = calculateTotalQuantity();
  
  // Use either manual quantity or warehouse total
  const effectiveQuantity = formData.warehouses?.length > 0 ? totalQuantity : (formData.quantity || 0);

  // Check if reorder is needed
  const needsReorder = useMemo(() => {
    if (!formData.reorderPoint) return false;
    return effectiveQuantity <= formData.reorderPoint;
  }, [effectiveQuantity, formData.reorderPoint]);

  // Calculate days until out of stock (mock calculation)
  const daysUntilOutOfStock = useMemo(() => {
    const averageDailySales = 5; // This would come from analytics in real app
    if (averageDailySales <= 0 || effectiveQuantity <= 0) return null;
    return Math.floor(effectiveQuantity / averageDailySales);
  }, [effectiveQuantity]);

  // Get stock status
  const getStockStatus = useCallback(() => {
    if (effectiveQuantity <= 0) {
      return { 
        text: 'Out of Stock', 
        color: 'red', 
        icon: FiXCircle,
        description: 'Product is currently unavailable',
        action: 'Restock immediately'
      };
    }
    if (effectiveQuantity <= (formData.lowStockThreshold || 5)) {
      return { 
        text: 'Critical Low Stock', 
        color: 'orange', 
        icon: FiAlertCircle,
        description: `Only ${effectiveQuantity} units left`,
        action: 'Reorder now'
      };
    }
    if (effectiveQuantity <= (formData.lowStockThreshold || 5) * 2) {
      return { 
        text: 'Low Stock', 
        color: 'yellow', 
        icon: FiAlertCircle,
        description: `${effectiveQuantity} units remaining`,
        action: 'Consider reordering soon'
      };
    }
    return { 
      text: 'In Stock', 
      color: 'green', 
      icon: FiCheckCircle,
      description: `${effectiveQuantity} units available`,
      action: 'Stock is healthy'
    };
  }, [effectiveQuantity, formData.lowStockThreshold]);

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  const addWarehouse = () => {
    const newWarehouses = [
      ...(formData.warehouses || []),
      {
        id: Date.now(),
        warehouse: '',
        quantity: 0,
        location: { aisle: '', shelf: '', bin: '', zone: '' },
        isDefault: formData.warehouses?.length === 0,
        lastUpdated: new Date().toISOString()
      }
    ];
    onInputChange('warehouses', newWarehouses);
    
    // If this is the first warehouse, update main quantity to match
    if (formData.warehouses?.length === 0) {
      onInputChange('quantity', 0);
    }
  };

  const updateWarehouse = (index, field, value) => {
    const newWarehouses = [...(formData.warehouses || [])];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newWarehouses[index][parent] = {
        ...newWarehouses[index][parent],
        [child]: value
      };
    } else {
      newWarehouses[index][field] = value;
    }
    newWarehouses[index].lastUpdated = new Date().toISOString();
    onInputChange('warehouses', newWarehouses);
  };

  const removeWarehouse = (index) => {
    const newWarehouses = formData.warehouses.filter((_, i) => i !== index);
    
    if (formData.warehouses[index].isDefault && newWarehouses.length > 0) {
      newWarehouses[0].isDefault = true;
      onInputChange('defaultWarehouse', newWarehouses[0].warehouse);
    }
    
    onInputChange('warehouses', newWarehouses);
    trackInventoryChange('warehouse_removed', newWarehouses.length, formData.warehouses.length);
  };

  const setDefaultWarehouse = (index) => {
    const newWarehouses = formData.warehouses.map((w, i) => ({
      ...w,
      isDefault: i === index
    }));
    onInputChange('warehouses', newWarehouses);
    onInputChange('defaultWarehouse', formData.warehouses[index].warehouse);
  };

  const adjustStock = (amount, reason = 'manual_adjustment') => {
    const newQuantity = Math.max(0, effectiveQuantity + amount);
    
    if (formData.warehouses?.length === 0) {
      // No warehouses - update main quantity
      onInputChange('quantity', newQuantity);
    } else if (formData.warehouses?.length === 1) {
      // Single warehouse - update its quantity
      const newWarehouses = [...formData.warehouses];
      newWarehouses[0].quantity = Math.max(0, (newWarehouses[0].quantity || 0) + amount);
      onInputChange('warehouses', newWarehouses);
    } else {
      // Multiple warehouses - show distribution dialog
      const distribution = window.prompt(
        `Adjust stock by ${amount > 0 ? '+' : ''}${amount} units. How would you like to distribute?\n` +
        formData.warehouses.map((w, i) => {
          const warehouseName = warehouses.find(wh => wh._id === w.warehouse)?.name || `Warehouse ${i + 1}`;
          return `${i + 1}. ${warehouseName}: ${w.quantity || 0} units`;
        }).join('\n') +
        `\n\nEnter warehouse numbers and quantities (e.g., "1:5,2:3" for WH1:+5, WH2:+3)`,
        `${amount > 0 ? '+' : ''}${amount}`
      );
      
      if (distribution) {
        // Parse distribution input
        const parts = distribution.split(',').map(p => p.trim());
        const newWarehouses = [...formData.warehouses];
        let totalAdjusted = 0;
        
        parts.forEach(part => {
          const [indexStr, qtyStr] = part.split(':').map(s => s.trim());
          const idx = parseInt(indexStr) - 1;
          const qty = parseInt(qtyStr);
          
          if (idx >= 0 && idx < newWarehouses.length && !isNaN(qty)) {
            newWarehouses[idx].quantity = Math.max(0, (newWarehouses[idx].quantity || 0) + qty);
            totalAdjusted += qty;
          }
        });
        
        if (totalAdjusted !== amount) {
          alert(`Warning: Total adjusted (${totalAdjusted}) doesn't match requested amount (${amount})`);
        }
        
        onInputChange('warehouses', newWarehouses);
      }
      return;
    }
    
    const adjustment = {
      id: Date.now(),
      amount,
      reason,
      previousQuantity: effectiveQuantity,
      newQuantity: effectiveQuantity + amount,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [adjustment, ...inventoryHistory].slice(0, 50);
    setInventoryHistory(updatedHistory);
    localStorage.setItem('inventoryHistory', JSON.stringify(updatedHistory));
  };

  const syncWarehouseToMain = () => {
    if (formData.warehouses?.length > 0) {
      onInputChange('quantity', totalQuantity);
      trackInventoryChange('quantity', totalQuantity, formData.quantity);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiPackage className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Inventory Management</h3>
            <p className="text-sm text-gray-600">
              Track stock levels, manage warehouses, and configure inventory alerts to ensure you never run out of products.
            </p>
          </div>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FiPackage className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total Stock</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{effectiveQuantity}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formData.warehouses?.length > 0 ? 'From warehouses' : 'Manual entry'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiCheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Available</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{effectiveQuantity}</p>
          <p className="text-xs text-gray-500 mt-1">ready to sell</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiArchive className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Low Stock Threshold</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formData.lowStockThreshold || 5}</p>
          <p className="text-xs text-gray-500 mt-1">Alert when below</p>
        </div>

        <div className={`bg-white rounded-xl border border-${stockStatus.color}-200 p-6 hover:shadow-lg transition-all duration-200`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 bg-${stockStatus.color}-100 rounded-lg`}>
              <StockIcon className={`w-5 h-5 text-${stockStatus.color}-600`} />
            </div>
            <span className="text-xs font-medium text-gray-500">Status</span>
          </div>
          <p className={`text-xl font-bold text-${stockStatus.color}-600`}>{stockStatus.text}</p>
          <p className={`text-xs text-${stockStatus.color}-600 mt-1`}>{stockStatus.action}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Quick Adjust:</span>
            <button
              onClick={() => adjustStock(-1)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              disabled={effectiveQuantity <= 0}
            >
              -1
            </button>
            <button
              onClick={() => adjustStock(-5)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              disabled={effectiveQuantity < 5}
            >
              -5
            </button>
            <button
              onClick={() => adjustStock(1)}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              +1
            </button>
            <button
              onClick={() => adjustStock(5)}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              +5
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {formData.warehouses?.length > 0 && (
              <button
                onClick={syncWarehouseToMain}
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                title="Sync warehouse totals to main quantity"
              >
                <FiRefreshCw className="w-4 h-4 mr-1" />
                Sync to Main
              </button>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <FiClock className="w-4 h-4 mr-1" />
              {showHistory ? 'Hide History' : 'View History'}
            </button>
          </div>
        </div>

        {/* Inventory History */}
        {showHistory && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Adjustments</h5>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {inventoryHistory.slice(0, 5).map(change => (
                <div key={change.id} className="text-xs text-gray-600 flex justify-between">
                  <span>
                    {change.type === 'stock_adjustment' ? (
                      <>Adjusted by <span className={change.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {change.amount > 0 ? '+' : ''}{change.amount}
                      </span> units</>
                    ) : (
                      <>Updated {change.field} from {change.oldValue} to {change.newValue}</>
                    )}
                  </span>
                  <span className="text-gray-400">
                    {new Date(change.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {inventoryHistory.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No recent changes</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stock Health Dashboard */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FiBarChart2 className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Stock Health Dashboard</h4>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Threshold: {formData.lowStockThreshold} units
            </span>
            {needsReorder && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center">
                <FiAlertCircle className="w-3 h-3 mr-1" />
                Reorder Needed
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-sm text-gray-600 block mb-1">Stock Level</span>
            <div className="flex items-center">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    effectiveQuantity <= 0 ? 'bg-red-500' :
                    effectiveQuantity <= formData.lowStockThreshold ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min((effectiveQuantity / (formData.maximumStock || effectiveQuantity * 2)) * 100, 100)}%` 
                  }}
                />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {effectiveQuantity} / {formData.maximumStock || '∞'}
              </span>
            </div>
            {formData.reorderPoint && effectiveQuantity <= formData.reorderPoint && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <FiTrendingDown className="w-3 h-3 mr-1" />
                Below reorder point ({formData.reorderPoint})
              </p>
            )}
          </div>

          <div>
            <span className="text-sm text-gray-600 block mb-1">Stock Health</span>
            <div className="flex items-center space-x-2">
              {effectiveQuantity > formData.lowStockThreshold * 2 ? (
                <>
                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700">Healthy Stock</span>
                </>
              ) : effectiveQuantity > 0 ? (
                <>
                  <FiAlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-yellow-700">Low Stock Warning</span>
                </>
              ) : (
                <>
                  <FiXCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">Out of Stock</span>
                </>
              )}
            </div>
            {daysUntilOutOfStock && daysUntilOutOfStock > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Est. {daysUntilOutOfStock} days until out of stock
              </p>
            )}
          </div>

          <div>
            <span className="text-sm text-gray-600 block mb-1">Warehouse Distribution</span>
            <div className="flex items-center space-x-2">
              <FiHome className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-gray-700">
                {formData.warehouses?.length || 0} {formData.warehouses?.length === 1 ? 'warehouse' : 'warehouses'}
              </span>
            </div>
            {formData.warehouses?.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Total: {totalQuantity} units across all locations
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stock Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center mb-4">
          <FiPackage className="w-5 h-5 text-indigo-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Stock Information</h4>
          {formData.warehouses?.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              (Using warehouse totals: {totalQuantity} units)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quantity in Stock */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity in Stock
            </label>
            <div className="relative">
              <input
                type="number"
                id="quantity"
                min="0"
                value={formData.quantity || 0}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 0;
                  onInputChange('quantity', newValue);
                  trackInventoryChange('quantity', newValue, formData.quantity);
                }}
                className={`block w-full px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                  errors?.quantity 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="Enter stock quantity"
                disabled={formData.warehouses?.length > 0} // Disable if using warehouses
              />
              {formData.warehouses?.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Managed by warehouses
                  </span>
                </div>
              )}
            </div>
            {errors?.quantity && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.quantity}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center">
                <FiInfo className="w-3 h-3 mr-1" />
                {formData.warehouses?.length > 0 
                  ? `Warehouse total: ${totalQuantity} units (auto-calculated)` 
                  : 'Enter total stock quantity'}
              </p>
            </div>
          </div>

          {/* Low Stock Threshold */}
          <div>
            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              id="lowStockThreshold"
              min="0"
              value={formData.lowStockThreshold}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                onInputChange('lowStockThreshold', newValue);
                trackInventoryChange('lowStockThreshold', newValue, formData.lowStockThreshold);
              }}
              className="block w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
              placeholder="5"
            />
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <FiInfo className="w-3 h-3 mr-1" />
              Alert when stock falls below this number
            </p>
          </div>
        </div>
      </div>

      {/* Stock Settings */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center">
            <FiSettings className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Stock Settings</h4>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Track Quantity Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                {formData.trackQuantity ? (
                  <FiEye className="w-5 h-5 text-green-500 mr-3" />
                ) : (
                  <FiEyeOff className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <div>
                  <label htmlFor="trackQuantity" className="text-sm font-medium text-gray-700">
                    Track quantity in stock
                  </label>
                  <p className="text-xs text-gray-500">Enable to monitor inventory levels</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.trackQuantity}
                onClick={() => onInputChange('trackQuantity', !formData.trackQuantity)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  formData.trackQuantity ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.trackQuantity ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.trackQuantity && (
              <>
                {/* Backorder Settings */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <FiClock className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <label htmlFor="allowBackorder" className="text-sm font-medium text-gray-700">
                          Allow backorders
                        </label>
                        <p className="text-xs text-gray-500">Accept orders when out of stock</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.allowBackorder}
                      onClick={() => onInputChange('allowBackorder', !formData.allowBackorder)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        formData.allowBackorder ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.allowBackorder ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {formData.allowBackorder && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="backorderLimit" className="block text-xs font-medium text-gray-600 mb-1">
                          Backorder Limit
                        </label>
                        <input
                          type="number"
                          id="backorderLimit"
                          min="0"
                          value={formData.backorderLimit}
                          onChange={(e) => onInputChange('backorderLimit', parseInt(e.target.value) || 0)}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Unlimited"
                        />
                      </div>

                      <div>
                        <label htmlFor="backorderLeadTime" className="block text-xs font-medium text-gray-600 mb-1">
                          Lead Time (days)
                        </label>
                        <input
                          type="number"
                          id="backorderLeadTime"
                          min="0"
                          value={formData.backorderLeadTime || ''}
                          onChange={(e) => onInputChange('backorderLeadTime', e.target.value ? parseInt(e.target.value) : null)}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Expected delivery time"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Stock Status Display */}
            <div>
              <label htmlFor="stockStatusDisplay" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status Display
              </label>
              <select
                id="stockStatusDisplay"
                value={formData.stockStatusDisplay}
                onChange={(e) => onInputChange('stockStatusDisplay', e.target.value)}
                className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="pre_order">Pre-Order</option>
                <option value="discontinued">Discontinued</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
            </div>

            {/* Pre-order Settings */}
            {formData.stockStatusDisplay === 'pre_order' && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="preOrderDate" className="block text-xs font-medium text-gray-600 mb-1">
                      Expected Availability Date
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        id="preOrderDate"
                        value={formData.preOrderAvailability?.expectedDate || ''}
                        onChange={(e) => onInputChange('preOrderAvailability', {
                          ...formData.preOrderAvailability,
                          expectedDate: e.target.value
                        })}
                        className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="preOrderQuantity" className="block text-xs font-medium text-gray-600 mb-1">
                      Available for Pre-Order
                    </label>
                    <input
                      type="number"
                      id="preOrderQuantity"
                      min="0"
                      value={formData.preOrderAvailability?.availableQuantity || ''}
                      onChange={(e) => onInputChange('preOrderAvailability', {
                        ...formData.preOrderAvailability,
                        availableQuantity: e.target.value ? parseInt(e.target.value) : null
                      })}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Inventory */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          type="button"
          onClick={() => setShowAdvancedInventory(!showAdvancedInventory)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiTrendingUp className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Advanced Inventory</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
              Optional
            </span>
          </div>
          {showAdvancedInventory ? (
            <FiChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showAdvancedInventory && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="space-y-6 mt-4">
              {/* Tracking Method */}
              <div>
                <label htmlFor="inventoryTrackingMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Method
                </label>
                <select
                  id="inventoryTrackingMethod"
                  value={formData.inventoryTrackingMethod}
                  onChange={(e) => onInputChange('inventoryTrackingMethod', e.target.value)}
                  className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                >
                  <option value="continuous">Continuous (Real-time)</option>
                  <option value="periodic">Periodic</option>
                  <option value="just_in_time">Just in Time</option>
                </select>
              </div>

              {/* Reorder Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    id="reorderPoint"
                    min="0"
                    value={formData.reorderPoint || ''}
                    onChange={(e) => onInputChange('reorderPoint', e.target.value ? parseInt(e.target.value) : null)}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                    placeholder="When to reorder"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Current: {effectiveQuantity} / {formData.reorderPoint || 'Not set'}
                  </p>
                </div>

                <div>
                  <label htmlFor="reorderQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Quantity
                  </label>
                  <input
                    type="number"
                    id="reorderQuantity"
                    min="1"
                    value={formData.reorderQuantity || ''}
                    onChange={(e) => onInputChange('reorderQuantity', e.target.value ? parseInt(e.target.value) : null)}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                    placeholder="Quantity to reorder"
                  />
                </div>

                <div>
                  <label htmlFor="safetyStock" className="block text-sm font-medium text-gray-700 mb-1">
                    Safety Stock
                  </label>
                  <input
                    type="number"
                    id="safetyStock"
                    min="0"
                    value={formData.safetyStock}
                    onChange={(e) => onInputChange('safetyStock', parseInt(e.target.value) || 0)}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                    placeholder="Buffer stock"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Effective stock: {Math.max(0, effectiveQuantity - (formData.safetyStock || 0))}
                  </p>
                </div>

                <div>
                  <label htmlFor="maximumStock" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Stock
                  </label>
                  <input
                    type="number"
                    id="maximumStock"
                    min="0"
                    value={formData.maximumStock || ''}
                    onChange={(e) => onInputChange('maximumStock', e.target.value ? parseInt(e.target.value) : null)}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                    placeholder="Max capacity"
                  />
                </div>
              </div>

              {/* Inventory Alerts */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FiBell className="w-5 h-5 text-indigo-600 mr-2" />
                    <h5 className="text-sm font-medium text-gray-900">Inventory Alerts</h5>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.inventoryAlerts?.enabled || false}
                    onClick={() => onInputChange('inventoryAlerts', {
                      ...formData.inventoryAlerts,
                      enabled: !formData.inventoryAlerts?.enabled
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      formData.inventoryAlerts?.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.inventoryAlerts?.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {formData.inventoryAlerts?.enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alert Thresholds
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[5, 10, 20, 50].map(threshold => (
                          <label
                            key={threshold}
                            className={`flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                              formData.inventoryAlerts?.thresholds?.includes(threshold)
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.inventoryAlerts?.thresholds?.includes(threshold)}
                              onChange={(e) => {
                                const current = formData.inventoryAlerts?.thresholds || [];
                                const newThresholds = e.target.checked
                                  ? [...current, threshold]
                                  : current.filter(t => t !== threshold);
                                onInputChange('inventoryAlerts', {
                                  ...formData.inventoryAlerts,
                                  thresholds: newThresholds.sort((a, b) => a - b)
                                });
                              }}
                              className="sr-only"
                            />
                            <span className="text-sm font-medium">{threshold} units</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="emailNotifications"
                        type="checkbox"
                        checked={formData.inventoryAlerts?.emailNotifications || false}
                        onChange={(e) => onInputChange('inventoryAlerts', {
                          ...formData.inventoryAlerts,
                          emailNotifications: e.target.checked
                        })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="emailNotifications" className="ml-2 flex items-center text-sm text-gray-700">
                        <FiMail className="w-4 h-4 mr-1" />
                        Send email notifications
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warehouse Management */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          type="button"
          onClick={() => setShowWarehouseManagement(!showWarehouseManagement)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiHome className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Warehouse Management</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {formData.warehouses?.length || 0} warehouses
            </span>
          </div>
          {showWarehouseManagement ? (
            <FiChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showWarehouseManagement && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="flex justify-end my-4">
              <button
                type="button"
                onClick={addWarehouse}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Warehouse
              </button>
            </div>

            <div className="space-y-4">
              {(formData.warehouses || []).map((warehouse, index) => (
                <div key={warehouse.id || index} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <FiMapPin className="w-5 h-5 text-indigo-600 mr-2" />
                      <h5 className="text-sm font-medium text-gray-900">
                        {warehouse.warehouse ? warehouses.find(w => w._id === warehouse.warehouse)?.name || `Warehouse ${index + 1}` : `Warehouse ${index + 1}`}
                      </h5>
                      {warehouse.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!warehouse.isDefault && (
                        <>
                          <button
                            onClick={() => setEditingWarehouse(editingWarehouse === index ? null : index)}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeWarehouse(index)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove warehouse"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Warehouse
                      </label>
                      <select
                        value={warehouse.warehouse}
                        onChange={(e) => updateWarehouse(index, 'warehouse', e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={loadingWarehouses}
                      >
                        <option value="">Select warehouse</option>
                        {warehouses.map(w => (
                          <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={warehouse.quantity}
                        onChange={(e) => updateWarehouse(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Available
                      </label>
                      <input
                        type="number"
                        value={warehouse.quantity || 0}
                        disabled
                        className="block w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                      />
                    </div>

                    {editingWarehouse === index && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Zone
                          </label>
                          <input
                            type="text"
                            value={warehouse.location?.zone || ''}
                            onChange={(e) => updateWarehouse(index, 'location.zone', e.target.value)}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., A"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Aisle
                          </label>
                          <input
                            type="text"
                            value={warehouse.location?.aisle || ''}
                            onChange={(e) => updateWarehouse(index, 'location.aisle', e.target.value)}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 1"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Shelf
                          </label>
                          <input
                            type="text"
                            value={warehouse.location?.shelf || ''}
                            onChange={(e) => updateWarehouse(index, 'location.shelf', e.target.value)}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., B"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Bin
                          </label>
                          <input
                            type="text"
                            value={warehouse.location?.bin || ''}
                            onChange={(e) => updateWarehouse(index, 'location.bin', e.target.value)}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 3"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {!warehouse.isDefault && !editingWarehouse && (
                    <div className="mt-4 flex justify-between items-center">
                      <button
                        onClick={() => setDefaultWarehouse(index)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Set as default warehouse
                      </button>
                    </div>
                  )}

                  {editingWarehouse === index && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setEditingWarehouse(null)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <FiSave className="w-4 h-4 inline mr-2" />
                        Save Location
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {(formData.warehouses || []).length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <FiHome className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-2">No warehouses configured</p>
                  <p className="text-xs text-gray-400">Add warehouses to manage multi-location inventory</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inventory Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FiLayers className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Inventory Summary</span>
          </div>
          <span className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-gray-500">Total Stock</span>
            <p className="text-lg font-semibold text-gray-900">{effectiveQuantity} units</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Available</span>
            <p className="text-lg font-semibold text-green-600">{effectiveQuantity} units</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Low Stock Threshold</span>
            <p className="text-lg font-semibold text-yellow-600">{formData.lowStockThreshold} units</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Warehouses</span>
            <p className="text-lg font-semibold text-gray-900">{formData.warehouses?.length || 0}</p>
          </div>
        </div>
        
        {/* Stock Distribution */}
        {formData.warehouses?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Stock Distribution by Warehouse</p>
            <div className="space-y-2">
              {formData.warehouses.map((w, i) => {
                const percentage = totalQuantity > 0 ? ((w.quantity || 0) / totalQuantity) * 100 : 0;
                const warehouseName = warehouses.find(wh => wh._id === w.warehouse)?.name || `Warehouse ${i + 1}`;
                return (
                  <div key={i} className="flex items-center">
                    <span className="text-xs text-gray-600 w-24 truncate" title={warehouseName}>
                      {warehouseName}
                    </span>
                    <div className="flex-1 mx-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 w-16 text-right">
                      {w.quantity || 0} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTab;