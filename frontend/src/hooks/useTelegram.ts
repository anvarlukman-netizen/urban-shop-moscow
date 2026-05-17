import { useEffect } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        expand(): void;
        close(): void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          setText(text: string): void;
          onClick(fn: () => void): void;
          offClick(fn: () => void): void;
        };
        BackButton: {
          isVisible: boolean;
          show(): void;
          hide(): void;
          onClick(fn: () => void): void;
          offClick(fn: () => void): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
        showAlert(message: string, callback?: () => void): void;
        showConfirm(message: string, callback: (ok: boolean) => void): void;
        openLink(url: string): void;
        setHeaderColor(color: string): void;
        setBackgroundColor(color: string): void;
        isExpanded: boolean;
        platform: string;
      };
    };
  }
}

export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

export function useTelegram() {
  useEffect(() => {
    tg?.ready();
    tg?.expand();
  }, []);

  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    initData: tg?.initData ?? '',
    colorScheme: tg?.colorScheme ?? 'light',
    haptic: tg?.HapticFeedback,
  };
}
