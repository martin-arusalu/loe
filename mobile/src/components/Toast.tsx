/**
 * Replacement for `sonner` on web. Same look: stone-800 pill, amber action
 * button, bottom-centre, optional infinite duration.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastOptions {
  /** Milliseconds, or `Infinity` to require an explicit dismiss. */
  duration?: number;
  action?: ToastAction;
}

interface ToastItem extends ToastOptions {
  id: number;
  message: string;
}

interface ToastApi {
  toast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = nextId++;
      setItems((prev) => [...prev, { id, message, ...options }]);
      const duration = options.duration ?? 4000;
      if (Number.isFinite(duration)) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 24, gap: 8 }}
      >
        {items.map((item) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.duration(200)}
            exiting={FadeOutDown.duration(150)}
            className="mx-4 flex-row items-center justify-between gap-3 rounded-xl border border-stone-700 bg-stone-800 px-4 py-3"
          >
            <Text className="flex-1 text-sm text-stone-200">{item.message}</Text>
            {item.action && (
              <Pressable
                onPress={() => {
                  item.action?.onPress();
                  dismiss(item.id);
                }}
                className="rounded-lg bg-amber-500 px-3 py-1.5"
              >
                <Text className="text-xs font-semibold text-stone-900">{item.action.label}</Text>
              </Pressable>
            )}
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}
