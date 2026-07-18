import {
  Basket,
  BowlFood,
  Cat,
  Cookie,
  Grains,
  Jar,
  Mouse,
  Shovel,
  Sparkle,
  Tray,
} from '@phosphor-icons/react/dist/ssr';

/** Phosphor (regular) stand-ins per item type: used while product photography is
 *  pending, and as the fallback whenever an item has no image. Objects only,
 *  never anthropomorphized (DESIGN.md illustration rules). */
const ICONS: Record<string, React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  'Bowl / plate': BowlFood,
  'Wet food': Jar,
  'Dry food': Grains,
  Treat: Cookie,
  Topper: Sparkle,
  Carrier: Basket,
  Litter: Shovel,
  'Litter box': Tray,
  Scratcher: Cat,
  Toy: Mouse,
};

export function ItemTypeIcon({ type, size = 42 }: { type: string; size?: number }) {
  const Icon = ICONS[type] ?? Cat;
  return <Icon size={size} aria-hidden />;
}
