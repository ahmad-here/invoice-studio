# Design Principles (digest of *Refactoring UI* v1.0.2)

A short, paraphrased summary of the book's rules for use as a design reference in this project. Where the book gives numbers, they are included. Some of the book's scales (the spacing/sizing scale, the hand-crafted type scale and the shadow elevation examples) appear only as images, which the text extraction could not read. Those values are marked *[figure]* and are not reproduced here.

## 0. Process
- Start with a feature, not the app shell (nav, sidebar). Leave details (fonts, shadows, icons) until later.
- Design in grayscale first, so spacing, contrast and size have to carry the hierarchy. Add color afterwards.
- Work in short cycles: design a simple version, build it, then iterate on the real thing. Design the smallest useful version you can ship.
- Pick a personality and keep it consistent. Fonts, color, border radius and wording all set it. A small radius is neutral, a large one feels playful, and none feels formal. Never mix square and rounded corners.
- Limit your choices: define systems in advance for font size, weight, line-height, color, margin, padding, width, height, shadows, border radius, border width and opacity. To choose a value, try a guess and then the values on either side of it.

## 1. Hierarchy
- Visual hierarchy is the most effective tool for making a UI feel "designed". De-emphasize secondary and tertiary content on purpose.
- **Size isn't everything.** Use font weight and color as well as size.
  - Colors for text: dark for primary content, grey for secondary, lighter grey for tertiary.
  - Weights: two are usually enough. Use 400 or 500 for normal text and 600 or 700 for emphasis. Avoid weights under 400 in UI text. To de-emphasize, use a lighter color or a smaller size, not a thinner weight.
- **No grey text on colored backgrounds.** Don't use reduced-opacity white either. Hand-pick a color with the same hue as the background, then adjust its saturation and lightness.
- **Emphasize by de-emphasizing.** Soften the competing elements, such as inactive nav items. Let a sidebar sit on the page background with no fill of its own.
- **Labels are a last resort.** Often the format or context makes the data clear (an email address, a phone number, $19.99). Combine label and value where you can ("12 left in stock", "3 bedrooms"). When you need a label, treat it as secondary: smaller, lower contrast or lighter weight. Emphasize the label only where users scan for it, as in a spec sheet. Even then, the label should be only slightly darker than the value.
- **Separate visual hierarchy from document hierarchy.** Section titles often act as labels and should be small. Choose an h1 or h2 for its meaning, then style it as needed.
- **Balance weight and contrast.** Heavy elements such as solid icons can take a softer color. Light, low-contrast elements such as thin borders can gain emphasis through extra width instead of a darker color.
- **Action hierarchy (buttons).** A page usually has one primary action, a few secondary ones and some tertiary ones.
  - Primary: solid fill with high contrast.
  - Secondary: outline style or a lower-contrast background.
  - Tertiary: styled like a link.
- **Destructive actions.** A destructive action does not automatically get a big, red, bold button. If it isn't the primary action, give it a secondary or tertiary style. Put the big red primary button on the confirmation step, where deleting is the primary action.

## 2. Layout & spacing
- **Start with too much white space,** then remove it until it looks right. Dense UIs such as dashboards are fine, as long as the density is a deliberate choice.
- **Spacing/sizing system.** A linear scale such as "multiples of 4px" doesn't work. No two adjacent values should be closer than about **25%** apart. Start from a **16px** base and build the scale from factors and multiples of it: values sit close together at the small end and spread out further up *[figure]*. Example sizes from the book: going from 12px to 16px is a 33% jump, while 500px to 520px is only 4%. A sample icon scale is 12, 16, 24 and 32px.
- **You don't have to fill the screen.** If something needs only 600px, use 600px. Not everything has to be full width. Try designing mobile-first on a canvas of about **400px**. If a narrow element looks unbalanced in a wide layout, split it into columns (for example, form help text in a side column) rather than stretching it.
- **Grids are overrated.** Not every element should be fluid. Give sidebars a fixed width and let the main content flex. Give cards a **max-width** (the example is 500px) and shrink them only when the screen is narrower than that. Use percentages only when you actually want something to scale.
- **Relative sizing doesn't scale.** Large elements need to shrink faster than small ones on small screens. Example: an 18px body with a 45px headline on desktop, and a 14px body with a 20 to 24px headline on mobile. Don't tie a button's padding to its font size. The sample button uses a 16px font with 16px horizontal and 12px vertical padding. Large buttons get more generous padding and small buttons get disproportionately tighter padding.
- **Avoid ambiguous spacing.** Leave more space around a group than inside it. This applies to label-to-input versus input-to-next-group, to the space above headings, to gaps between list items, and to horizontal groups.

## 3. Typography
- **Type scale.** Define one in advance. A linear scale doesn't work. Modular scales (4:5, 2:3, 1:1.618) produce fractional sizes and too few useful steps for UI work. A rounded 3:4 scale gives 12, 16, 21, 28px. The book recommends a **hand-crafted scale** for UI that lines up with the spacing scale *[figure]*. Use **px or rem, never em**, because nested em values drift off the scale (for example, 1.25em × .875em = 17.5px).
- **Fonts.** A neutral sans-serif is the safe choice, or use the system font stack (-apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue). Skip typefaces with fewer than 5 weights (filter Google Fonts to 10+ styles). Avoid condensed faces with a short x-height for UI text. Popular fonts are a reasonable bet.
- **Line length:** 45 to 75 characters per line, which is a width of about **20 to 35em**. Limit paragraph width even when the content area is wider.
- **Baseline, not center.** When font sizes are mixed on one line, align them on their baselines.
- **Line-height is proportional.**
  - It grows with line width: about 1.5 for narrow text and up to 2 for wide text.
  - It shrinks as font size grows: small text needs a taller line-height, and large headlines can use 1.
- **Links.** In a UI where nearly everything is a link, show it with weight or a darker color instead of a bright link color. Ancillary links can show an underline or color only on hover.
- **Alignment.**
  - Left-align text in left-to-right languages.
  - Center only headlines and short blocks. Anything over 2 or 3 lines should be left-aligned; shorten the text if needed.
  - **Right-align numbers in tables** so the decimal points line up.
  - Justified text must have hyphenation turned on.
- **Letter-spacing.** Usually leave it as the typeface designer set it. Tighten it for headlines set in a wide-spaced family. Increase it for ALL-CAPS text to improve legibility.

## 4. Color
- **Use HSL, not hex.** Hue is measured in degrees (0 red, 120 green, 240 blue). Saturation runs from 0% (grey) upward. Lightness runs from 0% black through 50% pure color to 100% white. HSL is not the same as HSB, and browsers use HSL.
- **You need more colors than you think.**
  - **Greys:** 8 to 10 shades, from a very dark grey (true black looks unnatural) up to white.
  - **Primary:** 5 to 10 shades. Ultra-light shades work as tinted backgrounds (alerts), and dark shades work for text.
  - **Accents:** semantic colors such as red for destructive, yellow for warning and green for positive, each with several shades, used sparingly. A complex UI can need up to 10 colors with 5 to 10 shades each.
- **Define shades up front.** Don't use lighten()/darken() on the fly. Steps:
  1. Pick the base shade (500) so that it works as a button background.
  2. Pick the darkest shade (900) for text and the lightest (100) for tinted backgrounds. An alert component is a good test for both.
  3. Fill in 700 and 300, then 800, 600, 400 and 200.
  4. Build greys the same way: the darkest text color and a subtle off-white background define the ends.
  5. Trust your eyes over the math, and avoid adding shades often.
- **Don't let lightness kill saturation.** Increase saturation as lightness moves away from 50%. You can also rotate the hue to change perceived brightness: toward 60, 180 or 300 degrees to lighten, and toward 0, 120 or 240 degrees to darken. Don't rotate more than 20 to 30 degrees.
- **Greys don't have to be grey.** Saturate greys with blue for a cool feel or yellow/orange for a warm one. Raise saturation at the light and dark ends.
- **Accessibility.** WCAG asks for at least **4.5:1** contrast for normal text (under about 18px) and **3:1** for larger text. If white text on a color needs a very dark background, flip it: put dark colored text on a light colored background. For colored text on a colored background, rotate the hue toward a brighter one (cyan, magenta, yellow).
- **Don't rely on color alone.** Add icons, for example for positive and negative trends. In charts, use light-versus-dark contrast rather than different hues. Color should support what the design already says.

## 5. Depth
- **Light comes from above.** For raised elements, give the top edge a lighter shade (a top border or an inset shadow, with the color hand-picked rather than semi-transparent white) and add a small dark shadow below with a sharp, small blur (a couple of px). For inset elements (wells, inputs, checkboxes), make the bottom edge lighter and add a dark inset shadow at the top. Don't aim for photo-realism.
- **Shadows convey elevation.** A small, tight shadow means slightly raised (buttons). A medium shadow suits dropdowns. A large shadow suits modals. Closer elements draw more focus.
- **Elevation system.** About **5 shadows** are usually plenty. Define the smallest and the largest, then fill in between with roughly linear steps *[figure]*.
- **Interaction.** Add a shadow on drag. Use a smaller shadow, or none, when a button is pressed. Choose shadows by z-position, not by look.
- **Two-part shadows.** One shadow is large and soft with a big y-offset and blur (direct light). The other is tight and dark with a small offset and blur (ambient occlusion). The tight shadow should be clear at low elevation and fade to almost nothing at high elevation.
- **Flat depth.** Lighter than the background reads as raised, and darker reads as inset. Solid shadows (short vertical offset, no blur) also work.
- **Overlap** elements to create layers. Overlapping images need an "invisible border" in the background color.

## 6. Images & icons
- Use good photos from a professional or quality stock (for example Unsplash). Don't design around placeholders.
- **Text on images needs consistent contrast.** Options: a semi-transparent overlay, a lower-contrast image, a colorized image (lower contrast, desaturate, then multiply a solid fill), or a text shadow with a large blur and no offset.
- **Everything has an intended size.** Don't scale 16 to 24px icons up 3 to 4 times. Instead, put a small icon inside a colored shape. Don't shrink full screenshots; take them at a smaller viewport, crop part of the screen, or draw a simplified UI. Redraw favicons at 16px rather than scaling a large logo down.
- **User-uploaded content.** Center it in fixed containers (background-size: cover). Prevent background bleed with a subtle inner box shadow or a semi-transparent inner border rather than a solid border.

## 7. Finishing touches
- **Supercharge the defaults.** Use icons as bullets (checkmarks, arrows, topical icons), make quote marks large and colored, give links custom underlines, and style checkboxes and radios in brand colors.
- **Accent borders.** Add a colored strip across the top of a card, beside an active nav item, along the side of an alert, under a headline, or across the top of the layout.
- **Decorate backgrounds.** Change the background color, use a gradient between two hues no more than about **30 degrees** apart, or add a subtle repeating pattern or simple shapes. Keep the contrast low.
- **Empty states** are a priority, not an afterthought. Use an illustration and emphasize the call to action. Hide tabs and filters that do nothing until content exists.
- **Use fewer borders.** Separate elements with a box shadow (best when the element's color differs from the background), two slightly different background colors, or extra spacing.
- **Think outside the box.** Dropdowns can have sections, columns and icons. Table columns that don't need sorting can be combined with hierarchy, and tables can include images and color. Important radio groups can become selectable cards.

## 8. Forms, tables, buttons (consolidated)
- Forms: leave more space between groups than between a label and its input. Keep the form at its ideal width and move help text into a side column. Inputs and checkboxes can use the inset treatment. Selected states use the brand color.
- Tables: right-align numbers. Combine related columns that don't need sorting. Use color and images to add meaning to data.
- Buttons: one solid primary, then outline or soft secondary, then link-style tertiary. Destructive actions follow the same hierarchy, and red is reserved for the confirmation step. Padding scales independently of font size.

## Applying to an invoice app
Palette: primary `#0692F4`, red `#BB2631`, grey `#6B6B6B`, background `#F7F9FC`, light blue `#EAF5FF`, border `#E5E7EB`, text `#202938`, secondary text `#6B7280`.

1. Build a 100 to 900 HSL scale for `#0692F4` (as the 500/button shade) and for `#BB2631`. Keep the cool greys around `#202938`/`#6B7280` and define every shade up front.
2. Text uses `#202938` for primary content, `#6B7280` for secondary, and a lighter grey for tertiary (footer notes, terms). Use only two weights: 400/500 and 600/700.
3. Each screen gets one solid `#0692F4` primary button (e.g. "Save invoice", "Send"). Secondary actions are outline or `#EAF5FF`-filled. Tertiary actions are link-style.
4. Delete invoice or client is secondary or tertiary on the page. The solid `#BB2631` button appears only in the confirmation dialog.
5. Right-align every amount column (qty, rate, tax, line total, subtotal, total) so decimals line up.
6. Drop "Label: value" where the format speaks for itself (emails, phones, $ amounts, dates). Where labels remain (Invoice #, Due date), make them small and `#6B7280`, and make the values `#202938`.
7. Make the grand total the dominant element through weight and color, not just size. Keep section titles such as "Bill to" or "Items" small, like labels.
8. Use one spacing scale based on 16px with steps at least 25% apart. Start roomy and tighten only where needed. Keep a dense table a deliberate choice.
9. In forms, leave more space between field groups than between a label and its input. Keep the form at its natural width and put help or preview in a second column rather than stretching fields.
10. Give the invoice card or page a max-width instead of a grid percentage. Fix the sidebar width and let the content flex.
11. Use fewer borders. Separate panels with the `#F7F9FC` page and white cards, or soft shadows, and keep `#E5E7EB` for the table rules that really need it.
12. Use a small shadow for cards and buttons, a medium one for dropdowns and a large one for modals, from a set of about 5 shadows.
13. Never show status by color alone. Paid, overdue and draft badges need text or an icon. Use tinted, light backgrounds with dark same-hue text (e.g. `#EAF5FF` with dark blue) rather than white text on saturated color, and check 4.5:1 contrast.
14. Use an accent border for flair: a `#0692F4` top strip on the invoice preview or the active nav item, or a red left border on an overdue alert.
15. Design the empty "No invoices yet" state with an illustration and a prominent "Create invoice" call to action, and hide filters and tabs until invoices exist.
16. Type uses px/rem, a predefined scale and line-height 1.5 for body text (tighter for large headings). Add letter-spacing to any ALL-CAPS labels such as "INVOICE" or table headers.
