---
name: Technical Precision
colors:
  surface: '#101419'
  surface-dim: '#101419'
  surface-bright: '#36393f'
  surface-container-lowest: '#0b0e13'
  surface-container-low: '#181c21'
  surface-container: '#1c2025'
  surface-container-high: '#272a30'
  surface-container-highest: '#31353b'
  on-surface: '#e0e2ea'
  on-surface-variant: '#c0c7d3'
  inverse-surface: '#e0e2ea'
  inverse-on-surface: '#2d3136'
  outline: '#8a919d'
  outline-variant: '#404751'
  surface-tint: '#9fcaff'
  primary: '#9fcaff'
  on-primary: '#003258'
  primary-container: '#007acc'
  on-primary-container: '#ffffff'
  inverse-primary: '#0061a4'
  secondary: '#c8c6c7'
  on-secondary: '#303031'
  secondary-container: '#474648'
  on-secondary-container: '#b6b4b5'
  tertiary: '#ffb784'
  on-tertiary: '#4f2500'
  tertiary-container: '#b95e01'
  on-tertiary-container: '#ffffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#9fcaff'
  on-primary-fixed: '#001d36'
  on-primary-fixed-variant: '#00497d'
  secondary-fixed: '#e4e2e3'
  secondary-fixed-dim: '#c8c6c7'
  on-secondary-fixed: '#1b1b1c'
  on-secondary-fixed-variant: '#474648'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb784'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#713700'
  background: '#101419'
  on-background: '#e0e2ea'
  surface-variant: '#31353b'
typography:
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: Monaco, Menlo, Consolas, 'Courier New', monospace
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  sidebar-padding: 12px
---

## Brand & Style
The design system is engineered to feel like a native extension of the VS Code environment, prioritizing utility, focus, and technical reliability. The brand personality is **Corporate Modern** with a lean toward **Minimalism**, ensuring that the AI functionalities do not distract from the primary coding task but rather feel like a built-in "superpower" for the developer. 

The UI evokes an emotional response of organized efficiency. By utilizing a high-density layout and a palette familiar to developers, the design system minimizes cognitive load. It avoids decorative flourishes in favor of crisp lines, purposeful hierarchy, and immediate feedback, positioning the tool as a professional utility rather than a consumer-grade app.

## Colors
The palette is strictly anchored in the standard VS Code dark theme architecture. 

- **Primary Blue (#007acc):** Reserved for primary actions, focus states, and active indicators. It provides a familiar beacon for user interaction.
- **Backgrounds:** The primary background (#1e1e1e) is used for the main container, while the secondary background (#252526) creates subtle depth for headers, search bars, and input fields.
- **Borders (#3c3c3c):** Used for structural definition between sidebar sections and card boundaries.
- **Typography:** Contrast is managed through shades of gray to maintain readability without causing eye strain. Primary text (#cccccc) is used for content, while muted text (#858585) handles labels and secondary metadata.

## Typography
This design system utilizes **Inter** as a highly legible, systematic substitute for system sans-serifs, ensuring a clean and modern look across all platforms. 

- **Hierarchy:** We use a compact scale. The 13px base size matches the standard IDE editor font size. 
- **Labels:** The 11px size is utilized for metadata, timestamps, and status badges to maximize vertical space in the sidebar.
- **Title:** The 16px title is used sparingly for main section headers to provide clear visual anchoring.
- **Monospace:** For snippets or technical keys within the sidebar, a standard monospace stack is used to maintain the developer-focused context.

## Layout & Spacing
The layout follows a **Fluid Grid** model restricted by the narrow constraints of the IDE sidebar. It relies on a 4px base unit to create a dense, information-rich interface.

- **Margins:** Main sidebar content should maintain a 12px horizontal padding to prevent text from hitting the edge of the panel.
- **Stacking:** Elements like cards and list items use 8px (sm) vertical spacing to group related items, while distinct sections are separated by 16px (lg) or a subtle border.
- **Compactness:** The goal is to maximize visible content. Padding inside cards and buttons is kept tight (4px-8px) to respect the limited horizontal real estate of a sidebar.

## Elevation & Depth
In alignment with the VS Code aesthetic, this design system avoids shadows. Depth is achieved exclusively through **Tonal Layers** and **Low-contrast Outlines**.

- **Level 0 (Main Surface):** #1e1e1e (The default sidebar background).
- **Level 1 (Interacting Surfaces):** #252526 (Used for cards, input fields, and tooltips).
- **Stroke Depth:** A 1px border (#3c3c3c) is used to define boundaries. 
- **Active State:** Depth is signaled by a left-aligned 2px solid primary blue border on active tabs or selected list items, rather than a change in elevation or shadow.

## Shapes
The design system employs **Soft** (1) roundedness. A universal 2px radius is applied to most components (buttons, input fields, and tags), while larger cards may use up to a 4px radius. 

This tight cornering maintains a professional, "engineered" look that aligns with the rectangular nature of code editors and terminal windows, avoiding the playfulness of larger border radii.

## Components
- **Sidebar Tabs:** Horizontal or vertical icons with a high-contrast active state. Active tabs feature the primary blue color and a subtle background shift.
- **Compact Cards:** Flat containers with a #3c3c3c border and #252526 background. Padding is fixed at 8px. Use for skill summaries or AI suggestions.
- **Search Inputs:** Secondary background (#252526) with a 1px border. Includes a 14px magnifying glass icon (1.5px stroke) positioned 8px from the left.
- **Status Badges:** Small 11px text containers with 2px radius. Colors are muted (e.g., low-opacity blue or green) to indicate state without being distracting.
- **Progress Bars:** Thin 4px height tracks. The background is #3c3c3c, with the fill using the primary blue (#007acc). Used for skill mastery checklists.
- **Buttons:** Primary buttons use the primary blue background with white text. Secondary buttons are "ghost" style with a border and no fill.
- **Icons:** All icons are 16px SVG line art with a 1.5px stroke, ensuring they remain sharp and legible at small sizes.