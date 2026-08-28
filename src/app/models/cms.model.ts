import { AppRole } from './user.model';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  visibleRoles: AppRole[];
  order: number;
  badge?: string;
  isExternal?: boolean;
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  bannerImage: string;
  content: string;
  ctaText?: string;
  ctaLink?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface OfferItem {
  id: string;
  badge: string;
  title: string;
  code: string;
  discount: string;
  bgColor: string;
  validTill: string;
  image: string;
  link: string;
}

export interface BannerConfig {
  announcementText: string;
  announcementLink?: string;
  quickInfoItems?: string[];
  heroHeadline: string;
  heroSubheadline: string;
  heroBannerImage: string;
  promoBadge: string;
  primaryButtonText: string;
}
