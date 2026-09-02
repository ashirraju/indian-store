import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../../services/store-state.service';
import { ApiService } from '../../../services/api.service';
import { Category, SubCategory, CreateCategoryInput, CreateSubCategoryInput } from '../../../models/category.model';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-management.component.html',
  styleUrl: './categories-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesManagementComponent implements OnInit {
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);

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


  ngOnInit() {
    this.loadCategories();
  }

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
        this.store.syncCatalogFromBackend();
        
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


}
