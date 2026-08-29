import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';
import { ApiService } from '../../services/api.service';
import { MenuItem, CustomPage } from '../../models/cms.model';
import { DynamicFormSchema, FormFieldSchema } from '../../models/dynamic-form.model';
import { AppRole } from '../../models/user.model';
import { Category, SubCategory, CreateCategoryInput, CreateSubCategoryInput } from '../../models/category.model';
import { Product, ProductsSummary } from '../../models/product.model';

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
  selector: 'app-admin-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-view.component.html',
  styleUrl: './admin-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminViewComponent implements OnInit {
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);

  readonly activeTab = signal<'categories' | 'products' | 'banners'>('categories');
  readonly allRoles: AppRole[] = ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'];

  onLogout() {
    this.store.keycloak.logout();
  }

  // ==========================================
  // CATEGORIES STATE
  // ==========================================
  readonly categoriesList = signal<Category[]>([]);
  readonly isCategoriesLoading = signal<boolean>(false);
  readonly isReorderingCategories = signal<boolean>(false);

  // Drag & Drop state
  draggedCategoryIndex: number | null = null;
  dragOverCategoryIndex: number | null = null;

  // Category Modal
  readonly isCategoryModalOpen = signal<boolean>(false);
  editingCategoryId: string | null = null;
  catName = '';
  catSlug = '';
  catIcon = 'category';
  catDisplayOrder = 1;

  // Sub-Category Modal
  readonly isSubCategoryModalOpen = signal<boolean>(false);
  parentCategoryIdForSub: string | null = null;
  parentCategoryNameForSub = '';
  editingSubCategoryId: string | null = null;
  subCatName = '';
  subCatSlug = '';
  subCatDisplayOrder = 1;

  // Delete Category Confirmation Modal
  readonly isDeleteCatModalOpen = signal<boolean>(false);
  deletingCategory: Category | null = null;
  forceDeleteCategory = true;

  // Icon options preview
  readonly commonIcons = [
    'grain', 'rice_bowl', 'opacity', 'coffee', 'cookie', 'soap',
    'face_retouching_natural', 'local_laundry_service', 'child_care',
    'pets', 'cake', 'spa', 'nutrition', 'egg_alt', 'local_florist',
    'shopping_bag', 'inventory_2', 'restaurant', 'storefront', 'category'
  ];

  // ==========================================
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

  // ==========================================
  // STOREFRONT BANNERS CONFIGURATION STATE
  // ==========================================
  announcementText = this.store.bannerConfig().announcementText;
  announcementLink = this.store.bannerConfig().announcementLink || '';
  heroHeadline = this.store.bannerConfig().heroHeadline;
  heroSubheadline = this.store.bannerConfig().heroSubheadline;
  heroBannerImage = this.store.bannerConfig().heroBannerImage;
  promoBadge = this.store.bannerConfig().promoBadge;
  primaryButtonText = this.store.bannerConfig().primaryButtonText;

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
    this.loadProductsSummary();
  }

  // ==========================================
  // CATEGORIES METHODS & DRAG-AND-DROP REORDERING
  // ==========================================

  async loadCategories() {
    this.isCategoriesLoading.set(true);
    try {
      const res = await this.api.getCategories();
      if (res.success) {
        const sorted = (res.data || []).sort((a, b) => a.display_order - b.display_order);
        this.categoriesList.set(sorted);
        this.store.updateCategoryOrder(sorted);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      this.store.showToast('error', 'Category Fetch Failed', 'Could not load categories from server.');
    } finally {
      this.isCategoriesLoading.set(false);
    }
  }

  // HTML5 Drag and Drop Handlers
  onCategoryDragStart(index: number, event: DragEvent) {
    this.draggedCategoryIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onCategoryDragOver(index: number, event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverCategoryIndex = index;
  }

  onCategoryDragLeave(index: number) {
    if (this.dragOverCategoryIndex === index) {
      this.dragOverCategoryIndex = null;
    }
  }

  onCategoryDrop(targetIndex: number, event: DragEvent) {
    event.preventDefault();
    if (this.draggedCategoryIndex === null || this.draggedCategoryIndex === targetIndex) {
      this.draggedCategoryIndex = null;
      this.dragOverCategoryIndex = null;
      return;
    }

    const list = [...this.categoriesList()];
    const [movedItem] = list.splice(this.draggedCategoryIndex, 1);
    list.splice(targetIndex, 0, movedItem);

    this.draggedCategoryIndex = null;
    this.dragOverCategoryIndex = null;

    this.saveReorderedCategories(list);
  }

  onCategoryDragEnd() {
    this.draggedCategoryIndex = null;
    this.dragOverCategoryIndex = null;
  }

  // Position Up / Down Click Handlers
  moveCategoryUp(index: number) {
    if (index <= 0) return;
    const list = [...this.categoriesList()];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    this.saveReorderedCategories(list);
  }

  moveCategoryDown(index: number) {
    const list = [...this.categoriesList()];
    if (index >= list.length - 1) return;
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    this.saveReorderedCategories(list);
  }

  async saveReorderedCategories(reorderedList: Category[]) {
    // 1. Reassign display_order (1-indexed)
    const updatedList = reorderedList.map((cat, idx) => ({
      ...cat,
      display_order: idx + 1
    }));

    // 2. Optimistic UI update for immediate customer and admin reaction
    this.categoriesList.set(updatedList);
    this.store.updateCategoryOrder(updatedList);
    this.isReorderingCategories.set(true);

    try {
      // 3. Persist new displayOrder to backend API
      await Promise.all(
        updatedList.map(cat =>
          this.api.updateCategory(cat.id, {
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            displayOrder: cat.display_order
          })
        )
      );
      this.store.showToast(
        'success',
        'Category Order Saved',
        'Categories reordered! Storefront navbar and customer page sections are now updated in this exact order.'
      );
    } catch (err) {
      console.error('Error saving reordered categories:', err);
      this.store.showToast('error', 'Reorder Save Error', 'Could not sync all category orders to server.');
    } finally {
      this.isReorderingCategories.set(false);
    }
  }

  openCategoryModal(category?: Category) {
    if (category) {
      this.editingCategoryId = category.id;
      this.catName = category.name;
      this.catSlug = category.slug;
      this.catIcon = category.icon;
      this.catDisplayOrder = category.display_order;
    } else {
      this.editingCategoryId = null;
      this.catName = '';
      this.catSlug = '';
      this.catIcon = 'grain';
      this.catDisplayOrder = this.categoriesList().length + 1;
    }
    this.isCategoryModalOpen.set(true);
  }

  onCategoryNameChange() {
    if (!this.editingCategoryId && this.catName) {
      this.catSlug = this.catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
  }

  async onCategorySubmit(event: Event) {
    event.preventDefault();
    if (!this.catName.trim()) return;

    const payload: CreateCategoryInput = {
      name: this.catName.trim(),
      slug: this.catSlug.trim() || undefined,
      icon: this.catIcon || 'category',
      displayOrder: Number(this.catDisplayOrder) || 1
    };

    try {
      if (this.editingCategoryId) {
        const res = await this.api.updateCategory(this.editingCategoryId, payload);
        if (res.success) {
          this.store.showToast('success', 'Category Updated', `"${res.data.name}" updated successfully.`);
          await this.loadCategories();
          this.isCategoryModalOpen.set(false);
        } else {
          this.store.showToast('error', 'Update Failed', res.message || 'Error updating category');
        }
      } else {
        const res = await this.api.createCategory(payload);
        if (res.success) {
          this.store.showToast('success', 'Category Created', `Category "${res.data.name}" added!`);
          await this.loadCategories();
          this.isCategoryModalOpen.set(false);
        } else {
          this.store.showToast('error', 'Creation Failed', res.message || 'Error creating category');
        }
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Failed to save category.');
    }
  }

  promptDeleteCategory(cat: Category) {
    this.deletingCategory = cat;
    this.forceDeleteCategory = true;
    this.isDeleteCatModalOpen.set(true);
  }

  async confirmDeleteCategory() {
    if (!this.deletingCategory) return;
    try {
      const res = await this.api.deleteCategory(this.deletingCategory.id, this.forceDeleteCategory);
      if (res.success) {
        this.store.showToast('warning', 'Category Deleted', `Category "${this.deletingCategory.name}" removed.`);
        await this.loadCategories();
        await this.loadProducts();
        await this.loadProductsSummary();
        this.isDeleteCatModalOpen.set(false);
        this.deletingCategory = null;
      } else {
        this.store.showToast('error', 'Delete Failed', res.message || 'Could not delete category');
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Failed to delete category.');
    }
  }

  openSubCategoryModal(parentCat: Category, subCat?: SubCategory) {
    this.parentCategoryIdForSub = parentCat.id;
    this.parentCategoryNameForSub = parentCat.name;
    if (subCat) {
      this.editingSubCategoryId = subCat.id;
      this.subCatName = subCat.name;
      this.subCatSlug = subCat.slug;
      this.subCatDisplayOrder = subCat.display_order;
    } else {
      this.editingSubCategoryId = null;
      this.subCatName = '';
      this.subCatSlug = '';
      this.subCatDisplayOrder = (parentCat.sub_categories?.length || 0) + 1;
    }
    this.isSubCategoryModalOpen.set(true);
  }

  onSubCatNameChange() {
    if (!this.editingSubCategoryId && this.subCatName) {
      this.subCatSlug = this.subCatName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
  }

  async onSubCategorySubmit(event: Event) {
    event.preventDefault();
    if (!this.subCatName.trim() || !this.parentCategoryIdForSub) return;

    const payload: CreateSubCategoryInput = {
      name: this.subCatName.trim(),
      slug: this.subCatSlug.trim() || undefined,
      displayOrder: Number(this.subCatDisplayOrder) || 1
    };

    try {
      if (this.editingSubCategoryId) {
        const res = await this.api.updateSubCategory(this.editingSubCategoryId, payload);
        if (res.success) {
          this.store.showToast('success', 'Sub-Category Updated', `"${res.data.name}" updated.`);
          await this.loadCategories();
          this.isSubCategoryModalOpen.set(false);
        } else {
          this.store.showToast('error', 'Update Failed', res.message || 'Error updating sub-category');
        }
      } else {
        const res = await this.api.createSubCategory(this.parentCategoryIdForSub, payload);
        if (res.success) {
          this.store.showToast('success', 'Sub-Category Created', `"${res.data.name}" added to ${this.parentCategoryNameForSub}.`);
          await this.loadCategories();
          this.isSubCategoryModalOpen.set(false);
        } else {
          this.store.showToast('error', 'Creation Failed', res.message || 'Error creating sub-category');
        }
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Failed to save sub-category.');
    }
  }

  async deleteSubCategory(subCat: SubCategory) {
    if (!confirm(`Are you sure you want to delete sub-category "${subCat.name}"?`)) return;
    try {
      const res = await this.api.deleteSubCategory(subCat.id);
      if (res.success) {
        this.store.showToast('warning', 'Sub-Category Deleted', `Sub-category "${subCat.name}" removed.`);
        await this.loadCategories();
      } else {
        this.store.showToast('error', 'Delete Failed', res.message || 'Error deleting sub-category');
      }
    } catch (err) {
      console.error(err);
      this.store.showToast('error', 'Error', 'Failed to delete sub-category.');
    }
  }

  // ==========================================
  // PRODUCTS METHODS & MULTI-ROW BUILDER
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
    if (product) {
      this.editingProductId = product.id;
      this.productFormRows.set([
        {
          id: product.id,
          sku: product.sku || '',
          name: product.name,
          category: product.category || '',
          subCategory: product.sub_category || '',
          price: product.price,
          originalPrice: product.original_price || product.originalPrice || product.price,
          weight: product.weight || '500g',
          stock: product.stock,
          lowStockThreshold: product.low_stock_threshold || product.lowStockThreshold || 10,
          originRegion: product.origin_region || product.originRegion || 'India',
          imageUrl: product.image_url || product.imageUrl,
          description: product.description || '',
          isOrganic: product.is_organic ?? product.isOrganic ?? false,
          isBestseller: product.is_bestseller ?? product.isBestseller ?? false,
          tagsString: (product.tags || []).join(', ')
        }
      ]);
    } else {
      this.editingProductId = null;
      this.productFormRows.set([this.createEmptyProductRow()]);
    }
    this.isProductModalOpen.set(true);
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

  // ==========================================
  // STOREFRONT BANNERS METHODS
  // ==========================================

  onSaveBanners(event: Event) {
    event.preventDefault();
    this.store.updateBannerConfig({
      announcementText: this.announcementText,
      announcementLink: this.announcementLink || undefined,
      heroHeadline: this.heroHeadline,
      heroSubheadline: this.heroSubheadline,
      heroBannerImage: this.heroBannerImage,
      promoBadge: this.promoBadge,
      primaryButtonText: this.primaryButtonText
    });
  }
}
