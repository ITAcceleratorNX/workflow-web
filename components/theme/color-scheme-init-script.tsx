import { COLOR_SCHEME_STORAGE_KEY } from "@/constants/mobile-theme";

/** Blocking script — prevents flash of wrong background before React hydration. */
export function ColorSchemeInitScript() {
  const script = `
(function() {
  try {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    var scheme = 'dark';
    var raw = localStorage.getItem('${COLOR_SCHEME_STORAGE_KEY}');
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed.state && parsed.state.colorScheme) {
        scheme = parsed.state.colorScheme;
      }
    }
    if (scheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
