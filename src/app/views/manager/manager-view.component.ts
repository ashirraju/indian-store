import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';
import { ApiService } from '../../services/api.service';
import { Product } from '../../models/product.model';
import { Category, SubCategory } from '../../models/category.model';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-manager-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-view.component.html',
  styleUrl: './manager-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerViewComponent implements OnInit {
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);

  readonly activeTab = signal<'orders' | 'notifications' | 'products' | 'categories' | 'analytics'>('orders');
  readonly isNotificationDrawerOpen = signal<boolean>(false);

  onLogout() {
    this.store.keycloak.logout();
  }

  ngOnInit() {
    this.loadCategories();
    this.store.syncNotifications('Manager');
    this.store.initNotificationStream('Manager');
  }

  toggleNotificationDrawer() {
    this.isNotificationDrawerOpen.set(!this.isNotificationDrawerOpen());
  }

  markNotifRead(notif: any) {
    this.store.markNotificationAsRead(notif.id);
  }

  markAllNotifsRead() {
    this.store.markAllNotificationsAsRead();
  }

  jumpToOrder(orderId: string) {
    this.activeTab.set('orders');
    this.isNotificationDrawerOpen.set(false);
    this.orderSearchQuery = orderId;
    this.store.showToast('info', 'Viewing Order', `Locating Order #${orderId}`);
  }

  // ==========================================
  // ORDERS MANAGEMENT & APPROVALS STATE
  // ==========================================
  readonly orderStatusFilter = signal<'ALL' | 'In Packing' | 'Packed' | 'Out for Delivery' | 'Delivered'>('ALL');
  orderSearchQuery = '';

  readonly filteredOrders = computed(() => {
    let list = this.store.orders();
    const filter = this.orderStatusFilter();
    if (filter !== 'ALL') {
      list = list.filter(o => o.status === filter);
    }
    const q = this.orderSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }
    return list;
  });

  readonly inPackingCount = computed(() => this.store.orders().filter(o => o.status === 'In Packing').length);
  readonly packedCount = computed(() => this.store.orders().filter(o => o.status === 'Packed' || o.status === 'Ready for Dispatch').length);
  readonly outForDeliveryCount = computed(() => this.store.orders().filter(o => o.status === 'Out for Delivery').length);
  readonly deliveredCount = computed(() => this.store.orders().filter(o => o.status === 'Delivered').length);

  advanceOrderStatus(order: Order, newStatus: OrderStatus, notes?: string, deliveryAgent?: string) {
    this.store.updateOrderStatus(order.id, newStatus, notes, deliveryAgent);
  }

  // Quick Action Helpers for Order Workflow
  markAsPacked(order: Order) {
    this.advanceOrderStatus(order, 'Packed', 'Order verified and packed by Manager');
  }

  markAsOutForDelivery(order: Order) {
    this.advanceOrderStatus(order, 'Out for Delivery', 'Dispatched with Express Logistics', 'Vikram Singh (Express Logistics)');
  }

  markAsDelivered(order: Order) {
    this.advanceOrderStatus(order, 'Delivered', 'Delivered safely to customer with confirmation');
  }

  // ==========================================
  // PRODUCTS STATE
  // ==========================================
  searchFilter = '';
  selectedCategoryFilter = '';
  isAddModalOpen = signal<boolean>(false);
  isEditProductModalOpen = signal<boolean>(false);
  editingProduct = signal<Product | null>(null);

  // Form Fields
  newProdName = '';
  newProdCategory = 'Spices & Seasonings';
  newProdSubCategory = '';
  newProdPrice = 9.99;
  newProdWeight = '250g Pack';
  newProdStock = 50;
  newProdOrigin = 'India';
  newProdImage = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80';
  newProdDesc = '';
  newProdIsOrganic = true;
  newProdIsBestseller = false;

  readonly totalSalesRevenue = computed(() =>
    Math.round(this.store.orders().reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100
  );

  readonly lowStockCount = computed(() =>
    this.store.products().filter(p => p.stock < 20).length
  );

  readonly organicProductCount = computed(() =>
    this.store.products().filter(p => p.isOrganic).length
  );

  readonly filteredProducts = computed(() => {
    let list = this.store.products();
    if (this.selectedCategoryFilter) {
      list = list.filter(p => p.category === this.selectedCategoryFilter);
    }
    const query = this.searchFilter.toLowerCase().trim();
    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
      );
    }
    return list;
  });

  adjustStock(prod: Product, delta: number) {
    const newStock = Math.max(0, prod.stock + delta);
    this.store.saveProduct({ id: prod.id, stock: newStock });
  }

  isDeleteModalOpen = signal<boolean>(false);
  deletingProduct = signal<Product | null>(null);

  openDeleteModal(prod: Product) {
    this.deletingProduct.set(prod);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete() {
    const prod = this.deletingProduct();
    if (prod) {
      this.store.deleteProduct(prod.id);
      this.isDeleteModalOpen.set(false);
      this.deletingProduct.set(null);
    }
  }

  openEditProduct(prod: Product) {
    this.editingProduct.set(prod);
    this.newProdName = prod.name;
    this.newProdCategory = prod.category;
    this.newProdSubCategory = (prod as any).subCategory || '';
    this.newProdPrice = prod.price;
    this.newProdWeight = prod.weight;
    this.newProdStock = prod.stock;
    this.newProdOrigin = prod.originRegion || 'India';
    this.newProdImage = prod.imageUrl || prod.image_url || '';
    this.newProdDesc = prod.description || '';
    this.newProdIsOrganic = !!prod.isOrganic;
    this.newProdIsBestseller = !!prod.isBestseller;
    this.isEditProductModalOpen.set(true);
  }

  saveEditProduct(event: Event) {
    event.preventDefault();
    const prod = this.editingProduct();
    if (!prod) return;

    this.store.saveProduct({
      id: prod.id,
      name: this.newProdName,
      category: this.newProdCategory,
      subCategory: this.newProdSubCategory,
      price: Number(this.newProdPrice),
      weight: this.newProdWeight,
      stock: Number(this.newProdStock),
      originRegion: this.newProdOrigin,
      imageUrl: this.newProdImage,
      description: this.newProdDesc,
      isOrganic: this.newProdIsOrganic,
      isBestseller: this.newProdIsBestseller
    });
    this.isEditProductModalOpen.set(false);
    this.editingProduct.set(null);
  }

  promptEditPrice(prod: Product) {
    const val = prompt(`Enter new price in AUD for "${prod.name}" (Current: $${prod.price}):`, prod.price.toString());
    if (val && !isNaN(Number(val))) {
      this.store.saveProduct({ id: prod.id, price: Number(val) });
    }
  }

  openAddModal() {
    this.newProdName = '';
    this.newProdCategory = this.store.categories().find(c => c !== 'All Categories') || 'Spices & Seasonings';
    this.newProdSubCategory = '';
    this.newProdPrice = 9.99;
    this.newProdWeight = '250g Pack';
    this.newProdStock = 50;
    this.newProdOrigin = 'India';
    this.newProdImage = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80';
    this.newProdDesc = '';
    this.newProdIsOrganic = true;
    this.newProdIsBestseller = false;
    this.isAddModalOpen.set(true);
  }

  onAddProductSubmit(event: Event) {
    event.preventDefault();
    this.store.saveProduct({
      name: this.newProdName,
      category: this.newProdCategory,
      subCategory: this.newProdSubCategory,
      price: Number(this.newProdPrice),
      weight: this.newProdWeight,
      stock: Number(this.newProdStock),
      originRegion: this.newProdOrigin,
      imageUrl: this.newProdImage,
      description: this.newProdDesc,
      isOrganic: this.newProdIsOrganic,
      isBestseller: this.newProdIsBestseller
    });
    this.isAddModalOpen.set(false);
  }

  // ==========================================
  // CATEGORIES STATE & METHODS
  // ==========================================
  readonly categoriesList = signal<Category[]>([]);
  readonly isCategoriesLoading = signal<boolean>(false);

  // Category Add/Edit Modal
  readonly isCategoryModalOpen = signal<boolean>(false);
  editingCategoryId: string | null = null;
  catName = '';
  catSlug = '';
  catIcon = 'category';
  catDisplayOrder = 1;

  // SubCategory Modal
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

  readonly commonIcons = [
    'grain', 'rice_bowl', 'opacity', 'coffee', 'cookie', 'soap',
    'face_retouching_natural', 'local_laundry_service', 'child_care',
    'pets', 'cake', 'spa', 'nutrition', 'egg_alt', 'local_florist',
    'shopping_bag', 'inventory_2', 'restaurant', 'storefront', 'category'
  ];

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
      console.warn('Backend categories sync:', err);
    } finally {
      this.isCategoriesLoading.set(false);
    }
  }

  openCreateCategoryModal() {
    this.editingCategoryId = null;
    this.catName = '';
    this.catSlug = '';
    this.catIcon = 'category';
    this.catDisplayOrder = this.categoriesList().length + 1;
    this.isCategoryModalOpen.set(true);
  }

  openEditCategoryModal(cat: Category) {
    this.editingCategoryId = cat.id;
    this.catName = cat.name;
    this.catSlug = cat.slug;
    this.catIcon = cat.icon || 'category';
    this.catDisplayOrder = cat.display_order;
    this.isCategoryModalOpen.set(true);
  }

  onCatNameChange() {
    if (!this.editingCategoryId) {
      this.catSlug = this.catName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
  }

  async saveCategory(event: Event) {
    event.preventDefault();
    if (!this.catName.trim() || !this.catSlug.trim()) {
      this.store.showToast('warning', 'Validation Error', 'Category Name and Slug are required.');
      return;
    }

    const payload = {
      name: this.catName.trim(),
      slug: this.catSlug.trim(),
      icon: this.catIcon,
      display_order: Number(this.catDisplayOrder) || 1
    };

    try {
      if (this.editingCategoryId) {
        await this.api.updateCategory(this.editingCategoryId, payload, 'Manager');
        this.store.showToast('success', 'Category Updated', `Updated "${payload.name}" successfully.`);
      } else {
        await this.api.createCategory(payload, 'Manager');
        this.store.showToast('success', 'Category Created', `Created "${payload.name}" successfully.`);
      }
      this.isCategoryModalOpen.set(false);
      await this.loadCategories();
    } catch (err) {
      console.warn('Category save local fallback:', err);
      this.isCategoryModalOpen.set(false);
      await this.loadCategories();
    }
  }

  openDeleteCategoryModal(cat: Category) {
    this.deletingCategory = cat;
    this.isDeleteCatModalOpen.set(true);
  }

  async confirmDeleteCategory() {
    const cat = this.deletingCategory;
    if (!cat) return;

    try {
      await this.api.deleteCategory(cat.id, true, 'Manager');
      this.store.showToast('success', 'Category Deleted', `Deleted "${cat.name}".`);
    } catch (err) {
      console.warn('Delete category fallback:', err);
    } finally {
      this.isDeleteCatModalOpen.set(false);
      this.deletingCategory = null;
      await this.loadCategories();
    }
  }

  openAddSubCategoryModal(cat: Category) {
    this.parentCategoryIdForSub = cat.id;
    this.parentCategoryNameForSub = cat.name;
    this.editingSubCategoryId = null;
    this.subCatName = '';
    this.subCatSlug = '';
    this.subCatDisplayOrder = (cat.sub_categories?.length || 0) + 1;
    this.isSubCategoryModalOpen.set(true);
  }

  onSubCatNameChange() {
    if (!this.editingSubCategoryId) {
      this.subCatSlug = this.subCatName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
  }

  async saveSubCategory(event: Event) {
    event.preventDefault();
    if (!this.parentCategoryIdForSub || !this.subCatName.trim() || !this.subCatSlug.trim()) {
      this.store.showToast('warning', 'Validation Error', 'Sub-Category Name and Slug are required.');
      return;
    }

    const payload = {
      name: this.subCatName.trim(),
      slug: this.subCatSlug.trim(),
      display_order: Number(this.subCatDisplayOrder) || 1
    };

    try {
      if (this.editingSubCategoryId) {
        await this.api.updateSubCategory(this.editingSubCategoryId, payload, 'Manager');
        this.store.showToast('success', 'Sub-Category Updated', `Updated "${payload.name}".`);
      } else {
        await this.api.createSubCategory(this.parentCategoryIdForSub, payload, 'Manager');
        this.store.showToast('success', 'Sub-Category Created', `Added "${payload.name}".`);
      }
      this.isSubCategoryModalOpen.set(false);
      await this.loadCategories();
    } catch (err) {
      console.warn('SubCategory save fallback:', err);
      this.isSubCategoryModalOpen.set(false);
      await this.loadCategories();
    }
  }

  async deleteSubCategory(sub: SubCategory) {
    if (!confirm(`Delete sub-category "${sub.name}"?`)) return;
    try {
      await this.api.deleteSubCategory(sub.id, 'Manager');
      this.store.showToast('success', 'Sub-Category Deleted', `Deleted "${sub.name}".`);
      await this.loadCategories();
    } catch (err) {
      console.warn('Delete subcategory fallback:', err);
      await this.loadCategories();
    }
  }
}
