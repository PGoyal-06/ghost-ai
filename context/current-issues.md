Check `/context/screenshots/image.png` for the desired output of the sidebars.


Issues to look for and document:

SIDEBAR ISSUES:

- The left and right sidebars should float OVER the canvas, not push or shrink it
- Sidebars must use position: fixed or position: absolute with a higher z-index so the canvas extends fully behind them
- The canvas background (dotted pattern) should be visible edge-to-edge underneath both sidebars
- Sidebars should have a semi-transparent or solid background with a subtle shadow so they feel elevated above the canvas, not embedded in the layout
- The left sidebar is not fully hiding when toggled off

— it is partially visible or peeking out instead of sliding completely off-screen. When closed, the sidebar should translate fully outside the viewport with no visible remnant. Check for incorrect transform: translateX values, insufficient negative offset, overflow issues on the parent container, or missing overflow: hidden that is causing the sidebar to remain partially visible during or after the close transition.

After documenting all issues fix all of the above so that:

1. The canvas has a dotted background pattern filling the full viewport naturally
2. The canvas feels flush with the surrounding background — no floating, no card effect
3. Box-shadow, excessive borders, and elevated styling are removed from the canvas
4. The canvas looks and feels like an infinite design canvas (similar to Figma or Excalidraw)
5. Both sidebars float over the canvas and are fully hidden when toggled off