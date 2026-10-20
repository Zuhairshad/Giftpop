import type { Item, ItemPickerStyle, ItemShape } from "@giftpop/contracts";

/**
 * DEMO DATA. A realistic catalogue modelled on what The Giftpop's Instagram feed shows, so the
 * builder looks finished in development and demos. The owner replaces it in the admin app.
 * Names are generic: no real brand names.
 *
 * Fixed 24-hex ids so re-running the seed updates the same documents. Ids …155 onward are later additions. The first 15 ids (…101 to
 * …115) are the original demo items and keep their ids; never reuse or renumber an id.
 */
export const ITEM_IDS = {
  milkBar: "65b000000000000000000101",
  darkBar: "65b000000000000000000102",
  truffleBox: "65b000000000000000000103",
  pinkRose: "65b000000000000000000104",
  whiteLily: "65b000000000000000000105",
  sunflower: "65b000000000000000000106",
  tulip: "65b000000000000000000107",
  bodyLotion: "65b000000000000000000108",
  candle: "65b000000000000000000109",
  bathSalts: "65b000000000000000000110",
  mug: "65b000000000000000000111",
  teddy: "65b000000000000000000112",
  balloon: "65b000000000000000000113",
  greetingCard: "65b000000000000000000114",
  loveNote: "65b000000000000000000115",
  nameBar: "65b000000000000000000116",
  waferFingers: "65b000000000000000000117",
  caramelBar: "65b000000000000000000118",
  whiteBar: "65b000000000000000000119",
  chocAlmonds: "65b000000000000000000120",
  satinRose: "65b000000000000000000121",
  babysBreath: "65b000000000000000000122",
  lavenderBunch: "65b000000000000000000123",
  roseParfum: "65b000000000000000000124",
  oudParfum: "65b000000000000000000125",
  bodyMist: "65b000000000000000000126",
  miniSpray: "65b000000000000000000127",
  deodorant: "65b000000000000000000128",
  roseCandle: "65b000000000000000000129",
  travelCandle: "65b000000000000000000130",
  teaLights: "65b000000000000000000131",
  diffuser: "65b000000000000000000132",
  barNecklace: "65b000000000000000000133",
  cloverBracelet: "65b000000000000000000134",
  pearlStuds: "65b000000000000000000135",
  charmKeychain: "65b000000000000000000136",
  lipGloss: "65b000000000000000000137",
  brushSet: "65b000000000000000000138",
  scrunchies: "65b000000000000000000139",
  clawClip: "65b000000000000000000140",
  redVelvetCupcake: "65b000000000000000000141",
  vanillaCupcake: "65b000000000000000000142",
  cookieTin: "65b000000000000000000143",
  popcorn: "65b000000000000000000144",
  masalaCrisps: "65b000000000000000000145",
  gummyBears: "65b000000000000000000146",
  plushBunny: "65b000000000000000000147",
  starBalloon: "65b000000000000000000148",
  plushKeyring: "65b000000000000000000149",
  glassCup: "65b000000000000000000150",
  tumbler: "65b000000000000000000151",
  photoFrame: "65b000000000000000000152",
  openWhenLetters: "65b000000000000000000153",
  giftWrap: "65b000000000000000000154",
  crunchyChips: "65b000000000000000000155",
  photoBar: "65b000000000000000000156",
  photoCard: "65b000000000000000000157",
  nameMug: "65b000000000000000000158",
  plushPuppy: "65b000000000000000000159",
  cheesePuffs: "65b000000000000000000160",
  chocPretzels: "65b000000000000000000161",
  cakeTopper: "65b000000000000000000162",
  waferRolls: "65b000000000000000000163",
  chocCoins: "65b000000000000000000164",
  satinScrunchie: "65b000000000000000000165",
  hairBow: "65b000000000000000000166",
  pillarCandle: "65b000000000000000000167",
  waxMelts: "65b000000000000000000168",
  polaroids: "65b000000000000000000169",
  frostedCup: "65b000000000000000000170",
  numberBalloon: "65b000000000000000000171",
} as const;

export type ItemKey = keyof typeof ITEM_IDS;

interface Row {
  key: ItemKey;
  name: string;
  shape: ItemShape;
  color: string;
  sizeUnits: number;
  pickerStyle: ItemPickerStyle;
  /** Set for personalizable items: the longest name the customer may add. */
  nameLimit?: number;
}

function row(pickerStyle: ItemPickerStyle) {
  return (
    key: ItemKey,
    name: string,
    shape: ItemShape,
    color: string,
    sizeUnits: number,
    nameLimit?: number,
  ): Row => ({ key, name, shape, color, sizeUnits, pickerStyle, nameLimit });
}
const tile = row("tile");
const list = row("list");

/**
 * Size guide: 1 is a bar, a stem or a card; 2 is a bottle, a jar or a boxed set; 3 is a mug, a
 * frame or a teddy. `tile` items are the pictured heroes of the item grid; `list` items are the
 * smaller extras in the written list under it.
 */
const CATALOGUE: Record<string, Row[]> = {
  Chocolates: [
    tile("milkBar", "Milk chocolate bar", "bar", "#7b4a2d", 1),
    tile("darkBar", "Dark chocolate bar", "bar", "#3e2418", 1),
    tile("truffleBox", "Gold-wrapped hazelnut truffles, box of 8", "box", "#c9a227", 2),
    tile("nameBar", "Chocolate bar with a name wrapper", "bar", "#f4a6b8", 1, 20),
    tile("photoBar", "Printed photo chocolate bar", "bar", "#f7d6e0", 1, 20),
    list("waferFingers", "Wafer chocolate fingers", "bar", "#c8102e", 1),
    list("waferRolls", "Chocolate wafer rolls", "bar", "#b5651d", 1),
    list("caramelBar", "Caramel chocolate bar", "bar", "#a0522d", 1),
    list("whiteBar", "White chocolate bar", "bar", "#f3e9d2", 1),
    list("chocAlmonds", "Chocolate-coated almonds", "jar", "#5a3a2a", 1),
    list("chocCoins", "Milk chocolate coins in gold foil", "jar", "#d4a82f", 1),
  ],
  Flowers: [
    tile("pinkRose", "Pink rose", "flower", "#e75480", 1),
    tile("whiteLily", "White lily", "flower", "#f5f0e6", 1),
    tile("sunflower", "Sunflower", "flower", "#f2b705", 1),
    tile("tulip", "Red tulip", "flower", "#d63a4f", 1),
    tile("satinRose", "Satin ribbon rose", "flower", "#b3122e", 1),
    list("babysBreath", "Baby's breath sprig", "flower", "#f7f7f2", 1),
    list("lavenderBunch", "Dried lavender bunch", "flower", "#9b7fc4", 1),
  ],
  Fragrance: [
    tile("roseParfum", "Rose eau de parfum, 50 ml", "perfume", "#f2b8c6", 2),
    tile("oudParfum", "Oud and amber perfume, 50 ml", "perfume", "#6b3e26", 2),
    list("bodyMist", "Fresh citrus body mist", "bottle", "#ffd166", 2),
    list("miniSpray", "Mini perfume spray, 10 ml", "perfume", "#e8c9e0", 1),
    list("deodorant", "Men's deodorant spray", "bottle", "#1f3a5f", 2),
  ],
  Candles: [
    tile("candle", "Vanilla soy candle", "candle", "#e8c9a0", 2),
    tile("roseCandle", "Rose garden jar candle", "candle", "#f4a6b8", 2),
        list("pillarCandle", "Ivory pillar candle", "candle", "#f3ead8", 2),
    list("travelCandle", "Lavender travel candle", "candle", "#b9a6d8", 1),
    list("teaLights", "Tea lights, set of 6", "candle", "#fff8e7", 1),
    list("diffuser", "Reed diffuser, 100 ml", "bottle", "#d9c7a7", 2),
    list("waxMelts", "Scented wax melts, tin of 6", "jar", "#c9b2f2", 1),
  ],
  Jewellery: [
    tile("barNecklace", "Engraved bar necklace", "necklace", "#d4a82f", 1, 12),
    tile("cloverBracelet", "Four-leaf clover bracelet", "bracelet", "#f3e5ab", 1),
    tile("pearlStuds", "Pearl stud earrings", "jewellery", "#f5f0e6", 1),
    list("charmKeychain", "Heart charm keychain", "jewellery", "#e8467c", 1),
  ],
  Beauty: [
    tile("bodyLotion", "Rose body lotion", "bottle", "#f4a6b8", 2),
    tile("lipGloss", "Tinted lip gloss", "cosmetic", "#e75480", 1),
    tile("brushSet", "Makeup brush set", "cosmetic", "#c9b2f2", 2),
    list("bathSalts", "Lavender bath salts", "jar", "#b9a6d8", 2),
    list("scrunchies", "Satin scrunchies, set of 3", "other", "#f4c2a1", 1),
    list("clawClip", "Pearl hair claw clip", "other", "#f3ead8", 1),
    list("satinScrunchie", "Satin scrunchie", "other", "#e8467c", 1),
    list("hairBow", "Velvet hair bow clip", "other", "#7b1e3a", 1),
  ],
  "Bakes and snacks": [
    tile("redVelvetCupcake", "Red velvet cupcake", "cupcake", "#b3122e", 1),
    tile("vanillaCupcake", "Vanilla sprinkle cupcake", "cupcake", "#fbd5df", 1),
    tile("cookieTin", "Butter cookie tin", "box", "#3b6ea5", 2),
    tile("crunchyChips", "Crunchy chips", "other", "#f2c14e", 1),
    list("popcorn", "Caramel popcorn bag", "other", "#e6b35a", 1),
    list("masalaCrisps", "Spicy masala crisps", "other", "#e4572e", 1),
    list("gummyBears", "Gummy bears pouch", "other", "#ff6f91", 1),
    list("cheesePuffs", "Cheese puffs", "other", "#f08a24", 1),
    list("chocPretzels", "Chocolate-dipped pretzels", "other", "#6b3e26", 1),
    list("cakeTopper", "Cake topper with a message", "card", "#fbd5df", 1, 20),
  ],
  "Soft toys and balloons": [
    tile("teddy", "Soft teddy", "soft-toy", "#c8a27a", 3, 15),
    tile("plushBunny", "Pink plush bunny", "soft-toy", "#f9c6d3", 2),
    tile("plushPuppy", "Plush puppy", "soft-toy", "#d9b99b", 2),
    tile("balloon", "Heart foil balloon", "balloon", "#ff6f91", 1),
    list("starBalloon", "Gold star foil balloon", "balloon", "#d4a82f", 1),
    list("plushKeyring", "Mini plush keyring", "soft-toy", "#e8c9a0", 1),
    list("numberBalloon", "Silver number balloon", "balloon", "#c0c0c8", 1),
  ],
  "Mugs and drinkware": [
    tile("mug", "Ceramic name mug", "mug", "#ffffff", 3, 20),
    tile("nameMug", "Name mug", "mug", "#fbe3e8", 3, 20),
    tile("glassCup", "Floral glass cup with straw", "mug", "#e9f3f5", 3, 15),
    tile("tumbler", "Insulated travel tumbler", "bottle", "#2f5d46", 3),
    list("frostedCup", "Frosted glass cup with straw", "mug", "#dfeef2", 2),
  ],
  "Cards and keepsakes": [
    tile("greetingCard", "Greeting card", "card", "#fff1f5", 1, 30),
    tile("photoCard", "Photo card", "card", "#ffffff", 1, 30),
    tile("photoFrame", "Wooden photo frame", "frame", "#c8a27a", 3, 24),
    list("polaroids", "Polaroid-style photo prints, set of 6", "card", "#f7f7f2", 1),
    list("loveNote", "Love note card", "card", "#fbd5df", 1),
    list("openWhenLetters", "Open-when letters, set of 5", "card", "#f7f1e5", 1),
    list("giftWrap", "Tissue and confetti wrap", "other", "#f9c6d3", 1),
  ],
};

function toItem(category: string, row: Row, index: number): Item {
  const item: Item = {
    id: ITEM_IDS[row.key],
    name: row.name,
    category,
    shape: row.shape,
    color: row.color,
    sizeUnits: row.sizeUnits,
    personalizable: row.nameLimit !== undefined,
    pickerStyle: row.pickerStyle,
    active: true,
    sortOrder: index + 1,
  };
  if (row.nameLimit !== undefined) item.personalizationMaxLength = row.nameLimit;
  return item;
}

/** No images: the renderer draws an illustration from `shape`, tinted by `color`. */
export const ITEMS: Item[] = Object.entries(CATALOGUE).flatMap(([category, rows]) =>
  rows.map((row, index) => toItem(category, row, index)),
);
