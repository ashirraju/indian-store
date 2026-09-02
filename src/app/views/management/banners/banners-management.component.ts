import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../../services/store-state.service';
import { BannerConfig } from '../../../models/cms.model';

@Component({
  selector: 'app-banners-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './banners-management.component.html',
  styleUrl: './banners-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BannersManagementComponent {
  readonly store = inject(StoreStateService);

  announcementText = this.store.bannerConfig().announcementText || '';
  announcementLink = this.store.bannerConfig().announcementLink || '';
  promoBadge = this.store.bannerConfig().promoBadge || '';
  primaryButtonText = this.store.bannerConfig().primaryButtonText || 'Shop Now';
  heroHeadline = this.store.bannerConfig().heroHeadline || '';
  heroSubheadline = this.store.bannerConfig().heroSubheadline || '';
  heroBannerImage = this.store.bannerConfig().heroBannerImage || '';

  onSaveBanners(event: Event) {
    event.preventDefault();
    const updated: BannerConfig = {
      ...this.store.bannerConfig(),
      announcementText: this.announcementText,
      announcementLink: this.announcementLink,
      promoBadge: this.promoBadge,
      primaryButtonText: this.primaryButtonText,
      heroHeadline: this.heroHeadline,
      heroSubheadline: this.heroSubheadline,
      heroBannerImage: this.heroBannerImage
    };
    this.store.updateBannerConfig(updated);
  }
}
