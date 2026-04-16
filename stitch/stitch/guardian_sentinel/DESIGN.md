# Design System Specification: The Ethereal Sentinel

This document defines the visual and structural language for a premium digital experience focused on security, family, and professional trust. This design system moves beyond the rigid constraints of traditional "dashboard" layouts, embracing an editorial approach that prioritizes tonal depth, atmospheric layering, and sophisticated typography.

## 1. Creative North Star: "The Digital Curator"
The system is built on the philosophy of **The Digital Curator**. It rejects the cluttered, "engineered" look of standard utility apps in favor of a serene, authoritative space. 

*   **Intentional Asymmetry:** Break the predictable grid. Use large-scale typography and offset cards to create a rhythmic, editorial flow.
*   **Atmospheric Depth:** The UI should feel like layers of frosted glass floating in a dark, expansive space.
*   **Silent Authority:** Trust is built through precision and "the absence of noise." We do not use borders to separate ideas; we use space and subtle shifts in light.

---

## 2. Color & Tonal Architecture
The palette is rooted in deep obsidian tones, punctuated by luminous violets and digital blues.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries are defined solely through background color shifts or tonal transitions.
*   **Surface-to-Surface:** Place a `surface-container-high` card on a `surface` background to define its boundary. 
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline-variant` at 15% opacity. Never use 100% opaque borders.

### Surface Hierarchy & Nesting
Treat the UI as physical layers. Each step "up" in the container hierarchy represents closer proximity to the user.
*   **Level 0 (Background):** `surface` (#0e0e10) - The foundation.
*   **Level 1 (Sections):** `surface-container-low` (#131315) - Softly grouping large content areas.
*   **Level 2 (Cards):** `surface-container` (#19191c) - The standard container for interactive elements.
*   **Level 3 (Popovers/Modals):** `surface-container-highest` (#262528) - Floating elements with maximum prominence.

### Signature Textures (Glass & Gradient)
To move beyond a "standard" UI, apply the following:
*   **The Radiant Shield:** Primary CTAs should utilize a gradient from `primary_dim` (#8a4cfc) to `secondary` (#699cff) at a 135-degree angle.
*   **Frosted Glass:** Floating headers or navigation bars must use `surface_container` at 70% opacity with a `backdrop-blur` of 20px.

---

## 3. Typography: Editorial Authority
We utilize **Inter** not as a utility font, but as a bold, editorial statement. The hierarchy is extreme to emphasize importance.

| Role | Token | Size | Weight/Style | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | 3.5rem | 700 / Tight Tracking | Hero headers, Critical status |
| **Headline** | `headline-md` | 1.75rem | 600 | Section titles |
| **Title** | `title-lg` | 1.375rem | 500 | Card headings, Vietnamese titles |
| **Body** | `body-md` | 0.875rem | 400 | General content, descriptions |
| **Label** | `label-md` | 0.75rem | 600 / All-Caps | Metadata, System labels |

**Vietnamese Considerations:** Due to the complexity of Vietnamese diacritics, always increase line-height by 10% for `body-md` and `body-lg` to prevent visual crowding.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are replaced by **Ambient Glows**.

*   **The Layering Principle:** Instead of a drop shadow, elevate a card by moving from `surface-container-low` to `surface-container-high`.
*   **Ambient Shadows:** When an element must "float" (e.g., a modal), use a shadow with a 40px blur at 6% opacity, tinted with the `primary` color (#bd9dff) rather than pure black.
*   **Glassmorphism:** Use semi-transparent surface colors to allow the "luminous" background gradients to bleed through, softening the interface's edges.

---

## 5. Component Logic

### Buttons (The Guardian Actions)
*   **Primary:** Gradient (`primary_dim` to `secondary`). Roundedness: `full`. No border. High-contrast white text (`on_primary_fixed`).
*   **Secondary:** `surface_container_highest` background. Roundedness: `md`. A subtle `on_surface_variant` icon.
*   **Ghost:** Transparent background. Hover state uses `surface_bright` at 10% opacity.

### Input Fields (The Secure Entry)
*   **Base State:** `surface_container_highest` background. Roundedness: `md`. No border.
*   **Focus State:** A 1px "Ghost Border" using `primary` at 40% opacity and a subtle outer glow (4px blur).
*   **Error State:** Background shifts to a 5% opacity `error` tint. Text uses `error_dim`.

### Cards & Lists (The Knowledge Base)
*   **The Divider Ban:** Strictly forbid `hr` tags or divider lines. Separate list items using 12px of vertical white space or by alternating background tints (`surface-container-low` vs `surface-container-lowest`).
*   **Interactive Cards:** On hover, a card should scale slightly (1.02x) and shift its background from `surface-container` to `surface_bright`.

### Signature Icons (Lucide React)
Icons must be used sparingly as "jewelry."
*   **Activity/Shield:** Use `primary` for active states with a subtle 10px outer blur to simulate a "neon" glow.
*   **Stroke Weight:** Use a consistent 1.5px stroke for all Lucide icons to maintain the editorial, light-weight feel.

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme white space. If you think there is enough space, add 16px more.
*   **Do** lean into the Vietnamese typography; let the diacritics breathe by using wide line-heights.
*   **Do** use gradients for "Success" or "Safe" states (`ShieldCheck`) to evoke a sense of premium protection.

### Don't
*   **Don't** use pure black (#000000) for anything other than `surface_container_lowest`. It kills the depth.
*   **Don't** use standard 1px borders. They make the UI look like a spreadsheet.
*   **Don't** use harsh, high-opacity shadows. Light in this system is ambient and soft.
*   **Don't** use more than two icons in a single visual cluster. Keep the "Curator" aesthetic clean.