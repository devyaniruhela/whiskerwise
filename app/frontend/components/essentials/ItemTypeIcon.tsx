import {
  Basket,
  BowlFood,
  Cat,
  Cookie,
  Grains,
  Jar,
  Mouse,
  PawPrint,
  PuzzlePiece,
  Shovel,
  Sparkle,
  Tray,
} from '@phosphor-icons/react/dist/ssr';

/** Phosphor (regular) stand-ins per item type: used while product photography is
 *  pending, and as the fallback whenever an item has no image. Objects only,
 *  never anthropomorphized (DESIGN.md illustration rules). */
type Glyph = React.ComponentType<{ size?: number; 'aria-hidden'?: boolean; className?: string }>;

const ICONS: Record<string, Glyph> = {
  'Bowl/plate': BowlFood, // CSV writes it without spaces; the spaced key never matched
  'Wet food': Jar,
  'Dry food': Grains,
  Treat: Cookie,
  Topper: Sparkle,
  Carrier: Basket,
  Harness: PawPrint,
  Litter: Shovel,
  'Litter box': Tray,
  Scratcher: Cat,
  Toy: Mouse,
  Enrichment: PuzzlePiece,
};

export function ItemTypeIcon({ type, size = 42 }: { type: string; size?: number }) {
  const Icon = ICONS[type] ?? Cat;
  return <Icon size={size} aria-hidden />;
}

/** Shop-by-need tiles: one glyph per item_category (not item_type). */
const NEED_ICONS: Record<string, Glyph> = {
  'Food & feeding': BowlFood,
  Litter: Tray,
  'Toys & enrichment': Mouse,
  'Toppers & treats': Cookie,
  'Carrier & outdoor': Basket,
};

export function NeedIcon({
  category,
  size = 28,
  className,
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  const Icon = NEED_ICONS[category] ?? Cat;
  return <Icon size={size} aria-hidden className={className} />;
}
