# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Design & Theme Guidelines: Consistent Yellow, Gray, and Black UI

The Behold application MUST maintain a consistent, cohesive, and premium design palette throughout all screens and components:

1. **Yellow / Gold (Primary Brand Accent)**:
   - Base Accent: `#FFD700` (Gold Yellow)
   - Secondary Yellows: `#FACC15`, `#EAB308`
   - Use for active states, play buttons, active notes, playheads, selected chips, and primary action highlights.
   - Any text or icon placed on top of a solid yellow background MUST be `#000000` (Black) for high-contrast accessibility.

2. **Black (Deep Surfaces & Backgrounds)**:
   - Pure Black: `#000000`
   - Dark Theme Background: `#121212` / `#151718`
   - Dark Surfaces: `#1E1E1E`
   - Use for the deep background layer, high contrast text on yellow elements, and sheet music ink.

3. **Gray (Scale of Neutrals, Cards, Borders, Subdued Elements)**:
   - Elevated Surfaces & Card Containers: `#1E293B`, `#2C2C2C`
   - High Surfaces & Inactive Chips: `#334155`, `#383838`
   - Borders & Dividers: `#2C2C2C`, `#475569`, `#E5E5E5`
   - Secondary Text & Inactive Icons: `#64748B`, `#94A3B8`, `#9BA1A6`
   - Staff Lines & Light Accents: `#CBD5E1`, `#F1F5F9`, `#FFFFFF`

**Strict Prohibition**:
- Do NOT introduce rogue blues, teals, or cyans (e.g. `#0284C7`, `#38BDF8`, `#0EA5E9`, `#00C2FF`, `#0a7ea4`). All accent elements must strictly utilize the Yellow, Gray, and Black palette.
