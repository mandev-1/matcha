import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

/**
 * Shared domain types
 * Single source of truth for type definitions across the application
 */

export interface User {
  id: number;
  username: string;
  email: string;
  set_up: boolean;
  is_setup: boolean;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id?: number;
  related_user_id?: number;
}
