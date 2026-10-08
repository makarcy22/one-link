import type { Section } from "../lib/sections";
export default function Planner({ go }: {
    go: (s: Section) => void;
}): import("react").JSX.Element;
