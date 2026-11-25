import { LucideIcon } from "lucide-react";

export interface NavItemConfig {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isExact?: boolean;
}

export interface NavSectionConfig {
  title?: string;
  items: NavItemConfig[];
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  logo?: string | null;
  membersCount?: number;
}
