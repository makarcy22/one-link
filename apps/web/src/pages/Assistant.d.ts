import type { Section } from "../lib/sections";
export default function Assistant({ go }: {
    go: (s: Section) => void;
}): import("react").JSX.Element;
