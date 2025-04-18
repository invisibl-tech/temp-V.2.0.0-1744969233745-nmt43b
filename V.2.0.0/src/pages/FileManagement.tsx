import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Trash2, AlertCircle, Check, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../App';
import * as XLSX from 'xlsx';

interface ProductCost {
  id: string;
  item_id: string;
  name: string;
  size: string;
  color: string;
  cost: number;
  product_type: string;
  created_at: string;
}

interface ProductUpload {
  item_id: string;
  name: string;
  size: string | null;
  color: string | null;
  cost: number;
  product_type: string;
  isDuplicate?: boolean;
  existingData?: ProductCost;
  action?: 'skip' | 'update';
}

function FileManagement() {
  const [products, setProducts] = useState<ProductCost[]>([]);
  const [uploadData, setUploadData] = useState<ProductUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [defaultDuplicateAction, setDefaultDuplicateAction] = useState<'skip' | 'update'>('skip');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_costs')
        .select('*')
        .order('item_id', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Item ID': 'SKU123',
        'Product Name': 'Example Product',
        'Product Type': 'Dresses',
        'Size': 'M',
        'Color': 'Blue',
        'Cost': 100
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'product_costs_template.xlsx');
  };

  const validateAndPreviewFile = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet) as Array<{
            'Item ID': string;
            'Product Name': string;
            'Product Type': string;
            'Size': string;
            'Color': string;
            'Cost': number;
          }>;

          const invalidRows = rows.filter(
            row => !row['Item ID'] || !row['Product Name'] || !row['Product Type'] || !row['Cost'] || isNaN(row['Cost'])
          );

          if (invalidRows.length > 0) {
            throw new Error('Invalid data format. Please use the template and ensure all required fields are filled.');
          }

          const formattedData: ProductUpload[] = rows.map(row => ({
            item_id: row['Item ID'],
            name: row['Product Name'],
            product_type: row['Product Type'],
            size: row['Size'] || null,
            color: row['Color'] || null,
            cost: Number(row['Cost']),
          }));

          formattedData.sort((a, b) => a.item_id.localeCompare(b.item_id));

          const updatedData = formattedData.map(item => {
            const existing = products.find(p => p.item_id === item.item_id);
            if (existing) {
              return {
                ...item,
                isDuplicate: true,
                existingData: existing,
                action: defaultDuplicateAction,
              };
            }
            return item;
          });

          setUploadData(updatedData);
          setShowPreview(true);
        } catch (error: any) {
          console.error('Error processing file:', error);
          setError(error.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error('Error validating file:', error);
      setError(error.message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const file = event.target.files?.[0];
      if (!file) return;

      await validateAndPreviewFile(file);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmUpload = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const productsToUpload = uploadData
        .filter(item => !item.isDuplicate || item.action === 'update')
        .map(({ item_id, name, size, color, cost, product_type }) => ({
          item_id,
          name,
          size,
          color,
          cost,
          product_type,
          user_id: user.id,
        }));

      if (productsToUpload.length === 0) {
        setSuccess('No new products to upload');
        setShowPreview(false);
        return;
      }

      const { error } = await supabase
        .from('product_costs')
        .upsert(productsToUpload, {
          onConflict: 'item_id,user_id',
          ignoreDuplicates: false,
        });

      if (error) throw error;

      setSuccess('Products uploaded successfully');
      setShowPreview(false);
      loadProducts();
    } catch (error: any) {
      console.error('Error confirming upload:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('product_costs')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      setSuccess('Product deleted successfully');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product');
    }
  };

  const handleItemActionChange = (index: number, action: 'skip' | 'update') => {
    setUploadData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], action };
      return newData;
    });
  };

  const applyActionToAll = (action: 'skip' | 'update') => {
    setDefaultDuplicateAction(action);
    setUploadData(prev => 
      prev.map(item => ({
        ...item,
        action: item.isDuplicate ? action : undefined
      }))
    );
  };

  const cancelUpload = () => {
    setShowPreview(false);
    setUploadData([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Cost Management</h1>
          <p className="text-gray-600 mb-4">
            Upload your product costs data to optimize pricing strategies. Download the template to ensure correct formatting.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={downloadTemplate}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Template
            </button>

            <label className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 cursor-pointer">
              <Upload className="h-5 w-5 mr-2" />
              Upload File
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {showPreview && (
          <div className="mb-8 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upload Preview</h2>
              <p className="text-sm text-gray-600 mt-1">
                Review the data before confirming the upload.
                {uploadData.some(item => item.isDuplicate) && (
                  <span className="text-amber-600 ml-1">
                    Some items already exist in your product list.
                  </span>
                )}
              </p>

              {uploadData.some(item => item.isDuplicate) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default action for duplicates:
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => applyActionToAll('skip')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        defaultDuplicateAction === 'skip'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Skip All
                    </button>
                    <button
                      onClick={() => applyActionToAll('update')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        defaultDuplicateAction === 'update'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Update All
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex space-x-4">
                <button
                  onClick={handleConfirmUpload}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {loading ? 'Uploading...' : 'Confirm Upload'}
                </button>
                <button
                  onClick={cancelUpload}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploadData.map((item, index) => (
                    <tr key={index} className={item.isDuplicate ? 'bg-amber-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.isDuplicate ? (
                          <span className="text-amber-600">Duplicate</span>
                        ) : (
                          <span className="text-green-600">New item</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.item_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.size || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.color || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ฿{item.cost.toLocaleString()}
                        {item.isDuplicate && item.existingData && item.cost !== item.existingData.cost && (
                          <span className="text-amber-600 ml-2">
                            (Current: ฿{item.existingData.cost.toLocaleString()})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.isDuplicate && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleItemActionChange(index, 'skip')}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                item.action === 'skip'
                                  ? 'bg-gray-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => handleItemActionChange(index, 'update')}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                item.action === 'update'
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Update
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.item_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.product_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.size || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.color || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{product.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                      No products found. Upload your first product cost data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default FileManagement;