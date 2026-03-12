import { useEffect, useState } from "react";

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const check = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.navigator.standalone === true;

      setIsPWA(standalone);
    };

    check();

    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener?.("change", check);

    return () => {
      media.removeEventListener?.("change", check);
    };
  }, []);

  return isPWA;
}
