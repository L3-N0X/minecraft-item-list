// A Game view for the game to either guess the item from more and more information
// or to get an item and fill out as much information as possible about it for higher score.

// Fields included in Game 2:
// - Name (only image is shown at start)
// - ID
// - Renewable
// - Stack Size
// - Rarity Tier (only when not common) #maybe
// - block.luminous (only when > 0) #maybe
// - block.waterloggable
// - block.bestTools
// - edible.foodPoints
// - edible.saturation #maybe
// - breaking.requires_silktouch
// - breaking.special_tools (combine tools so the player only needs to determine the lowest tier tool required, e.g. diamond -> iron pickaxe)
// - breaking.instant_break
// - obtaining.craftable (very important)
// - obtaining.obtainability (maybe filter for survival only, else show it)
// - obtaining.natural_generation (everything except the comment), needs fix for dirt and grass where not all biomes need to be selected, like a minimum of 8 is enough for all points (dirt has 0 biomes specified but generates in almost every biome, so sometimes skip this field for those items)
// - generated loot (only structure, chest is pro mode only, maybe probabilities in expert mode if probability is 100% )
// - mob loot of course, needs disclaimer for cat and fox special perks, amount only in pro mode
// - Block loot of course, needs explanation to the user, amount only in pro mode
// - Trading without probabilities, amount only in pro mode
// - Fishing of course, needs special treatment for bamboo e.g. and category only in pro mode, amount only in pro mode, probabilities in expert mode (maybe)
// - Bartering of course, no probabilities here (maybe dropdown for expert mode)
// - Smelting of course
// - Composting of course, probabilities in expert mode (maybe)
// - Crafting Ingredient of course
// - Armor Trim Material (optional because only 7 items have this)
// - Fuel (burn time only in pro mode with dropdown, no help for expert?)
// - Possible Enchantments probably not, too much text and easy to guess, maybe for expert though

// - Difficulty to obtain (this is no minecraft field, this is used to determine the user's score what he thinks how hard this item is to obtain, we might collect this as data here to improve our score for obtaining difficulty)
