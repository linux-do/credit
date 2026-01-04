import { ComponentType } from "react";

export interface AvatarDecorationTheme {
  key: string;
  MainDecoration: ComponentType<{ className?: string }>;
  InteractionDecoration: ComponentType<{ className?: string; show?: boolean }>;
  BackgroundEffect?: ComponentType;
  smallMainDecorationConfig?: {
    className?: string;
  };
  largeMainDecorationConfig?: {
    className?: string;
  };
  interactionDecorationConfig?: {
    className?: string;
  };
}
