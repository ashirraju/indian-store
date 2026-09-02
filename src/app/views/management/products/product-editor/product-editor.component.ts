import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StoreStateService } from '../../../../services/store-state.service';
import { ApiService } from '../../../../services/api.service';
import { Product } from '../../../../models/product.model';
import { Category, SubCategory } from '../../../../models/category.model';

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
  selector: 'app-product-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-editor.component.html',
  styleUrl: './product-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductEditorComponent implements OnInit {
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly categoriesList = signal<Category[]>([]);
  readonly productFormRows = signal<ProductFormRow[]>([]);
  readonly isSavingProducts = signal<boolean>(false);
  readonly uploadingRowIndex = signal<number | null>(null);
  editingProductId: string | null = null;

  async onImageFileSelected(event: Event, row: ProductFormRow, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.store.showToast('warning', 'File Too Large', 'Please select an image smaller than 10MB.');
      input.value = '';
      return;
    }

    this.uploadingRowIndex.set(index);
    try {
      const res = await this.api.uploadImage(file, this.store.activeRole() || 'Admin');
      if (res.success && res.data) {
        const uploadedUrl = res.data.imageUrl || res.data.url;
        row.imageUrl = uploadedUrl;
        this.store.showToast('success', 'Image Uploaded 📸', 'Image uploaded and URL auto-filled!');
      } else {
        this.store.showToast('error', 'Upload Failed', res.message || 'Could not upload image.');
      }
    } catch (err: any) {
      console.error(err);
      this.store.showToast('error', 'Upload Error', err?.message || 'Failed to upload image file.');
    } finally {
      this.uploadingRowIndex.set(null);
      input.value = '';
    }
  }

  ngOnInit() {
    this.loadCategories();
    this.route.queryParamMap.subscribe(params => {
      const editId = params.get('editId');
      if (editId) {
        this.editingProductId = editId;
        this.loadProductForEdit(editId);
      } else {
        this.editingProductId = null;
        if (this.productFormRows().length === 0) {
          this.productFormRows.set([this.createEmptyProductRow()]);
        }
      }
    });
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

  private loadProductForEdit(id: string) {
    const p = this.store.products().find(x => x.id === id);
    if (p) {
      this.productFormRows.set([{
        id: p.id,
        sku: p.sku || '',
        name: p.name,
        category: p.category || '',
        subCategory: p.sub_category || '',
        price: p.price,
        originalPrice: p.original_price || p.originalPrice || p.price,
        weight: p.weight || '500g Pack',
        stock: p.stock,
        lowStockThreshold: p.low_stock_threshold || p.lowStockThreshold || 10,
        originRegion: p.origin_region || p.originRegion || 'India',
        imageUrl: p.image_url || p.imageUrl,
        description: p.description || '',
        isOrganic: p.is_organic ?? p.isOrganic ?? false,
        isBestseller: p.is_bestseller ?? p.isBestseller ?? false,
        tagsString: (p.tags || []).join(', ')
      }]);
    }
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

  getSubCategoriesForCategory(categoryIdOrName: string): SubCategory[] {
    if (!categoryIdOrName) return [];
    const cat = this.categoriesList().find(
      c => c.id === categoryIdOrName || c.name.toLowerCase() === categoryIdOrName.toLowerCase() || c.slug === categoryIdOrName
    );
    return cat?.sub_categories || [];
  }

  onRowCategoryChange(row: ProductFormRow) {
    row.subCategory = '';
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
      if (this.editingProductId && validRows.length === 1) {
        const row = validRows[0];
        const tags = row.tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
        const payload = {
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
          await this.store.syncCatalogFromBackend();
          this.goBack();
        } else {
          this.store.showToast('error', 'Update Failed', (res as any).message || 'Error updating product');
        }
      } else {
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
            await this.store.syncCatalogFromBackend();
            this.goBack();
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
            await this.store.syncCatalogFromBackend();
            this.goBack();
          } else {
            this.store.showToast('error', 'Bulk Creation Failed', res.message || 'Error creating multiple products');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      this.store.showToast('error', 'Operation Failed', err?.message || 'Could not save products');
    } finally {
      this.isSavingProducts.set(false);
    }
  }

  goBack() {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/admin/')) {
      this.router.navigate(['/admin/products']);
    } else if (currentUrl.includes('/operations/')) {
      this.router.navigate(['/operations/products']);
    } else {
      this.location.back();
    }
  }
}
