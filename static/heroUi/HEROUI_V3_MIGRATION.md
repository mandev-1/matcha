# HeroUI v2 → v3 Migration Summary

## Completed Changes

### 1. Package Updates
- **package.json**: Upgraded React to 19.x, removed all 40+ `@heroui/*` packages, added `@heroui/react@beta` and `@heroui/styles@beta`
- **globals.css**: Replaced `@plugin '../hero.ts'` and `@source '@heroui/theme/...'` with `@import "@heroui/styles"`
- **Deleted**: `hero.ts` (no longer needed)

### 2. Providers & Layout
- **providers.tsx**: Removed `HeroUIProvider` (v3 no longer requires it)
- **layout.tsx**: Moved HeroUI components to `LayoutClient` (client component) - `Toast.Provider`, `ScrollShadow`, `Navbar`, `Sidebar`, etc.
- **LayoutClient.tsx**: New client wrapper for layout structure

### 3. Toast
- **lib/addToast.ts**: Adapter mapping `addToast({title, description, color})` → `toast.success/danger/warning(title, {description})`
- All `addToast` imports updated to use `@/lib/addToast`

### 4. Imports
- All `@heroui/*` imports consolidated to `@heroui/react`

### 5. Compatibility Components Created
- **components/Image.tsx**: v3 has no Image - wrapper using `<img>` with object-fit
- **components/SelectCompat.tsx**: v2 Select API (selectedKeys, onSelectionChange, SelectItem children)
- **components/SelectItem.tsx**: Data carrier for SelectCompat
- **components/ModalCompat.tsx**: v2 Modal API (isOpen, onClose, ModalContent/Header/Body/Footer)
- **components/PaginationCompat.tsx**: Simple page/total/onChange pagination
- **components/Progress.tsx**: Simple progress bar (v3 has no Progress)
- **components/Spacer.tsx**: Simple flex spacer
- **components/Divider.tsx**: Wraps v3 Separator

### 6. Component Updates
- **Card**: CardBody → Card.Content, CardHeader → Card.Header, CardFooter → Card.Footer
- **CustomRadio**: Rewritten to use v3 Radio composition (Radio.Control, Radio.Indicator, Radio.Content)
- **theme-switch**: useSwitch from @heroui/react
- **Navbar**: Custom header (v3 has no Navbar) - div + Link + Button + Dropdown
- **HelpDrawer**: Replaced Drawer with Modal placement="bottom" (bottom sheet style)
- **ServerStatusModal**: Updated to v3 Modal composition (needs ModalCompat for full compatibility)

### 7. State Hooks
- **useDisclosure** → **useOverlayState** (isOpen, open, close, setOpen) across discover, matcha, search, Profile, card-other, LocationMiddleware

### 8. Table & Pagination
- **bot-activity, ranking**: Removed bottomContent, loadingContent, loadingState (v3 Table API differs)
- **Pagination**: Replaced with PaginationCompat (v3 uses composition API)

## Remaining Issues (Build Fails)

### API Differences Requiring Manual Fixes

1. **Input**: v3 uses `onChange` not `onValueChange`, no `endContent`/`startContent`, no `classNames` (use `className`)

2. **Button**: v3 variants are `primary|danger|ghost|outline|secondary|tertiary` - no `light`, `flat`. No `color` prop - use `className` for colors.

3. **Modal**: Many pages still use old Modal API (isOpen, onClose, ModalContent). Need to migrate to ModalCompat or v3 composition:
   - discover/page.tsx, matcha/page.tsx, LocationSetup.tsx, LocationMiddleware.tsx
   - card-other.tsx, search/page.tsx, Profile/page.tsx

4. **Skeleton**: v3 Skeleton has no `children` - use className for dimensions only

5. **Input/TextField**: v3 may use TextField with Label, Description. Check Input vs TextField API.

6. **Form components**: labelPlacement, variant="bordered", isRequired, etc. - verify v3 equivalents

7. **Chip, Slider, Tabs, etc.**: Verify prop compatibility

### Files Still Using Old Patterns
- All Modal usages (except chat block dialog - partial)
- Input with onValueChange, endContent, classNames
- Button with color, variant="light"/"flat"
- Skeleton with children

## Recommended Next Steps

1. **Bulk replace** `variant="light"` → `variant="ghost"` and `variant="flat"` → `variant="secondary"`
2. **Replace all Modal** with ModalCompat + ModalContent/Header/Body/Footer
3. **Input migration**: Replace onValueChange→onChange, endContent→wrap in InputGroup or use slot
4. **Run** `npm run build` and fix type errors iteratively
5. **Manual testing** of each page after build succeeds

## v3 Key API Reference

- **Toast**: `toast()`, `toast.success()`, `toast.danger()`, `toast.warning()`, `Toast.Provider`
- **Modal**: Composition - Modal.Backdrop, Modal.Container, Modal.Dialog, Modal.Header/Body/Footer
- **Card**: Card.Header, Card.Title, Card.Description, Card.Content, Card.Footer
- **Select**: Label, Select.Trigger, Select.Value, Select.Indicator, Select.Popover, ListBox, ListBox.Item
- **Radio**: RadioGroup, Radio with Radio.Control, Radio.Indicator, Radio.Content
