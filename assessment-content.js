/**
 * assessment-content.js — Multilingual Assessment Question Matrix
 *
 * Provides curated, pedagogically rich assessment questions across all 7 supported languages:
 * 1. English (en)
 * 2. Hindi (hi)
 * 3. Tamil (ta)
 * 4. Telugu (te)
 * 5. Kannada (kn)
 * 6. Bengali (bn)
 * 7. Marathi (mr)
 *
 * Covers 4 core literacy diagnostic modalities:
 * - 🔤 MCQ (Vocabulary, Akshar Identification, Word Grammar)
 * - 📖 Reading Assessment (Comprehension Passages & Community Signs)
 * - 🎙️ Speaking Assessment (Sentence Fluency & Practical Speaking)
 * - 🔊 Pronunciation Test (Phonetic Articulation & Audio-Assisted Pronunciation)
 * - 🎧 Listening Comprehension (Audio Sentence Decoding)
 *
 * Stratified across 3 Tiers (Beginner, Intermediate, Advanced) and adapted to Age Groups.
 */

const ASSESSMENT_QUESTION_BANK = {

  // ═════════════════════════════════════════════════════════════════
  // 1. HINDI (hi) TARGET LANGUAGE
  // ═════════════════════════════════════════════════════════════════
  hi: {
    beginner: [
      {
        type: "mcq",
        category: "mcq",
        text: "Which of the following is the Hindi letter for 'A' sound?",
        translations: {
          en: "Which of the following is the Hindi letter for 'A' sound?",
          hi: "इनमें से 'अ' ध्वनि का अक्षर कौन सा है?",
          ta: "'அ' ஒலிக்குரிய இந்தி எழுத்து எது?",
          te: "'అ' శబ్దానికి సంబంధించిన హిందీ అక్షరం ఏది?",
          kn: "'ಅ' ಧ್ವನಿಗೆ ಸಂಬಂಧಿಸಿದ ಹಿಂದಿ ಅಕ್ಷರ ಯಾವುದು?",
          bn: "'অ' শব্দের জন্য কোন হিন্দি বর্ণটি সঠিক?",
          mr: "यापैकी 'अ' आवाजाचे हिंदी अक्षर कोणते आहे?"
        },
        targetPhrase: "अ",
        options: ["अ", "क", "म", "र"],
        answerIndex: 0
      },
      {
        type: "mcq",
        category: "mcq",
        text: "What does the Hindi word 'जल' (Jal) mean?",
        translations: {
          en: "What does the Hindi word 'जल' (Jal) mean?",
          hi: "हिंदी शब्द 'जल' का क्या अर्थ है?",
          ta: "'जल' (Jal) என்ற இந்தி வார்த்தையின் பொருள் என்ன?",
          te: "'जल' (Jal) అనే హిందీ పదానికి అర్థం ఏమిటి?",
          kn: "'जल' (Jal) ಎಂಬ ಹಿಂದಿ ಪದದ ಅರ್ಥವೇನು?",
          bn: "'जल' (Jal) হিন্দি শব্দের অর্থ কী?",
          mr: "'जल' या हिंदी शब्दाचा अर्थ काय आहे?"
        },
        targetPhrase: "जल",
        optionsTranslations: {
          en: ["Water", "Fire", "House", "Tree"],
          hi: ["पानी (Water)", "आग (Fire)", "घर (House)", "पेड़ (Tree)"],
          ta: ["தண்ணீர்", "நெருப்பு", "வீடு", "மரம்"],
          te: ["నీరు", "నిప్పు", "ఇల్లు", "చెట్టు"],
          kn: ["ನೀರು", "ಬೆಂಕಿ", "ಮನೆ", "ಮರ"],
          bn: ["জল / পানি", "আগুন", "বাড়ি", "গাছ"],
          mr: ["पाणी", "आग", "घर", "झाड"]
        },
        answerIndex: 0
      },
      {
        type: "reading",
        category: "reading",
        passage: "बस स्टॉप यहाँ है। कृपया लाइन में खड़े रहें।",
        passageTranslation: "Bus stop is here. Please stand in line.",
        text: "Read the sign above. Where should people stand?",
        translations: {
          en: "Read the sign above. Where should people stand?",
          hi: "ऊपर दिया गया बोर्ड पढ़ें। लोगों को कहाँ खड़ा होना चाहिए?",
          ta: "மேலே உள்ள அறிவிப்பைப் படியுங்கள். மக்கள் எங்கே நிற்க வேண்டும்?",
          te: "పై బోర్డును చదవండి. ప్రజలు ఎక్కడ నిలబడాలి?",
          kn: "ಮೇಲಿನ ಸೂಚನೆಯನ್ನು ಓದಿ. ಜನರು ಎಲ್ಲಿ ನಿಲ್ಲಬೇಕು?",
          bn: "উপরের নির্দেশিকাটি পড়ুন। মানুষদের কোথায় দাঁড়াতে বলা হয়েছে?",
          mr: "वरील फलक वाचा. लोकांनी कुठे उभे राहावे?"
        },
        optionsTranslations: {
          en: ["In a line at the bus stop", "Inside the shop", "On the road", "At home"],
          hi: ["बस स्टॉप पर लाइन में", "दुकान के अंदर", "सड़क के बीच", "घर पर"],
          ta: ["பேருந்து நிறுத்தத்தில் வரிசையில்", "கடைக்குள்", "சாலையில்", "வீட்டில்"],
          te: ["బస్ స్టాప్ వద్ద లైన్‌లో", "దుకాణంలో", "రోడ్డుపై", "ఇంట్లో"],
          kn: ["ಬಸ್ ನಿಲ್ದಾಣದಲ್ಲಿ ಸಾಲಿನಲ್ಲಿ", "ಅಂಗಡಿಯೊಳಗೆ", "ರಸ್ತೆಯಲ್ಲಿ", "ಮನೆಯಲ್ಲಿ"],
          bn: ["বাস স্টপে লাইনে", "দোকানের ভেতর", "রাস্তার মাঝে", "বাড়িতে"],
          mr: ["बस स्टॉपवर रांगेत", "दुकानात", "रस्त्यावर", "घरी"]
        },
        answerIndex: 0
      },
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen to the word and pronounce it clearly:",
        translations: {
          en: "Listen to the word and pronounce it clearly:",
          hi: "शब्द को सुनें और स्पष्ट रूप से बोलें:",
          ta: "வார்த்தையைக் கேட்டு தெளிவாக உச்சரிக்கவும்:",
          te: "పదాన్ని విని స్పష్టంగా ఉచ్చరించండి:",
          kn: "ಪದವನ್ನು ಕೇಳಿ ಸ್ಪಷ್ಟವಾಗಿ ಉಚ್ಚರಿಸಿ:",
          bn: "শব্দটি শুনুন এবং স্পষ্টভাবে উচ্চারণ করুন:",
          mr: "शब्द ऐका आणि स्पष्टपणे उच्चार करा:"
        },
        targetPhrase: "नमस्ते",
        phoneticHint: "Na-mas-te (Hello / Greetings)"
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this polite Hindi greeting aloud into the mic:",
        translations: {
          en: "Speak this polite Hindi greeting aloud into the mic:",
          hi: "माइक में यह अभिवादन स्पष्ट बोलें:",
          ta: "இந்த இந்தி வாழ்த்தை மைக்கில் தெளிவாகப் பேசுங்கள்:",
          te: "ఈ హిందీ శుభాకాంక్షను మైక్‌లో స్పష్టంగా మాట్లాడండి:",
          kn: "ಈ ಹಿಂದಿ ಶುಭಾಶಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই হিন্দি সম্ভাষণটি স্পষ্ট করে বলুন:",
          mr: "हा हिंदी नमस्कार माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "शुभ प्रभात",
        phoneticHint: "Shubh Prabhat (Good Morning)"
      },
      {
        type: "listening",
        category: "mcq",
        audioText: "मेरा नाम अमित है",
        text: "Listen to the audio. What is the speaker saying?",
        translations: {
          en: "Listen to the audio. What is the speaker saying?",
          hi: "ऑडियो सुनें। वक्ता क्या कह रहा है?",
          ta: "ஒலியைக் கேளுங்கள். பேசுபவர் என்ன சொல்கிறார்?",
          te: "ఆడియో వినండి. మాట్లాడే వ్యక్తి ఏమి చెబుతున్నాడు?",
          kn: "ಆಡಿಯೋ ಆಲಿಸಿ. ಮಾತನಾಡುವವರು ಏನು ಹೇಳುತ್ತಿದ್ದಾರೆ?",
          bn: "অডিওটি শুনুন। বক্তা কী বলছেন?",
          mr: "ऑडिओ ऐका. वक्ता काय म्हणत आहे?"
        },
        optionsTranslations: {
          en: ["My name is Amit", "I live in Delhi", "I am going to school", "This is my house"],
          hi: ["मेरा नाम अमित है", "मैं दिल्ली में रहता हूँ", "मैं स्कूल जा रहा हूँ", "यह मेरा घर है"],
          ta: ["என் பெயர் அமித்", "நான் தில்லியில் வசிக்கிறேன்", "நான் பள்ளிக்குச் செல்கிறேன்", "இது என் வீடு"],
          te: ["నా పేరు అమిత్", "నేను ఢిల్లీలో ఉంటాను", "నేను పాఠశాలకు వెళ్తున్నాను", "ఇది నా ఇల్లు"],
          kn: ["ನನ್ನ ಹೆಸರು ಅಮಿತ್", "ನಾನು ದೆಹಲಿಯಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ", "ನಾನು ಶಾಲೆಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ", "ಇದು ನನ್ನ ಮನೆ"],
          bn: ["আমার নাম অমিত", "আমি দিল্লিতে থাকি", "আমি স্কুলে যাচ্ছি", "এটি আমার বাড়ি"],
          mr: ["माझे नाव अमित आहे", "मी दिल्लीत राहतो", "मी शाळेत जात आहे", "हे माझे घर आहे"]
        },
        answerIndex: 0
      }
    ],

    intermediate: [
      {
        type: "mcq",
        category: "mcq",
        text: "Choose the correct Hindi sentence for 'I want to drink water':",
        translations: {
          en: "Choose the correct Hindi sentence for 'I want to drink water':",
          hi: "'मुझे पानी पीना है' के लिए सही वाक्य चुनें:",
          ta: "'எனக்கு தண்ணீர் குடிக்க வேண்டும்' என்பதற்கான சரியான இந்தி வாக்கியத்தைத் தேர்ந்தெடுக்கவும்:",
          te: "'నాకు నీరు త్రాగాలని ఉంది' అనేదానికి సరైన హిందీ వాక్యాన్ని ఎంచుకోండి:",
          kn: "'ನನಗೆ ನೀರು ಕುಡಿಯಬೇಕು' ಎಂಬ ಅರ್ಥದ ಸರಿಯಾದ ಹಿಂದಿ ವಾಕ್ಯವನ್ನು ಆರಿಸಿ:",
          bn: "'আমি পানি খেতে চাই' এর জন্য সঠিক হিন্দি বাক্যটি নির্বাচন করুন:",
          mr: "'मला पाणी प्यायचे आहे' यासाठी योग्य हिंदी वाक्य निवडा:"
        },
        options: [
          "मुझे पानी पीना है।",
          "मैं पानी खाता हूँ।",
          "पानी मुझे देखता है।",
          "हम पानी जाता है।"
        ],
        answerIndex: 0
      },
      {
        type: "reading",
        category: "reading",
        passage: "प्राथमिक स्वास्थ्य केंद्र सोमवार से शनिवार सुबह ९ बजे से दोपहर २ बजे तक खुला रहता है। रविवार को अवकाश रहेगा।",
        passageTranslation: "The Primary Health Center is open Monday to Saturday from 9 AM to 2 PM. Closed on Sunday.",
        text: "According to the clinic notice, on which day is the center closed?",
        translations: {
          en: "According to the clinic notice, on which day is the center closed?",
          hi: "अस्पताल के नोटिस के अनुसार, केंद्र किस दिन बंद रहता है?",
          ta: "மருத்துவமனை அறிவிப்பின்படி, மையம் எந்த நாளில் மூடப்பட்டிருக்கும்?",
          te: "క్లినిక్ నోటీసు ప్రకారం, కేంద్రం ఏ రోజున మూసివేయబడుతుంది?",
          kn: "ಆಸ್ಪತ್ರೆಯ ಸೂಚನೆಯಂತೆ, ಕೇಂದ್ರವು ಯಾವ ದಿನ ಮುಚ್ಚಿರುತ್ತದೆ?",
          bn: "হাসপাতালের নোটিশ অনুযায়ী, কেন্দ্রটি কোন দিন বন্ধ থাকে?",
          mr: "दवाखान्याच्या सूचनेनुसार केंद्र कोणत्या दिवशी बंद असते?"
        },
        optionsTranslations: {
          en: ["Sunday (रविवार)", "Monday (सोमवार)", "Saturday (शनिवार)", "Friday (शुक्रवार)"],
          hi: ["रविवार", "सोमवार", "शनिवार", "शुक्रवार"],
          ta: ["ஞாயிறு", "திங்கள்", "சனி", "வெள்ளி"],
          te: ["ఆదివారం", "సోమవారం", "శనివారం", "శుక్రవారం"],
          kn: ["ಭಾನುವಾರ", "ಸೋಮವಾರ", "ಶನಿವಾರ", "ಶುಕ್ರವಾರ"],
          bn: ["রবিবার", "সোমবার", "শনিবার", "শুক্রবার"],
          mr: ["रविवार", "सोमवार", "शनिवार", "शुक्रवार"]
        },
        answerIndex: 0
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this practical question aloud into the mic:",
        translations: {
          en: "Speak this practical question aloud into the mic:",
          hi: "माइक में यह व्यावहारिक प्रश्न बोलें:",
          ta: "இந்த நடைமுறை கேள்வியை மைக்கில் பேசுங்கள்:",
          te: "ఈ ప్రశ్నను మైక్‌లో స్పష్టంగా మాట్లాడండి:",
          kn: "ಈ ಪ್ರಶ್ನೆಯನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই প্রশ্নটি স্পষ্ট করে বলুন:",
          mr: "हा प्रश्न माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "यह टिकट कितने का है?",
        phoneticHint: "Yeh ticket kitne ka hai? (How much is this ticket?)"
      },
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this important Hindi word accurately:",
        translations: {
          en: "Listen and pronounce this important Hindi word accurately:",
          hi: "सुनें और इस शब्द का सही उच्चारण करें:",
          ta: "கேட்டு இந்த வார்த்தையைத் துல்லியமாக உச்சரிக்கவும்:",
          te: "విని ఈ పదాన్ని సరిగ్గా ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಪದವನ್ನು ಸರಿಯಾಗಿ ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই শব্দটির সঠিক উচ্চারণ করুন:",
          mr: "ऐका आणि या शब्दाचा योग्य उच्चार करा:"
        },
        targetPhrase: "चिकित्सालय",
        phoneticHint: "Chi-kit-saa-lay (Hospital / Medical Center)"
      }
    ],

    advanced: [
      {
        type: "reading",
        category: "reading",
        passage: "बैंक खाता खोलने हेतु आधार कार्ड, निवास प्रमाण पत्र तथा दो पासपोर्ट साइज फोटो संलग्न करना अनिवार्य है। सभी दस्तावेजों की स्व-हस्ताक्षरित प्रति जमा करें।",
        passageTranslation: "For opening a bank account, attaching Aadhaar card, address proof, and two passport-sized photographs is mandatory. Submit self-attested copies of all documents.",
        text: "What type of copies must be submitted with the bank application?",
        translations: {
          en: "What type of copies must be submitted with the bank application?",
          hi: "बैंक आवेदन के साथ किस प्रकार की प्रतियां जमा करनी होंगी?",
          ta: "வங்கி விண்ணப்பத்துடன் எந்த வகையான நகல்கள் சமர்ப்பிக்கப்பட வேண்டும்?",
          te: "బ్యాంక్ దరఖాస్తుతో ఎలాంటి కాపీలను సమర్పించాలి?",
          kn: "ಬ್ಯಾಂಕ್ ಅರ್ಜಿಯೊಂದಿಗೆ ಎಂತಹ ಪ್ರತಿಗಳನ್ನು ಸಲ್ಲಿಸಬೇಕು?",
          bn: "ব্যাংক আবেদনের সাথে কোন ধরনের কপি জমা দিতে হবে?",
          mr: "बँक अर्जासोबत कोणत्या प्रकारच्या प्रती जमा कराव्या लागतील?"
        },
        optionsTranslations: {
          en: ["Self-attested copies (स्व-हस्ताक्षरित)", "Originals only", "Unsigned photocopies", "No documents needed"],
          hi: ["स्व-हस्ताक्षरित प्रतियां", "केवल मूल दस्तावेज", "बिना हस्ताक्षर वाली प्रतियां", "कोई दस्तावेज नहीं"],
          ta: ["சுய சான்றொப்பமிட்ட நகல்கள்", "அசல் மட்டுமே", "கையொப்பமிடாத நகல்கள்", "எந்த ஆவணமும் தேவையில்லை"],
          te: ["స్వీయ ధృవీకరణ కాపీలు", "ఒరిజినల్స్ మాత్రమే", "సంతకం లేని కాపీలు", "పత్రాలు అవసరం లేదు"],
          kn: ["ಸ್ವಯಂ ಸಹಿ ಮಾಡಿದ ಪ್ರತಿಗಳು", "ಮೂಲ ಪ್ರತಿಗಳು ಮಾತ್ರ", "ಸಹಿ ಇಲ್ಲದ ಪ್ರತಿಗಳು", "ದಾಖಲೆಗಳ ಅಗತ್ಯವಿಲ್ಲ"],
          bn: ["স্ব-স্বাক্ষরিত কপি", "কেবল মূল কপি", "স্বাক্ষরবিহীন ফটোকপি", "কোনো নথি লাগবে না"],
          mr: ["स्व-स्वाक्षरी केलेल्या प्रती", "केवळ मूळ कागदपत्रे", "स्वाक्षरी नसलेल्या प्रती", "कागदपत्रांची गरज नाही"]
        },
        answerIndex: 0
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this complex real-world sentence fluently into the mic:",
        translations: {
          en: "Speak this complex real-world sentence fluently into the mic:",
          hi: "माइक में इस वाक्य को धाराप्रवाह बोलें:",
          ta: "இந்த முழு வாக்கியத்தை மைக்கில் சரளமாகப் பேசுங்கள்:",
          te: "ఈ వాక్యాన్ని మైక్‌లో ధారాళంగా మాట్లాడండి:",
          kn: "ಈ ವಾಕ್ಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ನಿರರ್ಗಳವಾಗಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই বাক্যটি সাবলীলভাবে বলুন:",
          mr: "हा वाक्य माइकमध्ये अस्खलितपणे बोला:"
        },
        targetPhrase: "कृपया मुझे इस फॉर्म को भरने में सहायता कीजिए।",
        phoneticHint: "Kripya mujhe is form ko bharne mein sahayata kijiye."
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════
  // 2. TAMIL (ta) TARGET LANGUAGE
  // ═════════════════════════════════════════════════════════════════
  ta: {
    beginner: [
      {
        type: "mcq",
        category: "mcq",
        text: "Which of the following is the first Tamil vowel letter?",
        translations: {
          en: "Which of the following is the first Tamil vowel letter?",
          hi: "इनमें से पहला तमिल स्वर (உயிர் எழுத்து) कौन सा है?",
          ta: "பின்வருவனவற்றில் முதல் தமிழ் உயிர் எழுத்து எது?",
          te: "కింది వాటిలో మొదటి తమిళ అచ్చు అక్షరం ఏది?",
          kn: "ಕೆಳಗಿನವುಗಳಲ್ಲಿ ಮೊದಲ ತಮಿಳು ಸ್ವರಾಕ್ಷರ ಯಾವುದು?",
          bn: "নিচের কোনটি প্রথম তামিল স্বরবর্ণ?",
          mr: "यापैकी पहिले तमिळ स्वर अक्षर कोणते आहे?"
        },
        targetPhrase: "அ",
        options: ["அ", "க", "ப", "ம"],
        answerIndex: 0
      },
      {
        type: "mcq",
        category: "mcq",
        text: "What does the Tamil word 'தண்ணீர்' (Thanneer) mean?",
        translations: {
          en: "What does the Tamil word 'தண்ணீர்' (Thanneer) mean?",
          hi: "तमिल शब्द 'தண்ணீர்' (Thanneer) का क्या अर्थ है?",
          ta: "'தண்ணீர்' என்ற சொல்லின் பொருள் என்ன?",
          te: "'தண்ணீர்' (Thanneer) అనే తమిళ పదానికి అర్థం ఏమిటి?",
          kn: "'தண்ணீர்' (Thanneer) ತಮಿಳು ಪದದ ಅರ್ಥವೇನು?",
          bn: "'தண்ணீர்' (Thanneer) তামিল শব্দের অর্থ কী?",
          mr: "'தண்ணீர்' (Thanneer) या तमिळ शब्दाचा अर्थ काय?"
        },
        targetPhrase: "தண்ணீர்",
        optionsTranslations: {
          en: ["Water", "Food", "House", "Book"],
          hi: ["पानी (Water)", "खाना (Food)", "घर (House)", "किताब (Book)"],
          ta: ["தண்ணீர்", "உணவு", "வீடு", "புத்தகம்"],
          te: ["నీరు", "ఆహారం", "ఇల్లు", "పుస్తకం"],
          kn: ["ನೀರು", "ಆಹಾರ", "ಮನೆ", "ಪುಸ್ತಕ"],
          bn: ["জল / পানি", "খাবার", "বাড়ি", "বই"],
          mr: ["पाणी", "अन्न", "घर", "पुस्तक"]
        },
        answerIndex: 0
      },
      {
        type: "reading",
        category: "reading",
        passage: "பேருந்து நிலையம் இங்கே உள்ளது. தயவுசெய்து வரிசையில் நிற்கவும்.",
        passageTranslation: "Bus stand is here. Please stand in queue.",
        text: "Read the sign above. What is the instruction?",
        translations: {
          en: "Read the sign above. What is the instruction?",
          hi: "ऊपर का बोर्ड पढ़ें। क्या निर्देश दिया गया है?",
          ta: "மேலே உள்ள அறிவிப்பைப் படியுங்கள். என்ன அறிவுறுத்தப்பட்டுள்ளது?",
          te: "పై బోర్డును చదవండి. ఏమి ఆదేశించబడింది?",
          kn: "ಮೇಲಿನ ಸೂಚನೆಯನ್ನು ಓದಿ. ಏನು ಸೂಚಿಸಲಾಗಿದೆ?",
          bn: "উপরের বোর্ডটি পড়ুন। কী নির্দেশ দেওয়া হয়েছে?",
          mr: "वरील पाटी वाचा. काय सूचना दिली आहे?"
        },
        optionsTranslations: {
          en: ["Stand in queue at bus stand", "Do not enter", "Shop closed", "Buy tickets tomorrow"],
          hi: ["बस स्टैंड पर लाइन में खड़े रहें", "अंदर न आएं", "दुकान बंद है", "टिकट कल खरीदें"],
          ta: ["பேருந்து நிலையத்தில் வரிசையில் நிற்கவும்", "உள்ளே நுழைய வேண்டாம்", "கடை மூடப்பட்டுள்ளது", "நாளை பயணச்சீட்டு வாங்கவும்"],
          te: ["బస్ స్టాండ్ వద్ద లైన్‌లో నిలబడండి", "లోపలికి రావద్దు", "దుకాణం మూసివేయబడింది", "రేపు టిక్కెట్లు కొనండి"],
          kn: ["ಬಸ್ ನಿಲ್ದಾಣದಲ್ಲಿ ಸಾಲಿನಲ್ಲಿ ನಿಲ್ಲಿ", "ಒಳಗೆ ಬರಬೇಡಿ", "ಅಂಗಡಿ ಮುಚ್ಚಿದೆ", "ನಾಳೆ ಟಿಕೆಟ್ ಖರೀದಿಸಿ"],
          bn: ["বাস স্ট্যান্ডে লাইনে দাঁড়ান", "ভেতরে আসবেন না", "দোকান বন্ধ", "কাল টিকিট কিনুন"],
          mr: ["बस स्थानकावर रांगेत उभे राहा", "आत येऊ नका", "दुकान बंद आहे", "उद्या तिकीट खरेदी करा"]
        },
        answerIndex: 0
      },
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this traditional Tamil greeting:",
        translations: {
          en: "Listen and pronounce this traditional Tamil greeting:",
          hi: "सुनें और इस पारंपरिक तमिल अभिवादन का उच्चारण करें:",
          ta: "கேட்டு இந்த பாரம்பரிய தமிழ் வாழ்த்தை உச்சரிக்கவும்:",
          te: "విని ఈ సంప్రదాయ తమిళ శుభాకాంక్షను ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಸಾಂಪ್ರದಾಯಿಕ ತಮಿಳು ಶುಭಾಶಯವನ್ನು ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই ঐতিহ্যবাহী তামিল সম্ভাষণটি উচ্চারণ করুন:",
          mr: "ऐका आणि या पारंपरिक तमिळ नमस्काराचा उच्चार करा:"
        },
        targetPhrase: "வணக்கம்",
        phoneticHint: "Va-nak-kam (Hello / Greetings)"
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this polite Tamil phrase aloud into the mic:",
        translations: {
          en: "Speak this polite Tamil phrase aloud into the mic:",
          hi: "माइक में यह तमिल वाक्य स्पष्ट बोलें:",
          ta: "மைக்கில் இந்த தமிழ் வாக்கியத்தை தெளிவாகப் பேசுங்கள்:",
          te: "ఈ తమిళ వాక్యాన్ని మైక్‌లో స్పష్టంగా మాట్లాడండి:",
          kn: "ಈ ತಮಿಳು ವಾಕ್ಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই তামিল বাক্যটি স্পষ্টভাবে বলুন:",
          mr: "हा तमिळ वाक्य माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "காலை வணக்கம்",
        phoneticHint: "Kaalai Vanakkam (Good Morning)"
      }
    ],

    intermediate: [
      {
        type: "mcq",
        category: "mcq",
        text: "Choose the correct Tamil sentence for 'Where is the hospital?':",
        translations: {
          en: "Choose the correct Tamil sentence for 'Where is the hospital?':",
          hi: "'अस्पताल कहाँ है?' के लिए सही तमिल वाक्य चुनें:",
          ta: "'மருத்துவமனை எங்கே உள்ளது?' என்பதற்கான சரியான வாக்கியத்தைத் தேர்ந்தெடுக்கவும்:",
          te: "'హాస్పిటల్ ఎక్కడ ఉంది?' అనేదానికి సరైన తమిళ వాక్యాన్ని ఎంచుకోండి:",
          kn: "'ಆಸ್ಪತ್ರೆ ಎಲ್ಲಿದೆ?' ಎಂಬುದಕ್ಕೆ ಸರಿಯಾದ ತಮಿಳು ವಾಕ್ಯವನ್ನು ಆರಿಸಿ:",
          bn: "'হাসপাতাল কোথায়?' এর জন্য সঠিক তামিল বাক্যটি নির্বাচন করুন:",
          mr: "'दवाखाना कुठे आहे?' यासाठी योग्य तमिळ वाक्य निवडा:"
        },
        options: [
          "மருத்துவமனை எங்கே இருக்கிறது?",
          "பள்ளி எங்கே போகிறது?",
          "வீடு எங்கே சாப்பிடுகிறது?",
          "தண்ணீர் எங்கே ஓடுகிறது?"
        ],
        answerIndex: 0
      },
      {
        type: "reading",
        category: "reading",
        passage: "ஆரம்ப சுகாதார நிலையம் காலை 9 மணி முதல் மதியம் 2 மணி வரை செயல்படும். அவசர சிகிச்சைக்கு 108 அழைக்கவும்.",
        passageTranslation: "Primary Health Centre operates from 9 AM to 2 PM. For emergency call 108.",
        text: "What number should be called for emergency treatment?",
        translations: {
          en: "What number should be called for emergency treatment?",
          hi: "आपातकालीन उपचार के लिए किस नंबर पर कॉल करना चाहिए?",
          ta: "அவசர சிகிச்சைக்கு எந்த எண்ணை அழைக்க வேண்டும்?",
          te: "అత్యవసర చికిత్స కోసం ఏ నంబర్‌కు కాల్ చేయాలి?",
          kn: "ತುರ್ತು ಚಿಕಿತ್ಸೆಗಾಗಿ ಯಾವ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಬೇಕು?",
          bn: "জরুরী চিকিৎসার জন্য কোন নম্বরে কল করতে হবে?",
          mr: "तातडीच्या उपचारासाठी कोणत्या क्रमांकावर कॉल करावा?"
        },
        optionsTranslations: {
          en: ["108", "100", "101", "102"],
          hi: ["108", "100", "101", "102"],
          ta: ["108", "100", "101", "102"],
          te: ["108", "100", "101", "102"],
          kn: ["108", "100", "101", "102"],
          bn: ["108", "100", "101", "102"],
          mr: ["108", "100", "101", "102"]
        },
        answerIndex: 0
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this practical question into the microphone:",
        translations: {
          en: "Speak this practical question into the microphone:",
          hi: "माइक में यह व्यावहारिक प्रश्न बोलें:",
          ta: "மைக்கில் இந்த நடைமுறை கேள்வியைப் பேசுங்கள்:",
          te: "ఈ ప్రశ్నను మైక్‌లో మాట్లాడండి:",
          kn: "ಈ ಪ್ರಶ್ನೆಯನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই ব্যবহারিক প্রশ্নটি বলুন:",
          mr: "हा व्यावहारिक प्रश्न माइकमध्ये बोला:"
        },
        targetPhrase: "இந்த பேருந்து எங்கு செல்கிறது?",
        phoneticHint: "Indha perundhu engu selgiradhu? (Where is this bus going?)"
      }
    ],

    advanced: [
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this advanced Tamil word clearly:",
        translations: {
          en: "Listen and pronounce this advanced Tamil word clearly:",
          hi: "सुनें और इस शब्द का स्पष्ट उच्चारण करें:",
          ta: "கேட்டு இந்த கடினமான சொல்லைத் தெளிவாக உச்சரிக்கவும்:",
          te: "విని ఈ తమిళ పదాన్ని స్పష్టంగా ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ತಮಿಳು ಪದವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই তামিল শব্দটি স্পষ্টভাবে উচ্চারণ করুন:",
          mr: "ऐका आणि या शब्दाचा स्पष्ट उच्चार करा:"
        },
        targetPhrase: "அரசாங்கம்",
        phoneticHint: "A-ra-saang-gam (Government)"
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this formal request fluently into the mic:",
        translations: {
          en: "Speak this formal request fluently into the mic:",
          hi: "माइक में इस औपचारिक वाक्य को धाराप्रवाह बोलें:",
          ta: "இந்த விண்ணப்ப வாக்கியத்தை மைக்கில் சரளமாகப் பேசுங்கள்:",
          te: "ఈ వాక్యాన్ని మైక్‌లో ధారాళంగా మాట్లాడండి:",
          kn: "ಈ ವಾಕ್ಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ನಿರರ್ಗಳವಾಗಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই আনুষ্ঠানিক বাক্যটি সাবলীলভাবে বলুন:",
          mr: "हा औपचारिक वाक्य माइकमध्ये अस्खलितपणे बोला:"
        },
        targetPhrase: "தயவுசெய்து எனக்கு உதவி செய்யுங்கள்.",
        phoneticHint: "Thayavuseidhu enakku udhavi seiyungal. (Please help me.)"
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════
  // 3. TELUGU (te) TARGET LANGUAGE
  // ═════════════════════════════════════════════════════════════════
  te: {
    beginner: [
      {
        type: "mcq",
        category: "mcq",
        text: "Which of the following is the first Telugu vowel letter?",
        translations: {
          en: "Which of the following is the first Telugu vowel letter?",
          hi: "इनमें से पहला तेलुगु स्वर अक्षर कौन सा है?",
          ta: "பின்வருவனவற்றில் முதல் தெலுங்கு உயிர் எழுத்து எது?",
          te: "కింది వాటిలో మొదటి తెలుగు అచ్చు అక్షరం ఏది?",
          kn: "ಕೆಳಗಿನವುಗಳಲ್ಲಿ ಮೊದಲ ತೆಲುಗು ಸ್ವರಾಕ್ಷರ ಯಾವುದು?",
          bn: "নিচের কোনটি প্রথম তেলুগু স্বরবর্ণ?",
          mr: "यापैकी पहिले तेलुगू स्वर अक्षर कोणते आहे?"
        },
        targetPhrase: "అ",
        options: ["అ", "క", "త", "మ"],
        answerIndex: 0
      },
      {
        type: "mcq",
        category: "mcq",
        text: "What does the Telugu word 'నీరు' (Neeru) mean?",
        translations: {
          en: "What does the Telugu word 'నీరు' (Neeru) mean?",
          hi: "तेलुगु शब्द 'నీరు' (Neeru) का क्या अर्थ है?",
          ta: "'నీరు' (Neeru) என்ற தெலுங்கு வார்த்தையின் பொருள் என்ன?",
          te: "'నీరు' అనే పదానికి అర్థం ఏమిటి?",
          kn: "'నీరు' (Neeru) ತೆಲುಗು ಪದದ ಅರ್ಥವೇನು?",
          bn: "'నీరు' (Neeru) তেলুগু শব্দের অর্থ কী?",
          mr: "'నీరు' (Neeru) या तेलुगू शब्दाचा अर्थ काय?"
        },
        targetPhrase: "నీరు",
        optionsTranslations: {
          en: ["Water", "Food", "Tree", "House"],
          hi: ["पानी (Water)", "खाना (Food)", "पेड़ (Tree)", "घर (House)"],
          ta: ["தண்ணீர்", "உணவு", "மரம்", "வீடு"],
          te: ["నీరు", "ఆహారం", "చెట్టు", "ఇల్లు"],
          kn: ["ನೀರು", "ಆಹಾರ", "ಮರ", "ಮನೆ"],
          bn: ["জল / পানি", "খাবার", "গাছ", "বাড়ি"],
          mr: ["पाणी", "अन्न", "झाड", "घर"]
        },
        answerIndex: 0
      },
      {
        type: "reading",
        category: "reading",
        passage: "రైల్వే స్టేషన్ ఇక్కడే ఉంది. దయచేసి టికెట్ తీసుకోండి.",
        passageTranslation: "Railway station is here. Please buy a ticket.",
        text: "According to the sign, what should you do?",
        translations: {
          en: "According to the sign, what should you do?",
          hi: "बोर्ड के अनुसार, आपको क्या करना चाहिए?",
          ta: "அறிவிப்பின்படி, நீங்கள் என்ன செய்ய வேண்டும்?",
          te: "బోర్డు ప్రకారం, మీరు ఏమి చేయాలి?",
          kn: "ಸೂಚನೆಯಂತೆ, ನೀವು ಏನು ಮಾಡಬೇಕು?",
          bn: "বোর্ড অনুযায়ী, আপনার কী করা উচিত?",
          mr: "फलकानुसार, आपण काय केले पाहिजे?"
        },
        optionsTranslations: {
          en: ["Buy a ticket (టికెట్ తీసుకోండి)", "Wait for bus", "Close doors", "Run away"],
          hi: ["टिकट लें", "बस का इंतजार करें", "दरवाजे बंद करें", "भाग जाएं"],
          ta: ["பயணச்சீட்டு வாங்கவும்", "பேருந்துக்கு காத்திருக்கவும்", "கதவை மூடவும்", "ஓடவும்"],
          te: ["టికెట్ తీసుకోండి", "బస్సు కోసం వేచి ఉండండి", "తలుపులు మూసివేయండి", "పారిపోండి"],
          kn: ["ಟಿಕೆಟ್ ತೆಗೆದುಕೊಳ್ಳಿ", "ಬಸ್‌ಗಾಗಿ ಕಾಯಿರಿ", "ಬಾಗಿಲು ಮುಚ್ಚಿ", "ಓಡಿಹೋಗಿ"],
          bn: ["টিকিট কাটুন", "বাসের জন্য অপেক্ষা করুন", "দরজা বন্ধ করুন", "পালিয়ে যান"],
          mr: ["तिकीट घ्या", "बसची वाट पाहा", "दारे बंद करा", "पळून जा"]
        },
        answerIndex: 0
      },
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this common Telugu greeting:",
        translations: {
          en: "Listen and pronounce this common Telugu greeting:",
          hi: "सुनें और इस तेलुगु अभिवादन का उच्चारण करें:",
          ta: "கேட்டு இந்த தெலுங்கு வாழ்த்தை உச்சரிக்கவும்:",
          te: "విని ఈ తెలుగు నమస్కారాన్ని స్పష్టంగా ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ತೆಲುಗು ಶುಭಾಶಯವನ್ನು ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই তেলুগু সম্ভাষণটি উচ্চারণ করুন:",
          mr: "ऐका आणि या तेलुगू नमस्काराचा उच्चार करा:"
        },
        targetPhrase: "నమస్కారం",
        phoneticHint: "Na-mas-kaa-ram (Hello / Greetings)"
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this Telugu greeting aloud into the mic:",
        translations: {
          en: "Speak this Telugu greeting aloud into the mic:",
          hi: "माइक में यह तेलुगु वाक्य स्पष्ट बोलें:",
          ta: "மைக்கில் இந்த வாக்கியத்தை தெளிவாகப் பேசுங்கள்:",
          te: "ఈ శుభోదయం వాక్యాన్ని మైక్‌లో స్పష్టంగా పలకండి:",
          kn: "ಈ ವಾಕ್ಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই বাক্যটি স্পষ্টভাবে বলুন:",
          mr: "हा वाक्य माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "శుభోదయం",
        phoneticHint: "Shubhodhayam (Good Morning)"
      }
    ],

    intermediate: [
      {
        type: "mcq",
        category: "mcq",
        text: "Choose the correct Telugu phrase for 'My name is':",
        translations: {
          en: "Choose the correct Telugu phrase for 'My name is':",
          hi: "'मेरा नाम है' के लिए सही तेलुगु वाक्यांश चुनें:",
          ta: "'என் பெயர்' என்பதற்கான சரியான தெலுங்கு சொற்றொடரைத் தேர்ந்தெடுக்கவும்:",
          te: "'నా పేరు' తెలిపే సరైన వాక్యాన్ని ఎంచుకోండి:",
          kn: "'ನನ್ನ ಹೆಸರು' ಎಂಬುದಕ್ಕೆ ಸರಿಯಾದ ತೆಲುಗು ವಾಕ್ಯವನ್ನು ಆರಿಸಿ:",
          bn: "'আমার নাম' বোঝাতে সঠিক তেলুগু বাক্য নির্বাচন করুন:",
          mr: "'माझे नाव' दर्शवणारे योग्य तेलुगू वाक्य निवडा:"
        },
        options: [
          "నా పేరు రాజు",
          "నేను తింటున్నాను",
          "ఇది నా ఇల్లు",
          "నీరు కావాలి"
        ],
        answerIndex: 0
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this practical question aloud into the mic:",
        translations: {
          en: "Speak this practical question aloud into the mic:",
          hi: "माइक में यह व्यावहारिक प्रश्न बोलें:",
          ta: "மைக்கில் இந்த நடைமுறை கேள்வியைப் பேசுங்கள்:",
          te: "ఈ ప్రశ్నను మైక్‌లో స్పష్టంగా మాట్లాడండి:",
          kn: "ಈ ಪ್ರಶ್ನೆಯನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই প্রশ্নটি স্পষ্ট করে বলুন:",
          mr: "हा प्रश्न माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "ఈ బస్సు ఎక్కడికి వెళుతుంది?",
        phoneticHint: "Ee bus ekkadiki velthundi? (Where is this bus going?)"
      }
    ],

    advanced: [
      {
        type: "reading",
        category: "reading",
        passage: "బ్యాంకు ఖాతా తెరవడానికి ఆధార్ కార్డు మరియు నివాస ధృవీకరణ పత్రం సమర్పించడం తప్పనిసరి. అన్ని పత్రాలపై మీ సంతకం ఉండాలి.",
        passageTranslation: "Aadhaar card and residence proof are mandatory to open a bank account. All documents must be signed.",
        text: "What must be on all submitted documents?",
        translations: {
          en: "What must be on all submitted documents?",
          hi: "सभी जमा किए गए दस्तावेजों पर क्या होना चाहिए?",
          ta: "சமர்ப்பிக்கப்பட்ட அனைத்து ஆவணங்களிலும் என்ன இருக்க வேண்டும்?",
          te: "సమర్పించిన అన్ని పత్రాలపై ఏమి ఉండాలి?",
          kn: "ಸಲ್ಲಿಸಿದ ಎಲ್ಲಾ ದಾಖಲೆಗಳಲ್ಲಿ ಏನನ್ನು ಹೊಂದಿರಬೇಕು?",
          bn: "জমা দেওয়া সমস্ত নথিতে কী থাকা বাধ্যতামূলক?",
          mr: "सादर केलेल्या सर्व कागदपत्रांवर काय असणे आवश्यक आहे?"
        },
        optionsTranslations: {
          en: ["Your signature (మీ సంతకం)", "Thumb impression only", "No markings", "Stamp only"],
          hi: ["आपका हस्ताक्षर", "केवल अंगूठा", "कोई निशान नहीं", "केवल मोहर"],
          ta: ["உங்கள் கையொப்பம்", "கைரேகை மட்டுமே", "எதுவும் இல்லை", "முத்திரை மட்டுமே"],
          te: ["మీ సంతకం", "వేలిముద్ర మాత్రమే", "ఏ గుర్తులు లేవు", "స్టాంప్ మాత్రమే"],
          kn: ["ನಿಮ್ಮ ಸಹಿ", "ಹೆಬ್ಬೆರಳಿನ ಗುರುತು ಮಾತ್ರ", "ಯಾವುದೇ ಗುರುತಿಲ್ಲ", "ಮುದ್ರೆ ಮಾತ್ರ"],
          bn: ["আপনার স্বাক্ষর", "কেবল টিপসই", "কোনো চিহ্ন নয়", "শুধু সিলমোহর"],
          mr: ["आपली स्वाक्षरी", "केवळ अंगठा", "काहीही नाही", "केवळ शिक्का"]
        },
        answerIndex: 0
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════
  // 4. KANNADA (kn) TARGET LANGUAGE
  // ═════════════════════════════════════════════════════════════════
  kn: {
    beginner: [
      {
        type: "mcq",
        category: "mcq",
        text: "Which of the following is the first Kannada vowel letter?",
        translations: {
          en: "Which of the following is the first Kannada vowel letter?",
          hi: "इनमें से पहला कन्नड़ स्वर अक्षर कौन सा है?",
          ta: "பின்வருவனவற்றில் முதல் கன்னட உயிர் எழுத்து எது?",
          te: "కింది వాటిలో మొదటి కన్నడ అచ్చు అక్షరం ఏది?",
          kn: "ಕೆಳಗಿನವುಗಳಲ್ಲಿ ಮೊದಲ ಕನ್ನಡ ಸ್ವರಾಕ್ಷರ ಯಾವುದು?",
          bn: "নিচের কোনটি প্রথম কন্নড় স্বরবর্ণ?",
          mr: "यापैकी पहिले कन्नड स्वर अक्षर कोणते आहे?"
        },
        targetPhrase: "ಅ",
        options: ["ಅ", "ಕ", "ಮ", "ರ"],
        answerIndex: 0
      },
      {
        type: "mcq",
        category: "mcq",
        text: "What does the Kannada word 'ನೀರು' (Neeru) mean?",
        translations: {
          en: "What does the Kannada word 'ನೀರು' (Neeru) mean?",
          hi: "कन्नड़ शब्द 'ನೀರು' (Neeru) का क्या अर्थ है?",
          ta: "'ನೀರು' (Neeru) என்ற கன்னட வார்த்தையின் பொருள் என்ன?",
          te: "'ನೀರು' (Neeru) అనే కన్నడ పదానికి అర్థం ఏమిటి?",
          kn: "'ನೀರು' ಪದದ ಅರ್ಥವೇನು?",
          bn: "'ನೀರು' (Neeru) কন্নড় শব্দের অর্থ কী?",
          mr: "'ನೀರು' (Neeru) या कन्नड शब्दाचा अर्थ काय?"
        },
        targetPhrase: "ನೀರು",
        optionsTranslations: {
          en: ["Water", "Fire", "Tree", "Book"],
          hi: ["पानी (Water)", "आग (Fire)", "पेड़ (Tree)", "किताब (Book)"],
          ta: ["தண்ணீர்", "நெருப்பு", "மரம்", "புத்தகம்"],
          te: ["నీరు", "నిప్పు", "చెట్టు", "పుస్తకం"],
          kn: ["ನೀರು", "ಬೆಂಕಿ", "ಮರ", "ಪುಸ್ತಕ"],
          bn: ["জল / পানি", "আগুন", "গাছ", "বই"],
          mr: ["पाणी", "आग", "झाड", "पुस्तक"]
        },
        answerIndex: 0
      },
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this traditional Kannada greeting:",
        translations: {
          en: "Listen and pronounce this traditional Kannada greeting:",
          hi: "सुनें और इस पारंपरिक कन्नड़ अभिवादन का उच्चारण करें:",
          ta: "கேட்டு இந்த பாரம்பரிய கன்னட வாழ்த்தை உச்சரிக்கவும்:",
          te: "విని ఈ కన్నడ నమస్కారాన్ని ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಸಾಂಪ್ರದಾಯಿಕ ಕನ್ನಡ ಶುಭಾಶಯವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই কন্নড় সম্ভাষণটি উচ্চারণ করুন:",
          mr: "ऐका आणि या कन्नड नमस्काराचा उच्चार करा:"
        },
        targetPhrase: "ನಮಸ್ಕಾರ",
        phoneticHint: "Na-mas-kaa-ra (Hello / Greetings)"
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this Kannada greeting aloud into the mic:",
        translations: {
          en: "Speak this Kannada greeting aloud into the mic:",
          hi: "माइक में यह कन्नड़ वाक्य स्पष्ट बोलें:",
          ta: "மைக்கில் இந்த வாக்கியத்தை தெளிவாகப் பேசுங்கள்:",
          te: "ఈ కన్నడ వాక్యాన్ని మైక్‌లో స్పష్టంగా మాట్లాడండి:",
          kn: "ಈ ಶುಭೋದಯ ಶುಭಾಶಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই কন্নড় বাক্যটি স্পষ্ট করে বলুন:",
          mr: "हा वाक्य माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "ಶುಭೋದಯ",
        phoneticHint: "Shubhodhaya (Good Morning)"
      }
    ],

    intermediate: [
      {
        type: "reading",
        category: "reading",
        passage: "ಬಸ್ ನಿಲ್ದಾಣ ಇಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಸಾಲಿನಲ್ಲಿ ನಿಲ್ಲಿ ಮತ್ತು ಟಿಕೆಟ್ ಪಡೆಯಿರಿ.",
        passageTranslation: "Bus stop is here. Please stand in queue and get ticket.",
        text: "Where should people stand according to the notice?",
        translations: {
          en: "Where should people stand according to the notice?",
          hi: "सूचना के अनुसार लोगों को कहाँ खड़ा होना चाहिए?",
          ta: "அறிவிப்பின்படி மக்கள் எங்கு நிற்க வேண்டும்?",
          te: "నోటీసు ప్రకారం ప్రజలు ఎక్కడ నిలబడాలి?",
          kn: "ಸೂಚನೆಯಂತೆ ಜನರು ಎಲ್ಲಿ ನಿಲ್ಲಬೇಕು?",
          bn: "নোটিশ অনুযায়ী মানুষদের কোথায় দাঁড়ানো উচিত?",
          mr: "सूचनेनुसार लोकांनी कुठे उभे राहावे?"
        },
        optionsTranslations: {
          en: ["In a queue at bus stop", "Inside hotel", "On train track", "At home"],
          hi: ["बस स्टॉप पर लाइन में", "होटल के अंदर", "रेलवे ट्रैक पर", "घर पर"],
          ta: ["பேருந்து நிறுத்தத்தில் வரிசையில்", "ஹோட்டலுக்குள்", "ரயில் தண்டவாளத்தில்", "வீட்டில்"],
          te: ["బస్ స్టాప్ వద్ద లైన్‌లో", "హోటల్‌లో", "రైలు పట్టాలపై", "ఇంట్లో"],
          kn: ["ಬಸ್ ನಿಲ್ದಾಣದಲ್ಲಿ ಸಾಲಿನಲ್ಲಿ", "ಹೋಟೆಲ್ ಒಳಗೆ", "ರೈಲ್ವೆ ಹಳಿಯ ಮೇಲೆ", "ಮನೆಯಲ್ಲಿ"],
          bn: ["বাস স্টপে লাইনে", "হোটেলের ভেতর", "রেললাইনে", "বাড়িতে"],
          mr: ["बस थांब्यावर रांगेत", "हॉटेलमध्ये", "रेल्वे रुळावर", "घरी"]
        },
        answerIndex: 0
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this practical Kannada question aloud into the mic:",
        translations: {
          en: "Speak this practical Kannada question aloud into the mic:",
          hi: "माइक में यह प्रश्न बोलें:",
          ta: "மைக்கில் இந்த நடைமுறை கேள்வியைப் பேசுங்கள்:",
          te: "ఈ ప్రశ్నను మైక్‌లో మాట్లాడండి:",
          kn: "ಈ ಪ್ರಾಯೋಗಿಕ ಪ್ರಶ್ನೆಯನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই প্রশ্নটি স্পষ্ট করে বলুন:",
          mr: "हा प्रश्न माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "ಈ ಬಸ್ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತದೆ?",
        phoneticHint: "Ee bus ellige hogathade? (Where is this bus going?)"
      }
    ],

    advanced: [
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this important Kannada term accurately:",
        translations: {
          en: "Listen and pronounce this important Kannada term accurately:",
          hi: "सुनें और इस शब्द का सही उच्चारण करें:",
          ta: "கேட்டு இந்த வார்த்தையைத் துல்லியமாக உச்சரிக்கவும்:",
          te: "విని ఈ పదాన్ని సరిగ్గా ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಪ್ರಮುಖ ಪದವನ್ನು ನಿಖರವಾಗಿ ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই শব্দটির সঠিক উচ্চারণ করুন:",
          mr: "ऐका आणि या शब्दाचा योग्य उच्चार करा:"
        },
        targetPhrase: "ವಿಶ್ವವಿದ್ಯಾಲಯ",
        phoneticHint: "Vish-wa-vid-yaa-la-ya (University)"
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════
  // 5. BENGALI (bn) TARGET LANGUAGE
  // ═════════════════════════════════════════════════════════════════
  bn: {
    beginner: [
      {
        type: "mcq",
        category: "mcq",
        text: "Which of the following is the first Bengali vowel letter?",
        translations: {
          en: "Which of the following is the first Bengali vowel letter?",
          hi: "इनमें से पहला बांग्ला स्वर वर्ण कौन सा है?",
          ta: "பின்வருவனவற்றில் முதல் வங்காள உயிர் எழுத்து எது?",
          te: "కింది వాటిలో మొదటి బెంగాలీ అచ్చు అక్షరం ఏది?",
          kn: "ಕೆಳಗಿನವುಗಳಲ್ಲಿ ಮೊದಲ ಬಂಗಾಳಿ ಸ್ವರಾಕ್ಷರ ಯಾವುದು?",
          bn: "নিচের কোনটি প্রথম বাংলা স্বরবর্ণ?",
          mr: "यापैकी पहिले बंगाली स्वर अक्षर कोणते आहे?"
        },
        targetPhrase: "অ",
        options: ["অ", "ক", "ম", "ব"],
        answerIndex: 0
      },
      {
        type: "mcq",
        category: "mcq",
        text: "What does the Bengali word 'জল' (Jol) mean?",
        translations: {
          en: "What does the Bengali word 'জল' (Jol) mean?",
          hi: "बांग्ला शब्द 'জল' (Jol) का क्या अर्थ है?",
          ta: "'জল' (Jol) என்ற வங்காள வார்த்தையின் பொருள் என்ன?",
          te: "'জল' (Jol) అనే బెంగాలీ పదానికి అర్థం ఏమిటి?",
          kn: "'জল' (Jol) ಬಂಗಾಳಿ ಪದದ ಅರ್ಥವೇನು?",
          bn: "'জল' (Jol) বাংলা শব্দের অর্থ কী?",
          mr: "'জল' (Jol) या बंगाली शब्दाचा अर्थ काय?"
        },
        targetPhrase: "জল",
        optionsTranslations: {
          en: ["Water", "Fire", "House", "Tree"],
          hi: ["पानी (Water)", "आग (Fire)", "घर (House)", "पेड़ (Tree)"],
          ta: ["தண்ணீர்", "நெருப்பு", "வீடு", "மரம்"],
          te: ["నీరు", "నిప్పు", "ఇల్లు", "చెట్టు"],
          kn: ["ನೀರು", "ಬೆಂಕಿ", "ಮನೆ", "ಮರ"],
          bn: ["জল / পানি", "আগুন", "বাড়ি", "গাছ"],
          mr: ["पाणी", "आग", "घर", "झाड"]
        },
        answerIndex: 0
      },
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this warm Bengali greeting:",
        translations: {
          en: "Listen and pronounce this warm Bengali greeting:",
          hi: "सुनें और इस बांग्ला अभिवादन का उच्चारण करें:",
          ta: "கேட்டு இந்த வங்காள வாழ்த்தை உச்சரிக்கவும்:",
          te: "విని ఈ బెంగాలీ శుభాకాంక్షను ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಬಂಗಾಳಿ ಶುಭಾಶಯವನ್ನು ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই বাংলা সম্ভাষণটি স্পষ্ট করে উচ্চারণ করুন:",
          mr: "ऐका आणि या बंगाली नमस्काराचा उच्चार करा:"
        },
        targetPhrase: "নমস্কার",
        phoneticHint: "Nomoshkar (Hello / Greetings)"
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this polite Bengali phrase into the mic:",
        translations: {
          en: "Speak this polite Bengali phrase into the mic:",
          hi: "माइक में यह बांग्ला वाक्य स्पष्ट बोलें:",
          ta: "மைக்கில் இந்த வாக்கியத்தை தெளிவாகப் பேசுங்கள்:",
          te: "ఈ బెంగాలీ వాక్యాన్ని మైక్‌లో స్పష్టంగా మాట్లాడండి:",
          kn: "ಈ ಬಂಗಾಳಿ ವಾಕ್ಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই বাংলা বাক্যটি স্পষ্ট করে বলুন:",
          mr: "हा वाक्य माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "শুভ সকাল",
        phoneticHint: "Shubho Sokal (Good Morning)"
      }
    ],

    intermediate: [
      {
        type: "reading",
        category: "reading",
        passage: "টিকিট কাউন্টার সকাল ৮টা থেকে দুপুর ২টো পর্যন্ত খোলা থাকবে। অনুগ্রহ করে লাইনে দাঁড়ান।",
        passageTranslation: "Ticket counter will remain open from 8 AM to 2 PM. Please stand in queue.",
        text: "Until what time is the ticket counter open?",
        translations: {
          en: "Until what time is the ticket counter open?",
          hi: "टिकट काउंटर कितने बजे तक खुला रहता है?",
          ta: "டிக்கெட் கவுண்டர் எத்தனை மணி வரை திறந்திருக்கும்?",
          te: "టికెట్ కౌంటర్ ఎన్ని గంటల వరకు తెరిచి ఉంటుంది?",
          kn: "ಟಿಕೆಟ್ ಕೌಂಟರ್ ಎಷ್ಟು ಗಂಟೆಯವರೆಗೆ ತೆರೆದಿರುತ್ತದೆ?",
          bn: "টিকিট কাউন্টার দুপুর কয়টা পর্যন্ত খোলা থাকবে?",
          mr: "तिकीट खिडकी किती वाजेपर्यंत उघडी राहील?"
        },
        optionsTranslations: {
          en: ["2:00 PM (দুপুর ২টো)", "8:00 AM (সকাল ৮টা)", "5:00 PM (বিকেল ৫টা)", "Night 10:00 PM"],
          hi: ["दोपहर 2:00 बजे", "सुबह 8:00 बजे", "शाम 5:00 बजे", "रात 10:00 बजे"],
          ta: ["மதியம் 2:00 மணி", "காலை 8:00 மணி", "மாலை 5:00 மணி", "இரவு 10:00 மணி"],
          te: ["మధ్యాహ్నం 2:00 గంటలు", "ఉదయం 8:00 గంటలు", "సాయంత్రం 5:00 గంటలు", "రాత్రి 10:00 గంటలు"],
          kn: ["ಮಧ್ಯಾಹ್ನ 2:00 ಗಂಟೆ", "ಬೆಳಿಗ್ಗೆ 8:00 ಗಂಟೆ", "ಸಂಜೆ 5:00 ಗಂಟೆ", "ರಾತ್ರಿ 10:00 ಗಂಟೆ"],
          bn: ["দুপুর ২টো পর্যন্ত", "সকাল ৮টা পর্যন্ত", "বিকেল ৫টা পর্যন্ত", "রাত ১০টা পর্যন্ত"],
          mr: ["दुपारी २:०० वाजेपर्यंत", "सकाळी ८:०० वाजेपर्यंत", "संध्याकाळी ५:०० वाजेपर्यंत", "रात्री १०:०० वाजेपर्यंत"]
        },
        answerIndex: 0
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this practical question aloud into the mic:",
        translations: {
          en: "Speak this practical question aloud into the mic:",
          hi: "माइक में यह व्यावहारिक प्रश्न बोलें:",
          ta: "மைக்கில் இந்த நடைமுறை கேள்வியைப் பேசுங்கள்:",
          te: "ఈ ప్రశ్నను మైక్‌లో మాట్లాడండి:",
          kn: "ಈ ಪ್ರಶ್ನೆಯನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই ব্যবহারিক প্রশ্নটি স্পষ্ট করে বলুন:",
          mr: "हा प्रश्न माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "হাসপাতালটি কোন দিকে?",
        phoneticHint: "Haaspaataal-ti kon dike? (Which way is the hospital?)"
      }
    ],

    advanced: [
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this important Bengali word accurately:",
        translations: {
          en: "Listen and pronounce this important Bengali word accurately:",
          hi: "सुनें और इस बांग्ला शब्द का सही उच्चारण करें:",
          ta: "கேட்டு இந்த வார்த்தையைத் துல்லியமாக உச்சரிக்கவும்:",
          te: "విని ఈ పదాన్ని సరిగ్గా ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಪದವನ್ನು ಸರಿಯಾಗಿ ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই গুরুত্বপূর্ণ বাংলা শব্দটির সঠিক উচ্চারণ করুন:",
          mr: "ऐका आणि या शब्दाचा योग्य उच्चार करा:"
        },
        targetPhrase: "বিশ্ববিদ্যালয়",
        phoneticHint: "Bissho-bid-yaa-loy (University)"
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════
  // 6. MARATHI (mr) TARGET LANGUAGE
  // ═════════════════════════════════════════════════════════════════
  mr: {
    beginner: [
      {
        type: "mcq",
        category: "mcq",
        text: "Which of the following is the first Marathi vowel letter?",
        translations: {
          en: "Which of the following is the first Marathi vowel letter?",
          hi: "इनमें से पहला मराठी स्वर अक्षर कौन सा है?",
          ta: "பின்வருவனவற்றில் முதல் மராத்தி உயிர் எழுத்து எது?",
          te: "కింది వాటిలో మొదటి మరాఠీ అచ్చు అಕ್ಷరం ఏది?",
          kn: "ಕೆಳಗಿನವುಗಳಲ್ಲಿ ಮೊದಲ ಮರಾಠಿ ಸ್ವರಾಕ್ಷರ ಯಾವುದು?",
          bn: "নিচের কোনটি প্রথম মারাঠি স্বরবর্ণ?",
          mr: "खालीलपैकी पहिले मराठी स्वर अक्षर कोणते आहे?"
        },
        targetPhrase: "अ",
        options: ["अ", "क", "प", "र"],
        answerIndex: 0
      },
      {
        type: "mcq",
        category: "mcq",
        text: "What does the Marathi word 'पाणी' (Paani) mean?",
        translations: {
          en: "What does the Marathi word 'पाणी' (Paani) mean?",
          hi: "मराठी शब्द 'पाणी' (Paani) का क्या अर्थ है?",
          ta: "'पाणी' (Paani) என்ற மராத்தி வார்த்தையின் பொருள் என்ன?",
          te: "'पाणी' (Paani) అనే మరాఠీ పదానికి అర్థం ఏమిటి?",
          kn: "'पाणी' (Paani) ಮರಾಠಿ ಪದದ ಅರ್ಥವೇನು?",
          bn: "'पाणी' (Paani) মারাঠি শব্দের অর্থ কী?",
          mr: "'पाणी' या शब्दाचा अर्थ काय आहे?"
        },
        targetPhrase: "पाणी",
        optionsTranslations: {
          en: ["Water", "Fire", "House", "Tree"],
          hi: ["पानी (Water)", "आग (Fire)", "घर (House)", "पेड़ (Tree)"],
          ta: ["தண்ணீர்", "நெருப்பு", "வீடு", "மரம்"],
          te: ["నీరు", "నిప్పు", "ఇల్లు", "చెట్టు"],
          kn: ["ನೀರು", "ಬೆಂಕಿ", "ಮನೆ", "ಮರ"],
          bn: ["জল / পানি", "আগুন", "বাড়ি", "গাছ"],
          mr: ["पाणी", "आग", "घर", "झाड"]
        },
        answerIndex: 0
      },
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this polite Marathi greeting:",
        translations: {
          en: "Listen and pronounce this polite Marathi greeting:",
          hi: "सुनें और इस मराठी अभिवादन का उच्चारण करें:",
          ta: "கேட்டு இந்த மராத்தி வாழ்த்தை உச்சரிக்கவும்:",
          te: "విని ఈ మరాఠీ నమస్కారాన్ని ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಮರಾಠಿ ಶುಭಾಶಯವನ್ನು ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই মারাঠি সম্ভাষণটি উচ্চারণ করুন:",
          mr: "ऐका आणि हा आदरयुक्त मराठी नमस्कार स्पष्ट बोला:"
        },
        targetPhrase: "नमस्कार",
        phoneticHint: "Na-mas-kaar (Hello / Greetings)"
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this Marathi morning greeting into the mic:",
        translations: {
          en: "Speak this Marathi morning greeting into the mic:",
          hi: "माइक में यह मराठी वाक्य स्पष्ट बोलें:",
          ta: "மைக்கில் இந்த வாக்கியத்தை தெளிவாகப் பேசுங்கள்:",
          te: "ఈ మరాఠీ వాక్యాన్ని మైక్‌లో స్పష్టంగా మాట్లాడండి:",
          kn: "ಈ ಮರಾಠಿ ವಾಕ್ಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই মারাঠি বাক্যটি স্পষ্ট করে বলুন:",
          mr: "हा सकाळचा नमस्कार माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "शुभ सकाळ",
        phoneticHint: "Shubh Sakaal (Good Morning)"
      }
    ],

    intermediate: [
      {
        type: "reading",
        category: "reading",
        passage: "दवाखाना सोमवार ते शनिवार सकाळी ९ ते दुपारी २ वाजेपर्यंत सुरू राहील. रविवारी सुट्टी असेल.",
        passageTranslation: "Clinic will remain open Monday to Saturday 9 AM to 2 PM. Sunday will be closed.",
        text: "On which day is the clinic closed?",
        translations: {
          en: "On which day is the clinic closed?",
          hi: "दवाखाना किस दिन बंद रहता है?",
          ta: "மருத்துவமனை எந்த நாளில் மூடப்பட்டிருக்கும்?",
          te: "క్లినిక్ ఏ రోజున మూసివేయబడుతుంది?",
          kn: "ಆಸ್ಪತ್ರೆ ಯಾವ ದಿನ ಮುಚ್ಚಿರುತ್ತದೆ?",
          bn: "দাওয়াইখানা কোন দিন বন্ধ থাকে?",
          mr: "दवाखाना कोणत्या दिवशी बंद असेल?"
        },
        optionsTranslations: {
          en: ["Sunday (रविवार)", "Monday (सोमवार)", "Friday (शुक्रवार)", "Saturday (शनिवार)"],
          hi: ["रविवार", "सोमवार", "शुक्रवार", "शनिवार"],
          ta: ["ஞாயிறு", "திங்கள்", "வெள்ளி", "சனி"],
          te: ["ఆదివారం", "సోమవారం", "శుక్రవారం", "శనివారం"],
          kn: ["ಭಾನುವಾರ", "ಸೋಮವಾರ", "ಶುಕ್ರವಾರ", "ಶನಿವಾರ"],
          bn: ["রবিবার", "সোমবার", "শুক্রবার", "শনিবার"],
          mr: ["रविवार", "सोमवार", "शुक्रवार", "शनिवार"]
        },
        answerIndex: 0
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this practical question aloud into the mic:",
        translations: {
          en: "Speak this practical question aloud into the mic:",
          hi: "माइक में यह प्रश्न बोलें:",
          ta: "மைக்கில் இந்த கேள்வியைப் பேசுங்கள்:",
          te: "ఈ ప్రశ్నను మైక్‌లో మాట్లాడండి:",
          kn: "ಈ ಪ್ರಶ್ನೆಯನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই প্রশ্নটি স্পষ্ট করে বলুন:",
          mr: "हा व्यावहारिक प्रश्न माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "हे तिकीट किती रुपयांचे आहे?",
        phoneticHint: "He ticket kiti rupyānche aahe? (How much is this ticket?)"
      }
    ],

    advanced: [
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this important Marathi term accurately:",
        translations: {
          en: "Listen and pronounce this important Marathi term accurately:",
          hi: "सुनें और इस शब्द का सही उच्चारण करें:",
          ta: "கேட்டு இந்த வார்த்தையைத் துல்லியமாக உச்சரிக்கவும்:",
          te: "విని ఈ పదాన్ని సరిగ్గా ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಪದವನ್ನು ಸರಿಯಾಗಿ ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই শব্দটির সঠিক উচ্চারণ করুন:",
          mr: "ऐका आणि या महत्त्वाच्या शब्दाचा अचूक उच्चार करा:"
        },
        targetPhrase: "कार्यालय",
        phoneticHint: "Kaar-yaa-lay (Office)"
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════
  // 7. ENGLISH (en) TARGET LANGUAGE
  // ═════════════════════════════════════════════════════════════════
  en: {
    beginner: [
      {
        type: "mcq",
        category: "mcq",
        text: "Which of these is the first letter of the English Alphabet?",
        translations: {
          en: "Which of these is the first letter of the English Alphabet?",
          hi: "इनमें से अंग्रेजी वर्णमाला का पहला अक्षर कौन सा है?",
          ta: "ஆங்கில எழுத்துக்களின் முதல் எழுத்து எது?",
          te: "ఆంగ్ల వర్ణమాలలోని మొదటి అక్షరం ఏది?",
          kn: "ಇವುಗಳಲ್ಲಿ ಇಂಗ್ಲಿಷ್ ವರ್ಣಮಾಲೆಯ ಮೊದಲ ಅಕ್ಷರ ಯಾವುದು?",
          bn: "ইংরেজি বর্ণমালার প্রথম বর্ণ কোনটি?",
          mr: "यापैकी इंग्रजी वर्णमालेतील पहिले अक्षर कोणते आहे?"
        },
        targetPhrase: "A",
        options: ["A", "B", "C", "D"],
        answerIndex: 0
      },
      {
        type: "mcq",
        category: "mcq",
        text: "Which word starts with the letter 'B'?",
        translations: {
          en: "Which word starts with the letter 'B'?",
          hi: "कौन सा शब्द 'B' अक्षर से शुरू होता है?",
          ta: "'B' என்ற எழுத்தில் தொடங்கும் வார்த்தை எது?",
          te: "'B' అక్షరంతో ప్రారంభమయ్యే పదం ఏది?",
          kn: "'B' ಅಕ್ಷರದಿಂದ ಪ್ರಾರಂಭವಾಗುವ ಪದ ಯಾವುದು?",
          bn: "'B' বর্ণ দিয়ে কোন শব্দটি শুরু হয়?",
          mr: "'B' या अक्षराने कोणता शब्द सुरू होतो?"
        },
        targetPhrase: "Bus",
        optionsTranslations: {
          en: ["Bus", "Apple", "Cat", "Dog"],
          hi: ["बस (Bus)", "सेब (Apple)", "बिल्ली (Cat)", "कुत्ता (Dog)"],
          ta: ["பேருந்து (Bus)", "ஆப்பிள் (Apple)", "பூனை (Cat)", "நாய் (Dog)"],
          te: ["బస్సు (Bus)", "యాపిల్ (Apple)", "పిల్లి (Cat)", "కుక్క (Dog)"],
          kn: ["ಬಸ್ (Bus)", "ಸೇಬು (Apple)", "ಬೆಕ್ಕು (Cat)", "ನಾಯಿ (Dog)"],
          bn: ["বাস (Bus)", "আপেল (Apple)", "বিড়াল (Cat)", "কুকুর (Dog)"],
          mr: ["बस (Bus)", "सफरचंद (Apple)", "मांजर (Cat)", "कुत्रा (Dog)"]
        },
        answerIndex: 0
      },
      {
        type: "reading",
        category: "reading",
        passage: "BUS STOP: Please wait here for Route 15 to City Center.",
        passageTranslation: "Bus Stop: Route 15 to City Center.",
        text: "Read the sign. Which bus number goes to City Center?",
        translations: {
          en: "Read the sign. Which bus number goes to City Center?",
          hi: "बोर्ड पढ़ें। सिटी सेंटर के लिए कौन सी बस संख्या जाती है?",
          ta: "அறிவிப்பைப் படியுங்கள். நகர மையத்திற்கு செல்லும் பேருந்து எண் எது?",
          te: "బోర్డు చదవండి. సిటీ సెంటర్‌కు ఏ బస్సు నంబర్ వెళుతుంది?",
          kn: "ಸೂಚನೆ ಓದಿ. ಸಿಟಿ ಸೆಂಟರ್‌ಗೆ ಯಾವ ಬಸ್ ಸಂಖ್ಯೆ ಹೋಗುತ್ತದೆ?",
          bn: "বোর্ডটি পড়ুন। সিটি সেন্টারে যাওয়ার বাস নম্বর কত?",
          mr: "पाटी वाचा. सिटी सेंटरसाठी कोणती बस जाते?"
        },
        optionsTranslations: {
          en: ["Route 15", "Route 1", "Route 50", "Route 99"],
          hi: ["रूट 15", "रूट 1", "रूट 50", "रूट 99"],
          ta: ["தடம் 15", "தடம் 1", "தடம் 50", "தடம் 99"],
          te: ["రూట్ 15", "రూట్ 1", "రూట్ 50", "రూట్ 99"],
          kn: ["ಮಾರ್ಗ 15", "ಮಾರ್ಗ 1", "ಮಾರ್ಗ 50", "ಮಾರ್ಗ 99"],
          bn: ["রুট ১৫", "রুট ১", "রুট ৫০", "রুট ৯৯"],
          mr: ["रूट १५", "रूट १", "रूट ५०", "रूट ९९"]
        },
        answerIndex: 0
      },
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this greeting clearly:",
        translations: {
          en: "Listen and pronounce this greeting clearly:",
          hi: "सुनें और इस अभिवादन का स्पष्ट उच्चारण करें:",
          ta: "கேட்டு இந்த வாழ்த்தை தெளிவாக உச்சரிக்கவும்:",
          te: "విని ఈ నమస్కారాన్ని స్పష్టంగా ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಶುಭಾಶಯವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই সম্ভাষণটি পরিষ্কারভাবে উচ্চারণ করুন:",
          mr: "ऐका आणि या शब्दाचा स्पष्ट उच्चार करा:"
        },
        targetPhrase: "Hello",
        phoneticHint: "Hel-lo"
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this English sentence clearly into the mic:",
        translations: {
          en: "Speak this English sentence clearly into the mic:",
          hi: "माइक में यह अंग्रेजी वाक्य स्पष्ट बोलें:",
          ta: "மைக்கில் இந்த ஆங்கில வாக்கியத்தை தெளிவாகப் பேசுங்கள்:",
          te: "ఈ ఆంగ్ల వాక్యాన్ని మైక్‌లో స్పష్టంగా మాట్లాడండి:",
          kn: "ಈ ಇಂಗ್ಲಿಷ್ ವಾಕ್ಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই ইংরেজি বাক্যটি স্পষ্টভাবে বলুন:",
          mr: "हा इंग्रजी वाक्य माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "Good morning",
        phoneticHint: "Good morning"
      }
    ],

    intermediate: [
      {
        type: "mcq",
        category: "mcq",
        text: "Select the correct spelling of the place where trains stop:",
        translations: {
          en: "Select the correct spelling of the place where trains stop:",
          hi: "उस स्थान की सही वर्तनी (Spelling) चुनें जहाँ ट्रेनें रुकती हैं:",
          ta: "ரயில்கள் நிற்கும் இடத்திற்கான சரியான எழுத்துப் பிழையற்ற வார்த்தையைத் தேர்ந்தெடுக்கவும்:",
          te: "రైళ్లు ఆగే ప్రదేశానికి సరైన స్పెల్లింగ్‌ను ఎంచుకోండి:",
          kn: "ರೈಲುಗಳು ನಿಲ್ಲುವ ಸ್ಥಳದ ಸರಿಯಾದ ಕಾಗುಣಿತವನ್ನು ಆರಿಸಿ:",
          bn: "যেখানে ট্রেন থামে সেই জায়গার সঠিক বানান নির্বাচন করুন:",
          mr: "जिथे गाड्या थांबतात त्या ठिकाणाचे योग्य स्पेलिंग निवडा:"
        },
        options: ["Station", "Statsion", "Stayshun", "Staytion"],
        answerIndex: 0
      },
      {
        type: "reading",
        category: "reading",
        passage: "CITY HEALTH CLINIC: Open Monday through Saturday from 9:00 AM to 5:00 PM. Closed on Sundays.",
        passageTranslation: "City Health Clinic: Open Mon-Sat 9AM-5PM. Closed on Sundays.",
        text: "When is the City Health Clinic closed?",
        translations: {
          en: "When is the City Health Clinic closed?",
          hi: "सिटी हेल्थ क्लिनिक कब बंद रहता है?",
          ta: "மருத்துவமனை எப்போது மூடப்பட்டிருக்கும்?",
          te: "సిటీ హెల్త్ క్లినిక్ ఎప్పుడు మూసివేయబడుతుంది?",
          kn: "ಸಿಟಿ ಹೆಲ್ತ್ ಕ್ಲಿನಿಕ್ ಯಾವಾಗ ಮುಚ್ಚಿರುತ್ತದೆ?",
          bn: "সিটি হেলথ ক্লিনিক কখন বন্ধ থাকে?",
          mr: "सिटी हेल्थ क्लिनिक कधी बंद असते?"
        },
        optionsTranslations: {
          en: ["Sundays", "Mondays", "Saturdays", "Every afternoon"],
          hi: ["रविवार", "सोमवार", "शनिवार", "हर दोपहर"],
          ta: ["ஞாயிற்றுக்கிழமைகள்", "திங்கட்கிழமைகள்", "சனிக்கிழமைகள்", "ஒவ்வொரு மதியமும்"],
          te: ["ఆదివారాలు", "సోమవారాలు", "శనివారాలు", "ప్రతి మధ్యాహ్నం"],
          kn: ["ಭಾನುವಾರಗಳು", "ಸೋಮವಾರಗಳು", "ಶನಿವಾರಗಳು", "ಪ್ರತಿ ಮಧ್ಯಾಹ್ನ"],
          bn: ["রবিবার", "সোমবার", "শনিবার", "প্রতি বিকেলে"],
          mr: ["रविवार", "सोमवार", "शनिवार", "दररोज दुपारी"]
        },
        answerIndex: 0
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this practical question aloud into the mic:",
        translations: {
          en: "Speak this practical question aloud into the mic:",
          hi: "माइक में यह व्यावहारिक प्रश्न बोलें:",
          ta: "மைக்கில் இந்த கேள்வியைப் பேசுங்கள்:",
          te: "ఈ ప్రశ్నను మైక్‌లో మాట్లాడండి:",
          kn: "ಈ ಪ್ರಶ್ನೆಯನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই প্রশ্নটি স্পষ্ট করে বলুন:",
          mr: "हा व्यावहारिक प्रश्न माइकमध्ये स्पष्ट बोला:"
        },
        targetPhrase: "Where is the nearest hospital?",
        phoneticHint: "Where is the nearest hospital?"
      }
    ],

    advanced: [
      {
        type: "pronunciation",
        category: "pronunciation",
        text: "Listen and pronounce this vocabulary word accurately:",
        translations: {
          en: "Listen and pronounce this vocabulary word accurately:",
          hi: "सुनें और इस शब्द का सही उच्चारण करें:",
          ta: "கேட்டு இந்த வார்த்தையைத் துல்லியமாக உச்சரிக்கவும்:",
          te: "విని ఈ పదాన్ని సరిగ్గా ఉచ్చరించండి:",
          kn: "ಕೇಳಿ ಈ ಪದವನ್ನು ಸರಿಯಾಗಿ ಉಚ್ಚರಿಸಿ:",
          bn: "শুনুন এবং এই শব্দটির সঠিক উচ্চারণ করুন:",
          mr: "ऐका आणि या शब्दाचा अचूक उच्चार करा:"
        },
        targetPhrase: "Opportunity",
        phoneticHint: "Op-por-tu-ni-ty"
      },
      {
        type: "speaking",
        category: "speaking",
        text: "Speak this complete sentence fluently into the mic:",
        translations: {
          en: "Speak this complete sentence fluently into the mic:",
          hi: "माइक में इस पूरे वाक्य को धाराप्रवाह बोलें:",
          ta: "மைக்கில் இந்த முழு வாக்கியத்தை சரளமாகப் பேசுங்கள்:",
          te: "ఈ వాక్యాన్ని మైక్‌లో ధారాళంగా మాట్లాడండి:",
          kn: "ಈ ವಾಕ್ಯವನ್ನು ಮೈಕ್‌ನಲ್ಲಿ ನಿರರ್ಗಳವಾಗಿ ಮಾತನಾಡಿ:",
          bn: "মাইকে এই বাক্যটি সাবলীলভাবে বলুন:",
          mr: "हा वाक्य माइकमध्ये अस्खलितपणे बोला:"
        },
        targetPhrase: "Please help me fill this application form.",
        phoneticHint: "Please help me fill this application form."
      }
    ]
  }
};

/**
 * Builds a balanced 10-question assessment customized for the user's profile:
 * - targetLang: The language being tested (en, hi, ta, te, kn, bn, mr)
 * - preferredLang: The UI / display language for instructions and options
 * - literacyLevel: neverLearned, canRecognize, canReadSimple, canReadComfort
 * - ageGroup: below18, 18-25, 26-40, 41-60, 60+
 */
function buildCuratedAssessmentQuestions(targetLang, preferredLang, literacyLevel, ageGroup) {
  const tLang = ASSESSMENT_QUESTION_BANK[targetLang] ? targetLang : "en";
  const pLang = preferredLang || "en";
  const bank = ASSESSMENT_QUESTION_BANK[tLang];

  // Determine starting tier distribution based on literacy level
  let questionPool = [];

  if (literacyLevel === "neverLearned" || literacyLevel === "canRecognize") {
    // 70% Beginner questions, 30% Intermediate
    questionPool = [
      ...(bank.beginner || []),
      ...(bank.intermediate ? bank.intermediate.slice(0, 2) : [])
    ];
  } else if (literacyLevel === "canReadSimple") {
    // 30% Beginner, 50% Intermediate, 20% Advanced
    questionPool = [
      ...(bank.beginner ? bank.beginner.slice(0, 2) : []),
      ...(bank.intermediate || []),
      ...(bank.advanced ? bank.advanced.slice(0, 2) : [])
    ];
  } else {
    // canReadComfort: 20% Beginner, 40% Intermediate, 40% Advanced
    questionPool = [
      ...(bank.beginner ? bank.beginner.slice(0, 1) : []),
      ...(bank.intermediate || []),
      ...(bank.advanced || [])
    ];
  }

  // Ensure fallback questions exist if pool is smaller
  if (questionPool.length === 0) {
    questionPool = bank.beginner || [];
  }

  // Format and localize every question according to preferredLang
  const localized = questionPool.map((q, idx) => {
    const questionText = (q.translations && q.translations[pLang]) || q.text || q.translations?.en || "Answer the question";

    let options = [];
    if (q.optionsTranslations && q.optionsTranslations[pLang]) {
      options = q.optionsTranslations[pLang];
    } else if (q.optionsTranslations && q.optionsTranslations.en) {
      options = q.optionsTranslations.en;
    } else if (q.options) {
      options = q.options;
    }

    return {
      id: `q_${tLang}_${idx + 1}`,
      type: q.type || "mcq",
      category: q.category || "mcq",
      text: questionText,
      targetPhrase: q.targetPhrase || "",
      audioText: q.audioText || q.targetPhrase || "",
      passage: q.passage || "",
      passageTranslation: q.passageTranslation || "",
      phoneticHint: q.phoneticHint || "",
      options: options,
      answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : 0,
      targetLanguage: tLang,
      preferredLanguage: pLang
    };
  });

  return localized;
}
