const WORDS = {
  animals: [
    "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "tiger", "lion",
    "monkey", "parrot", "crocodile", "butterfly", "kangaroo", "octopus", "zebra",
    "shark", "turtle", "owl", "flamingo", "hedgehog", "peacock", "cheetah",
    "gorilla", "panda", "koala", "jellyfish", "lobster", "seahorse", "whale",
    "eagle", "bat", "deer", "fox", "wolf", "bear", "rabbit", "squirrel"
  ],
  objects: [
    "umbrella", "telescope", "backpack", "bicycle", "guitar", "camera", "clock",
    "compass", "hammer", "key", "ladder", "lantern", "lighthouse", "magnet",
    "microscope", "mirror", "paintbrush", "pencil", "piano", "rocket", "scissors",
    "shield", "suitcase", "sword", "telescope", "trophy", "violin", "wallet",
    "windmill", "wrench", "anchor", "balloon", "candle", "crown", "drum",
    "fan", "flag", "globe", "glove", "helmet", "hourglass", "jar", "kite"
  ],
  food: [
    "pizza", "burger", "sushi", "taco", "waffle", "donut", "croissant", "sandwich",
    "ice cream", "cupcake", "hotdog", "pancake", "salad", "soup", "steak",
    "watermelon", "strawberry", "pineapple", "avocado", "broccoli", "carrot",
    "mushroom", "pretzel", "cookie", "cake", "pie", "muffin", "bagel",
    "popcorn", "nachos", "burrito", "noodles", "dumpling", "ramen", "pasta"
  ],
  actions: [
    "swimming", "dancing", "singing", "cooking", "painting", "reading", "running",
    "jumping", "climbing", "flying", "fishing", "sleeping", "laughing", "crying",
    "driving", "surfing", "skateboarding", "knitting", "juggling", "bowling",
    "boxing", "hiking", "cycling", "yoga", "skiing", "snowboarding", "kayaking",
    "rock climbing", "skydiving", "bungee jumping", "snorkeling", "gardening"
  ],
  places: [
    "beach", "mountain", "forest", "desert", "castle", "library", "museum",
    "airport", "stadium", "hospital", "school", "farm", "jungle", "island",
    "cave", "volcano", "waterfall", "canyon", "glacier", "swamp", "lighthouse",
    "palace", "temple", "church", "market", "playground", "theater", "circus",
    "zoo", "aquarium", "observatory", "lighthouse", "harbor", "bridge"
  ]
};

function getRandomWords(count = 3) {
  const allCategories = Object.keys(WORDS);
  const selectedWords = [];
  const usedWords = new Set();

  while (selectedWords.length < count) {
    const category = allCategories[Math.floor(Math.random() * allCategories.length)];
    const wordList = WORDS[category];
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    if (!usedWords.has(word)) {
      usedWords.add(word);
      selectedWords.push(word);
    }
  }
  return selectedWords;
}

module.exports = { WORDS, getRandomWords };
