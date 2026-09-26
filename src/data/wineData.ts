// Curated Unsplash photo IDs grouped by wine style. Using stable photo IDs
// (rather than keyword search) keeps the images consistent across deploys.
const RED_WINE_PHOTO = "1510812431401-41d2bd2722f3";
const WHITE_WINE_PHOTO = "1506377247377-2a5b3b417ebb";
const ROSE_WINE_PHOTO = "1558346490-a72e53ae2d4f";
const SPARKLING_PHOTO = "1547595628-c61a29f496f0";
const DESSERT_PHOTO = "1568213816046-0ee1c42bd559";
const POUR_PHOTO = "1474722883778-792e7990302f";
const GRAPES_PHOTO = "1535688269728-49b3b6da1f0d";
const CELLAR_PHOTO = "1506377247377-2a5b3b417ebb";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80";

function imageFor(color, photo) {
  const id = photo || RED_WINE_PHOTO;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;
}

function imageByColor(color) {
  if (color === "Red") return imageFor(color, RED_WINE_PHOTO);
  if (color === "White") return imageFor(color, WHITE_WINE_PHOTO);
  if (color === "Rose") return imageFor(color, ROSE_WINE_PHOTO);
  if (color === "Sparkling") return imageFor(color, SPARKLING_PHOTO);
  if (color === "Dessert") return imageFor(color, DESSERT_PHOTO);
  return FALLBACK_IMAGE;
}

export { imageByColor, FALLBACK_IMAGE };

export const tasteParameters = [
  {
    id: "acidity",
    label: "Acidity",
    low: "Soft",
    high: "Sharp",
    help: "How bright, fresh, or mouth-watering the wine feels.",
  },
  {
    id: "body",
    label: "Body",
    low: "Light",
    high: "Full",
    help: "The weight and richness of the wine on your palate.",
  },
  {
    id: "tannin",
    label: "Tannin",
    low: "Silky",
    high: "Grippy",
    help: "The drying texture, common in red wines.",
  },
  {
    id: "sweetness",
    label: "Sweetness",
    low: "Dry",
    high: "Sweet",
    help: "How much sugar or ripe sweetness you perceive.",
  },
  {
    id: "alcohol",
    label: "Alcohol warmth",
    low: "Cool",
    high: "Warm",
    help: "The heat or weight from alcohol.",
  },
  {
    id: "fruit",
    label: "Fruit intensity",
    low: "Subtle",
    high: "Expressive",
    help: "How strongly fruit aromas and flavors stand out.",
  },
];

const p = {
  pinotNoir: {
    acidity: 4,
    body: 2,
    tannin: 2,
    sweetness: 1,
    alcohol: 2,
    fruit: 3,
  },
  cab: { acidity: 3, body: 5, tannin: 5, sweetness: 1, alcohol: 4, fruit: 4 },
  merlot: {
    acidity: 3,
    body: 4,
    tannin: 3,
    sweetness: 1,
    alcohol: 3,
    fruit: 4,
  },
  syrah: { acidity: 3, body: 5, tannin: 4, sweetness: 1, alcohol: 4, fruit: 5 },
  sangiovese: {
    acidity: 5,
    body: 3,
    tannin: 4,
    sweetness: 1,
    alcohol: 3,
    fruit: 3,
  },
  chardonnay: {
    acidity: 3,
    body: 4,
    tannin: 1,
    sweetness: 1,
    alcohol: 3,
    fruit: 3,
  },
  sauvBlanc: {
    acidity: 5,
    body: 2,
    tannin: 1,
    sweetness: 1,
    alcohol: 2,
    fruit: 4,
  },
  riesling: {
    acidity: 5,
    body: 2,
    tannin: 1,
    sweetness: 3,
    alcohol: 2,
    fruit: 4,
  },
  prosecco: {
    acidity: 4,
    body: 1,
    tannin: 1,
    sweetness: 2,
    alcohol: 1,
    fruit: 4,
  },
  rose: { acidity: 4, body: 2, tannin: 1, sweetness: 1, alcohol: 2, fruit: 3 },
  tempranillo: {
    acidity: 4,
    body: 4,
    tannin: 4,
    sweetness: 1,
    alcohol: 3,
    fruit: 4,
  },
  malbec: {
    acidity: 3,
    body: 5,
    tannin: 4,
    sweetness: 1,
    alcohol: 4,
    fruit: 5,
  },
  zinfandel: {
    acidity: 3,
    body: 5,
    tannin: 4,
    sweetness: 2,
    alcohol: 5,
    fruit: 5,
  },
  nebbiolo: {
    acidity: 4,
    body: 4,
    tannin: 5,
    sweetness: 1,
    alcohol: 4,
    fruit: 3,
  },
  gamay: { acidity: 4, body: 2, tannin: 2, sweetness: 1, alcohol: 2, fruit: 4 },
  pinotGrigio: {
    acidity: 4,
    body: 2,
    tannin: 1,
    sweetness: 1,
    alcohol: 2,
    fruit: 3,
  },
  pinotGris: {
    acidity: 3,
    body: 3,
    tannin: 1,
    sweetness: 2,
    alcohol: 3,
    fruit: 4,
  },
  viognier: {
    acidity: 3,
    body: 4,
    tannin: 1,
    sweetness: 2,
    alcohol: 4,
    fruit: 5,
  },
  gewurz: {
    acidity: 3,
    body: 4,
    tannin: 1,
    sweetness: 3,
    alcohol: 4,
    fruit: 5,
  },
  chenin: {
    acidity: 5,
    body: 3,
    tannin: 1,
    sweetness: 2,
    alcohol: 2,
    fruit: 3,
  },
  semillon: {
    acidity: 4,
    body: 2,
    tannin: 1,
    sweetness: 1,
    alcohol: 2,
    fruit: 2,
  },
  gruner: {
    acidity: 4,
    body: 3,
    tannin: 1,
    sweetness: 1,
    alcohol: 3,
    fruit: 3,
  },
  albarino: {
    acidity: 5,
    body: 2,
    tannin: 1,
    sweetness: 1,
    alcohol: 2,
    fruit: 4,
  },
  verdejo: {
    acidity: 4,
    body: 2,
    tannin: 1,
    sweetness: 1,
    alcohol: 2,
    fruit: 3,
  },
  champagne: {
    acidity: 5,
    body: 2,
    tannin: 1,
    sweetness: 1,
    alcohol: 3,
    fruit: 3,
  },
  cava: { acidity: 4, body: 2, tannin: 1, sweetness: 1, alcohol: 2, fruit: 3 },
  franciacorta: {
    acidity: 4,
    body: 3,
    tannin: 1,
    sweetness: 1,
    alcohol: 3,
    fruit: 3,
  },
  moscato: {
    acidity: 4,
    body: 2,
    tannin: 1,
    sweetness: 5,
    alcohol: 1,
    fruit: 5,
  },
  sauternes: {
    acidity: 4,
    body: 4,
    tannin: 1,
    sweetness: 5,
    alcohol: 3,
    fruit: 5,
  },
  port: { acidity: 3, body: 4, tannin: 3, sweetness: 5, alcohol: 4, fruit: 4 },
  sherry: {
    acidity: 3,
    body: 4,
    tannin: 1,
    sweetness: 2,
    alcohol: 5,
    fruit: 3,
  },
  pinotage: {
    acidity: 3,
    body: 4,
    tannin: 3,
    sweetness: 1,
    alcohol: 4,
    fruit: 4,
  },
  torrontes: {
    acidity: 4,
    body: 2,
    tannin: 1,
    sweetness: 1,
    alcohol: 3,
    fruit: 5,
  },
  superTuscan: {
    acidity: 4,
    body: 5,
    tannin: 4,
    sweetness: 1,
    alcohol: 4,
    fruit: 4,
  },
};

// Compact wine definitions; image URLs are picked from a small palette
// of curated Unsplash photos so the bundle stays light and the look
// remains consistent.
function img(color) {
  return imageByColor(color);
}

// Vintage library. Each wine gets 2-3 recent vintages. A vintage is a
// concrete bottle-year for a wine: the year the grapes were harvested
// and a short tasting note that reflects what that specific year was
// like. Adding vintages lets the React finder answer "what was the
// 2020 Penfolds like?" in addition to "what does a generic Penfolds
// taste like?".
const VINTAGE_LIBRARY = {
  "pinot-noir": [
    {
      year: 2018,
      prompt:
        "Cool, savoury vintage. Red cherry, forest floor, and a long, mineral finish.",
    },
    {
      year: 2020,
      prompt:
        "Vibrant and perfumed. Bright raspberry, rose petal, and lifted acidity.",
    },
    {
      year: 2022,
      prompt:
        "Generous, sun-kissed year. Plump red fruit, fine tannin, and a velvety mid-palate.",
    },
  ],
  "cabernet-sauvignon": [
    {
      year: 2018,
      prompt:
        "Classic, structured vintage. Cassis, cedar, graphite, and firm, age-worthy tannin.",
    },
    {
      year: 2020,
      prompt:
        "Elegant and cool. Blackcurrant, mint, and a slate-driven finish.",
    },
    {
      year: 2021,
      prompt:
        "Powerful and concentrated. Black fruit, cocoa, and a long, warming finish.",
    },
  ],
  merlot: [
    {
      year: 2019,
      prompt:
        "Plush and approachable. Plum, chocolate, and a soft, rounded tannin.",
    },
    {
      year: 2021,
      prompt:
        "Bright and fresh. Red cherry, herbs, and a medium-bodied, food-friendly frame.",
    },
  ],
  "syrah-shiraz": [
    {
      year: 2018,
      prompt:
        "Cool-climate elegance. White pepper, violet, and finely wrought tannin.",
    },
    {
      year: 2020,
      prompt:
        "Warm and generous. Blackberry jam, clove, and warm, baking-spice finish.",
    },
    {
      year: 2022,
      prompt:
        "Bold Barossa style. Dark fruit, chocolate, licorice, and plush alcohol.",
    },
  ],
  sangiovese: [
    {
      year: 2019,
      prompt:
        "Classic Chianti year. Sour cherry, dried herbs, and a tangy, food-friendly acidity.",
    },
    {
      year: 2021,
      prompt:
        "Riper, more generous. Red plum, leather, and a savoury, sun-warmed finish.",
    },
  ],
  chardonnay: [
    {
      year: 2019,
      prompt:
        "Linear and mineral. Lemon pith, oyster shell, and a long, saline finish.",
    },
    {
      year: 2021,
      prompt:
        "Generous and creamy. Stone fruit, hazelnut, and gentle French oak.",
    },
  ],
  "sauvignon-blanc": [
    {
      year: 2020,
      prompt:
        "Classic Marlborough. Lime, passionfruit, and a crisp, herbaceous finish.",
    },
    {
      year: 2022,
      prompt:
        "Softer, riper style. Stone fruit, citrus, and a rounder, more textural palate.",
    },
  ],
  riesling: [
    {
      year: 2018,
      prompt:
        "Off-dry Mosel classic. Lime, green apple, slate, and a long, filigree finish.",
    },
    {
      year: 2021,
      prompt:
        "Bone-dry Clare Valley. Lemon, bath salt, and a steely, dry finish.",
    },
  ],
  prosecco: [
    {
      year: 2021,
      prompt: "Fresh and zippy. Pear, green apple, and lively, frothy bubbles.",
    },
    {
      year: 2022,
      prompt:
        "Softer and riper. White peach, honeysuckle, and a creamy, easy-drinking mousse.",
    },
  ],
  rose: [
    {
      year: 2021,
      prompt:
        "Pale, dry Provence style. Strawberry, melon, and a crisp, saline finish.",
    },
    {
      year: 2023,
      prompt:
        "Bright, juicy, and aromatic. Red berries, citrus zest, and a clean, dry finish.",
    },
  ],
  tempranillo: [
    {
      year: 2018,
      prompt:
        "Traditional Rioja. Red cherry, dill, American oak, and silky tannin.",
    },
    {
      year: 2020,
      prompt:
        "Riper, more modern. Black cherry, vanilla, and a richer, fuller body.",
    },
  ],
  malbec: [
    {
      year: 2019,
      prompt:
        "Concentrated Mendoza vintage. Plum, violet, cocoa, and rich, velvety tannin.",
    },
    {
      year: 2021,
      prompt:
        "Cooler, more elegant. Red fruit, herbs, and a fresh, structured finish.",
    },
  ],
  zinfandel: [
    {
      year: 2018,
      prompt:
        "Ripe, heady vintage. Brambleberry, black pepper, vanilla, and warm alcohol.",
    },
    {
      year: 2020,
      prompt:
        "Bright and balanced. Red fruit, spice, and a more elegant, food-friendly frame.",
    },
  ],
  nebbiolo: [
    {
      year: 2017,
      prompt:
        "Classic Barolo. Tar, rose, dried cherry, and a long, firm, age-worthy finish.",
    },
    {
      year: 2019,
      prompt:
        "Softer, more approachable vintage. Red berries, herbs, and refined tannin.",
    },
  ],
  gamay: [
    {
      year: 2021,
      prompt:
        "Bright, juicy Cru Beaujolais. Red berries, granite minerality, and low tannin.",
    },
    {
      year: 2022,
      prompt:
        "Easy, bouncy and chillable. Cherry, banana, and a soft, juicy finish.",
    },
  ],
  "pinot-grigio": [
    {
      year: 2021,
      prompt:
        "Crisp Alto Adige style. Pear, almond, and a clean, mineral finish.",
    },
    {
      year: 2022,
      prompt:
        "Softer, riper Italian pinot grigio. Lemon, melon, and a rounder, moreish finish.",
    },
  ],
  "pinot-gris": [
    {
      year: 2019,
      prompt:
        "Rich, Alsace style. Pear, honey, ginger, and a touch of residual sweetness.",
    },
    {
      year: 2021,
      prompt:
        "Dry, mineral Oregon gris. Stone fruit, white flowers, and a clean, savoury finish.",
    },
  ],
  viognier: [
    {
      year: 2020,
      prompt:
        "Aromatic Condrieu-style. Apricot, honeysuckle, and a luxurious, oily mid-palate.",
    },
    {
      year: 2022,
      prompt:
        "Modern, fresher viognier. Peach, ginger, and a brighter, more lifted finish.",
    },
  ],
  gewurztraminer: [
    {
      year: 2019,
      prompt:
        "Headily aromatic Alsace. Lychee, rose petal, Turkish delight, and a hint of sweetness.",
    },
    {
      year: 2021,
      prompt: "Bone-dry style. Grapefruit pith, spice, and a long, dry finish.",
    },
  ],
  "chenin-blanc": [
    {
      year: 2018,
      prompt:
        "Dry Vouvray. Quince, chamomile, wet stone, and a long, savoury finish.",
    },
    {
      year: 2020,
      prompt: "Off-dry, honeyed. Pear, beeswax, and bright, balancing acidity.",
    },
  ],
  semillon: [
    {
      year: 2018,
      prompt: "Young Hunter Valley. Lemon, snow pea, and a tight, racy finish.",
    },
    {
      year: 2014,
      prompt:
        "Aged release. Toast, honey, lanolin, and a toasty, complex palate.",
    },
  ],
  "gruner-veltliner": [
    {
      year: 2021,
      prompt:
        "Classic Wachau. White pepper, lentil, lime, and a crisp, savoury finish.",
    },
    {
      year: 2022,
      prompt:
        "Riper Smaragd level. Stone fruit, spice, and a more textured, layered palate.",
    },
  ],
  albarino: [
    {
      year: 2021,
      prompt:
        "Atlantic-influenced Rias Baixas. Saline, citrus peel, and a stony, mouth-watering finish.",
    },
    {
      year: 2022,
      prompt:
        "Riper, rounder vintage. White peach, apricot, and a richer, fuller mid-palate.",
    },
  ],
  verdejo: [
    {
      year: 2021,
      prompt:
        "Rueda classic. Fennel, grapefruit, and a crisp, herbaceous finish.",
    },
    {
      year: 2022,
      prompt:
        "Modern, more fruit-forward verdejo. Melon, stone fruit, and a softer, rounder finish.",
    },
  ],
  champagne: [
    {
      year: 2014,
      prompt:
        "Vintage Champagne. Brioche, citrus, and a long, fine, mineral finish.",
    },
    {
      year: 2018,
      prompt:
        "Generous, ripe vintage. Yellow apple, honey, and creamy, persistent bubbles.",
    },
  ],
  cava: [
    {
      year: 2020,
      prompt:
        "Brut Nature Cava. Green apple, almond, and a dry, mouth-watering finish.",
    },
    {
      year: 2021,
      prompt: "Softer Brut. Pear, lemon, and an easy, bready mid-palate.",
    },
  ],
  franciacorta: [
    {
      year: 2018,
      prompt:
        "Satèn style. Almond, white peach, and a creamy, persistent mousse.",
    },
    {
      year: 2019,
      prompt:
        "Nature dosage. Lemon curd, bread crust, and a long, dry, mineral finish.",
    },
  ],
  "moscato-d-asti": [
    {
      year: 2021,
      prompt:
        "Fresh, fragrant Moscato. Orange blossom, peach, and a gentle, frothy sweetness.",
    },
    {
      year: 2022,
      prompt:
        "Riper, lusher vintage. Honey, grape, and a more generous, sweeter mousse.",
    },
  ],
  sauternes: [
    {
      year: 2015,
      prompt:
        "Rich botrytis year. Apricot, honey, ginger, and bright, lifting acidity.",
    },
    {
      year: 2017,
      prompt:
        "Concentrated and opulent. Mango, saffron, and a long, luscious, sweet finish.",
    },
  ],
  "port-tawny": [
    {
      year: 2010,
      prompt:
        "10 year old Tawny. Dried fig, walnut, orange peel, and a long, polished finish.",
    },
    {
      year: 2015,
      prompt:
        "Fresher, fruitier Tawny. Plum, cherry, spice, and a more vibrant, lifted finish.",
    },
  ],
  "sherry-oloroso": [
    {
      year: 2010,
      prompt:
        "Dry, mature Oloroso. Walnut, toffee, leather, and a long, savoury, dry finish.",
    },
    {
      year: 2015,
      prompt:
        "Younger, fresher Oloroso. Dried orange, spice, and a more lifted, rounder mouthfeel.",
    },
  ],
  pinotage: [
    {
      year: 2019,
      prompt:
        "Modern, elegant style. Red berries, chocolate, and a smooth, smoky finish.",
    },
    {
      year: 2021,
      prompt:
        "Classic bold Pinotage. Smoked meat, plum, banana, and a robust, firm tannin.",
    },
  ],
  torrontes: [
    {
      year: 2021,
      prompt:
        "High-altitude Salta. Grapefruit, rose, lychee, and a long, herbaceous finish.",
    },
    {
      year: 2022,
      prompt:
        "Softer, riper vintage. Peach, white flowers, and a rounder, more generous palate.",
    },
  ],
  "sangiovese-blend-super-tuscan": [
    {
      year: 2018,
      prompt:
        "Iconic vintage. Dark cherry, cedar, leather, and a long, powerful finish.",
    },
    {
      year: 2020,
      prompt:
        "More elegant, structured. Red fruit, tobacco, and a fine-boned, savoury frame.",
    },
  ],
};

const VINTAGE_TEST_LIBRARY = {
  "penfolds-bin-389": [
    {
      year: 2018,
      prompt:
        "A powerhouse Bin 389. Dark fruit, firm tannin, and a long, oak-driven finish.",
    },
    {
      year: 2020,
      prompt:
        "A more elegant, structured 389. Cassis, spice, and savoury, fine-grained tannin.",
    },
  ],
  "henschke-hill-of-grace": [
    {
      year: 2017,
      prompt:
        "A cool, poised vintage. Black fruit, spice, and a long, mineral, age-worthy finish.",
    },
    {
      year: 2019,
      prompt:
        "A riper, more opulent year. Plum, dark chocolate, and warm, polished oak.",
    },
  ],
  "leeuwin-estate-art-series": [
    {
      year: 2019,
      prompt:
        "A bright, linear Art Series. Citrus, white peach, and a crystalline, long finish.",
    },
    {
      year: 2021,
      prompt:
        "A richer, more generous release. Stone fruit, hazelnut, and creamy, integrated oak.",
    },
  ],
  "grosset-polish-hill": [
    {
      year: 2021,
      prompt:
        "Bone-dry, intense Polish Hill. Lime, bath salt, and a long, focused finish.",
    },
    {
      year: 2023,
      prompt:
        "A more approachable, juicy vintage. Lemon, white flowers, and a bright, clean finish.",
    },
  ],
  "tyrrells-vat-1-semillon": [
    {
      year: 2018,
      prompt:
        "Young, racy Vat 1. Lemon, snow pea, and a tight, bone-dry finish.",
    },
    {
      year: 2010,
      prompt:
        "Aged release. Toast, honey, lanolin, and a complex, toasty mid-palate.",
    },
  ],
  "giaconda-chardonnay": [
    {
      year: 2019,
      prompt:
        "Intense, mineral Giaconda. Citrus, struck match, and a long, layered finish.",
    },
    {
      year: 2021,
      prompt:
        "Riper, more generous. White peach, hazelnut, and a creamy, oak-driven finish.",
    },
  ],
  "yalumba-signature": [
    {
      year: 2017,
      prompt:
        "Concentrated, structured vintage. Cassis, plum, and firm, savoury tannin.",
    },
    {
      year: 2019,
      prompt:
        "A more approachable release. Red fruit, spice, and a soft, generous finish.",
    },
  ],
  "tolpuddle-pinot-noir": [
    {
      year: 2021,
      prompt:
        "Cool, fragrant vintage. Red cherry, rose, and a long, fine, mineral finish.",
    },
    {
      year: 2022,
      prompt:
        "Riper, more plush. Plum, baking spice, and a soft, generous mid-palate.",
    },
  ],
  "de-bortoli-noble-one": [
    {
      year: 2018,
      prompt:
        "Rich botrytis year. Apricot, honey, and a long, luscious, sweet finish.",
    },
    {
      year: 2020,
      prompt:
        "A more focused, balanced vintage. Marmalade, ginger, and bright, lifting acidity.",
    },
  ],
  "rockford-basket-press": [
    {
      year: 2018,
      prompt:
        "Classic old-vine Barossa. Blackberry, dark chocolate, and warm, generous alcohol.",
    },
    {
      year: 2020,
      prompt:
        "A cooler, more elegant Basket Press. Red fruit, spice, and fine, savoury tannin.",
    },
  ],
};

// Per-wine packaging metadata: how the bottle is sealed, the alcohol
// percentage, and the standard volume per bottle. This is shared
// between the wineProfiles catalogue and the australianWineTests
// quiz, so we look it up by wine id and apply it through withDetails
// in both exports.
const WINE_DETAILS_LIBRARY = {
  "pinot-noir": { closure: "Cork", alcoholPercentage: 13.5, volumeMl: 750 },
  "cabernet-sauvignon": {
    closure: "Cork",
    alcoholPercentage: 14.5,
    volumeMl: 750,
  },
  merlot: { closure: "Cork", alcoholPercentage: 14.0, volumeMl: 750 },
  "syrah-shiraz": {
    closure: "Screw cap",
    alcoholPercentage: 14.5,
    volumeMl: 750,
  },
  sangiovese: { closure: "Cork", alcoholPercentage: 13.5, volumeMl: 750 },
  chardonnay: { closure: "Cork", alcoholPercentage: 13.5, volumeMl: 750 },
  "sauvignon-blanc": {
    closure: "Screw cap",
    alcoholPercentage: 12.5,
    volumeMl: 750,
  },
  riesling: { closure: "Screw cap", alcoholPercentage: 12.0, volumeMl: 750 },
  prosecco: { closure: "Cork", alcoholPercentage: 11.5, volumeMl: 750 },
  rose: { closure: "Cork", alcoholPercentage: 12.5, volumeMl: 750 },
  tempranillo: { closure: "Cork", alcoholPercentage: 14.0, volumeMl: 750 },
  malbec: { closure: "Cork", alcoholPercentage: 14.0, volumeMl: 750 },
  zinfandel: { closure: "Cork", alcoholPercentage: 14.5, volumeMl: 750 },
  nebbiolo: { closure: "Cork", alcoholPercentage: 14.0, volumeMl: 750 },
  gamay: { closure: "Cork", alcoholPercentage: 12.5, volumeMl: 750 },
  "pinot-grigio": { closure: "Cork", alcoholPercentage: 12.5, volumeMl: 750 },
  "pinot-gris": { closure: "Cork", alcoholPercentage: 13.5, volumeMl: 750 },
  viognier: { closure: "Screw cap", alcoholPercentage: 13.5, volumeMl: 750 },
  gewurztraminer: { closure: "Cork", alcoholPercentage: 13.5, volumeMl: 750 },
  "chenin-blanc": { closure: "Cork", alcoholPercentage: 12.5, volumeMl: 750 },
  semillon: { closure: "Screw cap", alcoholPercentage: 11.5, volumeMl: 750 },
  "gruner-veltliner": {
    closure: "Screw cap",
    alcoholPercentage: 12.5,
    volumeMl: 750,
  },
  albarino: { closure: "Cork", alcoholPercentage: 12.5, volumeMl: 750 },
  verdejo: { closure: "Cork", alcoholPercentage: 13.0, volumeMl: 750 },
  champagne: { closure: "Cork", alcoholPercentage: 12.5, volumeMl: 750 },
  cava: { closure: "Cork", alcoholPercentage: 11.5, volumeMl: 750 },
  franciacorta: { closure: "Cork", alcoholPercentage: 12.5, volumeMl: 750 },
  "moscato-d-asti": { closure: "Cork", alcoholPercentage: 5.5, volumeMl: 750 },
  sauternes: { closure: "Cork", alcoholPercentage: 14.0, volumeMl: 375 },
  "port-tawny": { closure: "Cork", alcoholPercentage: 19.5, volumeMl: 750 },
  "sherry-oloroso": { closure: "Cork", alcoholPercentage: 18.0, volumeMl: 750 },
  pinotage: { closure: "Screw cap", alcoholPercentage: 14.0, volumeMl: 750 },
  torrontes: { closure: "Cork", alcoholPercentage: 13.0, volumeMl: 750 },
  "sangiovese-blend-super-tuscan": {
    closure: "Cork",
    alcoholPercentage: 14.5,
    volumeMl: 750,
  },
  "penfolds-bin-389": {
    closure: "Screw cap",
    alcoholPercentage: 14.5,
    volumeMl: 750,
  },
  "henschke-hill-of-grace": {
    closure: "Cork",
    alcoholPercentage: 14.5,
    volumeMl: 750,
  },
  "leeuwin-estate-art-series": {
    closure: "Screw cap",
    alcoholPercentage: 13.5,
    volumeMl: 750,
  },
  "grosset-polish-hill": {
    closure: "Screw cap",
    alcoholPercentage: 12.5,
    volumeMl: 750,
  },
  "tyrrells-vat-1-semillon": {
    closure: "Screw cap",
    alcoholPercentage: 10.5,
    volumeMl: 750,
  },
  "giaconda-chardonnay": {
    closure: "Cork",
    alcoholPercentage: 13.5,
    volumeMl: 750,
  },
  "yalumba-signature": {
    closure: "Screw cap",
    alcoholPercentage: 14.5,
    volumeMl: 750,
  },
  "tolpuddle-pinot-noir": {
    closure: "Cork",
    alcoholPercentage: 13.0,
    volumeMl: 750,
  },
  "de-bortoli-noble-one": {
    closure: "Screw cap",
    alcoholPercentage: 10.5,
    volumeMl: 375,
  },
  "rockford-basket-press": {
    closure: "Cork",
    alcoholPercentage: 14.5,
    volumeMl: 750,
  },
};

function withVintages(wine, library) {
  const vintages = library[wine.id] || [];
  return { ...wine, vintages };
}

function withDetails(wine) {
  const details = WINE_DETAILS_LIBRARY[wine.id] || {
    closure: "Cork",
    alcoholPercentage: 13.5,
    volumeMl: 750,
  };
  return { ...wine, ...details };
}

export const wineProfiles = [
  {
    id: "pinot-noir",
    name: "Pinot Noir",
    color: "Red",
    grapes: ["Pinot Noir"],
    regions: ["Burgundy", "Oregon", "New Zealand"],
    notes: ["cherry", "raspberry", "earth", "violet"],
    serving: "Great with roast chicken, mushrooms, salmon, and charcuterie.",
    image: img("Red"),
    parameters: p.pinotNoir,
  },
  {
    id: "cabernet-sauvignon",
    name: "Cabernet Sauvignon",
    color: "Red",
    grapes: ["Cabernet Sauvignon"],
    regions: ["Bordeaux", "Napa Valley", "Coonawarra"],
    notes: ["blackcurrant", "cedar", "graphite", "mint"],
    serving: "Built for steak, lamb, hard cheeses, and richer sauces.",
    image: img("Red"),
    parameters: p.cab,
  },
  {
    id: "merlot",
    name: "Merlot",
    color: "Red",
    grapes: ["Merlot"],
    regions: ["Right Bank Bordeaux", "Washington State", "Chile"],
    notes: ["plum", "black cherry", "cocoa", "bay leaf"],
    serving: "Easy with burgers, roast pork, tomato pasta, and soft cheeses.",
    image: img("Red"),
    parameters: p.merlot,
  },
  {
    id: "syrah-shiraz",
    name: "Syrah / Shiraz",
    color: "Red",
    grapes: ["Syrah", "Shiraz"],
    regions: ["Northern Rhone", "Barossa Valley", "McLaren Vale"],
    notes: ["blackberry", "pepper", "smoke", "olive"],
    serving: "Strong match for barbecue, grilled vegetables, lamb, and spices.",
    image: img("Red"),
    parameters: p.syrah,
  },
  {
    id: "sangiovese",
    name: "Sangiovese",
    color: "Red",
    grapes: ["Sangiovese"],
    regions: ["Chianti", "Brunello di Montalcino", "Tuscany"],
    notes: ["red cherry", "tomato leaf", "dried herbs", "leather"],
    serving: "A natural partner for pizza, pasta, ragu, and grilled meats.",
    image: img("Red"),
    parameters: p.sangiovese,
  },
  {
    id: "chardonnay",
    name: "Chardonnay",
    color: "White",
    grapes: ["Chardonnay"],
    regions: ["Burgundy", "California", "Margaret River"],
    notes: ["apple", "citrus", "butter", "vanilla"],
    serving: "Works with roast chicken, creamy sauces, seafood, and corn.",
    image: img("White"),
    parameters: p.chardonnay,
  },
  {
    id: "sauvignon-blanc",
    name: "Sauvignon Blanc",
    color: "White",
    grapes: ["Sauvignon Blanc"],
    regions: ["Marlborough", "Loire Valley", "Adelaide Hills"],
    notes: ["lime", "passionfruit", "grass", "gooseberry"],
    serving: "Bright with goat cheese, salads, prawns, herbs, and citrus.",
    image: img("White"),
    parameters: p.sauvBlanc,
  },
  {
    id: "riesling",
    name: "Riesling",
    color: "White",
    grapes: ["Riesling"],
    regions: ["Mosel", "Clare Valley", "Alsace"],
    notes: ["lime", "green apple", "jasmine", "petrol"],
    serving: "Excellent with spicy food, pork, seafood, and salty snacks.",
    image: img("White"),
    parameters: p.riesling,
  },
  {
    id: "prosecco",
    name: "Prosecco",
    color: "Sparkling",
    grapes: ["Glera"],
    regions: ["Veneto", "Friuli"],
    notes: ["pear", "apple blossom", "melon", "lemon"],
    serving:
      "Pour with brunch, fried snacks, fresh fruit, and aperitivo plates.",
    image: img("Sparkling"),
    parameters: p.prosecco,
  },
  {
    id: "rose",
    name: "Dry Rose",
    color: "Rose",
    grapes: ["Grenache", "Cinsault", "Syrah"],
    regions: ["Provence", "Bandol", "South Australia"],
    notes: ["strawberry", "watermelon", "citrus", "white flowers"],
    serving: "Flexible with seafood, picnic food, grilled chicken, and mezze.",
    image: img("Rose"),
    parameters: p.rose,
  },
  {
    id: "tempranillo",
    name: "Tempranillo",
    color: "Red",
    grapes: ["Tempranillo"],
    regions: ["Rioja", "Ribera del Duero", "Toro"],
    notes: ["red cherry", "dried fig", "tobacco", "leather"],
    serving: "Pairs with grilled lamb, chorizo, manchego, and beef stew.",
    image: img("Red"),
    parameters: p.tempranillo,
  },
  {
    id: "malbec",
    name: "Malbec",
    color: "Red",
    grapes: ["Malbec"],
    regions: ["Mendoza", "Cahors", "Patagonia"],
    notes: ["plum", "blackberry", "violet", "cocoa"],
    serving:
      "Perfect with grilled steak, empanadas, barbecue, and blue cheese.",
    image: img("Red"),
    parameters: p.malbec,
  },
  {
    id: "zinfandel",
    name: "Zinfandel",
    color: "Red",
    grapes: ["Zinfandel"],
    regions: ["Sonoma", "Napa Valley", "Paso Robles"],
    notes: ["brambleberry", "jammy fruit", "black pepper", "vanilla"],
    serving: "Great with pulled pork, ribs, smoky barbecue, and pizza.",
    image: img("Red"),
    parameters: p.zinfandel,
  },
  {
    id: "nebbiolo",
    name: "Nebbiolo",
    color: "Red",
    grapes: ["Nebbiolo"],
    regions: ["Piedmont", "Barolo", "Barbaresco"],
    notes: ["tar", "rose", "dried cherry", "truffle"],
    serving:
      "Matches braised beef, risotto, aged hard cheese, and truffle dishes.",
    image: img("Red"),
    parameters: p.nebbiolo,
  },
  {
    id: "gamay",
    name: "Gamay (Beaujolais)",
    color: "Red",
    grapes: ["Gamay"],
    regions: ["Beaujolais", "Loire Valley"],
    notes: ["red berry", "banana", "candy", "floral"],
    serving:
      "Lively with charcuterie, roasted chicken, soft cheeses, and salads.",
    image: img("Red"),
    parameters: p.gamay,
  },
  {
    id: "pinot-grigio",
    name: "Pinot Grigio",
    color: "White",
    grapes: ["Pinot Grigio"],
    regions: ["Friuli", "Trentino", "Veneto"],
    notes: ["lemon zest", "green apple", "pear", "almond"],
    serving: "Clean with seafood pasta, oysters, light salads, and caprese.",
    image: img("White"),
    parameters: p.pinotGrigio,
  },
  {
    id: "pinot-gris",
    name: "Pinot Gris",
    color: "White",
    grapes: ["Pinot Gris"],
    regions: ["Alsace", "Oregon", "New Zealand"],
    notes: ["pear", "honey", "stone fruit", "spice"],
    serving:
      "Versatile with roast pork, asian cuisine, soft cheeses, and pumpkin.",
    image: img("White"),
    parameters: p.pinotGris,
  },
  {
    id: "viognier",
    name: "Viognier",
    color: "White",
    grapes: ["Viognier"],
    regions: ["Condrieu", "Margaret River", "Virginia"],
    notes: ["apricot", "peach", "honeysuckle", "ginger"],
    serving: "Lovely with lobster, scallops, spicy curries, and roast chicken.",
    image: img("White"),
    parameters: p.viognier,
  },
  {
    id: "gewurztraminer",
    name: "Gewurztraminer",
    color: "White",
    grapes: ["Gewurztraminer"],
    regions: ["Alsace", "Pfalz", "Marlborough"],
    notes: ["lychee", "rose petal", "turkish delight", "ginger"],
    serving:
      "Stunning with thai food, indian curries, smoked salmon, and strong cheese.",
    image: img("White"),
    parameters: p.gewurz,
  },
  {
    id: "chenin-blanc",
    name: "Chenin Blanc",
    color: "White",
    grapes: ["Chenin Blanc"],
    regions: ["Loire Valley", "Stellenbosch", "California"],
    notes: ["quince", "honeydew", "chamomile", "wet stone"],
    serving:
      "Bright with roast chicken, pork, goat cheese, and vegetable tarts.",
    image: img("White"),
    parameters: p.chenin,
  },
  {
    id: "semillon",
    name: "Semillon",
    color: "White",
    grapes: ["Semillon"],
    regions: ["Hunter Valley", "Bordeaux", "Margaret River"],
    notes: ["lemon curd", "beeswax", "lanolin", "toast"],
    serving: "Classic with roast chicken, seafood, and creamy pasta.",
    image: img("White"),
    parameters: p.semillon,
  },
  {
    id: "gruner-veltliner",
    name: "Gruner Veltliner",
    color: "White",
    grapes: ["Gruner Veltliner"],
    regions: ["Wachau", "Kamptal", "Kremstal"],
    notes: ["white pepper", "green pea", "lime", "lentil"],
    serving:
      "Beautifully matches schnitzel, asparagus, sushi, and fresh salads.",
    image: img("White"),
    parameters: p.gruner,
  },
  {
    id: "albarino",
    name: "Albarino",
    color: "White",
    grapes: ["Albarino"],
    regions: ["Rias Baixas", "Moncao", "Bairrada"],
    notes: ["saline", "citrus peel", "white peach", "jasmine"],
    serving:
      "Brilliant with grilled octopus, ceviche, sushi, and briny shellfish.",
    image: img("White"),
    parameters: p.albarino,
  },
  {
    id: "verdejo",
    name: "Verdejo",
    color: "White",
    grapes: ["Verdejo"],
    regions: ["Rueda", "La Mancha"],
    notes: ["fennel", "grapefruit", "broom flower", "cut grass"],
    serving:
      "Cuts through garlic prawns, paella, grilled vegetables, and tapas.",
    image: img("White"),
    parameters: p.verdejo,
  },
  {
    id: "champagne",
    name: "Champagne",
    color: "Sparkling",
    grapes: ["Chardonnay", "Pinot Noir", "Pinot Meunier"],
    regions: ["Champagne"],
    notes: ["brioche", "citrus", "green apple", "chalk"],
    serving:
      "Pour with oysters, caviar, fried chicken, and celebration toasts.",
    image: img("Sparkling"),
    parameters: p.champagne,
  },
  {
    id: "cava",
    name: "Cava",
    color: "Sparkling",
    grapes: ["Macabeo", "Parellada", "Xarel.lo"],
    regions: ["Penedes", "Catalonia"],
    notes: ["green apple", "almond", "toast", "lemon"],
    serving: "Lively with patatas bravas, jamon, seafood, and fried snacks.",
    image: img("Sparkling"),
    parameters: p.cava,
  },
  {
    id: "franciacorta",
    name: "Franciacorta",
    color: "Sparkling",
    grapes: ["Chardonnay", "Pinot Nero"],
    regions: ["Lombardy", "Franciacorta"],
    notes: ["almond paste", "white peach", "lemon curd", "biscuit"],
    serving: "Refined with cured meats, sushi, seafood risotto, and aperitivo.",
    image: img("Sparkling"),
    parameters: p.franciacorta,
  },
  {
    id: "moscato-d-asti",
    name: "Moscato d'Asti",
    color: "Dessert",
    grapes: ["Moscato Bianco"],
    regions: ["Asti", "Piedmont"],
    notes: ["orange blossom", "peach", "honey", "grape"],
    serving: "Luscious with panettone, fresh fruit, panna cotta, and pastries.",
    image: img("Dessert"),
    parameters: p.moscato,
  },
  {
    id: "sauternes",
    name: "Sauternes",
    color: "Dessert",
    grapes: ["Semillon", "Sauvignon Blanc", "Muscadelle"],
    regions: ["Bordeaux", "Sauternes", "Barsac"],
    notes: ["apricot", "honey", "ginger", "beeswax"],
    serving:
      "Decadent with foie gras, blue cheese, tarte tatin, and creme brulee.",
    image: img("Dessert"),
    parameters: p.sauternes,
  },
  {
    id: "port-tawny",
    name: "Tawny Port",
    color: "Dessert",
    grapes: ["Touriga Nacional", "Touriga Franca", "Tinta Roriz"],
    regions: ["Douro Valley"],
    notes: ["dried fig", "caramel", "walnut", "orange peel"],
    serving: "Wonderful with stilton, chocolate desserts, and toasted nuts.",
    image: img("Dessert"),
    parameters: p.port,
  },
  {
    id: "sherry-oloroso",
    name: "Oloroso Sherry",
    color: "Dessert",
    grapes: ["Palomino"],
    regions: ["Jerez", "Andalusia"],
    notes: ["walnut", "toffee", "cinnamon", "dried orange"],
    serving: "Sip with aged manchego, olives, almonds, and rich stews.",
    image: img("Dessert"),
    parameters: p.sherry,
  },
  {
    id: "pinotage",
    name: "Pinotage",
    color: "Red",
    grapes: ["Pinotage"],
    regions: ["Stellenbosch", "Franschhoek", "Swartland"],
    notes: ["smoked meat", "plum", "banana", "earthy spice"],
    serving:
      "Barbecue champion - pairs with boerewors, lamb chops, and grilled meats.",
    image: img("Red"),
    parameters: p.pinotage,
  },
  {
    id: "torrontes",
    name: "Torrontes",
    color: "White",
    grapes: ["Torrontes"],
    regions: ["Salta", "Mendoza", "Cafayate"],
    notes: ["grapefruit", "rose", "lychee", "herbal lift"],
    serving:
      "Vivid with ceviche, grilled fish, empanadas, and spicy latin cuisine.",
    image: img("White"),
    parameters: p.torrontes,
  },
  {
    id: "sangiovese-blend-super-tuscan",
    name: "Super Tuscan Blend",
    color: "Red",
    grapes: ["Sangiovese", "Cabernet Sauvignon", "Merlot"],
    regions: ["Tuscany", "Bolgheri"],
    notes: ["dark cherry", "cedar", "leather", "tobacco"],
    serving:
      "Great with bistecca alla fiorentina, rich pasta, and aged pecorino.",
    image: img("Red"),
    parameters: p.superTuscan,
  },
]
  .map((wine) => withVintages(wine, VINTAGE_LIBRARY))
  .map((wine) => withDetails(wine));

export const australianWineTests = [
  {
    id: "penfolds-bin-389",
    name: "Penfolds Bin 389 Cabernet Shiraz",
    region: "South Australia",
    color: "Red",
    image: img("Red"),
    prompt:
      "Classic Australian cabernet shiraz: dark fruit, structure, oak spice, and generous weight.",
    parameters: {
      acidity: 3,
      body: 5,
      tannin: 4,
      sweetness: 1,
      alcohol: 4,
      fruit: 5,
    },
  },
  {
    id: "henschke-hill-of-grace",
    name: "Henschke Hill of Grace Shiraz",
    region: "Eden Valley, South Australia",
    color: "Red",
    image: img("Red"),
    prompt:
      "A powerful but detailed old-vine shiraz style with spice, dark berries, and firm structure.",
    parameters: {
      acidity: 3,
      body: 5,
      tannin: 4,
      sweetness: 1,
      alcohol: 4,
      fruit: 4,
    },
  },
  {
    id: "leeuwin-estate-art-series",
    name: "Leeuwin Estate Art Series Chardonnay",
    region: "Margaret River, Western Australia",
    color: "White",
    image: img("White"),
    prompt:
      "Premium Margaret River chardonnay: citrus, stone fruit, creamy texture, and polished oak.",
    parameters: {
      acidity: 4,
      body: 4,
      tannin: 1,
      sweetness: 1,
      alcohol: 3,
      fruit: 4,
    },
  },
  {
    id: "grosset-polish-hill",
    name: "Grosset Polish Hill Riesling",
    region: "Clare Valley, South Australia",
    color: "White",
    image: img("White"),
    prompt:
      "Dry Clare Valley riesling: lime, floral lift, high acidity, and a lean mineral feel.",
    parameters: {
      acidity: 5,
      body: 1,
      tannin: 1,
      sweetness: 1,
      alcohol: 2,
      fruit: 3,
    },
  },
  {
    id: "tyrrells-vat-1-semillon",
    name: "Tyrrell's Vat 1 Semillon",
    region: "Hunter Valley, New South Wales",
    color: "White",
    image: img("White"),
    prompt:
      "Classic Hunter semillon: light, dry, lemony, low alcohol, and very crisp when young.",
    parameters: {
      acidity: 5,
      body: 1,
      tannin: 1,
      sweetness: 1,
      alcohol: 1,
      fruit: 2,
    },
  },
  {
    id: "giaconda-chardonnay",
    name: "Giaconda Estate Vineyard Chardonnay",
    region: "Beechworth, Victoria",
    color: "White",
    image: img("White"),
    prompt:
      "Intense Victorian chardonnay with citrus, stone fruit, texture, oak detail, and strong freshness.",
    parameters: {
      acidity: 4,
      body: 4,
      tannin: 1,
      sweetness: 1,
      alcohol: 3,
      fruit: 4,
    },
  },
  {
    id: "yalumba-signature",
    name: "Yalumba The Signature Cabernet Shiraz",
    region: "Barossa, South Australia",
    color: "Red",
    image: img("Red"),
    prompt:
      "Australian cabernet shiraz blend: cassis, plum, spice, firm tannin, and generous body.",
    parameters: {
      acidity: 3,
      body: 5,
      tannin: 4,
      sweetness: 1,
      alcohol: 4,
      fruit: 5,
    },
  },
  {
    id: "tolpuddle-pinot-noir",
    name: "Tolpuddle Vineyard Pinot Noir",
    region: "Coal River Valley, Tasmania",
    color: "Red",
    image: img("Red"),
    prompt:
      "Cool-climate Tasmanian pinot: red cherry, perfume, bright acidity, fine tannin, and medium-light body.",
    parameters: {
      acidity: 4,
      body: 2,
      tannin: 2,
      sweetness: 1,
      alcohol: 2,
      fruit: 3,
    },
  },
  {
    id: "de-bortoli-noble-one",
    name: "De Bortoli Noble One Botrytis Semillon",
    region: "Riverina, New South Wales",
    color: "Dessert",
    image: img("Dessert"),
    prompt:
      "Sweet botrytis semillon: honey, apricot, marmalade, rich body, and balancing acidity.",
    parameters: {
      acidity: 4,
      body: 4,
      tannin: 1,
      sweetness: 5,
      alcohol: 2,
      fruit: 5,
    },
  },
  {
    id: "rockford-basket-press",
    name: "Rockford Basket Press Shiraz",
    region: "Barossa Valley, South Australia",
    color: "Red",
    image: img("Red"),
    prompt:
      "Traditional Barossa shiraz: ripe blackberry, dark plum, spice, full body, and warm alcohol.",
    parameters: {
      acidity: 3,
      body: 5,
      tannin: 4,
      sweetness: 1,
      alcohol: 5,
      fruit: 5,
    },
  },
]
  .map((wine) => withVintages(wine, VINTAGE_TEST_LIBRARY))
  .map((wine) => withDetails(wine));

export const initialTaste = tasteParameters.reduce((taste, parameter) => {
  return { ...taste, [parameter.id]: 3 };
}, {});

export function calculateMatch(profile, selectedTaste) {
  const totalDistance = tasteParameters.reduce((total, parameter) => {
    return (
      total +
      Math.abs(profile.parameters[parameter.id] - selectedTaste[parameter.id])
    );
  }, 0);
  const maxDistance = tasteParameters.length * 4;
  return Math.round((1 - totalDistance / maxDistance) * 100);
}
