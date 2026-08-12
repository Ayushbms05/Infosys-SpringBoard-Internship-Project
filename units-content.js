/**
 * units-content.js — Hardcoded lesson content for the Units tab
 *
 * Schema per exercise:
 *   reading / listening:
 *     { instruction, content, translation, question, options[4], answerIndex, explanation }
 *   writing (sentence builder):
 *     { instruction, content, question, options[5 words], answerIndex, explanation }
 *   speaking / pronunciation:
 *     { instruction, content, translation, question, options: [], answerIndex }
 *
 * Coverage: 10 units × 5 skills = 50 lesson objects, 5 exercises each = 250 exercises total.
 * Content is in English (target language). Translation field is in Hindi (knownLanguage fallback).
 * The rendering layer handles TTS/STT for audio-based skill types via the existing speakText() /
 * startSpeechToText() functions — this file only supplies the text.
 */

const UNITS_CONTENT = {

  // ═══════════════════════════════════════════════════════════════
  // BEGINNER
  // ═══════════════════════════════════════════════════════════════

  // ── Unit 1: Greetings & Numbers ─────────────────────────────────
  unit_greetings_numbers: {
    reading: [
      {
        instruction: "Read and answer",
        content: "Good morning! My name is Ravi.",
        translation: "सुप्रभात! मेरा नाम रवि है।",
        question: "What is the person's name?",
        options: ["Ravi", "Raj", "Rohit", "Rita"],
        answerIndex: 0,
        explanation: "'My name is Ravi' tells us the name directly."
      },
      {
        instruction: "Read and answer",
        content: "Hello! How are you today?",
        translation: "नमस्ते! आज आप कैसे हैं?",
        question: "What is the speaker asking about?",
        options: ["Your age", "Your wellbeing", "Your name", "Your job"],
        answerIndex: 1,
        explanation: "'How are you?' asks about wellbeing."
      },
      {
        instruction: "Read and answer",
        content: "There are five students in the class.",
        translation: "कक्षा में पाँच छात्र हैं।",
        question: "How many students are there?",
        options: ["Two", "Three", "Four", "Five"],
        answerIndex: 3,
        explanation: "'Five students' is stated directly in the sentence."
      },
      {
        instruction: "Read and answer",
        content: "The shop opens at nine o'clock.",
        translation: "दुकान नौ बजे खुलती है।",
        question: "When does the shop open?",
        options: ["At eight", "At nine", "At ten", "At eleven"],
        answerIndex: 1,
        explanation: "'At nine o'clock' tells us the opening time."
      },
      {
        instruction: "Read and answer",
        content: "Nice to meet you. Please sit down.",
        translation: "आपसे मिलकर अच्छा लगा। कृपया बैठिए।",
        question: "What is the speaker asking the person to do?",
        options: ["Stand up", "Go away", "Sit down", "Come back"],
        answerIndex: 2,
        explanation: "'Please sit down' is a polite request to take a seat."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "A sentence about greeting someone in the morning",
        question: "Good morning how are you",
        options: ["morning", "Good", "how", "are", "you"],
        answerIndex: 0,
        explanation: "Standard morning greeting in English."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying what your name is",
        question: "My name is Priya",
        options: ["name", "Priya", "My", "is"],
        answerIndex: 0,
        explanation: "Subject + 'name is' + name is the correct order."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Counting ten items on a table",
        question: "There are ten apples here",
        options: ["ten", "are", "There", "here", "apples"],
        answerIndex: 0,
        explanation: "'There are' + number + noun is standard English structure."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "A polite goodbye when leaving",
        question: "Goodbye see you tomorrow",
        options: ["tomorrow", "Goodbye", "you", "see"],
        answerIndex: 0,
        explanation: "Goodbye followed by 'see you' is a common farewell."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Expressing pleasure at meeting someone new",
        question: "Nice to meet you today",
        options: ["meet", "Nice", "today", "to", "you"],
        answerIndex: 0,
        explanation: "'Nice to meet you' is a fixed polite greeting phrase."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "Hello, my name is Anita. I am from Delhi.",
        translation: "नमस्ते, मेरा नाम अनिता है। मैं दिल्ली से हूँ।",
        question: "Where is Anita from?",
        options: ["Mumbai", "Pune", "Delhi", "Jaipur"],
        answerIndex: 2,
        explanation: "The sentence says 'I am from Delhi'."
      },
      {
        instruction: "Listen and answer",
        content: "The price is two hundred rupees.",
        translation: "कीमत दो सौ रुपये है।",
        question: "What is the price?",
        options: ["₹100", "₹150", "₹200", "₹250"],
        answerIndex: 2,
        explanation: "'Two hundred rupees' = ₹200."
      },
      {
        instruction: "Listen and answer",
        content: "Good evening! Welcome to our store.",
        translation: "शुभ संध्या! हमारी दुकान में आपका स्वागत है।",
        question: "What time of day is it?",
        options: ["Morning", "Afternoon", "Evening", "Night"],
        answerIndex: 2,
        explanation: "'Good evening' is used in the evening."
      },
      {
        instruction: "Listen and answer",
        content: "I have three brothers and one sister.",
        translation: "मेरे तीन भाई और एक बहन है।",
        question: "How many brothers does the speaker have?",
        options: ["One", "Two", "Three", "Four"],
        answerIndex: 2,
        explanation: "The audio says 'three brothers'."
      },
      {
        instruction: "Listen and answer",
        content: "Please write your phone number here.",
        translation: "कृपया यहाँ अपना फोन नंबर लिखें।",
        question: "What should you write?",
        options: ["Your name", "Your address", "Your phone number", "Your age"],
        answerIndex: 2,
        explanation: "'Your phone number here' is clearly stated."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "Hello, my name is Ravi.",
        translation: "नमस्ते, मेरा नाम रवि है।",
        question: "Repeat this greeting",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Good morning! How are you?",
        translation: "सुप्रभात! आप कैसे हैं?",
        question: "Repeat this morning greeting",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Nice to meet you.",
        translation: "आपसे मिलकर खुशी हुई।",
        question: "Repeat this polite phrase",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "My phone number is nine eight seven six.",
        translation: "मेरा फोन नंबर नौ आठ सात छह है।",
        question: "Repeat the number sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Goodbye, see you tomorrow!",
        translation: "अलविदा, कल मिलते हैं!",
        question: "Repeat this farewell",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Hello",
        translation: "नमस्ते",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Welcome",
        translation: "स्वागत",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Hundred",
        translation: "सौ",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Thousand",
        translation: "हज़ार",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Goodbye",
        translation: "अलविदा",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  },

  // ── Unit 2: Daily Life ───────────────────────────────────────────
  unit_daily_life: {
    reading: [
      {
        instruction: "Read and answer",
        content: "I wake up at six o'clock every morning.",
        translation: "मैं हर सुबह छह बजे उठता हूँ।",
        question: "What time does this person wake up?",
        options: ["Five o'clock", "Six o'clock", "Seven o'clock", "Eight o'clock"],
        answerIndex: 1,
        explanation: "'At six o'clock' gives the wake-up time."
      },
      {
        instruction: "Read and answer",
        content: "She cooks rice and vegetables for dinner.",
        translation: "वह रात के खाने के लिए चावल और सब्जी पकाती है।",
        question: "What does she cook?",
        options: ["Bread and soup", "Rice and vegetables", "Eggs and toast", "Fish and rice"],
        answerIndex: 1,
        explanation: "The sentence says 'rice and vegetables'."
      },
      {
        instruction: "Read and answer",
        content: "The electricity bill is due on the fifth.",
        translation: "बिजली का बिल पाँच तारीख को देय है।",
        question: "When is the electricity bill due?",
        options: ["The first", "The third", "The fifth", "The tenth"],
        answerIndex: 2,
        explanation: "'On the fifth' gives the due date."
      },
      {
        instruction: "Read and answer",
        content: "He walks to the bus stop every day.",
        translation: "वह हर दिन बस स्टॉप तक पैदल जाता है।",
        question: "How does he get to the bus stop?",
        options: ["By car", "By bicycle", "On foot", "By auto"],
        answerIndex: 2,
        explanation: "'Walks to the bus stop' means on foot."
      },
      {
        instruction: "Read and answer",
        content: "The water supply is cut for two hours today.",
        translation: "आज दो घंटे पानी की आपूर्ति बंद है।",
        question: "How long is the water supply cut?",
        options: ["One hour", "Two hours", "Three hours", "Four hours"],
        answerIndex: 1,
        explanation: "'For two hours' gives the duration."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Describing when you eat breakfast",
        question: "I eat breakfast at seven",
        options: ["eat", "I", "seven", "at", "breakfast"],
        answerIndex: 0,
        explanation: "Subject + verb + object + time is the correct order."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying that you go to work daily",
        question: "I go to work every day",
        options: ["work", "go", "I", "every", "to", "day"],
        answerIndex: 0,
        explanation: "'I go to work every day' follows natural English word order."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Talking about cooking at home",
        question: "She cooks food at home",
        options: ["home", "cooks", "She", "at", "food"],
        answerIndex: 0,
        explanation: "Subject + verb + object + location is standard."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Mentioning that you drink water",
        question: "I drink water every morning",
        options: ["every", "drink", "I", "morning", "water"],
        answerIndex: 0,
        explanation: "Simple present tense: subject + verb + object + time."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying when you sleep at night",
        question: "I sleep at ten at night",
        options: ["at", "sleep", "I", "night", "ten"],
        answerIndex: 0,
        explanation: "'I sleep at ten at night' gives both time and period."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "The market opens at eight in the morning.",
        translation: "बाज़ार सुबह आठ बजे खुलता है।",
        question: "When does the market open?",
        options: ["Seven", "Eight", "Nine", "Ten"],
        answerIndex: 1,
        explanation: "'Eight in the morning' gives the opening time."
      },
      {
        instruction: "Listen and answer",
        content: "Please pay the rent by the first of the month.",
        translation: "कृपया महीने की पहली तारीख तक किराया दें।",
        question: "When should you pay the rent?",
        options: ["The fifth", "The tenth", "The first", "The fifteenth"],
        answerIndex: 2,
        explanation: "'By the first of the month' is the deadline."
      },
      {
        instruction: "Listen and answer",
        content: "She buys vegetables from the local market.",
        translation: "वह स्थानीय बाज़ार से सब्जियाँ खरीदती है।",
        question: "What does she buy?",
        options: ["Fruits", "Vegetables", "Clothes", "Medicine"],
        answerIndex: 1,
        explanation: "'Buys vegetables' is stated in the sentence."
      },
      {
        instruction: "Listen and answer",
        content: "The bus arrives every thirty minutes.",
        translation: "बस हर तीस मिनट में आती है।",
        question: "How often does the bus arrive?",
        options: ["Every ten minutes", "Every twenty minutes", "Every thirty minutes", "Every hour"],
        answerIndex: 2,
        explanation: "'Every thirty minutes' gives the frequency."
      },
      {
        instruction: "Listen and answer",
        content: "I take a bath before going to work.",
        translation: "मैं काम पर जाने से पहले नहाता हूँ।",
        question: "When does the speaker take a bath?",
        options: ["After work", "Before work", "At night", "In the afternoon"],
        answerIndex: 1,
        explanation: "'Before going to work' gives the timing."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "I wake up at six every morning.",
        translation: "मैं हर सुबह छह बजे उठता हूँ।",
        question: "Repeat this daily routine sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Please give me the electricity bill.",
        translation: "कृपया मुझे बिजली का बिल दें।",
        question: "Repeat this request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "The water is not coming today.",
        translation: "आज पानी नहीं आ रहा है।",
        question: "Repeat this statement",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I cook food at home every evening.",
        translation: "मैं हर शाम घर पर खाना बनाता हूँ।",
        question: "Repeat this routine sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "My house has two rooms.",
        translation: "मेरे घर में दो कमरे हैं।",
        question: "Repeat this description",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Electricity",
        translation: "बिजली",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Vegetables",
        translation: "सब्जियाँ",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Morning",
        translation: "सुबह",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Kitchen",
        translation: "रसोई",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Neighbourhood",
        translation: "पड़ोस",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  },

  // ── Unit 3: Family & Relations ───────────────────────────────────
  unit_family: {
    reading: [
      {
        instruction: "Read and answer",
        content: "My father works in a government office.",
        translation: "मेरे पिताजी सरकारी दफ्तर में काम करते हैं।",
        question: "Where does the father work?",
        options: ["In a school", "In a hospital", "In a government office", "In a shop"],
        answerIndex: 2,
        explanation: "'Government office' is where the father works."
      },
      {
        instruction: "Read and answer",
        content: "My elder sister got married last year.",
        translation: "मेरी बड़ी बहन की शादी पिछले साल हुई थी।",
        question: "Who got married last year?",
        options: ["Younger sister", "Elder brother", "Elder sister", "Mother"],
        answerIndex: 2,
        explanation: "'My elder sister got married' is clearly stated."
      },
      {
        instruction: "Read and answer",
        content: "We have three children — two sons and one daughter.",
        translation: "हमारे तीन बच्चे हैं — दो बेटे और एक बेटी।",
        question: "How many daughters do they have?",
        options: ["None", "One", "Two", "Three"],
        answerIndex: 1,
        explanation: "'One daughter' is mentioned in the sentence."
      },
      {
        instruction: "Read and answer",
        content: "My grandmother lives with us in the same house.",
        translation: "मेरी दादी हमारे साथ उसी घर में रहती हैं।",
        question: "Who lives in the same house?",
        options: ["Grandfather", "Uncle", "Grandmother", "Cousin"],
        answerIndex: 2,
        explanation: "'My grandmother lives with us' gives the answer."
      },
      {
        instruction: "Read and answer",
        content: "My son is studying in class five.",
        translation: "मेरा बेटा पाँचवीं कक्षा में पढ़ता है।",
        question: "Which class is the son studying in?",
        options: ["Class three", "Class four", "Class five", "Class six"],
        answerIndex: 2,
        explanation: "'Class five' is directly stated."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Talking about where your father works",
        question: "My father works in a factory",
        options: ["in", "father", "My", "works", "factory", "a"],
        answerIndex: 0,
        explanation: "Possessive + noun + verb + location is the correct structure."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Describing how many siblings you have",
        question: "I have two brothers",
        options: ["brothers", "have", "I", "two"],
        answerIndex: 0,
        explanation: "Subject + 'have' + number + noun."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying that your mother is at home",
        question: "My mother is at home",
        options: ["at", "mother", "My", "home", "is"],
        answerIndex: 0,
        explanation: "Possessive + noun + 'is' + location."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Describing your child going to school",
        question: "My daughter goes to school daily",
        options: ["school", "goes", "My", "daily", "daughter", "to"],
        answerIndex: 0,
        explanation: "Subject + verb + location + time adverb."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying where your grandparents live",
        question: "My grandparents live in the village",
        options: ["village", "live", "My", "in", "grandparents", "the"],
        answerIndex: 0,
        explanation: "Possessive + noun + verb + location is standard."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "My husband works in a factory in the city.",
        translation: "मेरे पति शहर की एक फैक्ट्री में काम करते हैं।",
        question: "Where does the husband work?",
        options: ["A school", "A hospital", "A factory", "A bank"],
        answerIndex: 2,
        explanation: "'Works in a factory' is stated in the audio."
      },
      {
        instruction: "Listen and answer",
        content: "Our family has five members.",
        translation: "हमारे परिवार में पाँच सदस्य हैं।",
        question: "How many family members are there?",
        options: ["Three", "Four", "Five", "Six"],
        answerIndex: 2,
        explanation: "'Five members' is clearly stated."
      },
      {
        instruction: "Listen and answer",
        content: "My younger brother is learning to read.",
        translation: "मेरा छोटा भाई पढ़ना सीख रहा है।",
        question: "What is the younger brother doing?",
        options: ["Learning to write", "Learning to cook", "Learning to read", "Learning to drive"],
        answerIndex: 2,
        explanation: "'Learning to read' is mentioned in the audio."
      },
      {
        instruction: "Listen and answer",
        content: "We celebrate festivals together as a family.",
        translation: "हम परिवार के रूप में एक साथ त्योहार मनाते हैं।",
        question: "What do they do together as a family?",
        options: ["Work", "Study", "Celebrate festivals", "Travel"],
        answerIndex: 2,
        explanation: "'Celebrate festivals together' is the key phrase."
      },
      {
        instruction: "Listen and answer",
        content: "My mother takes care of our elderly grandfather.",
        translation: "मेरी माँ हमारे बुजुर्ग दादाजी की देखभाल करती हैं।",
        question: "Who does the mother take care of?",
        options: ["The children", "The grandmother", "The elderly grandfather", "The neighbours"],
        answerIndex: 2,
        explanation: "'Takes care of our elderly grandfather' gives the answer."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "I have one brother and two sisters.",
        translation: "मेरे एक भाई और दो बहनें हैं।",
        question: "Repeat this family description",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "My parents live in the village.",
        translation: "मेरे माता-पिता गाँव में रहते हैं।",
        question: "Repeat this sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "My son is five years old.",
        translation: "मेरे बेटे की उम्र पाँच साल है।",
        question: "Repeat this sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "My wife is a teacher.",
        translation: "मेरी पत्नी शिक्षिका हैं।",
        question: "Repeat this description",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "We all eat together in the evening.",
        translation: "हम सब शाम को एक साथ खाते हैं।",
        question: "Repeat this routine sentence",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Family",
        translation: "परिवार",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Brother",
        translation: "भाई",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Daughter",
        translation: "बेटी",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Grandfather",
        translation: "दादाजी",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Husband",
        translation: "पति",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  },

  // ── Unit 4: Shopping & Market ────────────────────────────────────
  unit_shopping: {
    reading: [
      {
        instruction: "Read and answer",
        content: "One kilogram of tomatoes costs twenty rupees.",
        translation: "एक किलोग्राम टमाटर की कीमत बीस रुपये है।",
        question: "What is the cost of one kg of tomatoes?",
        options: ["₹10", "₹15", "₹20", "₹25"],
        answerIndex: 2,
        explanation: "'Twenty rupees' is the price stated."
      },
      {
        instruction: "Read and answer",
        content: "Do you have this shirt in a larger size?",
        translation: "क्या आपके पास इस शर्ट का बड़ा साइज़ है?",
        question: "What is the customer asking for?",
        options: ["A different colour", "A cheaper price", "A larger size", "A different style"],
        answerIndex: 2,
        explanation: "'Larger size' is what the customer wants."
      },
      {
        instruction: "Read and answer",
        content: "The total bill is five hundred and fifty rupees.",
        translation: "कुल बिल पाँच सौ पचास रुपये है।",
        question: "What is the total amount?",
        options: ["₹500", "₹550", "₹600", "₹650"],
        answerIndex: 1,
        explanation: "'Five hundred and fifty rupees' = ₹550."
      },
      {
        instruction: "Read and answer",
        content: "I need two packets of milk and some bread.",
        translation: "मुझे दो पैकेट दूध और कुछ रोटी चाहिए।",
        question: "How many packets of milk are needed?",
        options: ["One", "Two", "Three", "Four"],
        answerIndex: 1,
        explanation: "'Two packets of milk' is stated clearly."
      },
      {
        instruction: "Read and answer",
        content: "This shop gives a ten percent discount on Sundays.",
        translation: "यह दुकान रविवार को दस प्रतिशत छूट देती है।",
        question: "When is the discount available?",
        options: ["Saturday", "Sunday", "Monday", "Friday"],
        answerIndex: 1,
        explanation: "'On Sundays' tells us when the discount applies."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking what something costs",
        question: "How much does this cost",
        options: ["this", "How", "does", "much", "cost"],
        answerIndex: 0,
        explanation: "Standard question form: 'How much does X cost?'"
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying you want to buy vegetables",
        question: "I want to buy vegetables",
        options: ["buy", "want", "I", "to", "vegetables"],
        answerIndex: 0,
        explanation: "Subject + 'want to' + verb + object."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying the price is too high",
        question: "The price is too high",
        options: ["too", "price", "The", "is", "high"],
        answerIndex: 0,
        explanation: "Subject + verb + adjective phrase."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking for a bag at the store",
        question: "Please give me a bag",
        options: ["me", "Please", "bag", "give", "a"],
        answerIndex: 0,
        explanation: "Polite imperative with 'please' at the start."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Requesting a receipt",
        question: "Can I have the bill please",
        options: ["please", "Can", "have", "I", "bill", "the"],
        answerIndex: 0,
        explanation: "'Can I have the bill please?' is a polite request."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "The vegetables are fresh today. Onions are fifteen rupees per kilo.",
        translation: "आज सब्जियाँ ताज़ी हैं। प्याज पंद्रह रुपये प्रति किलो है।",
        question: "What is the price of onions per kg?",
        options: ["₹10", "₹12", "₹15", "₹20"],
        answerIndex: 2,
        explanation: "'Fifteen rupees per kilo' is stated for onions."
      },
      {
        instruction: "Listen and answer",
        content: "We accept cash and UPI payments here.",
        translation: "हम यहाँ नकद और UPI भुगतान स्वीकार करते हैं।",
        question: "What payment methods are accepted?",
        options: ["Only cash", "Only card", "Cash and UPI", "Card and cheque"],
        answerIndex: 2,
        explanation: "'Cash and UPI payments' are both accepted."
      },
      {
        instruction: "Listen and answer",
        content: "Your change is thirty rupees.",
        translation: "आपका बाकी पैसा तीस रुपये है।",
        question: "How much change does the customer get?",
        options: ["₹10", "₹20", "₹30", "₹40"],
        answerIndex: 2,
        explanation: "'Thirty rupees' is the change."
      },
      {
        instruction: "Listen and answer",
        content: "This item is out of stock. We will get it next week.",
        translation: "यह वस्तु स्टॉक में नहीं है। हमें यह अगले सप्ताह मिलेगी।",
        question: "When will the item be available?",
        options: ["Tomorrow", "This weekend", "Next week", "Next month"],
        answerIndex: 2,
        explanation: "'Next week' is when the stock will arrive."
      },
      {
        instruction: "Listen and answer",
        content: "Please take your bag. Have a good day.",
        translation: "कृपया अपना थैला ले जाइए। आपका दिन शुभ हो।",
        question: "What is the shopkeeper saying?",
        options: ["Come back tomorrow", "Take your bag and have a good day", "The shop is closed", "Pay at the counter"],
        answerIndex: 1,
        explanation: "'Take your bag. Have a good day.' is a farewell."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "How much does this cost?",
        translation: "इसकी कीमत कितनी है?",
        question: "Repeat this shopping question",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I want two kilograms of rice.",
        translation: "मुझे दो किलोग्राम चावल चाहिए।",
        question: "Repeat this shopping request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Please give me the bill.",
        translation: "कृपया मुझे बिल दें।",
        question: "Repeat this request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Can you give a small discount?",
        translation: "क्या आप थोड़ी छूट दे सकते हैं?",
        question: "Repeat this bargaining phrase",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I will pay by UPI.",
        translation: "मैं UPI से भुगतान करूँगा।",
        question: "Repeat this payment sentence",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Market",
        translation: "बाज़ार",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Discount",
        translation: "छूट",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Receipt",
        translation: "रसीद",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Kilogram",
        translation: "किलोग्राम",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Payment",
        translation: "भुगतान",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // INTERMEDIATE
  // ═══════════════════════════════════════════════════════════════

  // ── Unit 5: Work & Employment ────────────────────────────────────
  unit_work: {
    reading: [
      {
        instruction: "Read and answer",
        content: "Please bring your original documents for the interview.",
        translation: "कृपया साक्षात्कार के लिए अपने मूल दस्तावेज़ लाएँ।",
        question: "What should you bring for the interview?",
        options: ["Your photograph", "Your original documents", "A reference letter", "Your work experience certificate"],
        answerIndex: 1,
        explanation: "'Original documents' is what is required."
      },
      {
        instruction: "Read and answer",
        content: "His salary is credited on the last working day of every month.",
        translation: "उनका वेतन हर महीने के आखिरी कार्य दिवस पर जमा होता है।",
        question: "When is his salary credited?",
        options: ["First working day", "Fifteenth of the month", "Last working day", "Every Friday"],
        answerIndex: 2,
        explanation: "'Last working day of every month' is the answer."
      },
      {
        instruction: "Read and answer",
        content: "You must apply for leave at least two days in advance.",
        translation: "आपको कम से कम दो दिन पहले छुट्टी के लिए आवेदन करना होगा।",
        question: "How far in advance should you apply for leave?",
        options: ["One day", "Two days", "Three days", "One week"],
        answerIndex: 1,
        explanation: "'At least two days in advance' is the requirement."
      },
      {
        instruction: "Read and answer",
        content: "The company offers medical insurance for all permanent employees.",
        translation: "कंपनी सभी स्थायी कर्मचारियों के लिए चिकित्सा बीमा प्रदान करती है।",
        question: "Who gets medical insurance?",
        options: ["All employees", "Managers only", "All permanent employees", "Contract workers"],
        answerIndex: 2,
        explanation: "'All permanent employees' receive medical insurance."
      },
      {
        instruction: "Read and answer",
        content: "Please sign the attendance register when you arrive.",
        translation: "जब आप पहुँचें तो कृपया उपस्थिति रजिस्टर में हस्ताक्षर करें।",
        question: "What should you do when you arrive?",
        options: ["Report to the manager", "Sign the attendance register", "Get your ID card", "Go to your desk"],
        answerIndex: 1,
        explanation: "'Sign the attendance register' is the instruction."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Requesting a day off from your boss",
        question: "I need one day of leave",
        options: ["leave", "need", "I", "one", "of", "day"],
        answerIndex: 0,
        explanation: "Subject + verb + object is the correct structure."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking about the timing of work",
        question: "What time does the shift start",
        options: ["start", "What", "the", "time", "does", "shift"],
        answerIndex: 0,
        explanation: "Question word + auxiliary + subject + verb."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying you have experience in a field",
        question: "I have five years of experience",
        options: ["years", "have", "I", "of", "five", "experience"],
        answerIndex: 0,
        explanation: "Subject + 'have' + duration + 'of' + noun."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking where to submit your application",
        question: "Where should I submit my application",
        options: ["submit", "Where", "I", "my", "should", "application"],
        answerIndex: 0,
        explanation: "Question word + modal + subject + verb + object."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying that your salary was not received",
        question: "My salary has not been received",
        options: ["been", "salary", "My", "not", "has", "received"],
        answerIndex: 0,
        explanation: "Subject + 'has not been' + past participle for passive voice."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "Your appointment letter will be sent by email within three days.",
        translation: "आपका नियुक्ति पत्र तीन दिनों के भीतर ईमेल द्वारा भेजा जाएगा।",
        question: "How will the appointment letter be sent?",
        options: ["By post", "By hand delivery", "By email", "By SMS"],
        answerIndex: 2,
        explanation: "'Sent by email' is clearly stated."
      },
      {
        instruction: "Listen and answer",
        content: "Overtime pay is double the normal rate.",
        translation: "ओवरटाइम का वेतन सामान्य दर का दोगुना है।",
        question: "How much is overtime pay compared to normal?",
        options: ["Same as normal", "One and a half times", "Double", "Triple"],
        answerIndex: 2,
        explanation: "'Double the normal rate' is stated."
      },
      {
        instruction: "Listen and answer",
        content: "Report to the HR department on your first day.",
        translation: "पहले दिन HR विभाग में रिपोर्ट करें।",
        question: "Where should you report on the first day?",
        options: ["The manager's office", "The canteen", "The HR department", "The security desk"],
        answerIndex: 2,
        explanation: "'HR department' is where you should report."
      },
      {
        instruction: "Listen and answer",
        content: "The probation period for this role is six months.",
        translation: "इस भूमिका के लिए परिवीक्षा अवधि छह महीने है।",
        question: "How long is the probation period?",
        options: ["Three months", "Four months", "Five months", "Six months"],
        answerIndex: 3,
        explanation: "'Six months' is stated as the probation period."
      },
      {
        instruction: "Listen and answer",
        content: "Punctuality is very important in this organization.",
        translation: "इस संस्था में समय पालन बहुत महत्वपूर्ण है।",
        question: "What is described as very important?",
        options: ["Dress code", "Teamwork", "Punctuality", "Communication"],
        answerIndex: 2,
        explanation: "'Punctuality is very important' is stated."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "I am applying for the supervisor position.",
        translation: "मैं पर्यवेक्षक के पद के लिए आवेदन कर रहा हूँ।",
        question: "Repeat this application sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I have three years of work experience.",
        translation: "मेरे पास तीन साल का कार्य अनुभव है।",
        question: "Repeat this experience sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Please tell me about the salary structure.",
        translation: "कृपया मुझे वेतन संरचना के बारे में बताएँ।",
        question: "Repeat this workplace question",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I would like to apply for sick leave.",
        translation: "मैं बीमारी की छुट्टी के लिए आवेदन करना चाहूँगा।",
        question: "Repeat this leave request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "My shift starts at eight in the morning.",
        translation: "मेरी शिफ्ट सुबह आठ बजे शुरू होती है।",
        question: "Repeat this work schedule sentence",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Interview",
        translation: "साक्षात्कार",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Salary",
        translation: "वेतन",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Attendance",
        translation: "उपस्थिति",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Probation",
        translation: "परिवीक्षा",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Department",
        translation: "विभाग",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  },

  // ── Unit 6: Health & Medicine ────────────────────────────────────
  unit_health: {
    reading: [
      {
        instruction: "Read and answer",
        content: "The doctor has prescribed medicine for three days.",
        translation: "डॉक्टर ने तीन दिन की दवाई लिखी है।",
        question: "For how many days has medicine been prescribed?",
        options: ["One day", "Two days", "Three days", "Five days"],
        answerIndex: 2,
        explanation: "'Three days' is the prescription duration."
      },
      {
        instruction: "Read and answer",
        content: "Take this tablet after meals, twice a day.",
        translation: "यह गोली दिन में दो बार खाने के बाद लें।",
        question: "When should you take the tablet?",
        options: ["Before meals", "After meals", "On an empty stomach", "At bedtime"],
        answerIndex: 1,
        explanation: "'After meals' is clearly stated."
      },
      {
        instruction: "Read and answer",
        content: "The patient needs to rest for one week.",
        translation: "मरीज़ को एक सप्ताह के लिए आराम करना है।",
        question: "For how long does the patient need to rest?",
        options: ["Two days", "Three days", "Five days", "One week"],
        answerIndex: 3,
        explanation: "'One week' is the resting period."
      },
      {
        instruction: "Read and answer",
        content: "Drink at least eight glasses of water every day.",
        translation: "हर दिन कम से कम आठ गिलास पानी पीएं।",
        question: "How many glasses of water should you drink daily?",
        options: ["Four", "Six", "Eight", "Ten"],
        answerIndex: 2,
        explanation: "'Eight glasses' is the recommended amount."
      },
      {
        instruction: "Read and answer",
        content: "Please carry your previous medical reports to the appointment.",
        translation: "कृपया अपनी पिछली चिकित्सा रिपोर्ट अपॉइंटमेंट पर लाएँ।",
        question: "What should you carry to the appointment?",
        options: ["Your ID card", "Your insurance card", "Your previous medical reports", "Your prescription"],
        answerIndex: 2,
        explanation: "'Previous medical reports' is what is needed."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Telling a doctor you have a fever",
        question: "I have a high fever",
        options: ["high", "have", "I", "fever", "a"],
        answerIndex: 0,
        explanation: "Subject + 'have' + adjective + noun."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking for a doctor's appointment",
        question: "I need to see a doctor",
        options: ["a", "need", "I", "doctor", "see", "to"],
        answerIndex: 0,
        explanation: "Subject + 'need to' + verb + object."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying that you have stomach pain",
        question: "My stomach is hurting badly",
        options: ["hurting", "stomach", "My", "badly", "is"],
        answerIndex: 0,
        explanation: "Possessive + noun + 'is' + verb + adverb."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking where the nearest hospital is",
        question: "Where is the nearest hospital",
        options: ["hospital", "Where", "the", "nearest", "is"],
        answerIndex: 0,
        explanation: "Question word + verb + article + adjective + noun."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying you are allergic to a medicine",
        question: "I am allergic to penicillin",
        options: ["allergic", "am", "I", "penicillin", "to"],
        answerIndex: 0,
        explanation: "Subject + 'am allergic to' + noun."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "Your blood pressure is slightly high. Please avoid salt.",
        translation: "आपका रक्तचाप थोड़ा अधिक है। कृपया नमक से बचें।",
        question: "What should the patient avoid?",
        options: ["Sugar", "Oil", "Salt", "Spices"],
        answerIndex: 2,
        explanation: "'Avoid salt' is the doctor's advice."
      },
      {
        instruction: "Listen and answer",
        content: "The clinic is open from nine to five on weekdays.",
        translation: "क्लिनिक कार्यदिवसों में नौ से पाँच बजे तक खुला रहता है।",
        question: "When is the clinic open?",
        options: ["Nine to three", "Nine to five", "Ten to six", "Eight to four"],
        answerIndex: 1,
        explanation: "'Nine to five on weekdays' is the clinic timing."
      },
      {
        instruction: "Listen and answer",
        content: "Please come for a follow-up after one week.",
        translation: "कृपया एक सप्ताह बाद फॉलो-अप के लिए आएँ।",
        question: "When should the patient come back?",
        options: ["After two days", "After three days", "After five days", "After one week"],
        answerIndex: 3,
        explanation: "'After one week' is the follow-up timing."
      },
      {
        instruction: "Listen and answer",
        content: "Take the first tablet now and the next one after six hours.",
        translation: "पहली गोली अभी लें और अगली छह घंटे बाद।",
        question: "When should the next tablet be taken?",
        options: ["After two hours", "After four hours", "After six hours", "After eight hours"],
        answerIndex: 2,
        explanation: "'After six hours' is stated clearly."
      },
      {
        instruction: "Listen and answer",
        content: "Your test reports will be ready by tomorrow morning.",
        translation: "आपकी जाँच रिपोर्ट कल सुबह तक तैयार हो जाएगी।",
        question: "When will the reports be ready?",
        options: ["This evening", "Tonight", "Tomorrow morning", "Tomorrow evening"],
        answerIndex: 2,
        explanation: "'By tomorrow morning' is when reports will be ready."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "I have a headache since this morning.",
        translation: "मुझे सुबह से सिरदर्द है।",
        question: "Repeat this symptom description",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I am allergic to dust.",
        translation: "मुझे धूल से एलर्जी है।",
        question: "Repeat this allergy sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Where is the nearest pharmacy?",
        translation: "सबसे पास की दवाई की दुकान कहाँ है?",
        question: "Repeat this question",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I need an ambulance immediately.",
        translation: "मुझे तुरंत एम्बुलेंस चाहिए।",
        question: "Repeat this emergency sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I want to book a doctor's appointment.",
        translation: "मैं डॉक्टर की अपॉइंटमेंट बुक करना चाहता हूँ।",
        question: "Repeat this request sentence",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Prescription",
        translation: "नुस्खा",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Pharmacy",
        translation: "दवाई की दुकान",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Temperature",
        translation: "तापमान",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Appointment",
        translation: "अपॉइंटमेंट",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Emergency",
        translation: "आपातकालीन",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  },

  // ── Unit 7: Banking & Forms ──────────────────────────────────────
  unit_banking: {
    reading: [
      {
        instruction: "Read and answer",
        content: "You need two passport-size photographs to open an account.",
        translation: "खाता खोलने के लिए आपको दो पासपोर्ट आकार की फ़ोटो चाहिए।",
        question: "How many photographs are required?",
        options: ["One", "Two", "Three", "Four"],
        answerIndex: 1,
        explanation: "'Two passport-size photographs' is required."
      },
      {
        instruction: "Read and answer",
        content: "The minimum balance for this account is five hundred rupees.",
        translation: "इस खाते के लिए न्यूनतम शेष राशि पाँच सौ रुपये है।",
        question: "What is the minimum balance required?",
        options: ["₹200", "₹300", "₹400", "₹500"],
        answerIndex: 3,
        explanation: "'Five hundred rupees' is the minimum balance."
      },
      {
        instruction: "Read and answer",
        content: "Please enter your ATM PIN carefully. Three wrong attempts will block your card.",
        translation: "कृपया अपना ATM PIN सावधानी से डालें। तीन गलत प्रयास आपका कार्ड ब्लॉक कर देंगे।",
        question: "How many wrong attempts will block the card?",
        options: ["Two", "Three", "Four", "Five"],
        answerIndex: 1,
        explanation: "'Three wrong attempts' will block the card."
      },
      {
        instruction: "Read and answer",
        content: "Your Aadhaar card is required for KYC verification.",
        translation: "KYC सत्यापन के लिए आपका आधार कार्ड आवश्यक है।",
        question: "What document is required for KYC?",
        options: ["PAN card", "Voter ID", "Aadhaar card", "Driving licence"],
        answerIndex: 2,
        explanation: "'Aadhaar card is required for KYC' is stated."
      },
      {
        instruction: "Read and answer",
        content: "Transfer charges apply for amounts below five thousand rupees.",
        translation: "पाँच हज़ार रुपये से कम राशि पर स्थानांतरण शुल्क लागू होते हैं।",
        question: "For which transactions do transfer charges apply?",
        options: ["Above ₹5000", "Below ₹5000", "Above ₹10000", "Below ₹1000"],
        answerIndex: 1,
        explanation: "'Below five thousand rupees' attracts transfer charges."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking for a bank account form",
        question: "I want to open a bank account",
        options: ["open", "want", "I", "a", "account", "to", "bank"],
        answerIndex: 0,
        explanation: "Subject + 'want to' + verb + article + noun."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Reporting that your card is lost",
        question: "My ATM card is lost",
        options: ["is", "ATM", "My", "lost", "card"],
        answerIndex: 0,
        explanation: "Possessive + noun phrase + 'is' + adjective."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking what documents are needed",
        question: "What documents do I need",
        options: ["I", "What", "do", "need", "documents"],
        answerIndex: 0,
        explanation: "Question word + noun + auxiliary + subject + verb."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying you want to check your balance",
        question: "I want to check my balance",
        options: ["check", "want", "I", "my", "to", "balance"],
        answerIndex: 0,
        explanation: "Subject + 'want to' + verb + possessive + noun."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking when the bank closes",
        question: "What time does the bank close",
        options: ["bank", "What", "the", "time", "does", "close"],
        answerIndex: 0,
        explanation: "Question word + auxiliary + subject + verb."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "Your account has been successfully opened. Here is your account number.",
        translation: "आपका खाता सफलतापूर्वक खुल गया है। यह आपका खाता नंबर है।",
        question: "What has just been done?",
        options: ["The account was closed", "The account was opened", "The passbook was updated", "The cheque was cleared"],
        answerIndex: 1,
        explanation: "'Account has been successfully opened' is stated."
      },
      {
        instruction: "Listen and answer",
        content: "Please fill in this deposit slip and go to counter number three.",
        translation: "कृपया यह जमा पर्ची भरें और काउंटर नंबर तीन पर जाएँ।",
        question: "Which counter should the customer go to?",
        options: ["Counter one", "Counter two", "Counter three", "Counter four"],
        answerIndex: 2,
        explanation: "'Counter number three' is where to go."
      },
      {
        instruction: "Listen and answer",
        content: "The bank is closed on Sundays and public holidays.",
        translation: "बैंक रविवार और सार्वजनिक अवकाश पर बंद रहता है।",
        question: "When is the bank closed?",
        options: ["Saturdays only", "Sundays only", "Sundays and public holidays", "All weekends"],
        answerIndex: 2,
        explanation: "'Sundays and public holidays' are when the bank is closed."
      },
      {
        instruction: "Listen and answer",
        content: "Your fixed deposit will mature after twelve months.",
        translation: "आपकी सावधि जमा बारह महीने बाद परिपक्व होगी।",
        question: "When will the fixed deposit mature?",
        options: ["After six months", "After nine months", "After twelve months", "After twenty-four months"],
        answerIndex: 2,
        explanation: "'After twelve months' is the maturity period."
      },
      {
        instruction: "Listen and answer",
        content: "For any queries, call our helpline at one eight hundred.",
        translation: "किसी भी जानकारी के लिए हमारी हेल्पलाइन 1800 पर कॉल करें।",
        question: "How can you reach the bank for queries?",
        options: ["Visit the branch", "Send an email", "Call the helpline", "Use the mobile app"],
        answerIndex: 2,
        explanation: "'Call our helpline' is the suggested contact method."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "I want to open a savings account.",
        translation: "मैं बचत खाता खोलना चाहता हूँ।",
        question: "Repeat this banking request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Please block my ATM card immediately.",
        translation: "कृपया मेरा ATM कार्ड तुरंत ब्लॉक करें।",
        question: "Repeat this emergency request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "What is the interest rate for a fixed deposit?",
        translation: "सावधि जमा पर ब्याज दर क्या है?",
        question: "Repeat this banking question",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I want to transfer money to another account.",
        translation: "मैं दूसरे खाते में पैसे भेजना चाहता हूँ।",
        question: "Repeat this transfer request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Can I get a mini statement please?",
        translation: "क्या मुझे मिनी स्टेटमेंट मिल सकता है?",
        question: "Repeat this banking request",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Account",
        translation: "खाता",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Deposit",
        translation: "जमा",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Withdrawal",
        translation: "निकासी",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Passbook",
        translation: "पासबुक",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Interest",
        translation: "ब्याज",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  },

  // ── Unit 8: Transit & Travel ─────────────────────────────────────
  unit_transit: {
    reading: [
      {
        instruction: "Read and answer",
        content: "The train to Bhopal departs from platform four at six-thirty.",
        translation: "भोपाल की ट्रेन छह बजकर तीस मिनट पर प्लेटफॉर्म चार से जाती है।",
        question: "From which platform does the train depart?",
        options: ["Platform two", "Platform three", "Platform four", "Platform five"],
        answerIndex: 2,
        explanation: "'Platform four' is clearly stated."
      },
      {
        instruction: "Read and answer",
        content: "Please keep your ticket ready for checking.",
        translation: "कृपया जाँच के लिए अपना टिकट तैयार रखें।",
        question: "What should you keep ready?",
        options: ["Your ID card", "Your ticket", "Your luggage", "Your phone"],
        answerIndex: 1,
        explanation: "'Keep your ticket ready' is the instruction."
      },
      {
        instruction: "Read and answer",
        content: "The bus fare from here to the city centre is twenty rupees.",
        translation: "यहाँ से शहर के केंद्र तक बस का किराया बीस रुपये है।",
        question: "What is the bus fare to the city centre?",
        options: ["₹10", "₹15", "₹20", "₹25"],
        answerIndex: 2,
        explanation: "'Twenty rupees' is the stated fare."
      },
      {
        instruction: "Read and answer",
        content: "No standing is allowed in the reserved coach.",
        translation: "आरक्षित डिब्बे में खड़े होने की अनुमति नहीं है।",
        question: "What is not allowed in the reserved coach?",
        options: ["Eating", "Sleeping", "Standing", "Talking"],
        answerIndex: 2,
        explanation: "'No standing is allowed' is stated."
      },
      {
        instruction: "Read and answer",
        content: "The last metro train runs at eleven-thirty at night.",
        translation: "आखिरी मेट्रो ट्रेन रात ग्यारह बजकर तीस मिनट पर जाती है।",
        question: "When does the last metro train run?",
        options: ["Ten-thirty", "Eleven o'clock", "Eleven-thirty", "Midnight"],
        answerIndex: 2,
        explanation: "'Eleven-thirty at night' is the last train timing."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking where the bus stop is",
        question: "Where is the bus stop",
        options: ["stop", "Where", "the", "bus", "is"],
        answerIndex: 0,
        explanation: "Question word + verb + article + noun."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Buying a train ticket",
        question: "I want one ticket to Delhi",
        options: ["Delhi", "want", "I", "to", "ticket", "one"],
        answerIndex: 0,
        explanation: "Subject + verb + quantity + noun + destination."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking how much an auto fare is",
        question: "How much to the railway station",
        options: ["station", "How", "the", "much", "to", "railway"],
        answerIndex: 0,
        explanation: "'How much to [destination]?' is a standard fare inquiry."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking if a bus goes to a particular place",
        question: "Does this bus go to the market",
        options: ["market", "Does", "bus", "this", "go", "the", "to"],
        answerIndex: 0,
        explanation: "Yes/no question: auxiliary + subject + verb + destination."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying the train is late",
        question: "The train is running late",
        options: ["running", "train", "The", "late", "is"],
        answerIndex: 0,
        explanation: "Subject + 'is running' + adjective."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "The next bus to the hospital will arrive in ten minutes.",
        translation: "अस्पताल के लिए अगली बस दस मिनट में आएगी।",
        question: "When will the next bus arrive?",
        options: ["In five minutes", "In ten minutes", "In fifteen minutes", "In twenty minutes"],
        answerIndex: 1,
        explanation: "'In ten minutes' is when the bus arrives."
      },
      {
        instruction: "Listen and answer",
        content: "Your seat is in coach B, berth number forty-two.",
        translation: "आपकी सीट कोच B में, बर्थ नंबर बयालीस पर है।",
        question: "What is the berth number?",
        options: ["Forty", "Forty-one", "Forty-two", "Forty-three"],
        answerIndex: 2,
        explanation: "'Berth number forty-two' is clearly stated."
      },
      {
        instruction: "Listen and answer",
        content: "Please do not block the exit doors of the bus.",
        translation: "कृपया बस के निकास द्वारों को अवरुद्ध न करें।",
        question: "What should you not block?",
        options: ["The windows", "The seats", "The exit doors", "The luggage area"],
        answerIndex: 2,
        explanation: "'Exit doors' should not be blocked."
      },
      {
        instruction: "Listen and answer",
        content: "This is an express train and does not stop at small stations.",
        translation: "यह एक्सप्रेस ट्रेन है और छोटे स्टेशनों पर नहीं रुकती।",
        question: "Where does this train not stop?",
        options: ["Major cities", "Junction stations", "Small stations", "Terminal stations"],
        answerIndex: 2,
        explanation: "'Small stations' — the train does not stop there."
      },
      {
        instruction: "Listen and answer",
        content: "Keep your luggage under the seat or in the overhead compartment.",
        translation: "अपना सामान सीट के नीचे या ऊपरी डिब्बे में रखें।",
        question: "Where should you keep your luggage?",
        options: ["At the door", "On the seat", "Under the seat or in the overhead compartment", "On the floor of the aisle"],
        answerIndex: 2,
        explanation: "'Under the seat or overhead compartment' is where luggage goes."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "One ticket to Nagpur please.",
        translation: "कृपया एक टिकट नागपुर के लिए।",
        question: "Repeat this ticket request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Does this bus go to the railway station?",
        translation: "क्या यह बस रेलवे स्टेशन जाती है?",
        question: "Repeat this travel question",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "How far is the airport from here?",
        translation: "यहाँ से हवाई अड्डा कितनी दूर है?",
        question: "Repeat this distance question",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "The train is twenty minutes late.",
        translation: "ट्रेन बीस मिनट देर से है।",
        question: "Repeat this delay announcement",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Can you drop me at the main road?",
        translation: "क्या आप मुझे मुख्य सड़क पर छोड़ सकते हैं?",
        question: "Repeat this auto/taxi request",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Platform",
        translation: "प्लेटफॉर्म",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Reservation",
        translation: "आरक्षण",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Departure",
        translation: "प्रस्थान",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Destination",
        translation: "गंतव्य",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Compartment",
        translation: "डिब्बा",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // ADVANCED
  // ═══════════════════════════════════════════════════════════════

  // ── Unit 9: Government & Legal ───────────────────────────────────
  unit_government: {
    reading: [
      {
        instruction: "Read and answer",
        content: "You must submit the application form along with a self-attested photocopy.",
        translation: "आपको स्व-सत्यापित फोटोकॉपी के साथ आवेदन पत्र जमा करना होगा।",
        question: "What must accompany the application form?",
        options: ["An original certificate", "A notarised document", "A self-attested photocopy", "A reference letter"],
        answerIndex: 2,
        explanation: "'Self-attested photocopy' must accompany the form."
      },
      {
        instruction: "Read and answer",
        content: "The appeal must be filed within thirty days of the order.",
        translation: "आदेश के तीस दिनों के भीतर अपील दायर की जानी चाहिए।",
        question: "Within how many days must an appeal be filed?",
        options: ["Fifteen days", "Twenty days", "Thirty days", "Sixty days"],
        answerIndex: 2,
        explanation: "'Within thirty days' is the deadline for appeal."
      },
      {
        instruction: "Read and answer",
        content: "Any citizen above eighteen years of age is eligible to vote.",
        translation: "अठारह वर्ष से अधिक आयु का कोई भी नागरिक मतदान के लिए पात्र है।",
        question: "Who is eligible to vote?",
        options: ["Citizens above sixteen", "Citizens above eighteen", "Citizens above twenty-one", "Citizens above twenty-five"],
        answerIndex: 1,
        explanation: "'Above eighteen years of age' is the eligibility criterion."
      },
      {
        instruction: "Read and answer",
        content: "The Right to Information Act allows citizens to request government information.",
        translation: "सूचना का अधिकार अधिनियम नागरिकों को सरकारी जानकारी माँगने की अनुमति देता है।",
        question: "What does the Right to Information Act allow?",
        options: ["Citizens to vote", "Citizens to request government information", "Citizens to appeal court orders", "Citizens to form unions"],
        answerIndex: 1,
        explanation: "'Request government information' is what the RTI Act allows."
      },
      {
        instruction: "Read and answer",
        content: "Corruption in government service is punishable under the Prevention of Corruption Act.",
        translation: "सरकारी सेवा में भ्रष्टाचार भ्रष्टाचार निवारण अधिनियम के तहत दंडनीय है।",
        question: "Under which act is government corruption punishable?",
        options: ["The IPC", "The CPC", "The Prevention of Corruption Act", "The RTI Act"],
        answerIndex: 2,
        explanation: "'Prevention of Corruption Act' governs this."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Filing a complaint at a government office",
        question: "I want to file a complaint",
        options: ["file", "want", "I", "a", "to", "complaint"],
        answerIndex: 0,
        explanation: "Subject + 'want to' + verb + article + noun."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Requesting a certified copy of a document",
        question: "I need a certified copy of this document",
        options: ["certified", "need", "I", "copy", "document", "of", "a", "this"],
        answerIndex: 0,
        explanation: "Subject + verb + article + adjective + noun + preposition + demonstrative + noun."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking about the procedure for a government scheme",
        question: "How do I apply for this scheme",
        options: ["I", "How", "apply", "do", "this", "scheme", "for"],
        answerIndex: 0,
        explanation: "Question word + auxiliary + subject + verb + preposition + object."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Saying that a document is missing from your file",
        question: "The document is missing from my file",
        options: ["missing", "document", "The", "from", "my", "is", "file"],
        answerIndex: 0,
        explanation: "Subject + verb + adjective + prepositional phrase."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking for an official receipt of payment",
        question: "Please give me an official receipt",
        options: ["official", "Please", "me", "receipt", "give", "an"],
        answerIndex: 0,
        explanation: "Polite imperative: 'Please' + verb + pronoun + article + adjective + noun."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "Your application has been accepted and is under review.",
        translation: "आपका आवेदन स्वीकार कर लिया गया है और समीक्षाधीन है।",
        question: "What is the current status of the application?",
        options: ["Rejected", "Approved", "Under review", "Returned for correction"],
        answerIndex: 2,
        explanation: "'Is under review' is the current status."
      },
      {
        instruction: "Listen and answer",
        content: "You can track your application status online using your reference number.",
        translation: "आप अपने संदर्भ नंबर का उपयोग करके ऑनलाइन आवेदन की स्थिति ट्रैक कर सकते हैं।",
        question: "How can you track your application status?",
        options: ["By visiting the office", "By calling", "Online using the reference number", "By sending a letter"],
        answerIndex: 2,
        explanation: "'Online using reference number' is the tracking method."
      },
      {
        instruction: "Listen and answer",
        content: "The last date to submit the renewal form is the fifteenth of this month.",
        translation: "नवीनीकरण फॉर्म जमा करने की अंतिम तारीख इस महीने की पंद्रहवीं है।",
        question: "What is the last date for the renewal form?",
        options: ["The tenth", "The twelfth", "The fifteenth", "The twentieth"],
        answerIndex: 2,
        explanation: "'The fifteenth of this month' is the deadline."
      },
      {
        instruction: "Listen and answer",
        content: "An affidavit must be notarised by a gazetted officer.",
        translation: "एक हलफनामे को राजपत्रित अधिकारी द्वारा नोटरी किया जाना चाहिए।",
        question: "Who must notarise the affidavit?",
        options: ["A bank manager", "A notary public", "A gazetted officer", "A lawyer"],
        answerIndex: 2,
        explanation: "'A gazetted officer' must notarise it."
      },
      {
        instruction: "Listen and answer",
        content: "All grievances must be submitted in writing to the concerned authority.",
        translation: "सभी शिकायतें लिखित रूप में संबंधित प्राधिकरण को प्रस्तुत की जानी चाहिए।",
        question: "How must grievances be submitted?",
        options: ["Verbally", "By email", "In writing", "By phone"],
        answerIndex: 2,
        explanation: "'Submitted in writing' is the required method."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "I want to register a complaint against this decision.",
        translation: "मैं इस निर्णय के खिलाफ शिकायत दर्ज करना चाहता हूँ।",
        question: "Repeat this formal complaint sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Please provide a written acknowledgement of my application.",
        translation: "कृपया मेरे आवेदन की लिखित पावती प्रदान करें।",
        question: "Repeat this formal request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "What documents are required for this scheme?",
        translation: "इस योजना के लिए कौन से दस्तावेज़ चाहिए?",
        question: "Repeat this formal inquiry",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I have been waiting for my application approval for three months.",
        translation: "मैं तीन महीने से अपने आवेदन की मंजूरी का इंतज़ार कर रहा हूँ।",
        question: "Repeat this statement of grievance",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Under which section does this regulation fall?",
        translation: "यह विनियमन किस धारा के अंतर्गत आता है?",
        question: "Repeat this legal inquiry",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Affidavit",
        translation: "हलफनामा",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Jurisdiction",
        translation: "अधिकार क्षेत्र",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Notarised",
        translation: "नोटरीकृत",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Legislation",
        translation: "कानून",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Grievance",
        translation: "शिकायत",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  },

  // ── Unit 10: Workplace Communication ─────────────────────────────
  unit_workplace_comm: {
    reading: [
      {
        instruction: "Read and answer",
        content: "Please find attached the meeting minutes from yesterday's session.",
        translation: "कृपया कल के सत्र की बैठक के कार्यवृत्त संलग्न पाएँ।",
        question: "What is attached to this message?",
        options: ["A report", "An invoice", "Meeting minutes", "A leave application"],
        answerIndex: 2,
        explanation: "'Meeting minutes' is what is attached."
      },
      {
        instruction: "Read and answer",
        content: "The deadline for this project is extended by five working days.",
        translation: "इस परियोजना की समयसीमा पाँच कार्य दिवसों के लिए बढ़ा दी गई है।",
        question: "By how many days is the deadline extended?",
        options: ["Three working days", "Four working days", "Five working days", "Seven working days"],
        answerIndex: 2,
        explanation: "'Five working days' is the extension granted."
      },
      {
        instruction: "Read and answer",
        content: "All team members must attend the briefing at ten o'clock sharp.",
        translation: "सभी टीम सदस्यों को ठीक दस बजे ब्रीफिंग में उपस्थित होना होगा।",
        question: "At what time is the briefing?",
        options: ["Nine o'clock", "Ten o'clock", "Eleven o'clock", "Noon"],
        answerIndex: 1,
        explanation: "'At ten o'clock sharp' is the briefing time."
      },
      {
        instruction: "Read and answer",
        content: "Please CC the department head on all external emails.",
        translation: "सभी बाहरी ईमेल पर विभाग प्रमुख को CC करें।",
        question: "Who should be CC'd on external emails?",
        options: ["The HR manager", "The client", "The department head", "The finance team"],
        answerIndex: 2,
        explanation: "'Department head' should be CC'd on external emails."
      },
      {
        instruction: "Read and answer",
        content: "Confidential information must not be shared with unauthorised personnel.",
        translation: "गोपनीय जानकारी अनधिकृत कर्मियों के साथ साझा नहीं की जानी चाहिए।",
        question: "What must not be shared with unauthorised personnel?",
        options: ["Project plans", "Budget reports", "Confidential information", "Meeting schedules"],
        answerIndex: 2,
        explanation: "'Confidential information' must not be shared."
      }
    ],
    writing: [
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Requesting a meeting with your manager",
        question: "Can we schedule a meeting tomorrow",
        options: ["meeting", "Can", "schedule", "tomorrow", "we", "a"],
        answerIndex: 0,
        explanation: "Modal + subject + verb + article + noun + time adverb."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Asking for clarification on a task",
        question: "Could you please clarify this task",
        options: ["please", "Could", "task", "clarify", "you", "this"],
        answerIndex: 0,
        explanation: "Polite modal + subject + adverb + verb + object."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Informing that a report is ready",
        question: "The quarterly report is ready now",
        options: ["now", "quarterly", "The", "ready", "report", "is"],
        answerIndex: 0,
        explanation: "Subject + verb + adjective + time adverb."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Apologising for being late to a meeting",
        question: "I apologise for being late today",
        options: ["late", "I", "apologise", "being", "today", "for"],
        answerIndex: 0,
        explanation: "Subject + verb + preposition + gerund + time adverb."
      },
      {
        instruction: "Arrange the words to make a correct sentence",
        content: "Confirming that you received an email",
        question: "I have received your email with the attachment",
        options: ["attachment", "have", "I", "the", "email", "received", "your", "with"],
        answerIndex: 0,
        explanation: "Subject + auxiliary + verb + possessive + noun + preposition + article + noun."
      }
    ],
    listening: [
      {
        instruction: "Listen and answer",
        content: "The client presentation has been rescheduled to Thursday.",
        translation: "क्लाइंट प्रेज़ेंटेशन को गुरुवार के लिए पुनर्निर्धारित किया गया है।",
        question: "When is the client presentation rescheduled to?",
        options: ["Tuesday", "Wednesday", "Thursday", "Friday"],
        answerIndex: 2,
        explanation: "'Rescheduled to Thursday' is the new date."
      },
      {
        instruction: "Listen and answer",
        content: "Please ensure all action items from the meeting are completed by Friday.",
        translation: "कृपया सुनिश्चित करें कि बैठक के सभी कार्य बिंदु शुक्रवार तक पूरे हों।",
        question: "By when should action items be completed?",
        options: ["Wednesday", "Thursday", "Friday", "Monday"],
        answerIndex: 2,
        explanation: "'By Friday' is the completion deadline."
      },
      {
        instruction: "Listen and answer",
        content: "We need to improve inter-departmental communication going forward.",
        translation: "हमें आगे जाकर विभागों के बीच संचार को बेहतर बनाने की ज़रूरत है।",
        question: "What needs to be improved?",
        options: ["Technical skills", "Customer service", "Inter-departmental communication", "Project management"],
        answerIndex: 2,
        explanation: "'Inter-departmental communication' needs improvement."
      },
      {
        instruction: "Listen and answer",
        content: "Your performance review is scheduled for next Monday at two PM.",
        translation: "आपकी प्रदर्शन समीक्षा अगले सोमवार को दोपहर दो बजे निर्धारित है।",
        question: "When is the performance review?",
        options: ["This Friday at two PM", "Next Monday at two PM", "Next Wednesday at two PM", "This Monday at three PM"],
        answerIndex: 1,
        explanation: "'Next Monday at two PM' is when the review is scheduled."
      },
      {
        instruction: "Listen and answer",
        content: "Please copy the finance team on all vendor-related correspondence.",
        translation: "सभी विक्रेता से संबंधित पत्राचार में वित्त टीम को कॉपी करें।",
        question: "Who should be copied on vendor-related correspondence?",
        options: ["The CEO", "The HR team", "The finance team", "The legal team"],
        answerIndex: 2,
        explanation: "'Finance team' should be copied on vendor correspondence."
      }
    ],
    speaking: [
      {
        instruction: "Tap the mic and say this out loud",
        content: "I would like to discuss the project timeline.",
        translation: "मैं परियोजना की समय-सीमा पर चर्चा करना चाहूँगा।",
        question: "Repeat this formal workplace sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Could you please send me the updated report?",
        translation: "क्या आप मुझे अपडेट की गई रिपोर्ट भेज सकते हैं?",
        question: "Repeat this professional request",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I will follow up on this by end of day.",
        translation: "मैं दिन के अंत तक इस पर अनुवर्ती कार्रवाई करूँगा।",
        question: "Repeat this commitment sentence",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "I apologise for the delay in responding.",
        translation: "मुझे प्रतिक्रिया देने में देरी के लिए खेद है।",
        question: "Repeat this professional apology",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Please keep me updated on the progress.",
        translation: "कृपया मुझे प्रगति के बारे में अपडेट रखें।",
        question: "Repeat this delegation sentence",
        options: [],
        answerIndex: 0
      }
    ],
    pronunciation: [
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Correspondence",
        translation: "पत्राचार",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Confidential",
        translation: "गोपनीय",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Acknowledgement",
        translation: "पावती",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Rescheduled",
        translation: "पुनर्निर्धारित",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      },
      {
        instruction: "Tap the mic and pronounce this word clearly",
        content: "Compliance",
        translation: "अनुपालन",
        question: "Pronounce this word",
        options: [],
        answerIndex: 0
      }
    ]
  }
};
