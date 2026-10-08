import type { Section } from "../lib/sections";
export default function Create({ go }: {
    go: (s: Section) => void;
}): import("react").JSX.Element;
