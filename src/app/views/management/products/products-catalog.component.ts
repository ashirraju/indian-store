import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StoreStateService } from '../../../services/store-state.service';
import { ApiService } from '../../../services/api.service';
import { Product, ProductsSummary } from '../../../models/product.model';
import { Category, SubCategory } from '../../../models/category.model';

export interface ProductFormRow {
  id?: string;
  sku: string;
  name: string;
  category: string;
  subCategory: string;
  price: number;
  originalPrice: number;
  weight: string;
  stock: number;
  lowStockThreshold: number;
  originRegion: string;
  imageUrl: string;
  description: string;
  isOrganic: boolean;
  isBestseller: boolean;
  tagsString: string;
}

@Component({
  selector: 'app-products-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products-catalog.component.html',
  styleUrl: './products-catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsCatalogComponent implements OnInit {
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly categoriesList = signal<Category[]>([]);

  // PRODUCTS STATE
  // ==========================================
  readonly productsList = signal<Product[]>([]);
  readonly productsSummary = signal<ProductsSummary | null>(null);
  readonly isProductsLoading = signal<boolean>(false);
  readonly totalProductCount = signal<number>(0);

  // Filter & Search State
  productSearch = '';
  selectedCategoryFilter = '';
  selectedSubCategoryFilter = '';
  selectedStockStatusFilter: 'in_stock' | 'low_stock' | 'out_of_stock' | '' = '';
  selectedDiscountFilter: 'true' | 'false' | '' = '';
  selectedOrganicFilter: 'true' | 'false' | '' = '';
  selectedBestsellerFilter: 'true' | 'false' | '' = '';
  selectedSortOption: 'newest' | 'price-low' | 'price-high' | 'stock-low' | 'stock-high' | 'rating' | 'name-asc' | 'name-desc' | '' = 'newest';

  // Multi-select for Bulk Actions
  readonly selectedProductIds = signal<Set<string>>(new Set());

  // Product Create/Edit Modal (Multi-Row Support)
  readonly isProductModalOpen = signal<boolean>(false);
  editingProductId: string | null = null;
  readonly productFormRows = signal<ProductFormRow[]>([]);
  isSavingProducts = signal<boolean>(false);

  // Quick Stock Adjustment Modal
  readonly isStockModalOpen = signal<boolean>(false);
  stockTargetProduct: Product | null = null;
  stockAdjustQty = 10;
  stockAdjustReason = 'RESTOCK_SHIPMENT';

  // Quick Discount Modal
  readonly isDiscountModalOpen = signal<boolean>(false);
  discountTargetProduct: Product | null = null;
  discountType: 'PERCENTAGE' | 'FLAT' = 'PERCENTAGE';
  discountValue = 15;
  discountOriginalPrice = 599;

  // Bulk Import Modal
  readonly isImportModalOpen = signal<boolean>(false);
  importMode: 'csv' | 'json' = 'csv';
  importDataText = '';
  importResult: { success: boolean; message: string; summary?: any } | null = null;
  isImporting = signal<boolean>(false);

  // Single Product Delete Confirmation Modal
  readonly isDeleteProductModalOpen = signal<boolean>(false);
  deletingProduct: Product | null = null;
  isDeletingProduct = signal<boolean>(false);

  // Multiple / Bulk Product Delete Confirmation Modal
  readonly isBulkDeleteModalOpen = signal<boolean>(false);
  isDeletingBulk = signal<boolean>(false);


  ngOnInit() {
    this.loadCategories();
    this.loadProductsSummary();
    this.loadProducts();
  }

  async loadCategories() {
    try {
      const res = await this.api.getCategories();
      if (res?.data) {
        this.categoriesList.set(res.data);
      }
    } catch {
      // Fallback
    }
  }

  // ==========================================

  async loadProductsSummary() {
    try {
      const res = await this.api.getProductsSummary();
      if (res.success) {
        this.productsSummary.set(res.data);
      }
    } catch (err) {
      console.error('Error fetching products summary:', err);
    }
  }

  async loadProducts() {
    this.isProductsLoading.set(true);
    try {
      const params: any = {
        limit: 100
      };
      if (this.productSearch.trim()) params.search = this.productSearch.trim();
      if (this.selectedCategoryFilter) params.category = this.selectedCategoryFilter;
      if (this.selectedSubCategoryFilter) params.subCategory = this.selectedSubCategoryFilter;
      if (this.selectedStockStatusFilter) params.stockStatus = this.selectedStockStatusFilter;
      if (this.selectedDiscountFilter) params.hasDiscount = this.selectedDiscountFilter;
      if (this.selectedOrganicFilter) params.organic = this.selectedOrganicFilter;
      if (this.selectedBestsellerFilter) params.bestseller = this.selectedBestsellerFilter;
      if (this.selectedSortOption) params.sort = this.selectedSortOption;

      const res = await this.api.getProducts(params);
      if (res.success) {
        this.productsList.set(res.data || []);
        this.totalProductCount.set(res.totalCount || res.data.length);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      this.store.showToast('error', 'Products Fetch Failed', 'Could not load products.');
    } finally {
      this.isProductsLoading.set(false);
    }
  }

  onCategoryFilterChange() {
    this.selectedSubCategoryFilter = '';
    this.loadProducts();
  }

  onFilterChange() {
    this.loadProducts();
  }

  getAvailableSubCategoriesForFilter(): SubCategory[] {
    if (this.selectedCategoryFilter) {
      return this.getSubCategoriesForCategory(this.selectedCategoryFilter);
    }
    return this.categoriesList().flatMap(c => c.sub_categories || []);
  }

  resetFilters() {
    this.productSearch = '';
    this.selectedCategoryFilter = '';
    this.selectedSubCategoryFilter = '';
    this.selectedStockStatusFilter = '';
    this.selectedDiscountFilter = '';
    this.selectedOrganicFilter = '';
    this.selectedBestsellerFilter = '';
    this.selectedSortOption = 'newest';
    this.loadProducts();
  }

  // Helper to dynamically get subcategories for any given category ID or category Name
  getSubCategoriesForCategory(categoryIdOrName: string): SubCategory[] {
    if (!categoryIdOrName) return [];
    const cat = this.categoriesList().find(
      c => c.id === categoryIdOrName || c.name.toLowerCase() === categoryIdOrName.toLowerCase() || c.slug === categoryIdOrName
    );
    return cat?.sub_categories || [];
  }

  // When user changes category on a product row -> dynamically reset sub-category for that row!
  onRowCategoryChange(row: ProductFormRow) {
    row.subCategory = '';
  }

  createEmptyProductRow(): ProductFormRow {
    const defaultCat = this.categoriesList().length > 0 ? this.categoriesList()[0].id : '';
    return {
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: defaultCat,
      subCategory: '',
      price: 299,
      originalPrice: 349,
      weight: '500g Pack',
      stock: 50,
      lowStockThreshold: 10,
      originRegion: 'India',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
      description: '',
      isOrganic: false,
      isBestseller: false,
      tagsString: 'Indian, Staples'
    };
  }

  addProductRow() {
    this.productFormRows.set([...this.productFormRows(), this.createEmptyProductRow()]);
  }

  addMultipleProductRows(count: number) {
    const newRows: ProductFormRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(this.createEmptyProductRow());
    }
    this.productFormRows.set([...this.productFormRows(), ...newRows]);
  }

  duplicateProductRow(index: number) {
    const rows = [...this.productFormRows()];
    const source = rows[index];
    if (source) {
      const cloned: ProductFormRow = {
        ...JSON.parse(JSON.stringify(source)),
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: source.name ? `${source.name} (Copy)` : ''
      };
      delete cloned.id;
      rows.splice(index + 1, 0, cloned);
      this.productFormRows.set(rows);
    }
  }

  removeProductRow(index: number) {
    const rows = [...this.productFormRows()];
    rows.splice(index, 1);
    if (rows.length === 0) {
      rows.push(this.createEmptyProductRow());
    }
    this.productFormRows.set(rows);
  }

  openProductModal(product?: Product) {
    const currentUrl = this.router.url;
    const targetRoute = currentUrl.includes('/operations') ? '/operations/products/add' : '/admin/products/add';
    if (product?.id) {
      this.router.navigate([targetRoute], { queryParams: { editId: product.id } });
    } else {
      this.router.navigate([targetRoute]);
    }
  }

  async onProductsMultiSubmit(event: Event) {
    event.preventDefault();
    const rows = this.productFormRows();
    const validRows = rows.filter(r => r.name.trim().length > 0);

    if (validRows.length === 0) {
      this.store.showToast('warning', 'Missing Product Details', 'Please provide a name for at least one product row.');
      return;
    }

    this.isSavingProducts.set(true);

    try {
      // EDIT SINGLE PRODUCT MODE
      if (this.editingProductId && validRows.length === 1) {
        const row = validRows[0];
        const tags = row.tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
        const payload: any = {
          sku: row.sku.trim() || undefined,
          name: row.name.trim(),
          category: row.category || undefined,
          subCategory: row.subCategory || undefined,
          price: Number(row.price),
          originalPrice: Number(row.originalPrice) || Number(row.price),
          imageUrl: row.imageUrl.trim(),
          description: row.description.trim(),
          weight: row.weight.trim(),
          stock: Number(row.stock),
          lowStockThreshold: Number(row.lowStockThreshold) || 10,
          isOrganic: row.isOrganic,
          isBestseller: row.isBestseller,
          originRegion: row.originRegion.trim() || 'India',
          tags
        };

        const res = await this.api.updateProduct(this.editingProductId, payload);
        if (res.success) {
          this.store.showToast('success', 'Product Updated', `"${res.data.name}" updated successfully.`);
          await this.loadProducts();
          await this.loadProductsSummary();
          await this.loadCategories();
          this.isProductModalOpen.set(false);
        } else {
          this.store.showToast('error', 'Update Failed', (res as any).message || 'Error updating product');
        }
      }
      // CREATE ONE OR MULTIPLE NEW PRODUCTS
      else {
        const itemsPayload = validRows.map(row => {
          const tags = row.tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
          return {
            sku: row.sku.trim() || undefined,
            name: row.name.trim(),
            category: row.category || undefined,
            subCategory: row.subCategory || undefined,
            price: Number(row.price),
            originalPrice: Number(row.originalPrice) || Number(row.price),
            imageUrl: row.imageUrl.trim() || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
            description: row.description.trim() || 'Authentic Indian grocery product.',
            weight: row.weight.trim() || '500g',
            stock: Number(row.stock) || 50,
            lowStockThreshold: Number(row.lowStockThreshold) || 10,
            isOrganic: row.isOrganic,
            isBestseller: row.isBestseller,
            originRegion: row.originRegion.trim() || 'India',
            tags
          };
        });

        if (itemsPayload.length === 1) {
          const res = await this.api.createProduct(itemsPayload[0]);
          if (res.success) {
            this.store.showToast('success', 'Product Created', `"${res.data.name}" added to catalog.`);
            await this.loadProducts();
            await this.loadProductsSummary();
            await this.loadCategories();
            this.isProductModalOpen.set(false);
          } else {
            this.store.showToast('error', 'Creation Failed', (res as any).message || 'Error adding product');
          }
        } else {
          const res = await this.api.bulkImportProducts({ items: itemsPayload });
          if (res.success) {
            this.store.showToast(
              'success',
              'Products Created',
              `Successfully added ${res.summary?.created || itemsPayload.length} items to the catalog!`
            );
            await this.loadProducts();
            await this.loadProductsSummary();
            await this.loadCategories();
            this.isProductModalOpen.set(false);
          } else {
            this.store.showToast('error', 'Bulk Creation Failed', res.message || 'Error creating multiple products');
          }
        }
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Failed to save products.');
    } finally {
      this.isSavingProducts.set(false);
    }
  }

  deleteProduct(product: Product) {
    this.openDeleteProductModal(product);
  }

  openDeleteProductModal(product: Product) {
    this.deletingProduct = product;
    this.isDeleteProductModalOpen.set(true);
  }

  async confirmDeleteProduct() {
    if (!this.deletingProduct) return;
    this.isDeletingProduct.set(true);
    try {
      const res = await this.api.deleteProduct(this.deletingProduct.id);
      if (res.success) {
        this.store.showToast('warning', 'Product Deleted', `"${this.deletingProduct.name}" deleted.`);
        await this.loadProducts();
        await this.loadProductsSummary();
        await this.loadCategories();
        this.selectedProductIds().delete(this.deletingProduct.id);
        this.isDeleteProductModalOpen.set(false);
        this.deletingProduct = null;
      } else {
        this.store.showToast('error', 'Delete Failed', res.message || 'Could not delete product');
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Failed to delete product.');
    } finally {
      this.isDeletingProduct.set(false);
    }
  }

  async toggleFlag(product: Product, flag: 'isBestseller' | 'isOrganic') {
    const currentBestseller = product.is_bestseller ?? product.isBestseller ?? false;
    const currentOrganic = product.is_organic ?? product.isOrganic ?? false;

    const newBestseller = flag === 'isBestseller' ? !currentBestseller : currentBestseller;
    const newOrganic = flag === 'isOrganic' ? !currentOrganic : currentOrganic;

    try {
      const res = await this.api.toggleProductFlag(product.id, {
        isBestseller: newBestseller,
        isOrganic: newOrganic
      });
      if (res.success) {
        this.productsList.set(
          this.productsList().map(p => {
            if (p.id === product.id) {
              return {
                ...p,
                is_bestseller: newBestseller,
                isBestseller: newBestseller,
                is_organic: newOrganic,
                isOrganic: newOrganic
              };
            }
            return p;
          })
        );
        this.store.showToast('success', 'Flag Updated', `${flag === 'isBestseller' ? 'Bestseller' : 'Organic'} status updated.`);
        this.loadProductsSummary();
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Failed to toggle flag.');
    }
  }

  // Quick Stock Adjustment
  openStockModal(product: Product) {
    this.stockTargetProduct = product;
    this.stockAdjustQty = 25;
    this.stockAdjustReason = 'RESTOCK_SHIPMENT';
    this.isStockModalOpen.set(true);
  }

  async onStockAdjustSubmit(event: Event) {
    event.preventDefault();
    if (!this.stockTargetProduct) return;

    const currentStock = this.stockTargetProduct.stock;
    const newStock = Math.max(0, currentStock + Number(this.stockAdjustQty));

    try {
      const res = await this.api.updateProductStock(this.stockTargetProduct.id, {
        stock: newStock,
        reason: this.stockAdjustReason
      });
      if (res.success) {
        this.store.showToast('success', 'Stock Adjusted', `Stock for "${this.stockTargetProduct.name}" set to ${newStock} units.`);
        await this.loadProducts();
        await this.loadProductsSummary();
        this.isStockModalOpen.set(false);
        this.stockTargetProduct = null;
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Failed to adjust stock.');
    }
  }

  async quickAdjustDelta(product: Product, delta: number) {
    const newStock = Math.max(0, product.stock + delta);
    try {
      const res = await this.api.updateProductStock(product.id, {
        stock: newStock,
        reason: delta > 0 ? 'QUICK_RESTOCK' : 'QUICK_DEDUCT'
      });
      if (res.success) {
        this.productsList.set(
          this.productsList().map(p => (p.id === product.id ? { ...p, stock: newStock } : p))
        );
        this.loadProductsSummary();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Quick Discount Setup
  openDiscountModal(product: Product) {
    this.discountTargetProduct = product;
    this.discountType = product.discount_type || 'PERCENTAGE';
    this.discountValue = product.discount_value || 10;
    this.discountOriginalPrice = product.original_price || product.originalPrice || product.price;
    this.isDiscountModalOpen.set(true);
  }

  get calculatedDiscountedPrice(): number {
    const mrp = Number(this.discountOriginalPrice) || 0;
    const val = Number(this.discountValue) || 0;
    if (this.discountType === 'PERCENTAGE') {
      return Math.max(0, Math.round(mrp * (1 - val / 100)));
    } else {
      return Math.max(0, Math.round(mrp - val));
    }
  }

  async onDiscountSubmit(event: Event) {
    event.preventDefault();
    if (!this.discountTargetProduct) return;

    try {
      const res = await this.api.updateProductDiscount(this.discountTargetProduct.id, {
        originalPrice: Number(this.discountOriginalPrice),
        discountType: this.discountType,
        discountValue: Number(this.discountValue)
      });
      if (res.success) {
        this.store.showToast('success', 'Discount Applied', `Discount updated for "${this.discountTargetProduct.name}".`);
        await this.loadProducts();
        await this.loadProductsSummary();
        this.isDiscountModalOpen.set(false);
        this.discountTargetProduct = null;
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Failed to apply discount.');
    }
  }

  // Multi-selection & Bulk Delete
  isProductSelected(id: string): boolean {
    return this.selectedProductIds().has(id);
  }

  toggleProductSelection(id: string) {
    const set = new Set(this.selectedProductIds());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.selectedProductIds.set(set);
  }

  toggleSelectAll() {
    const allIds = this.productsList().map(p => p.id);
    if (this.selectedProductIds().size === allIds.length && allIds.length > 0) {
      this.selectedProductIds.set(new Set());
    } else {
      this.selectedProductIds.set(new Set(allIds));
    }
  }

  executeBulkDelete() {
    this.openBulkDeleteModal();
  }

  openBulkDeleteModal() {
    if (this.selectedProductIds().size === 0) return;
    this.isBulkDeleteModalOpen.set(true);
  }

  getSelectedProductsForDelete(): Product[] {
    const ids = this.selectedProductIds();
    return this.productsList().filter(p => ids.has(p.id));
  }

  async confirmBulkDelete() {
    const ids = Array.from(this.selectedProductIds());
    if (ids.length === 0) return;
    this.isDeletingBulk.set(true);
    try {
      const res = await this.api.bulkDeleteProducts(ids);
      if (res.success) {
        this.store.showToast('warning', 'Bulk Delete Completed', `Successfully deleted ${res.deletedCount} products.`);
        this.selectedProductIds.set(new Set());
        await this.loadProducts();
        await this.loadProductsSummary();
        await this.loadCategories();
        this.isBulkDeleteModalOpen.set(false);
      } else {
        this.store.showToast('error', 'Delete Failed', 'Bulk delete failed.');
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Bulk delete failed.');
    } finally {
      this.isDeletingBulk.set(false);
    }
  }

  // Bulk Import
  openImportModal() {
    this.importMode = 'csv';
    this.importDataText = `name,sku,price,original_price,stock,category\nRoyal Basmati Rice 5kg,SKU-RICE-09,499,599,50,Atta, rice & grains\nKashmiri Chili Powder,SKU-CHILI-01,180,200,80,Spices & Masalas\nPure Cow Ghee 1L,SKU-GHEE-05,650,720,40,Oil & ghee`;
    this.importResult = null;
    this.isImportModalOpen.set(true);
  }

  setSampleJson() {
    this.importDataText = JSON.stringify(
      [
        {
          name: 'Amul Salted Butter 500g',
          sku: 'SKU-BUTTER-500',
          price: 275,
          originalPrice: 290,
          stock: 60,
          weight: '500g Block',
          category: 'Oil & ghee',
          description: 'Delicious creamy pasteurized table butter.',
          imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80'
        },
        {
          name: 'Tata Tea Gold 1kg',
          sku: 'SKU-TEA-GOLD-1K',
          price: 480,
          originalPrice: 550,
          stock: 90,
          weight: '1kg Pouch',
          category: 'Tea & coffee',
          description: 'Fine CTC tea leaves with gently rolled aromatic long leaves.',
          imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'
        }
      ],
      null,
      2
    );
  }

  async onExecuteImport() {
    if (!this.importDataText.trim()) return;
    this.isImporting.set(true);
    this.importResult = null;

    try {
      let payload: any = {};
      if (this.importMode === 'csv') {
        payload = { csv: this.importDataText.trim() };
      } else {
        payload = { items: JSON.parse(this.importDataText.trim()) };
      }

      const res = await this.api.bulkImportProducts(payload);
      this.importResult = res;
      if (res.success) {
        this.store.showToast('success', 'Import Successful', res.message || 'Products imported successfully.');
        await this.loadProducts();
        await this.loadProductsSummary();
        await this.loadCategories();
      }
    } catch (err: any) {
      console.error(err);
      this.importResult = {
        success: false,
        message: err.message || 'Import syntax error or server issue.'
      };
      this.store.showToast('error', 'Import Failed', 'Please verify your CSV/JSON format.');
    } finally {
      this.isImporting.set(false);
    }
  }


}
