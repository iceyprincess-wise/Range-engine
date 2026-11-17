import { RangeEngine } from "./components/mockups/range-engine/RangeEngine";

export default function App() {
  // D-2026-11-17-05: the .dark theme tokens in index.css were never
  // applied anywhere, so --popover resolved to the light value and
  // every Select dropdown opened white on the dark page.
  return (
    <div className="dark">
      <RangeEngine />
    </div>
  );
}
