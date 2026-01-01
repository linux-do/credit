import { AvatarDecorationTheme } from "./types"
import { ChristmasDecorations } from "./Christmas"
import { NewYearDecorations } from "./NewYear"

export const DecorationThemes: Record<string, AvatarDecorationTheme> = {
  christmas: {
    key: "christmas",
    MainDecoration: ChristmasDecorations.Hat,
    InteractionDecoration: ChristmasDecorations.Tree,
    BackgroundEffect: ChristmasDecorations.SnowEffect,
    smallMainDecorationConfig: {
      className: "absolute -top-1 -left-1 w-3 h-3 z-20 rotate-[-20deg] drop-shadow-sm"
    },
    largeMainDecorationConfig: {
      className: "absolute -top-2 -left-1 w-5 h-5 z-20 rotate-[-20deg] drop-shadow-sm"
    },
    interactionDecorationConfig: {
      className: "absolute -top-2 right-2 w-12 h-12 z-0 rotate-[10deg] transition-all duration-500 ease-out"
    }
  },
  newyear: {
    key: "newyear",
    MainDecoration: NewYearDecorations.Lantern,
    InteractionDecoration: NewYearDecorations.Fu,
    BackgroundEffect: NewYearDecorations.FireworksEffect,
    smallMainDecorationConfig: {
      className: "absolute -top-2 -right-1 w-8 h-8 z-20 rotate-[10deg] drop-shadow-md pointer-events-none"
    },
    largeMainDecorationConfig: {
      className: "absolute -top-3 -right-3 w-8 h-8 z-20 rotate-[10deg] drop-shadow-md pointer-events-none"
    },
    interactionDecorationConfig: {
      className: "absolute top-6 left-4 w-10 h-10 z-20 -rotate-[5deg] transition-all duration-500 ease-out"
    }
  },
  none: {
    key: "none",
    MainDecoration: () => null,
    InteractionDecoration: () => null,
  }
}

/* 可选值: 'christmas', 'newyear', 'none' */
export const CURRENT_THEME_KEY: string = "newyear"

export const getCurrentTheme = (): AvatarDecorationTheme => {
  return DecorationThemes[CURRENT_THEME_KEY] || DecorationThemes.none
}
