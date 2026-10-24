import { useEffect, useState } from "react";

/** True when something has been busy for longer than `ms` (used to explain a slow first request). */
export function useSlow(busy: boolean, ms = 5000): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!busy) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(t);
  }, [busy, ms]);
  return slow;
}
