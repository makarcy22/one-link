import type { Section } from "../lib/sections";
export default function Home({ go }: {
    go: (s: Section) => void;
}): import("react").JSX.Element;
