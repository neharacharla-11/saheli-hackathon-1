/**
 * About 150 common Indian and global foods with everyday portions.
 * Values are per portion and approximate (home recipes vary).
 */

export type FoodCategory = "rotis" | "breakfast" | "dal" | "sabzi" | "meat" | "snacks" | "drinks";

export const FOOD_CATEGORIES: { id: FoodCategory; label: string }[] = [
  { id: "rotis", label: "Rotis and rice" },
  { id: "breakfast", label: "Breakfast" },
  { id: "dal", label: "Dal and legumes" },
  { id: "sabzi", label: "Sabzi" },
  { id: "meat", label: "Eggs and meat" },
  { id: "snacks", label: "Snacks" },
  { id: "drinks", label: "Drinks" },
];

/** veg = vegetarian (may have dairy), vegan, egg, meat, fish. Nutrient tags help advice. */
export type FoodTag =
  | "vegan"
  | "egg"
  | "meat"
  | "fish"
  | "iron"
  | "calcium"
  | "protein"
  | "fibre"
  | "lowgi"
  | "vitd"
  | "folate"
  | "omega3"
  | "sweet"
  | "fried"
  | "onion-garlic";

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  tags: FoodTag[];
}

type Row = [string, string, FoodCategory, string, number, number, number, number, number, string?];

// id, name, category, portion, kcal, protein g, carbs g, fat g, fibre g, tags
const ROWS: Row[] = [
  // Rotis and rice
  ["roti", "Roti / chapati", "rotis", "1 roti (40 g)", 104, 3.1, 18, 2.4, 2.7, "vegan fibre"],
  ["phulka", "Phulka (no ghee)", "rotis", "1 phulka (30 g)", 71, 2.4, 15, 0.4, 2.1, "vegan fibre"],
  ["paratha-plain", "Plain paratha", "rotis", "1 paratha (60 g)", 190, 4, 26, 8, 3, ""],
  ["aloo-paratha", "Aloo paratha", "rotis", "1 paratha (100 g)", 260, 5.5, 36, 10.5, 3.5, ""],
  ["methi-thepla", "Methi thepla", "rotis", "1 thepla (40 g)", 120, 3.2, 16, 4.8, 2.4, "iron fibre"],
  ["bhakri-jowar", "Jowar bhakri", "rotis", "1 bhakri (50 g)", 160, 5, 33, 1, 4.5, "vegan fibre lowgi iron"],
  ["bhakri-bajra", "Bajra bhakri", "rotis", "1 bhakri (50 g)", 175, 5.5, 32, 2.5, 5, "vegan fibre lowgi iron"],
  ["jowar-roti", "Jowar roti", "rotis", "1 roti (40 g)", 120, 4, 25, 0.8, 3.5, "vegan fibre lowgi"],
  ["ragi-roti", "Ragi roti", "rotis", "1 roti (40 g)", 118, 2.8, 25, 0.8, 4, "vegan fibre calcium lowgi"],
  ["missi-roti", "Missi roti", "rotis", "1 roti (50 g)", 150, 6, 24, 3.5, 4, "fibre protein"],
  ["naan", "Naan", "rotis", "1 naan (90 g)", 262, 8.7, 45, 5.1, 2, ""],
  ["puri", "Puri", "rotis", "1 puri (25 g)", 101, 1.8, 12, 5.2, 0.8, "vegan fried"],
  ["rice-white", "Steamed white rice", "rotis", "1 katori (150 g)", 195, 4, 43, 0.4, 0.6, "vegan"],
  ["rice-brown", "Brown rice", "rotis", "1 katori (150 g)", 165, 3.8, 34, 1.3, 2.7, "vegan fibre lowgi"],
  ["jeera-rice", "Jeera rice", "rotis", "1 katori (150 g)", 240, 4, 42, 6, 1, ""],
  ["veg-pulao", "Vegetable pulao", "rotis", "1 katori (150 g)", 230, 5, 38, 6.5, 2.5, ""],
  ["veg-biryani", "Vegetable biryani", "rotis", "1 plate (250 g)", 380, 8, 58, 12, 4, "onion-garlic"],
  ["chicken-biryani", "Chicken biryani", "rotis", "1 plate (300 g)", 520, 26, 60, 18, 2.5, "meat protein onion-garlic"],
  ["curd-rice", "Curd rice", "rotis", "1 katori (200 g)", 250, 7, 40, 6, 1, "calcium"],
  ["lemon-rice", "Lemon rice", "rotis", "1 katori (150 g)", 240, 4, 40, 7, 1.5, "vegan"],
  ["khichdi", "Moong dal khichdi", "rotis", "1 katori (200 g)", 230, 9, 38, 4.5, 4, "protein fibre"],
  ["millet-khichdi", "Millet khichdi", "rotis", "1 katori (200 g)", 220, 8, 36, 4.5, 5, "fibre lowgi"],
  ["quinoa", "Cooked quinoa", "rotis", "1 katori (150 g)", 180, 6.6, 32, 2.9, 4.2, "vegan protein fibre lowgi iron"],
  ["bread-whole", "Whole wheat bread", "rotis", "1 slice (30 g)", 75, 3.6, 13, 1, 2, "vegan fibre"],
  ["pasta", "Whole wheat pasta", "rotis", "1 bowl (200 g)", 290, 11, 55, 2.5, 7, "vegan fibre"],

  // Breakfast
  ["poha", "Poha", "breakfast", "1 plate (150 g)", 250, 5, 42, 7, 2.5, "vegan iron"],
  ["upma", "Rava upma", "breakfast", "1 plate (150 g)", 230, 5.5, 34, 8, 2.5, ""],
  ["vermicelli-upma", "Vermicelli upma", "breakfast", "1 plate (150 g)", 240, 5, 38, 7, 2, ""],
  ["idli", "Idli", "breakfast", "1 idli (40 g)", 58, 2, 12, 0.2, 0.6, "vegan"],
  ["ragi-idli", "Ragi idli", "breakfast", "1 idli (40 g)", 62, 2, 12, 0.5, 1.2, "vegan calcium"],
  ["dosa-plain", "Plain dosa", "breakfast", "1 dosa (80 g)", 168, 4, 29, 3.7, 1, "vegan"],
  ["masala-dosa", "Masala dosa", "breakfast", "1 dosa (150 g)", 290, 6, 45, 10, 3, "vegan"],
  ["rava-dosa", "Rava dosa", "breakfast", "1 dosa (90 g)", 190, 4, 28, 7, 1, ""],
  ["uttapam", "Onion uttapam", "breakfast", "1 uttapam (120 g)", 210, 6, 34, 5, 2.5, "vegan onion-garlic"],
  ["pesarattu", "Pesarattu (moong dosa)", "breakfast", "1 dosa (100 g)", 180, 10, 26, 4, 5, "vegan protein fibre iron"],
  ["besan-chilla", "Besan chilla", "breakfast", "1 chilla (70 g)", 160, 8, 18, 6, 3.5, "vegan protein fibre"],
  ["moong-chilla", "Moong dal chilla", "breakfast", "1 chilla (70 g)", 140, 9, 18, 3.5, 3.5, "vegan protein fibre iron"],
  ["sabudana-khichdi", "Sabudana khichdi", "breakfast", "1 plate (150 g)", 330, 4, 52, 12, 1.5, ""],
  ["dhokla", "Khaman dhokla", "breakfast", "2 pieces (80 g)", 130, 6, 20, 3, 2, "protein"],
  ["oats-porridge", "Oats porridge with milk", "breakfast", "1 bowl (250 g)", 240, 10, 36, 6, 4, "fibre lowgi calcium"],
  ["masala-oats", "Masala oats", "breakfast", "1 bowl (200 g)", 190, 6, 30, 5, 4.5, "vegan fibre lowgi"],
  ["ragi-porridge", "Ragi porridge (ragi malt)", "breakfast", "1 bowl (200 g)", 180, 6, 30, 4, 3.5, "calcium iron lowgi"],
  ["daliya", "Vegetable daliya", "breakfast", "1 bowl (200 g)", 200, 6.5, 36, 3.5, 6, "vegan fibre lowgi"],
  ["muesli", "Muesli with milk", "breakfast", "1 bowl (60 g + milk)", 300, 11, 48, 7, 5, "fibre calcium"],
  ["overnight-oats", "Overnight oats with seeds", "breakfast", "1 jar (250 g)", 320, 13, 42, 11, 7, "fibre lowgi omega3"],
  ["appam", "Appam", "breakfast", "1 appam (60 g)", 120, 2, 23, 1.5, 0.5, "vegan"],
  ["puttu", "Puttu with kadala", "breakfast", "1 plate (200 g)", 330, 12, 56, 6, 8, "vegan fibre iron"],
  ["pongal", "Ven pongal", "breakfast", "1 bowl (200 g)", 290, 8, 40, 10, 2.5, ""],
  ["toast-pb", "Toast with peanut butter", "breakfast", "1 slice + 1 tbsp", 170, 7, 15, 9, 2.5, "vegan protein"],
  ["avocado-toast", "Avocado toast", "breakfast", "1 slice", 190, 5, 18, 11, 6, "vegan fibre"],
  ["pancakes", "Pancakes", "breakfast", "2 small (100 g)", 230, 6, 30, 9, 1, "sweet"],
  ["granola-yogurt", "Granola with yogurt", "breakfast", "1 bowl (200 g)", 300, 12, 40, 10, 4, "calcium"],

  // Dal and legumes
  ["dal-tadka", "Dal tadka (toor)", "dal", "1 katori (150 g)", 150, 7.5, 20, 4.5, 4, "vegan protein fibre"],
  ["moong-dal", "Yellow moong dal", "dal", "1 katori (150 g)", 130, 8, 18, 3, 3.5, "vegan protein fibre"],
  ["masoor-dal", "Masoor dal", "dal", "1 katori (150 g)", 140, 9, 20, 2.5, 4.5, "vegan protein fibre iron"],
  ["dal-makhani", "Dal makhani", "dal", "1 katori (150 g)", 230, 9, 22, 12, 6, "protein fibre iron"],
  ["chana-dal", "Chana dal", "dal", "1 katori (150 g)", 170, 9.5, 24, 4, 6, "vegan protein fibre lowgi"],
  ["sambar", "Sambar", "dal", "1 katori (150 g)", 110, 5, 15, 3.5, 4, "vegan fibre"],
  ["rasam", "Rasam", "dal", "1 katori (150 g)", 45, 1.5, 6, 1.8, 1, "vegan"],
  ["rajma", "Rajma", "dal", "1 katori (150 g)", 190, 10, 27, 5, 8, "vegan protein fibre iron lowgi folate"],
  ["chole", "Chole (chickpea curry)", "dal", "1 katori (150 g)", 210, 9, 28, 7, 8, "vegan protein fibre iron lowgi folate"],
  ["lobia", "Lobia (black-eyed beans)", "dal", "1 katori (150 g)", 170, 10, 26, 3, 7, "vegan protein fibre iron folate"],
  ["kala-chana", "Kala chana", "dal", "1 katori (150 g)", 180, 10, 27, 3.5, 9, "vegan protein fibre iron lowgi"],
  ["sprouts-salad", "Moong sprouts salad", "dal", "1 bowl (100 g)", 100, 7, 15, 1, 4, "vegan protein fibre iron folate lowgi"],
  ["usal", "Matki usal", "dal", "1 katori (150 g)", 160, 9, 22, 4.5, 6, "vegan protein fibre iron"],
  ["kadhi", "Kadhi", "dal", "1 katori (150 g)", 130, 5, 12, 7, 1, "calcium"],
  ["soya-chunks", "Soya chunks curry", "dal", "1 katori (150 g)", 190, 18, 14, 7, 5, "vegan protein iron calcium"],
  ["hummus", "Hummus", "dal", "2 tbsp (30 g)", 80, 2.4, 6, 5, 1.8, "vegan fibre"],
  ["tofu", "Tofu, grilled", "dal", "100 g", 145, 15, 3, 8.5, 1.5, "vegan protein calcium iron"],
  ["lentil-soup", "Lentil soup", "dal", "1 bowl (250 g)", 180, 11, 28, 2.5, 7, "vegan protein fibre iron"],

  // Sabzi
  ["palak-paneer", "Palak paneer", "sabzi", "1 katori (150 g)", 240, 12, 9, 17, 3, "protein calcium iron folate"],
  ["paneer-bhurji", "Paneer bhurji", "sabzi", "1 katori (120 g)", 260, 15, 6, 19, 1.5, "protein calcium"],
  ["paneer-tikka", "Paneer tikka", "sabzi", "6 pieces (120 g)", 280, 18, 6, 20, 1, "protein calcium"],
  ["paneer-raw", "Paneer", "sabzi", "50 g", 145, 9, 1.8, 11, 0, "protein calcium"],
  ["matar-paneer", "Matar paneer", "sabzi", "1 katori (150 g)", 250, 11, 13, 17, 4, "protein calcium"],
  ["aloo-gobi", "Aloo gobi", "sabzi", "1 katori (150 g)", 160, 3.5, 20, 7.5, 4, "vegan fibre"],
  ["bhindi", "Bhindi sabzi", "sabzi", "1 katori (120 g)", 120, 2.5, 10, 8, 4, "vegan fibre lowgi folate"],
  ["baingan-bharta", "Baingan bharta", "sabzi", "1 katori (150 g)", 130, 3, 13, 7.5, 5, "vegan fibre lowgi"],
  ["palak-sabzi", "Palak sabzi", "sabzi", "1 katori (120 g)", 90, 3.5, 7, 5.5, 3, "vegan iron folate calcium"],
  ["methi-sabzi", "Methi aloo", "sabzi", "1 katori (120 g)", 130, 3, 15, 6.5, 3.5, "vegan iron fibre"],
  ["cabbage-sabzi", "Cabbage sabzi", "sabzi", "1 katori (120 g)", 90, 2, 9, 5, 3, "vegan fibre lowgi"],
  ["beans-poriyal", "Beans poriyal", "sabzi", "1 katori (120 g)", 100, 2.5, 9, 6, 4, "vegan fibre lowgi"],
  ["lauki", "Lauki sabzi", "sabzi", "1 katori (150 g)", 80, 1.5, 9, 4.5, 2.5, "vegan lowgi"],
  ["mixed-veg", "Mixed vegetable sabzi", "sabzi", "1 katori (150 g)", 130, 3.5, 14, 7, 4.5, "vegan fibre"],
  ["avial", "Avial", "sabzi", "1 katori (150 g)", 150, 3, 12, 10, 4, "fibre"],
  ["sarson-saag", "Sarson ka saag", "sabzi", "1 katori (150 g)", 150, 5, 11, 10, 5, "iron calcium folate fibre"],
  ["mushroom-masala", "Mushroom masala", "sabzi", "1 katori (150 g)", 140, 4.5, 10, 9.5, 3, "vegan vitd"],
  ["aloo-sabzi", "Aloo sabzi", "sabzi", "1 katori (150 g)", 170, 3, 26, 6.5, 3, "vegan"],
  ["beetroot-sabzi", "Beetroot thoran", "sabzi", "1 katori (120 g)", 110, 2.5, 13, 5.5, 3.5, "vegan iron folate"],
  ["raita", "Cucumber raita", "sabzi", "1 katori (100 g)", 60, 3.5, 5, 3, 0.5, "calcium"],
  ["green-salad", "Green salad", "sabzi", "1 bowl (100 g)", 30, 1.5, 6, 0.2, 2.5, "vegan fibre lowgi"],
  ["kachumber", "Kachumber salad", "sabzi", "1 bowl (100 g)", 35, 1.3, 7, 0.3, 2, "vegan fibre lowgi"],
  ["stir-fry-veg", "Vegetable stir-fry", "sabzi", "1 bowl (150 g)", 120, 4, 12, 6, 4.5, "vegan fibre"],
  ["broccoli", "Steamed broccoli", "sabzi", "1 cup (90 g)", 31, 2.5, 6, 0.3, 2.4, "vegan fibre calcium folate"],

  // Eggs and meat
  ["egg-boiled", "Boiled egg", "meat", "1 egg (50 g)", 78, 6.3, 0.6, 5.3, 0, "egg protein vitd"],
  ["omelette", "Masala omelette", "meat", "2 eggs", 190, 13, 3, 14, 0.5, "egg protein vitd"],
  ["egg-bhurji", "Egg bhurji", "meat", "2 eggs", 210, 13, 4, 16, 1, "egg protein vitd"],
  ["egg-curry", "Egg curry", "meat", "2 eggs + gravy", 260, 14, 8, 19, 2, "egg protein vitd"],
  ["egg-white", "Egg whites", "meat", "3 whites", 51, 11, 0.7, 0.2, 0, "egg protein"],
  ["chicken-curry", "Chicken curry", "meat", "1 katori (150 g)", 240, 22, 6, 14, 1.5, "meat protein"],
  ["chicken-tikka", "Chicken tikka", "meat", "6 pieces (120 g)", 200, 28, 4, 8, 0.5, "meat protein"],
  ["tandoori-chicken", "Tandoori chicken", "meat", "1 leg (150 g)", 260, 32, 4, 12, 0.5, "meat protein"],
  ["chicken-breast", "Grilled chicken breast", "meat", "100 g", 165, 31, 0, 3.6, 0, "meat protein"],
  ["butter-chicken", "Butter chicken", "meat", "1 katori (150 g)", 330, 20, 8, 24, 1, "meat protein"],
  ["fish-curry", "Fish curry", "meat", "1 katori (150 g)", 210, 20, 6, 11, 1, "fish protein omega3 vitd"],
  ["fish-fry", "Fish fry", "meat", "1 piece (100 g)", 220, 20, 6, 13, 0.5, "fish protein omega3 vitd fried"],
  ["salmon", "Baked salmon", "meat", "100 g", 206, 22, 0, 12, 0, "fish protein omega3 vitd"],
  ["prawn-curry", "Prawn curry", "meat", "1 katori (150 g)", 190, 20, 6, 9, 1, "fish protein"],
  ["mutton-curry", "Mutton curry", "meat", "1 katori (150 g)", 310, 24, 6, 21, 1, "meat protein iron"],
  ["keema", "Mutton keema", "meat", "1 katori (150 g)", 290, 22, 7, 19, 2, "meat protein iron"],
  ["chicken-soup", "Chicken soup", "meat", "1 bowl (250 g)", 120, 14, 6, 4, 1, "meat protein"],
  ["tuna", "Tuna (canned in water)", "meat", "100 g", 116, 26, 0, 1, 0, "fish protein vitd omega3"],

  // Snacks (fruit, nuts, dairy and treats)
  ["banana", "Banana", "snacks", "1 medium (118 g)", 105, 1.3, 27, 0.4, 3.1, "vegan fibre"],
  ["apple", "Apple", "snacks", "1 medium (180 g)", 95, 0.5, 25, 0.3, 4.4, "vegan fibre lowgi"],
  ["orange", "Orange", "snacks", "1 medium (130 g)", 62, 1.2, 15, 0.2, 3.1, "vegan fibre lowgi folate"],
  ["papaya", "Papaya", "snacks", "1 bowl (150 g)", 65, 0.7, 16, 0.4, 2.5, "vegan fibre"],
  ["guava", "Guava", "snacks", "1 guava (100 g)", 68, 2.6, 14, 1, 5.4, "vegan fibre lowgi"],
  ["pomegranate", "Pomegranate", "snacks", "1 bowl (100 g)", 83, 1.7, 19, 1.2, 4, "vegan fibre"],
  ["mango", "Mango", "snacks", "1 cup (165 g)", 99, 1.4, 25, 0.6, 2.6, "vegan sweet"],
  ["berries", "Mixed berries", "snacks", "1 cup (150 g)", 70, 1, 17, 0.5, 4, "vegan fibre lowgi"],
  ["dates", "Dates", "snacks", "3 dates (24 g)", 70, 0.6, 18, 0.1, 1.9, "vegan iron sweet"],
  ["almonds", "Almonds", "snacks", "10 almonds (12 g)", 70, 2.5, 2.6, 6, 1.5, "vegan protein calcium lowgi"],
  ["walnuts", "Walnuts", "snacks", "4 halves (14 g)", 92, 2.1, 1.9, 9.2, 1, "vegan omega3 lowgi"],
  ["peanuts", "Roasted peanuts", "snacks", "1 handful (30 g)", 170, 7.5, 5, 14, 2.5, "vegan protein lowgi"],
  ["mixed-seeds", "Mixed seeds (pumpkin, flax, sesame)", "snacks", "1 tbsp (10 g)", 55, 2.5, 1.5, 4.5, 1.5, "vegan iron omega3 calcium"],
  ["makhana", "Roasted makhana", "snacks", "1 bowl (25 g)", 90, 2.4, 19, 0.5, 2, "vegan lowgi"],
  ["roasted-chana", "Roasted chana", "snacks", "1 handful (30 g)", 110, 6, 18, 1.5, 5, "vegan protein fibre iron lowgi"],
  ["chana-chaat", "Chana chaat", "snacks", "1 bowl (120 g)", 160, 8, 24, 3.5, 7, "vegan protein fibre iron"],
  ["bhel", "Bhel puri", "snacks", "1 plate (100 g)", 200, 5, 32, 6, 3, "vegan"],
  ["samosa", "Samosa", "snacks", "1 samosa (60 g)", 260, 4, 24, 17, 2, "vegan fried"],
  ["pakora", "Onion pakora", "snacks", "4 pieces (60 g)", 200, 4, 18, 12, 2, "vegan fried onion-garlic"],
  ["vada", "Medu vada", "snacks", "1 vada (50 g)", 160, 5, 15, 9, 2, "vegan fried protein"],
  ["dark-chocolate", "Dark chocolate (70%)", "snacks", "2 squares (20 g)", 120, 1.6, 9, 8.5, 2.2, "vegan iron sweet"],
  ["curd", "Curd / dahi", "snacks", "1 katori (100 g)", 60, 3.5, 4.7, 3.3, 0, "calcium protein"],
  ["greek-yogurt", "Greek yogurt", "snacks", "1 cup (150 g)", 130, 15, 6, 5, 0, "protein calcium"],
  ["hung-curd-dip", "Hung curd dip with veggies", "snacks", "1 bowl", 110, 7, 8, 5, 2, "protein calcium"],
  ["til-ladoo", "Til (sesame) ladoo", "snacks", "1 ladoo (25 g)", 120, 3, 13, 6.5, 2, "iron calcium sweet"],
  ["besan-ladoo", "Besan ladoo", "snacks", "1 ladoo (30 g)", 150, 3, 16, 8.5, 1, "sweet"],
  ["gulab-jamun", "Gulab jamun", "snacks", "1 piece (40 g)", 150, 2, 22, 6, 0.3, "sweet fried"],
  ["kheer", "Rice kheer", "snacks", "1 katori (150 g)", 210, 6, 32, 6.5, 0.3, "sweet calcium"],
  ["halwa", "Sooji halwa", "snacks", "1 katori (100 g)", 280, 3.5, 36, 14, 1, "sweet"],
  ["biscuits", "Digestive biscuits", "snacks", "2 biscuits (30 g)", 145, 2, 20, 6.5, 1, "sweet"],
  ["cookies", "Chocolate chip cookie", "snacks", "1 cookie (30 g)", 150, 1.5, 20, 7.5, 0.7, "sweet"],
  ["chips", "Potato chips", "snacks", "1 small pack (30 g)", 160, 2, 15, 10, 1.3, "vegan fried"],
  ["popcorn", "Popcorn (light butter)", "snacks", "1 bowl (25 g)", 110, 3, 18, 3.5, 3.5, "fibre"],
  ["energy-ball", "Date and nut energy ball", "snacks", "1 ball (25 g)", 100, 2.5, 13, 4.5, 2, "vegan iron sweet"],
  ["sweet-potato", "Roasted sweet potato", "snacks", "1 medium (130 g)", 115, 2, 27, 0.2, 4, "vegan fibre"],
  ["boiled-corn", "Boiled corn (bhutta)", "snacks", "1 cob (100 g)", 96, 3.4, 21, 1.5, 2.4, "vegan fibre"],
  ["cheese-slice", "Cheese slice", "snacks", "1 slice (20 g)", 65, 4, 1, 5, 0, "calcium protein"],
  ["protein-bar", "Protein bar", "snacks", "1 bar (50 g)", 200, 15, 22, 6, 4, "protein"],

  // Drinks
  ["chai", "Chai with milk and sugar", "drinks", "1 cup (150 ml)", 90, 2.5, 12, 3.5, 0, "sweet"],
  ["chai-nosugar", "Chai, no sugar", "drinks", "1 cup (150 ml)", 50, 2.5, 4, 3, 0, ""],
  ["coffee", "Coffee with milk", "drinks", "1 cup (150 ml)", 70, 3, 8, 3, 0, ""],
  ["black-coffee", "Black coffee", "drinks", "1 cup", 2, 0.3, 0, 0, 0, "vegan"],
  ["milk", "Milk (toned)", "drinks", "1 glass (200 ml)", 120, 6.5, 9.5, 6, 0, "calcium protein vitd"],
  ["haldi-doodh", "Haldi doodh", "drinks", "1 glass (200 ml)", 140, 6.5, 13, 6.5, 0, "calcium"],
  ["buttermilk", "Chaas / buttermilk", "drinks", "1 glass (250 ml)", 50, 3, 5, 1.5, 0, "calcium"],
  ["lassi", "Sweet lassi", "drinks", "1 glass (250 ml)", 200, 7, 32, 5, 0, "calcium sweet"],
  ["coconut-water", "Coconut water", "drinks", "1 glass (250 ml)", 45, 1.7, 9, 0.5, 2.6, "vegan"],
  ["nimbu-pani", "Nimbu pani", "drinks", "1 glass (250 ml)", 60, 0.2, 15, 0, 0, "vegan"],
  ["green-tea", "Green tea", "drinks", "1 cup", 2, 0, 0, 0, 0, "vegan"],
  ["herbal-tea", "Ginger or jeera tea", "drinks", "1 cup", 5, 0, 1, 0, 0, "vegan"],
  ["fresh-juice", "Fresh orange juice", "drinks", "1 glass (200 ml)", 90, 1.4, 21, 0.4, 0.4, "vegan folate"],
  ["smoothie", "Banana peanut smoothie", "drinks", "1 glass (300 ml)", 280, 11, 38, 10, 4, "protein"],
  ["protein-shake", "Protein shake with milk", "drinks", "1 glass (300 ml)", 230, 30, 14, 6, 1, "protein calcium"],
  ["soy-milk", "Soy milk", "drinks", "1 glass (200 ml)", 90, 6.5, 6, 4, 1, "vegan protein calcium"],
  ["beet-carrot-juice", "Beet and carrot juice", "drinks", "1 glass (200 ml)", 90, 2, 20, 0.3, 2, "vegan iron folate"],
  ["sattu-drink", "Sattu drink", "drinks", "1 glass (250 ml)", 150, 8, 24, 2.5, 5, "vegan protein fibre iron"],
  ["soft-drink", "Soft drink", "drinks", "1 can (330 ml)", 140, 0, 35, 0, 0, "vegan sweet"],
  ["water", "Water", "drinks", "1 glass", 0, 0, 0, 0, 0, "vegan"],
];

export const FOODS: Food[] = ROWS.map(([id, name, category, portion, kcal, protein, carbs, fat, fibre, tags]) => ({
  id,
  name,
  category,
  portion,
  kcal,
  protein,
  carbs,
  fat,
  fibre,
  tags: (tags ?? "").split(" ").filter(Boolean) as FoodTag[],
}));

const BY_ID = new Map(FOODS.map((f) => [f.id, f]));

export function foodById(id: string): Food | undefined {
  return BY_ID.get(id);
}

export function isVegetarian(f: Food): boolean {
  return !f.tags.includes("meat") && !f.tags.includes("fish") && !f.tags.includes("egg");
}

/** Foods that fit her diet type. */
export function fitsDiet(f: Food, diet?: string): boolean {
  if (!diet || diet === "non-vegetarian") return true;
  if (diet === "eggetarian") return !f.tags.includes("meat") && !f.tags.includes("fish");
  if (diet === "vegan") return f.tags.includes("vegan");
  if (diet === "jain") return isVegetarian(f) && !f.tags.includes("onion-garlic") && !/aloo|potato|onion|garlic|beetroot|carrot|sweet potato/i.test(f.name);
  return isVegetarian(f); // vegetarian
}

/** Simple search: every word must appear in the name or the category label. */
export function searchFoods(query: string, foods: Food[] = FOODS): Food[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return foods;
  return foods.filter((f) => {
    const hay = `${f.name} ${f.id.replace(/-/g, " ")} ${f.portion}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export interface Totals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export const ZERO: Totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };

export function addTotals<T extends Totals>(items: T[]): Totals {
  return items.reduce(
    (a, f) => ({
      kcal: a.kcal + f.kcal,
      protein: a.protein + f.protein,
      carbs: a.carbs + f.carbs,
      fat: a.fat + f.fat,
      fibre: a.fibre + f.fibre,
    }),
    { ...ZERO },
  );
}

export function scale(f: Totals, qty: number): Totals {
  const r = (n: number) => Math.round(n * qty * 10) / 10;
  return { kcal: Math.round(f.kcal * qty), protein: r(f.protein), carbs: r(f.carbs), fat: r(f.fat), fibre: r(f.fibre) };
}
