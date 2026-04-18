import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatPrice, categories } from '@/data/mockData';
import {
  createAdminProduct,
  deleteAdminProduct,
  listAdminProducts,
  updateAdminProduct,
  uploadAdminProductImage
} from '@/services/adminApi';
import type { Product } from '@/types/product';

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  discount: string;
  brand: string;
  sku: string;
  stock: string;
  categorySlug: string;
  images: string;
};

const BRANDS = [
  'Apple',
  'Samsung',
  'LG',
  'Sony',
  'Daikin',
  'Panasonic',
  'Sharp',
  'Aqua',
  'Dell',
  'HP',
  'Lenovo',
  'ASUS',
  'Xiaomi',
  'OPPO',
  'vivo',
  'Toshiba',
  'Hatari',
  'Midea',
  'Sunhouse',
  'Kangaroo'
].sort();

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  price: '0',
  originalPrice: '0',
  discount: '0',
  brand: 'NovaX',
  sku: '',
  stock: '0',
  categorySlug: 'dien-thoai',
  images: ''
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await listAdminProducts());
    } catch {
      toast.error('Không tải được danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    const editingProduct = products.find((product) => product.id === editingId) || null;
    if (!editingProduct) {
      return;
    }

    setForm({
      name: editingProduct.name,
      description: editingProduct.description || '',
      price: String(editingProduct.price),
      originalPrice: String(editingProduct.originalPrice || ''),
      discount: String(editingProduct.discount || ''),
      brand: editingProduct.brand,
      sku: '',
      stock: editingProduct.inStock ? '10' : '0',
      categorySlug: editingProduct.category,
      images: editingProduct.images?.join('\n') || ''
    });
  }, [editingId, products]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitForm = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        discount: form.discount ? Number(form.discount) : undefined,
        brand: form.brand,
        sku: form.sku || undefined,
        stock: Number(form.stock),
        categorySlug: form.categorySlug,
        images: form.images
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      };

      if (editingId) {
        await updateAdminProduct(editingId, payload);
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await createAdminProduct(payload);
        toast.success('Đã tạo sản phẩm mới');
      }

      await loadProducts();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ẩn sản phẩm này khỏi cửa hàng?')) return;
    try {
      await deleteAdminProduct(id);
      toast.success('Đã ẩn sản phẩm');
      await loadProducts();
    } catch {
      toast.error('Không thể xóa sản phẩm');
    }
  };

  const updateField = (key: keyof ProductFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-2xl font-black">Quản lý sản phẩm</h2>
        <p className="mt-2 text-sm text-muted-foreground">Thêm, sửa, ẩn sản phẩm ngay trên admin.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Danh sách sản phẩm</h3>
            <button onClick={() => void loadProducts()} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary">
              Làm mới
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Đang tải...</p>
          ) : (
            <div className="mt-4 space-y-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand} · {product.category}</p>
                      <p className="mt-1 text-sm font-bold text-primary">{formatPrice(product.price)}</p>
                      <p className="text-xs text-muted-foreground">Tồn kho: {product.inStock ? 'Còn hàng' : 'Hết hàng'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(product.id)} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary">
                        Sửa
                      </button>
                      <button onClick={() => void handleDelete(product.id)} className="rounded-lg border border-sale/40 px-3 py-1.5 text-sm text-sale hover:bg-sale/10">
                        Ẩn
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{editingId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
            {editingId && (
              <button onClick={resetForm} className="text-sm text-primary hover:underline">
                Hủy sửa
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Tên sản phẩm</span>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Thương hiệu</span>
              <select
                value={form.brand}
                onChange={(e) => updateField('brand', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                {BRANDS.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
                <option value="Khác">Khác</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Danh mục</span>
              <select
                value={form.categorySlug}
                onChange={(e) => updateField('categorySlug', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">SKU</span>
              <input
                value={form.sku}
                onChange={(e) => updateField('sku', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Giá bán</span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Giá gốc</span>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => updateField('originalPrice', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Giảm giá %</span>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => updateField('discount', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Tồn kho</span>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Mô tả</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Ảnh sản phẩm</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={saving}
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  try {
                    setSaving(true);
                    let urlList = form.images ? form.images + '\n' : '';
                    for (let i = 0; i < files.length; i++) {
                      const res = await uploadAdminProductImage(files[i], form.categorySlug);
                      urlList += res.url + '\n';
                    }
                    setForm((prev) => ({ ...prev, images: urlList }));
                    toast.success('Đã tải ảnh lên Server thành công');
                  } catch (error) {
                    toast.error('Lỗi upload ảnh');
                  } finally {
                    setSaving(false);
                    // Reset input
                    e.target.value = '';
                  }
                }}
                className="w-full mb-2"
              />
              <span className="mb-1 block text-xs text-muted-foreground">List URL sau khi upload (bạn có thể chỉnh sửa thủ công)</span>
              <textarea
                value={form.images}
                onChange={(e) => setForm((prev) => ({ ...prev, images: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <button
              onClick={() => void submitForm()}
              disabled={saving}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : editingId ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
