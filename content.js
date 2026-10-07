/*
 * content.js
 * All Diwali content, organized by age tier.
 * Tiers: "little" (3-7), "kids" (8-12), "teen" (13+)
 *
 * Everything here is factual, kid-friendly text. No external assets are
 * referenced — all visuals are drawn with CSS/SVG/canvas elsewhere.
 */

const AGE_TIERS = {
  little: { label: "Little Star", range: "3–7", emoji: "🌟" },
  kids: { label: "Explorer", range: "8–12", emoji: "🧭" },
  teen: { label: "Scholar", range: "13 & up", emoji: "📚" },
};

/* Decide a tier from a numeric age. */
function tierForAge(age) {
  if (age <= 7) return "little";
  if (age <= 12) return "kids";
  return "teen";
}

const CONTENT = {
  /* ---------- What is Diwali? ---------- */
  intro: {
    little: {
      title: "What is Diwali?",
      text: "Diwali is the Festival of Lights! 🪔 People light little lamps called diyas so everything glows warm and bright. It means light wins over dark, and good wins over bad. Yay!",
    },
    kids: {
      title: "What is Diwali?",
      text: "Diwali (also called Deepavali, meaning 'a row of lights') is India's biggest festival. Families light rows of clay lamps called diyas, share sweets, wear new clothes, and celebrate light triumphing over darkness and good over evil. It usually falls in October or November.",
    },
    teen: {
      title: "What is Diwali?",
      text: "Diwali, or Deepavali ('row of lamps' in Sanskrit), is a five-day festival celebrated across India and by communities worldwide. It symbolizes the victory of light over darkness and knowledge over ignorance. Different regions tie it to different legends: Rama's return to Ayodhya after defeating Ravana (north India), Krishna vanquishing the demon Narakasura (south India), and the worship of Lakshmi, goddess of prosperity. It is also significant in Jainism, Sikhism (Bandi Chhor Divas), and Buddhism.",
    },
  },

  /* ---------- The 5 Days ---------- */
  days: [
    {
      day: 1,
      name: "Dhanteras",
      icon: "🪙",
      little: "People buy something shiny and new, like coins or pots!",
      kids: "The first day. People buy metal items like gold, silver, or new utensils for good luck and clean their homes to welcome prosperity.",
      teen: "Dhanteras marks the start of Diwali. 'Dhan' means wealth. People buy precious metals and worship Lakshmi and Dhanvantari (the physician of the gods). Homes are cleaned and decorated to invite prosperity.",
    },
    {
      day: 2,
      name: "Naraka Chaturdashi",
      icon: "🌅",
      little: "Also called Choti Diwali — a little Diwali before the big one!",
      kids: "Also called Choti Diwali ('small Diwali'). It celebrates the defeat of the demon Narakasura. People take early oil baths and light a few diyas.",
      teen: "Naraka Chaturdashi (Choti Diwali) commemorates Krishna's victory over the demon Narakasura, freeing 16,000 captives. Traditions include an early-morning ritual oil bath (Abhyanga Snan) symbolizing the washing away of sins.",
    },
    {
      day: 3,
      name: "Lakshmi Puja",
      icon: "🪔",
      little: "The BIG day! Lots and lots of lamps everywhere! ✨",
      kids: "The main day of Diwali! Families pray to Lakshmi, the goddess of wealth, light hundreds of diyas, make colorful rangoli, and share sweets and gifts.",
      teen: "The main day. Families perform Lakshmi Puja to invite the goddess of wealth into their homes, light rows of diyas, draw rangoli at thresholds, and burst fireworks. It falls on the darkest night (amavasya) of the Hindu month of Kartik.",
    },
    {
      day: 4,
      name: "Govardhan Puja / Padwa",
      icon: "⛰️",
      little: "A day to say thank you for food and nature!",
      kids: "Celebrates Krishna lifting the Govardhan hill to protect villagers from rain. People make mountains of food (annakut) as offerings.",
      teen: "Govardhan Puja recalls Krishna lifting Mount Govardhan to shelter villagers from Indra's storm. Devotees prepare 'annakut' (a mountain of food). In some regions it is Padwa, celebrating the bond between husband and wife.",
    },
    {
      day: 5,
      name: "Bhai Dooj",
      icon: "🫶",
      little: "Brothers and sisters celebrate together!",
      kids: "The last day celebrates the bond between brothers and sisters, similar to Raksha Bandhan. Sisters pray for their brothers' long lives.",
      teen: "Bhai Dooj honors the sibling bond. Sisters apply a tilak on their brothers' foreheads and pray for their well-being; brothers give gifts. It echoes the legend of Yama visiting his sister Yamuna.",
    },
  ],

  /* ---------- Diyas ---------- */
  diyas: [
    {
      name: "Clay Diya",
      color: "#c0653a",
      little: "A little clay cup with a happy flame! 🔥",
      kids: "The classic terracotta lamp (mitti ka diya) filled with oil and a cotton wick. Simple, traditional, and used everywhere.",
      teen: "The traditional terracotta lamp, hand-shaped from clay and dried in the sun. Filled with mustard or sesame oil and a cotton wick. Biodegradable and central to Diwali since ancient times.",
    },
    {
      name: "Decorated Diya",
      color: "#d94f8a",
      little: "A fancy painted lamp with pretty colors! 🎨",
      kids: "Clay or metal diyas painted with bright colors, mirrors, and glitter. Often given as gifts.",
      teen: "Ornamental diyas decorated with paint, mirror-work, beads, and gold leaf. Popular as decorative pieces and gifts, blending craft traditions across regions.",
    },
    {
      name: "Brass Diya",
      color: "#e0a92e",
      little: "A shiny golden lamp! ✨",
      kids: "A lamp made of brass or metal that can be reused every year. Often used in temples and prayers.",
      teen: "Reusable metal (brass or bronze) lamps used in temples and home shrines. Some are multi-wick 'deepam' lamps or tall standing 'samai' lamps used in southern India.",
    },
    {
      name: "Floating Diya",
      color: "#3aa0c0",
      little: "A lamp that floats on water! 💧",
      kids: "Small diyas placed in bowls of water or on rivers, glowing as they float.",
      teen: "Diyas set afloat on water in bowls, ponds, and rivers — most spectacular during Dev Deepawali in Varanasi, where thousands illuminate the Ganga ghats.",
    },
    {
      name: "Akash Kandil",
      color: "#7b5bd6",
      little: "A glowing paper star lantern! ⭐",
      kids: "A paper lantern (kandil) hung outside homes, especially in Maharashtra, glowing like a colorful star.",
      teen: "The Akash Kandil ('sky lantern') is an intricate paper-and-bamboo lantern hung outside homes, popular in Maharashtra and Goa. Modern versions come in elaborate geometric star shapes.",
    },
  ],

  /* ---------- Famous places ---------- */
  places: [
    {
      name: "Ayodhya",
      where: "Uttar Pradesh, India",
      scene: "ayodhya",
      photo: {
        src: "images/ayodhya-ram-mandir.jpg",
        alt: "The Ram Mandir in Ayodhya, decorated with flowers during the January 2024 consecration (Pran Pratishtha)",
        author: "Prime Minister's Office (GODL-India)",
        authorUrl: "https://www.pmindia.gov.in/en/",
        license: "GODL-India",
        licenseUrl: "https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Ram_Janmbhoomi_Mandir,_Ayodhya_Dham.jpg",
      },
      little: "Rama's home city — it lights up with millions of lamps! 🪔",
      kids: "The birthplace of Lord Rama. Every year Ayodhya sets world records lighting hundreds of thousands of diyas on the riverbanks (Deepotsav). Its grand Ram Mandir was consecrated in 2024.",
      teen: "Believed to be Lord Rama's kingdom and home to the Ram Mandir (consecrated January 2024). Its 'Deepotsav' celebration repeatedly breaks Guinness World Records — over 2.2 million diyas lit along the Saryu river in recent years.",
    },
    {
      name: "Amritsar",
      where: "Punjab, India",
      scene: "amritsar",
      photo: {
        src: "images/amritsar-golden-temple.jpg",
        alt: "The Golden Temple (Harmandir Sahib) in Amritsar, reflected in its sacred pool",
        author: "Bernard Gagnon",
        authorUrl: "https://commons.wikimedia.org/wiki/User:Bgag",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Golden_Temple,_Amritsar_02.jpg",
      },
      little: "The Golden Temple shines super bright! ✨",
      kids: "Home of the Golden Temple, which glows with lights and reflections. Sikhs also celebrate Bandi Chhor Divas here.",
      teen: "The Golden Temple (Harmandir Sahib) is illuminated and reflected in its sacred pool. Sikhs mark Bandi Chhor Divas, celebrating Guru Hargobind's release from imprisonment, alongside Diwali.",
    },
    {
      name: "Varanasi",
      where: "Uttar Pradesh, India",
      scene: "varanasi",
      photo: {
        src: "images/varanasi-namo-ghat.jpg",
        alt: "The giant praying-hands sculpture at Namo Ghat on the banks of the Ganga in Varanasi",
        author: "Bimalsaha25",
        authorUrl: "https://commons.wikimedia.org/wiki/User:Bimalsaha25",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Namo_Ghat.jpg",
      },
      little: "Thousands of lamps float on the river! 💧",
      kids: "During Dev Deepawali, the steps (ghats) along the Ganga river glow with thousands of diyas.",
      teen: "Dev Deepawali ('Diwali of the gods'), 15 days after Diwali, transforms Varanasi's ghats with over a million diyas lining the Ganga — one of India's most breathtaking light spectacles.",
    },
    {
      name: "Jaipur",
      where: "Rajasthan, India",
      scene: "jaipur",
      photo: {
        src: "images/jaipur-hawa-mahal.jpg",
        alt: "The Hawa Mahal (Palace of Winds) in Jaipur, illuminated at night",
        author: "SaibalG",
        authorUrl: "https://commons.wikimedia.org/wiki/User:SaibalG",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Hawa_Mahal_by_Saibal_Ghosh.jpg",
      },
      little: "The whole market sparkles with lights! 🌆",
      kids: "Jaipur's markets, especially Johari Bazaar, are famous for dazzling light decorations and even hold competitions. Its Hawa Mahal glows beautifully.",
      teen: "The 'Pink City' holds market-lighting competitions; Johari Bazaar and landmarks like the Hawa Mahal (Palace of Winds) are decked in synchronized illuminations, drawing crowds from across Rajasthan.",
    },
  ],

  /* ---------- Firecrackers (built as canvas animations) ----------
   * 'anim' selects the popup animation + synthesized sound. */
  crackers: [
    {
      name: "Sparkler",
      hindi: "Phuljhadi",
      anim: "sparkler",
      little: "A stick that sparkles like magic! ✨",
      kids: "A hand-held sparkler that throws off tiny bright sparks. A favorite for little ones (with a grown-up nearby).",
      teen: "The phuljhadi (sparkler) is a metal wire coated in a slow-burning pyrotechnic. Handheld and iconic, it's often the first firework kids experience.",
    },
    {
      name: "Anar",
      hindi: "Flower Pot",
      anim: "anar",
      little: "A fountain of golden sparkles! 🎆",
      kids: "The anar sits on the ground and shoots a beautiful fountain of sparks upward like a glowing flower.",
      teen: "The anar (flower pot / fountain) is a ground-based cone that ejects a sustained fountain of sparks — one of the most popular and relatively contained fireworks.",
    },
    {
      name: "Spinner",
      hindi: "Chakri",
      anim: "chakri",
      little: "A spinning wheel of light! 🌀",
      kids: "The chakri spins fast on the ground, drawing a glowing circle of sparks.",
      teen: "The chakkar/chakri is a ground spinner that rotates rapidly, producing a bright circular trail of sparks powered by tangentially vented gas.",
    },
    {
      name: "Rocket",
      hindi: "Raket",
      anim: "rocket",
      little: "Whoosh! Up into the sky it goes! 🚀",
      kids: "A rocket that shoots high into the sky and bursts into colorful sparks.",
      teen: "Sky rockets launch on a propellant charge, then a bursting charge scatters colorful stars high in the air — the classic aerial firework.",
    },
    {
      name: "Sky Shot",
      hindi: "Aerial Shell",
      anim: "skyshot",
      little: "Big colorful booms in the sky! 🎇",
      kids: "Aerial shells burst into huge, colorful patterns high above — the grand finale of many Diwali nights.",
      teen: "Aerial shells (multi-shot 'cakes') launch shells that burst into large chrysanthemum, peony, and willow patterns. Colors come from metal salts: strontium (red), barium (green), copper (blue), sodium (yellow).",
    },
    {
      name: "Snake",
      hindi: "Kaala Saap",
      anim: "snake",
      little: "A little black pill grows a wiggly ash snake! 🐍",
      kids: "The 'snake' (kaala saap) is a small tablet that doesn't bang — when lit, it grows a long, wiggly coil of ash like a snake. Fun and quiet!",
      teen: "The snake/serpent tablet (kaala saap) burns without a flame or bang, expanding into a long carbonaceous ash coil. A classic non-explosive novelty, gentle enough for young children.",
    },
    {
      name: "Sutli Bomb",
      hindi: "Sutli Bam",
      anim: "sutlibam",
      little: "A big LOUD bang! 💥 (cover your ears!)",
      kids: "The sutli bam is a jute-string wrapped cracker known for one very loud bang — no sparks, just a big boom.",
      teen: "The sutli bomb is a tightly jute-wound firecracker famed for a single powerful report (bang) rather than light. Among the loudest common crackers — best enjoyed from a safe distance with ears covered.",
    },
    {
      name: "String of Crackers",
      hindi: "Ladi / Chatai",
      anim: "ladi",
      little: "Lots of tiny crackers go pop-pop-pop! 🧨",
      kids: "A 'ladi' (also called chatai) is a long chain of small crackers tied together — once lit, they burst one after another in a fast rattle of pops.",
      teen: "The ladi/chatai is a woven belt of many small crackers connected by a single fuse; lighting one end sets off a rapid chain of reports — a staple sound of Diwali streets.",
    },
    {
      name: "Seven Shots",
      hindi: "Seven Crackers",
      anim: "sevenshots",
      little: "One, two, three… seven booms in the sky! 🎆",
      kids: "A 'seven shot' fires seven aerial bursts one after another from a single tube — a mini fireworks show in itself.",
      teen: "The seven-shot is a repeater tube that launches seven aerial shells in sequence, each bursting into colored stars — a compact precursor to the large multi-shot 'cakes'.",
    },
  ],

  /* ---------- Memories (external media on Google Drive) ---------- */
  memories: [
    {
      year: "2025",
      emoji: "📸",
      url: "https://drive.google.com/drive/folders/1v83v36u6cqFN9p8eE2o-yIvqZnimTqEd?usp=sharing",
      little: "Look at our Diwali party photos from 2025! 🎉",
      kids: "Photo highlights from our 2025 Diwali celebration — tap to open the album.",
      teen: "A portrait gallery from our 2025 Diwali celebration. Opens in Google Drive in a new tab.",
    },
    {
      year: "2024",
      emoji: "🎬",
      url: "https://drive.google.com/drive/folders/1--CZLz5lvgSI9ByG13zxVc6nsB6wKxCa?usp=sharing",
      little: "Watch our fun dances and games from 2024! 💃",
      kids: "Videos from our 2024 Diwali celebration — dances, quiz, and more. Tap to open.",
      teen: "Video memories from our 2024 Diwali celebration (dances, quiz, performances). Opens in Google Drive in a new tab.",
    },
  ],

  /* ---------- Quiz ---------- */
  quiz: {
    little: [
      {
        q: "What does Diwali celebrate?",
        options: ["Light! 🪔", "Rain ☔", "Snow ❄️"],
        answer: 0,
      },
      {
        q: "What do we light on Diwali?",
        options: ["Diyas (lamps) 🔥", "Candles on a cake 🎂", "A campfire 🏕️"],
        answer: 0,
      },
      {
        q: "How do people feel on Diwali?",
        options: ["Happy! 😄", "Sleepy 😴", "Grumpy 😠"],
        answer: 0,
      },
    ],
    kids: [
      {
        q: "What does the word 'Deepavali' mean?",
        options: ["A row of lights", "A big feast", "A new year"],
        answer: 0,
      },
      {
        q: "Which day is the MAIN day of Diwali?",
        options: ["Lakshmi Puja", "Bhai Dooj", "Dhanteras"],
        answer: 0,
      },
      {
        q: "Which city sets world records for lighting diyas?",
        options: ["Ayodhya", "Mumbai", "Delhi"],
        answer: 0,
      },
      {
        q: "What is a 'chakri'?",
        options: ["A ground spinner", "A sweet", "A lamp"],
        answer: 0,
      },
    ],
    teen: [
      {
        q: "Diwali falls on the darkest night (amavasya) of which Hindu month?",
        options: ["Kartik", "Chaitra", "Shravan"],
        answer: 0,
      },
      {
        q: "In south India, Diwali often celebrates Krishna defeating which demon?",
        options: ["Narakasura", "Ravana", "Mahishasura"],
        answer: 0,
      },
      {
        q: "Which festival do Sikhs celebrate alongside Diwali?",
        options: ["Bandi Chhor Divas", "Vaisakhi", "Hola Mohalla"],
        answer: 0,
      },
      {
        q: "Which metal salt produces GREEN in fireworks?",
        options: ["Barium", "Strontium", "Sodium"],
        answer: 0,
      },
      {
        q: "Dev Deepawali, famous for a million diyas on the Ganga, is held in which city?",
        options: ["Varanasi", "Amritsar", "Jaipur"],
        answer: 0,
      },
    ],
  },
};
