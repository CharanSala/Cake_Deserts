export type DessertCategory = 'all' | 'pastries' | 'chocolates' | 'verrines';

export interface ProductVariant {
  label: string;
  price: number;
}

export interface DessertItem {
  id: string;
  slug: string;
  number: string;
  name: string;
  frenchSubtitle: string;
  category: Exclude<DessertCategory, 'all'>;
  price: number;
  variants: ProductVariant[];
  shortDescription: string;
  fullDescription: string;
  ingredients: string[];
  flavorNotes: string[];
  craftDetail: string;
  modelPath: string;
  blendPath: string;
  fallbackImage: string;
  layoutVariant: 'wide-ivory' | 'tall-cream' | 'espresso-feature' | 'rose-offset';
  cameraPosition: [number, number, number];
  modelYOffset?: number;
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const DESSERTS: DessertItem[] = [
  {
    id: 'cupcake',
    slug: 'cupcake',
    number: '01',
    name: 'Rose & Tahitian Vanilla Cupcake',
    frenchSubtitle: 'Petit Gâteau à la Rose',
    category: 'pastries',
    price: 580,
    variants: [
      { label: 'Single Piece', price: 580 },
      { label: 'Coffret of 4', price: 2150 },
      { label: 'Atelier Box of 8', price: 4100 },
    ],
    shortDescription:
      'Velvet cocoa sponge crowned with rosewater buttercream and spun gold pearls.',
    fullDescription:
      'Baked in small fluted batches using single-origin dark cocoa and cultured Normandy butter, finished with airy Swiss meringue buttercream infused with Damask rose distillate.',
    ingredients: [
      '70% Valrhona Cocoa Sponge',
      'Damask Rosewater Buttercream',
      'Madagascar Bourbon Vanilla',
      'Cultured Normandy Butter',
      '24k Gold Sugar Dragees',
    ],
    flavorNotes: ['Floral Rose', 'Velvet Cocoa', 'Silky Cream'],
    craftDetail: 'Hand-piped star-tip rosette • Daily small batch',
    modelPath: '/models/cupcake.glb',
    blendPath: '/assets/blender/cupcake.blend',
    fallbackImage: '/images/cupcake.svg',
    layoutVariant: 'tall-cream',
    cameraPosition: [2.1, 1.45, 2.35],
    modelYOffset: -0.68,
  },
  {
    id: 'brownie',
    slug: 'brownie',
    number: '02',
    name: 'Crinkle-Crust Guanaja Brownie',
    frenchSubtitle: 'Carré Fondant au Chocolat Noir',
    category: 'chocolates',
    price: 680,
    variants: [
      { label: 'Single Square', price: 680 },
      { label: 'Box of 4', price: 2500 },
      { label: 'Gift Tin of 6', price: 3650 },
    ],
    shortDescription:
      'Double-baked dark chocolate squares with roasted cocoa chunks and gold leaf.',
    fullDescription:
      'Prepared from melted 70% Guanaja couverture, browned hazelnut butter, and roasted cocoa nibs for an eggshell-thin crinkle crust over a dense ganache center.',
    ingredients: [
      '70% Guanaja Dark Couverture',
      'Noisette Browned Butter',
      'Roasted Cocoa Chunks',
      'Fleur de Sel de Guérande',
      'Edible Gold Leaf Accent',
    ],
    flavorNotes: ['Roasted Cacao', 'Toasted Hazelnut', 'Sea Salt'],
    craftDetail: 'Slow-cooled 12 hours for truffle crumb',
    modelPath: '/models/brownie.glb',
    blendPath: '/assets/blender/brownie.blend',
    fallbackImage: '/images/brownie.svg',
    layoutVariant: 'wide-ivory',
    cameraPosition: [2.25, 1.5, 2.1],
    modelYOffset: -0.45,
  },
  {
    id: 'cake-pops',
    slug: 'cake-pops',
    number: '03',
    name: 'Trio of Couture Cake Pops',
    frenchSubtitle: 'Sucettes de Gâteau Glacées',
    category: 'chocolates',
    price: 950,
    variants: [
      { label: 'Tasting Trio (3 pcs)', price: 950 },
      { label: 'Salon Bouquet (6 pcs)', price: 1800 },
      { label: 'Celebration Box (12 pcs)', price: 3400 },
    ],
    shortDescription:
      'Three cake jewels dipped in dark mirror, ruby rose, and blonde caramel chocolate.',
    fullDescription:
      'Hand-rolled chocolate genoise blended with warm espresso ganache and individually dipped in tempered dark, ruby, and caramelized blonde chocolate.',
    ingredients: [
      'Espresso Genoise Crumb',
      'Tempered Dark & Ruby Chocolate',
      'Caramelized Blonde Glaze',
      'Salted Caramel Ganache',
      'Crisp Ivory Ribbons',
    ],
    flavorNotes: ['Bittersweet Cocoa', 'Silky Caramel', 'Crisp Shell'],
    craftDetail: 'Triple-tempered shell • Hand-ribboned finish',
    modelPath: '/models/cake-pops.glb',
    blendPath: '/assets/blender/cake-pops.blend',
    fallbackImage: '/images/cake-pops.svg',
    layoutVariant: 'espresso-feature',
    cameraPosition: [2.3, 1.35, 2.55],
    modelYOffset: -0.78,
  },
  {
    id: 'cake-truffles',
    slug: 'cake-truffles',
    number: '04',
    name: 'Artisan Grand Cru Cake Truffles',
    frenchSubtitle: 'Truffes Pâtissières Assorties',
    category: 'chocolates',
    price: 1150,
    variants: [
      { label: 'Tasting Trio (3 pcs)', price: 1150 },
      { label: 'Signature Coffret (6 pcs)', price: 2200 },
      { label: 'Grand Coffret (12 pcs)', price: 4200 },
    ],
    shortDescription:
      'Dutch-cocoa dusted, Piedmont hazelnut praline, and rose gold-leaf bonbons.',
    fullDescription:
      'Each bonbon marries moist almond sponge with velvety dark ganache inside pleated parchment cups—balancing earthy cocoa with roasted Piedmont crunch.',
    ingredients: [
      'Ecuadorian Dark Ganache',
      'Piedmont Roasted Hazelnuts',
      'Almond Biscuit Heart',
      'Raw Alkalized Cocoa Dust',
      '24k Gold Foil Leaf',
    ],
    flavorNotes: ['Earthy Cocoa', 'Hazelnut', 'Warm Almond'],
    craftDetail: 'Hand-rolled in small bonbon batches',
    modelPath: '/models/cake-truffles.glb',
    blendPath: '/assets/blender/cake-truffles.blend',
    fallbackImage: '/images/cake-truffles.svg',
    layoutVariant: 'rose-offset',
    cameraPosition: [2.2, 1.55, 2.25],
    modelYOffset: -0.35,
  },
  {
    id: 'swiss-roll',
    slug: 'swiss-roll',
    number: '05',
    name: 'Chantilly & Vanilla Swiss Roll',
    frenchSubtitle: 'Roulé Soufflé à la Vanille',
    category: 'pastries',
    price: 850,
    variants: [
      { label: 'Artisan Slice', price: 850 },
      { label: 'Half Roll (4 servings)', price: 2400 },
      { label: 'Whole Roll (8 servings)', price: 4500 },
    ],
    shortDescription:
      'Featherlight chiffon sponge spiraled around whipped vanilla Chantilly and ganache.',
    fullDescription:
      'Whipped meringue folds gently into warm sponge batter and rolls tightly around cold Madagascar vanilla bean cream for an unbroken architectural spiral.',
    ingredients: [
      'Whipped Chiffon Sponge',
      'Madagascar Vanilla Chantilly',
      'Crème Fraîche Fold',
      'Dark Chocolate Ganache Stripes',
      'Pasture Eggs',
    ],
    flavorNotes: ['Featherlight Sponge', 'Sweet Cream', 'Dark Ganache'],
    craftDetail: 'Hand-rolled warm in linen cloth',
    modelPath: '/models/swiss-roll.glb',
    blendPath: '/assets/blender/swiss-roll.blend',
    fallbackImage: '/images/swiss-roll.svg',
    layoutVariant: 'wide-ivory',
    cameraPosition: [2.2, 1.25, 2.45],
    modelYOffset: -0.45,
  },
  {
    id: 'pastry',
    slug: 'pastry',
    number: '06',
    name: 'Mille-Feuille Royale',
    frenchSubtitle: 'Pâtisserie Feuilletée aux Deux Crèmes',
    category: 'pastries',
    price: 920,
    variants: [
      { label: 'Individual Tartlet', price: 920 },
      { label: 'Duo Tasting Box (2 pcs)', price: 1780 },
      { label: 'Salon Share (4 pcs)', price: 3450 },
    ],
    shortDescription:
      'Caramelized puff-pastry tiers layered with diplomat cream and mirror chocolate.',
    fullDescription:
      'Seventy-two hours of cold butter lamination yield crisp caramelized puff pastry layered between vanilla-bean crème diplomat, rose pearls, and 24k gold leaf.',
    ingredients: [
      'Inverted Normandy Puff Pastry',
      'Vanilla Bean Crème Diplomat',
      'Rose Chantilly Pearls',
      'Tempered Mirror Chocolate',
      '24k Edible Gold Leaf',
    ],
    flavorNotes: ['Caramelized Butter', 'Vanilla Bean', 'Crisp Feuilletage'],
    craftDetail: '72-hour cold lamination • Assembled fresh',
    modelPath: '/models/pastry.glb',
    blendPath: '/assets/blender/pastry.blend',
    fallbackImage: '/images/pastry.svg',
    layoutVariant: 'tall-cream',
    cameraPosition: [2.15, 1.35, 2.35],
    modelYOffset: -0.55,
  },
  {
    id: 'mousse',
    slug: 'mousse',
    number: '07',
    name: 'Tri-Layer Velvet Chocolate Mousse',
    frenchSubtitle: 'Verrine Mousse Trois Chocolats',
    category: 'verrines',
    price: 890,
    variants: [
      { label: 'Crystal Verrine (1 pc)', price: 890 },
      { label: 'Tasting Duo (2 pcs)', price: 1680 },
      { label: 'Evening Set (4 pcs)', price: 3200 },
    ],
    shortDescription:
      'Crystal verrine layered with dark ganache mousse, praline cloud, and rose cream.',
    fullDescription:
      'Presented in a fluted dessert glass revealing 72% dark mousse at the base, milk-chocolate praline in the center, and blush rose Chantilly crowned with a chocolate curl.',
    ingredients: [
      '72% Single-Estate Dark Mousse',
      'Milk Chocolate Praline Cloud',
      'Rose Vanilla Chantilly',
      'Whipped Pâte à Bombe',
      'Tempered Chocolate Curl',
    ],
    flavorNotes: ['Silky Bittersweet', 'Praline', 'Airy Cream'],
    craftDetail: 'Aerated via French pâte à bombe',
    modelPath: '/models/mousse.glb',
    blendPath: '/assets/blender/mousse.blend',
    fallbackImage: '/images/mousse.svg',
    layoutVariant: 'espresso-feature',
    cameraPosition: [2.1, 1.4, 2.3],
    modelYOffset: -0.75,
  },
  {
    id: 'cake-rusk',
    slug: 'cake-rusk',
    number: '08',
    name: 'Golden Almond Cake Rusk',
    frenchSubtitle: 'Biscuit Doré Double Cuisson',
    category: 'verrines',
    price: 1050,
    variants: [
      { label: 'Tea Box (8 pcs)', price: 1050 },
      { label: 'Salon Tin (16 pcs)', price: 1950 },
    ],
    shortDescription:
      'Twice-baked golden rectangular rusks with clarified butter, almonds, and cardamom.',
    fullDescription:
      'Rich butter pound cake sliced warm and slow-toasted a second time until every porous crumb turns delicate, crisp, and luminous amber gold.',
    ingredients: [
      'Clarified Cultured Butter',
      'Marcona Almond Flour',
      'Green Cardamom Infusion',
      'Unbleached French Flour',
      'Demerara Sugar Crust',
    ],
    flavorNotes: ['Toasted Butter', 'Warm Almond', 'Crisp Crunch'],
    craftDetail: 'Slow twice-baked 4 hours',
    modelPath: '/models/cake-rusk.glb',
    blendPath: '/assets/blender/cake-rusk.blend',
    fallbackImage: '/images/cake-rusk.svg',
    layoutVariant: 'rose-offset',
    cameraPosition: [2.25, 1.45, 2.25],
    modelYOffset: -0.45,
  },
  {
    id: 'eclair',
    slug: 'eclair',
    number: '09',
    name: 'Mirror-Glazed Chocolate Éclair',
    frenchSubtitle: 'Éclair au Chocolat Grand Cru',
    category: 'pastries',
    price: 740,
    variants: [
      { label: 'Single Éclair', price: 740 },
      { label: 'Box of 4', price: 2800 },
      { label: 'Atelier Box of 6', price: 4050 },
    ],
    shortDescription:
      'Golden choux shell filled with Madagascar vanilla cream and dark mirror fondant.',
    fullDescription:
      'Baked hollow and crisp-golden, generously piped end-to-end with vanilla-bean crème pâtissière, dipped in mirror dark fondant, and signed in gold cocoa filigree.',
    ingredients: [
      'Crisp Choux Pastry Shell',
      'Madagascar Crème Pâtissière',
      '66% Dark Mirror Fondant',
      'Tahitian Vanilla Pods',
      'Gold Cocoa Filigree',
    ],
    flavorNotes: ['Toasted Choux', 'Silky Vanilla', 'Mirror Cocoa'],
    craftDetail: 'Precision hearth bake • Hand-dipped glaze',
    modelPath: '/models/eclair.glb',
    blendPath: '/assets/blender/eclair.blend',
    fallbackImage: '/images/eclair.svg',
    layoutVariant: 'wide-ivory',
    cameraPosition: [2.05, 1.35, 2.35],
    modelYOffset: -0.32,
  },
  {
    id: 'tiramisu',
    slug: 'tiramisu',
    number: '10',
    name: 'Venetian Espresso Tiramisu',
    frenchSubtitle: 'Tiramisu Classique au Mascarpone',
    category: 'verrines',
    price: 980,
    variants: [
      { label: 'Individual Portion', price: 980 },
      { label: 'Table Dish (4 servings)', price: 3400 },
      { label: 'Grand Salon Tray (8 servings)', price: 6400 },
    ],
    shortDescription:
      'Espresso-soaked Savoiardi biscuits under whipped mascarpone peaks and cocoa veil.',
    fullDescription:
      'Crisp house-baked ladyfingers dipped in fresh dark roast espresso, layered with Lombardy mascarpone zabaglione, piped into satin pillows and dusted with raw cocoa.',
    ingredients: [
      'Lombardy Artisanal Mascarpone',
      'Single-Origin Italian Espresso',
      'House-Baked Savoiardi Biscuits',
      'Marsala & Vanilla Zabaglione',
      'Raw Dutch Cocoa Veil',
    ],
    flavorNotes: ['Fresh Espresso', 'Velvet Mascarpone', 'Bittersweet Cocoa'],
    craftDetail: '24-hour rested infusion • Fresh cocoa dust',
    modelPath: '/models/tiramisu.glb',
    blendPath: '/assets/blender/tiramisu.blend',
    fallbackImage: '/images/tiramisu.svg',
    layoutVariant: 'tall-cream',
    cameraPosition: [2.15, 1.5, 2.3],
    modelYOffset: -0.48,
  },
];

export const SIGNATURE_CAKE_PRODUCT: DessertItem = {
  id: 'signature-cake',
  slug: 'recipe-cake',
  number: '00',
  name: 'The ÉCLAT Signature Layer Cake',
  frenchSubtitle: 'Gâteau Signature Trois Étages',
  category: 'pastries',
  price: 5400,
  variants: [
    { label: '6" Petite Celebration (6–8 slices)', price: 5400 },
    { label: '8" Grand Salon (12–14 slices)', price: 7800 },
  ],
  shortDescription:
    'Three dark cocoa sponge tiers layered with rose Chantilly, mirror ganache drip, and 24k gold leaf.',
  fullDescription:
    'Our flagship bespoke celebration cake—built layer by layer with stone-baked dark chocolate sponge, Damascus rose Chantilly cream, tempered Valrhona drip glaze, and edible gold leaf.',
  ingredients: [
    '70% Single-Origin Dark Cocoa Sponge',
    'Rosewater Chantilly Filling',
    'Tempered Valrhona Mirror Drip',
    'Hand-Curled Dark Chocolate Ribbons',
    '24k Edible Gold Leaf',
  ],
  flavorNotes: ['Deep Cacao', 'Damask Rose', 'Velvet Ganache'],
  craftDetail: 'Bespoke atelier piece • Gold presentation box',
  modelPath: '/models/recipe-cake.glb',
  blendPath: '/assets/blender/recipe-cake.blend',
  fallbackImage: '/images/recipe-step-5.svg',
  layoutVariant: 'espresso-feature',
  cameraPosition: [2.25, 1.55, 2.45],
};

export const HERO_DESSERT = DESSERTS.find((d) => d.slug === 'pastry')!;
export const FEATURED_DESSERT = DESSERTS.find((d) => d.slug === 'tiramisu')!;
