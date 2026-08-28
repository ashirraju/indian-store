import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';
import { MenuItem, CustomPage } from '../../models/cms.model';
import { DynamicFormSchema, FormFieldSchema } from '../../models/dynamic-form.model';
import { AppRole } from '../../models/user.model';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-view.component.html',
  styleUrl: './admin-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminViewComponent {
  readonly store = inject(StoreStateService);

  readonly activeTab = signal<'menus' | 'pages' | 'forms' | 'banners' | 'submissions'>('menus');
  readonly allRoles: AppRole[] = ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'];

  isMenuModalOpen = signal<boolean>(false);
  editingMenuId: string | null = null;
  menuLabel = '';
  menuIcon = '';
  menuPath = '';
  menuOrder = 1;
  menuBadge = '';
  selectedRoles: AppRole[] = ['Customer', 'Manager', 'Admin'];

  isPageModalOpen = signal<boolean>(false);
  editingPageId: string | null = null;
  pageTitle = '';
  pageSlug = '';
  pageSubtitle = '';
  pageBanner = '';
  pageContent = '';
  pageCtaText = '';
  pageCtaLink = '';

  isFormModalOpen = signal<boolean>(false);
  editingFormId: string | null = null;
  formTitle = '';
  formSlug = '';
  formDescription = '';
  formSubmitText = '';
  formFields: FormFieldSchema[] = [];

  announcementText = this.store.bannerConfig().announcementText;
  announcementLink = this.store.bannerConfig().announcementLink || '';
  heroHeadline = this.store.bannerConfig().heroHeadline;
  heroSubheadline = this.store.bannerConfig().heroSubheadline;
  heroBannerImage = this.store.bannerConfig().heroBannerImage;
  promoBadge = this.store.bannerConfig().promoBadge;
  primaryButtonText = this.store.bannerConfig().primaryButtonText;

  getKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj || {});
  }

  openMenuModal(menu?: MenuItem) {
    if (menu) {
      this.editingMenuId = menu.id;
      this.menuLabel = menu.label;
      this.menuIcon = menu.icon;
      this.menuPath = menu.path;
      this.menuOrder = menu.order;
      this.menuBadge = menu.badge || '';
      this.selectedRoles = [...menu.visibleRoles];
    } else {
      this.editingMenuId = null;
      this.menuLabel = '';
      this.menuIcon = 'link';
      this.menuPath = '/page/new';
      this.menuOrder = this.store.menus().length + 1;
      this.menuBadge = '';
      this.selectedRoles = ['Customer', 'Manager', 'Admin'];
    }
    this.isMenuModalOpen.set(true);
  }

  isRoleSelected(r: AppRole): boolean {
    return this.selectedRoles.includes(r);
  }

  toggleRoleSelection(r: AppRole) {
    if (this.isRoleSelected(r)) {
      this.selectedRoles = this.selectedRoles.filter(role => role !== r);
    } else {
      this.selectedRoles.push(r);
    }
  }

  onMenuSubmit(event: Event) {
    event.preventDefault();
    if (this.editingMenuId) {
      this.store.updateMenuItem({
        id: this.editingMenuId,
        label: this.menuLabel,
        icon: this.menuIcon,
        path: this.menuPath,
        order: Number(this.menuOrder),
        badge: this.menuBadge || undefined,
        visibleRoles: this.selectedRoles
      });
    } else {
      this.store.addMenuItem({
        label: this.menuLabel,
        icon: this.menuIcon,
        path: this.menuPath,
        order: Number(this.menuOrder),
        badge: this.menuBadge || undefined,
        visibleRoles: this.selectedRoles
      });
    }
    this.isMenuModalOpen.set(false);
  }

  openPageModal(page?: CustomPage) {
    if (page) {
      this.editingPageId = page.id;
      this.pageTitle = page.title;
      this.pageSlug = page.slug;
      this.pageSubtitle = page.subtitle;
      this.pageBanner = page.bannerImage;
      this.pageContent = page.content;
      this.pageCtaText = page.ctaText || '';
      this.pageCtaLink = page.ctaLink || '';
    } else {
      this.editingPageId = null;
      this.pageTitle = '';
      this.pageSlug = 'festive-offer';
      this.pageSubtitle = '';
      this.pageBanner = 'https://images.unsplash.com/photo-1605826832916-d0ea9d6fe71e?w=1000&auto=format&fit=crop&q=80';
      this.pageContent = '<h3>Custom Page Heading</h3><p>Write custom story or details here.</p>';
      this.pageCtaText = 'Shop Now';
      this.pageCtaLink = '/store';
    }
    this.isPageModalOpen.set(true);
  }

  onPageSubmit(event: Event) {
    event.preventDefault();
    this.store.saveCustomPage({
      id: this.editingPageId || undefined,
      title: this.pageTitle,
      slug: this.pageSlug,
      subtitle: this.pageSubtitle,
      bannerImage: this.pageBanner,
      content: this.pageContent,
      ctaText: this.pageCtaText || undefined,
      ctaLink: this.pageCtaLink || undefined,
      isPublished: true
    });
    this.isPageModalOpen.set(false);
  }

  openFormModal(formSchema?: DynamicFormSchema) {
    if (formSchema) {
      this.editingFormId = formSchema.id;
      this.formTitle = formSchema.title;
      this.formSlug = formSchema.slug;
      this.formDescription = formSchema.description;
      this.formSubmitText = formSchema.submitButtonText;
      this.formFields = JSON.parse(JSON.stringify(formSchema.fields));
    } else {
      this.editingFormId = null;
      this.formTitle = '';
      this.formSlug = 'custom-inquiry';
      this.formDescription = '';
      this.formSubmitText = 'Submit Form';
      this.formFields = [
        { id: 'f_1', label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'Enter name', required: true }
      ];
    }
    this.isFormModalOpen.set(true);
  }

  addFormFieldRow() {
    this.formFields.push({
      id: `f_${Date.now()}`,
      label: 'New Field',
      name: `field_${this.formFields.length + 1}`,
      type: 'text',
      required: false
    });
  }

  removeFormFieldRow(index: number) {
    this.formFields.splice(index, 1);
  }

  getOptionsString(options?: string[]): string {
    return (options || []).join(', ');
  }

  updateOptions(field: FormFieldSchema, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    field.options = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  onFormSubmit(event: Event) {
    event.preventDefault();
    this.store.saveDynamicForm({
      id: this.editingFormId || undefined,
      title: this.formTitle,
      slug: this.formSlug,
      description: this.formDescription,
      submitButtonText: this.formSubmitText,
      fields: this.formFields,
      isPublished: true
    });
    this.isFormModalOpen.set(false);
  }

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
