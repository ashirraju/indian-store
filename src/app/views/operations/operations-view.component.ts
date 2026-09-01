import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';
import { ApiService } from '../../services/api.service';
import { Order, OrderStatus } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { Category, SubCategory } from '../../models/category.model';

@Component({
  selector: 'app-operations-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operations-view.component.html',
  styleUrl: './operations-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationsViewComponent implements OnInit {
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);

  readonly activeTab = signal<'pipeline' | 'notifications' | 'products' | 'categories' | 'replenishment'>('pipeline');
  readonly isNotificationDrawerOpen = signal<boolean>(false);

  onLogout() {
    this.store.keycloak.logout();
  }

  ngOnInit() {
    this.loadCategories();
    this.store.syncOrdersFromBackend();
    this.store.syncNotifications('Operations');
    this.store.initNotificationStream('Operations');
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
    this.activeTab.set('pipeline');
    this.isNotificationDrawerOpen.set(false);
    this.store.showToast('info', 'Viewing Order', `Locating Order #${orderId} in fulfillment pipeline`);
  }

  // ==========================================
  // FULFILLMENT PIPELINE STATE & COMPUTED
  // ==========================================
  readonly inPackingOrders = computed(() =>
    this.store.orders().filter(o => {
      const s = (o.status || '').toLowerCase().trim();
      return s.includes('pack') || s.includes('place') || s.includes('pend') || s.includes('confirm');
    })
  );

  readonly packedOrders = computed(() =>
    this.store.orders().filter(o => {
      const s = (o.status || '').toLowerCase().trim();
      return (s.includes('packed') || s.includes('dispatch') || s.includes('ready')) && !s.includes('in packing');
    })
  );

  readonly outForDeliveryOrders = computed(() =>
    this.store.orders().filter(o => {
      const s = (o.status || '').toLowerCase().trim();
      return s.includes('delivery') || s.includes('transit') || s.includes('out');
    })
  );

  readonly deliveredOrders = computed(() =>
    this.store.orders().filter(o => {
      const s = (o.status || '').toLowerCase().trim();
      return s.includes('deliver') && !s.includes('out');
    })
  );

  advanceStatus(order: Order, newStatus: OrderStatus, notes: string, deliveryAgent?: string) {
    this.store.updateOrderStatus(order.id, newStatus, notes, deliveryAgent);
  }

  // Quick Action triggers
  markAsPacked(order: Order) {
    this.advanceStatus(order, 'Packed', 'Packed and sealed with tamper-proof security tape');
  }

  markOutForDelivery(order: Order, agentName = 'Vikram Singh (Express Logistics)') {
    this.advanceStatus(order, 'Out for Delivery', 'Handed over to Express AU delivery driver', agentName);
  }

  markDelivered(order: Order) {
    this.advanceStatus(order, 'Delivered', 'Delivered safely to customer doorstep');
  }

  // ==========================================
  // PRODUCTS & INVENTORY STATE
  // ==========================================
  productSearch = '';
  selectedProductCategory = '';
  isAddModalOpen = signal<boolean>(false);
  isEditProductModalOpen = signal<boolean>(false);
  editingProduct = signal<Product | null>(null);

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

  readonly filteredProducts = computed(() => {
    let list = this.store.products();
    if (this.selectedProductCategory) {
      list = list.filter(p => p.category === this.selectedProductCategory);
    }
    const q = this.productSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    return list;
  });

  restockItem(prod: Product, amount = 50) {
    this.store.saveProduct({ id: prod.id, stock: prod.stock + amount });
    this.store.showToast('success', 'Stock Replenished', `Added +${amount} units to ${prod.name}`);
  }

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

  readonly isCategoryModalOpen = signal<boolean>(false);
  editingCategoryId: string | null = null;
  catName = '';
  catSlug = '';
  catIcon = 'category';
  catDisplayOrder = 1;

  readonly isSubCategoryModalOpen = signal<boolean>(false);
  parentCategoryIdForSub: string | null = null;
  parentCategoryNameForSub = '';
  editingSubCategoryId: string | null = null;
  subCatName = '';
  subCatSlug = '';
  subCatDisplayOrder = 1;

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
        await this.api.updateCategory(this.editingCategoryId, payload, 'Operations');
        this.store.showToast('success', 'Category Updated', `Updated "${payload.name}".`);
      } else {
        await this.api.createCategory(payload, 'Operations');
        this.store.showToast('success', 'Category Created', `Created "${payload.name}".`);
      }
      this.isCategoryModalOpen.set(false);
      await this.loadCategories();
    } catch (err) {
      console.warn('Category save fallback:', err);
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
      await this.api.deleteCategory(cat.id, true, 'Operations');
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
        await this.api.updateSubCategory(this.editingSubCategoryId, payload, 'Operations');
        this.store.showToast('success', 'Sub-Category Updated', `Updated "${payload.name}".`);
      } else {
        await this.api.createSubCategory(this.parentCategoryIdForSub, payload, 'Operations');
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
      await this.api.deleteSubCategory(sub.id, 'Operations');
      this.store.showToast('success', 'Sub-Category Deleted', `Deleted "${sub.name}".`);
      await this.loadCategories();
    } catch (err) {
      console.warn('Delete subcategory fallback:', err);
      await this.loadCategories();
    }
  }
}
