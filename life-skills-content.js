/**
 * life-skills-content.js — Hardcoded Independent Practical Life Skills Question Bank
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ISOLATION GUARANTEE:
 *   - 100% Independent from Firestore sharedLessonContent cache
 *   - 100% Independent from Gemini AI API calls
 *   - Provides real-world practical scenarios across Beginner, Intermediate, and Advanced levels
 *   - Supports Banking & Forms, Transit & Travel, Health & Medicine, Market & Shopping, Utilities & Bills
 * ═══════════════════════════════════════════════════════════════════════════
 */

const LIFE_SKILLS_CONTENT = {

  // ═════════════════════════════════════════════════════════════════════════
  // 1. BANKING & FORMS (unit=banking)
  // ═════════════════════════════════════════════════════════════════════════
  banking: {
    beginner: [
      {
        instruction: "Read the bank slip and answer the question",
        content: "जमा पर्ची (Deposit Slip)\nखाता संख्या: 4829103847\nराशि: ₹500 (पाँच सौ रुपये)",
        translation: "Deposit Slip | Account No: 4829103847 | Amount: ₹500 (Five hundred rupees)",
        question: "इस पर्ची में कितनी राशि जमा की जा रही है? (How much money is being deposited?)",
        options: ["₹50 (पचास रुपये)", "₹500 (पाँच सौ रुपये)", "₹5,000 (पाँच हज़ार रुपये)", "₹100 (एक सौ रुपये)"],
        answerIndex: 1,
        explanation: "पर्ची पर साफ़ लिखा है कि जमा की जाने वाली राशि ₹500 (पाँच सौ रुपये) है।"
      },
      {
        instruction: "Read the ATM screen message and answer",
        content: "ATM स्क्रीन: कृपया अपना 4 अंकों का पिन दर्ज करें। (Please enter your 4-digit PIN.)",
        translation: "ATM Screen: Please enter your 4-digit PIN.",
        question: "ATM मशीन आपसे क्या दर्ज करने के लिए कह रही है?",
        options: ["मोबाइल नंबर", "4 अंकों का गुप्त पिन", "घर का पता", "नाम"],
        answerIndex: 1,
        explanation: "ATM मशीन लेन-देन शुरू करने के लिए आपका गुप्त 4-अंकों का PIN दर्ज करने को कह रही है।"
      },
      {
        instruction: "Read the cheque slip details and answer",
        content: "चेक संख्या: 004921\nपेई नाम: रमेश कुमार\nरकम: ₹1,200",
        translation: "Cheque No: 004921 | Payee Name: Ramesh Kumar | Amount: ₹1,200",
        question: "यह चेक किसके नाम पर जारी किया गया है? (Who is payee?)",
        options: ["सुरेश वर्मा", "रमेश कुमार", "अमित शर्मा", "बैंक मैनेजर"],
        answerIndex: 1,
        explanation: "चेक के पेई (Payee) फ़ील्ड में रमेश कुमार का नाम लिखा है।"
      },
      {
        instruction: "Read the bank notice board and answer",
        content: "सूचना: शनिवार और रविवार को बैंक बंद रहेगा। आपातकालीन ATM सेवा 24x7 चालू रहेगी।",
        translation: "Notice: Bank will remain closed on Saturday and Sunday. Emergency ATM service open 24x7.",
        question: "सप्ताह के किन दिनों में बैंक शाखा बंद रहेगी?",
        options: ["सोमवार और मंगलवार", "बुधवार और गुरुवार", "शनिवार और रविवार", "केवल शुक्रवार"],
        answerIndex: 2,
        explanation: "सूचना पत्र में स्पष्ट उल्लेख है कि शनिवार और रविवार को बैंक शाखा बंद रहती है।"
      },
      {
        instruction: "Read the passbook update and answer",
        content: "पासबुक प्रविष्टि: शेष राशि (Available Balance): ₹8,450.00",
        translation: "Passbook Entry: Available Balance: ₹8,450.00",
        question: "खाते में कुल कितनी शेष राशि उपलब्ध है?",
        options: ["₹845", "₹8,450", "₹84,500", "₹450"],
        answerIndex: 1,
        explanation: "पासबुक में कुल उपलब्ध शेष राशि ₹8,450 दर्शायी गई है।"
      }
    ],

    intermediate: [
      {
        instruction: "Read the withdrawal form instructions and answer",
        content: "निकासी फॉर्म (Withdrawal Form)\nशाखा: सिविल लाइंस\nनिकासी राशि: ₹4,500\nनोट: निकासी के लिए पासबुक साथ लाना अनिवार्य है।",
        translation: "Withdrawal Form | Branch: Civil Lines | Amount: ₹4,500 | Note: Passbook required.",
        question: "पैसे निकालने के लिए फॉर्म के साथ क्या लाना अनिवार्य है?",
        options: ["आधार कार्ड की फोटोकॉपी", "बैंक की पासबुक", "ड्राइविंग लाइसेंस", "राशन कार्ड"],
        answerIndex: 1,
        explanation: "फॉर्म के निर्देश में लिखा है कि पैसे निकालते समय पासबुक साथ लाना अनिवार्य है।"
      },
      {
        instruction: "Read the bank SMS notification and answer",
        content: "बैंक अलर्ट: आपके खाते से ₹2,300 डेबिट (निकाले) किए गए। यदि यह लेन-देन आपने नहीं किया, तो तुरंत 1800-111-222 पर कॉल करें।",
        translation: "Bank Alert: ₹2,300 debited from your account. If not done by you, call 1800-111-222 immediately.",
        question: "अनधिकृत लेन-देन होने पर आपको तुरंत क्या करना चाहिए?",
        options: ["बैंक बंद होने का इंतज़ार करें", "दिए गए टोल-फ्री नंबर पर तुरंत कॉल करें", "अपना फ़ोन बंद कर दें", "पड़ोसी को बताएं"],
        answerIndex: 1,
        explanation: "सुरक्षा अलर्ट में साफ़ निर्देश है कि अगर लेन-देन आपका नहीं है, तो टोल-फ्री नंबर पर कॉल करें।"
      },
      {
        instruction: "Read the Fixed Deposit (FD) receipt and answer",
        content: "आवधिक जमा (FD) रसीद:\nजमा राशि: ₹25,000\nअवधि: 1 वर्ष\nब्याज दर: 6.5% वार्षिक\nपरिपक्वता राशि (Maturity Amount): ₹26,625",
        translation: "Fixed Deposit Receipt | Amount: ₹25,000 | Tenure: 1 Year | Interest: 6.5% p.a. | Maturity: ₹26,625",
        question: "1 वर्ष पूरा होने पर परिपक्वता (Maturity) पर कितनी कुल राशि मिलेगी?",
        options: ["₹25,000", "₹26,625", "₹30,000", "₹1,625"],
        answerIndex: 1,
        explanation: "1 वर्ष की अवधि पूरी होने पर मिलने वाली कुल परिपक्वता राशि ₹26,625 है।"
      },
      {
        instruction: "Read the KYC verification requirement and answer",
        content: "KYC अपडेट सूचना: अपने बैंक खाते को चालू रखने के लिए 31 मार्च से पहले पहचान पत्र (Aadhaar/PAN) जमा करें।",
        translation: "KYC Update Notice: Submit identity proof (Aadhaar/PAN) before 31st March to keep account active.",
        question: "KYC अपडेट की अंतिम तिथि क्या है?",
        options: ["15 जनवरी", "28 फ़रवरी", "31 मार्च", "31 दिसंबर"],
        answerIndex: 2,
        explanation: "सूचना में खाता सक्रिय रखने हेतु पहचान पत्र जमा करने की अंतिम तिथि 31 मार्च दी गई है।"
      },
      {
        instruction: "Read the demand draft (DD) form and answer",
        content: "डिपॉजिट ड्राफ्ट फॉर्म:\nलाभार्थी (In Favor of): निदेशक, दिल्ली विश्वविद्यालय\nराशि: ₹3,000\nड्राफ्ट शुल्क: ₹50",
        translation: "Demand Draft Form | In Favor of: Director, Delhi University | Amount: ₹3,000 | Fee: ₹50",
        question: "यह ड्राफ्ट किसके पक्ष में तैयार किया जा रहा है?",
        options: ["बैंक मैनेजर", "निदेशक, दिल्ली विश्वविद्यालय", "दिल्ली परिवहन निगम", "रमेश लाल"],
        answerIndex: 1,
        explanation: "ड्राफ्ट के लाभार्थी (In Favor of) कॉलम में 'निदेशक, दिल्ली विश्वविद्यालय' लिखा है।"
      }
    ],

    advanced: [
      {
        instruction: "Read the loan agreement summary clause and answer",
        content: "ऋण अनुबंध (Loan Agreement Clause):\nमासिक किश्त (EMI): ₹12,400\nभुगतान तिथि: प्रत्येक माह की 5 तारीख\nविलंब शुल्क: देय तिथि के बाद भुगतान पर 2% प्रति माह की दर से शास्ति लगेगी।",
        translation: "Loan Clause | Monthly EMI: ₹12,400 | Due Date: 5th of every month | Late Fee: 2% per month after due date.",
        question: "यदि किश्त का भुगतान 5 तारीख के बाद किया जाता है, तो क्या परिणाम होगा?",
        options: ["कोई अतिरिक्त शुल्क नहीं लगेगा", "2% प्रति माह विलंब शुल्क (Penalty) लगेगा", "ऋण स्वतः रद्द हो जाएगा", "बैंक खाता बंद हो जाएगा"],
        answerIndex: 1,
        explanation: "अनुबंध में लिखा है कि देय तिथि (5 तारीख) के बाद भुगतान करने पर 2% प्रति माह विलंब शुल्क लागू होगा।"
      },
      {
        instruction: "Read the bank statement transaction log and answer",
        content: "बैंक विवरण:\nप्रारंभिक शेष: ₹45,000\n10-मई: सैलरी जमा +₹35,000\n12-मई: मकान किराया -₹15,000\n15-मई: राशन खरीदारी -₹5,000\nअंतिम शेष राशि दर्ज करें।",
        translation: "Bank Statement | Opening: ₹45,000 | May 10 Salary Credit: +₹35,000 | May 12 Rent Debit: -₹15,000 | May 15 Grocery Debit: -₹5,000",
        question: "15 मई के लेन-देन के बाद खाते में अंतिम शेष राशि कितनी बची?",
        options: ["₹55,000", "₹60,000", "₹45,000", "₹75,000"],
        answerIndex: 1,
        explanation: "गणना: ₹45,000 + ₹35,000 = ₹80,000; माइनस (₹15,000 + ₹5,000 = ₹20,000) = ₹60,000।"
      },
      {
        instruction: "Read the internet banking security guideline and answer",
        content: "सुरक्षा दिशानिर्देश:\n1. अपना पासवर्ड कभी किसी से साझा न करें।\n2. सार्वजनिक Wi-Fi पर नेटबैंकिंग न चलाएं।\n3. बैंक अधिकारी कभी फ़ोन पर OTP या पासवर्ड नहीं मांगते।",
        translation: "Security Rules | 1. Never share password | 2. Don't use NetBanking on public Wi-Fi | 3. Bank staff never ask for OTP over call.",
        question: "यदि कोई व्यक्ति फ़ोन पर बैंक अधिकारी बनकर OTP मांगे, तो क्या करना चाहिए?",
        options: ["OTP तुरंत बता देना चाहिए", "OTP देने से मना कर दें, यह एक फ्रॉड कॉल है", "अपना नया पासवर्ड बताएं", "फ़ोन किसी और को पकड़ा दें"],
        answerIndex: 1,
        explanation: "दिशानिर्देश के अनुसार बैंक कभी OTP नहीं मांगता; ऐसी कॉल पर OTP साझा नहीं करना चाहिए।"
      },
      {
        instruction: "Read the credit card bill statement and answer",
        content: "क्रेडिट कार्ड बिल:\nकुल देय राशि (Total Amount Due): ₹18,500\nन्यूनतम देय राशि (Minimum Amount Due): ₹1,850\nदेय तिथि: 25 जून\nनोट: न्यूनतम राशि देने पर शेष राशि पर 3.5% मासिक ब्याज लगेगा।",
        translation: "Credit Card Bill | Total Due: ₹18,500 | Minimum Due: ₹1,850 | Due Date: June 25 | Note: Interest of 3.5%/mo applies on unpaid balance.",
        question: "ब्याज शुल्क से बचने के लिए क्या करना सबसे बुद्धिमानी होगा?",
        options: ["केवल न्यूनतम राशि (₹1,850) देना", "25 जून तक पूरी राशि (₹18,500) का भुगतान करना", "भुगतान न करना", "अगले महीने भुगतान करना"],
        answerIndex: 1,
        explanation: "पूरी राशि देने पर ही ब्याज से बचा जा सकता है, केवल न्यूनतम राशि देने पर शेष पर भारी ब्याज लगता है।"
      },
      {
        instruction: "Read the cheque bounce penalty clause and answer",
        content: "चेक अनादरण (Cheque Bounce Notice):\nपर्याप्त राशि न होने के कारण चेक बाउंस हो गया है।\nधारा 138 के तहत चेक बाउंस एक दंडनीय अपराध है। खाताधारक पर ₹500 बैंक जुर्माना लगाया गया है।",
        translation: "Cheque Bounce Notice: Cheque bounced due to insufficient funds. Offence under Sec 138. Bank penalty ₹500.",
        question: "चेक बाउंस होने का मुख्य कारण क्या था?",
        options: ["गलत हस्ताक्षर", "खाते में पर्याप्त राशि (Insufficient Funds) न होना", "पुरानी तारीख", "बैंक में अवकाश"],
        answerIndex: 1,
        explanation: "नोटिस में स्पष्ट लिखा है कि खाते में पर्याप्त राशि न होने की वजह से चेक बाउंस हुआ।"
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 2. TRANSIT & TRAVEL (unit=transit)
  // ═════════════════════════════════════════════════════════════════════════
  transit: {
    beginner: [
      {
        instruction: "Read the bus destination board and answer",
        content: "बस बोर्ड:\nबस नंबर: 534\nमार्ग: आनंद विहार ➔ नेहरू प्लेस ➔ मेहरौली",
        translation: "Bus Board | Bus No: 534 | Route: Anand Vihar ➔ Nehru Place ➔ Mehrauli",
        question: "इस बस का नंबर क्या है?",
        options: ["534", "435", "543", "354"],
        answerIndex: 0,
        explanation: "बस के आगे लगे बोर्ड पर बस नंबर 534 लिखा है।"
      },
      {
        instruction: "Read the train ticket detail and answer",
        content: "रेल टिकट:\nट्रेन नंबर: 12951 (राजधानी एक्सप्रेस)\nकोच: B3 | सीट नंबर: 42 (लोअर बर्थ)",
        translation: "Train Ticket | Train No: 12951 (Rajdhani Exp) | Coach: B3 | Seat: 42 (Lower Berth)",
        question: "यात्री की सीट किस कोच में है?",
        options: ["A1", "B3", "S5", "B12"],
        answerIndex: 1,
        explanation: "टिकट पर कोच नंबर B3 अंकित है।"
      },
      {
        instruction: "Read the metro platform direction sign and answer",
        content: "मेट्रो प्लेटफॉर्म सूचना:\nप्लेटफॉर्म नंबर 2: विश्वविद्यालय की ओर जाने वाली ट्रेन",
        translation: "Metro Sign | Platform No 2: Train towards Vishwavidyalaya",
        question: "विश्वविद्यालय जाने के लिए किस प्लेटफॉर्म पर जाना होगा?",
        options: ["प्लेटफॉर्म 1", "प्लेटफॉर्म 2", "प्लेटफॉर्म 4", "निकास द्वार"],
        answerIndex: 1,
        explanation: "साइन बोर्ड के अनुसार विश्वविद्यालय जाने वाली ट्रेन प्लेटफॉर्म नंबर 2 पर आएगी।"
      },
      {
        instruction: "Read the bus stop timetable sign and answer",
        content: "बस समय सारिणी:\nप्रथम बस: सुबह 06:00 बजे\nअंतिम बस: रात 10:30 बजे\nप्रत्येक 15 मिनट में बस उपलब्ध है।",
        translation: "Bus Schedule | First Bus: 06:00 AM | Last Bus: 10:30 PM | Frequency: Every 15 mins",
        question: "सुबह की पहली बस कितने बजे चलती है?",
        options: ["सुबह 5:00 बजे", "सुबह 6:00 बजे", "सुबह 7:30 बजे", "दोपहर 12:00 बजे"],
        answerIndex: 1,
        explanation: "समय सारिणी में लिखा है कि पहली बस सुबह 06:00 बजे प्रस्थान करती है।"
      },
      {
        instruction: "Read the airport gate direction and answer",
        content: "एयरपोर्ट साइन: बोर्डिंग गेट 12B ➔ सीधा जाएं (Go Straight)",
        translation: "Airport Sign: Boarding Gate 12B ➔ Go Straight",
        question: "बोर्डिंग गेट 12B तक पहुँचने के लिए किस दिशा में जाना है?",
        options: ["बाएं मुड़ें", "दाएं मुड़ें", "सीधा जाएं (Go Straight)", "वापस लौटें"],
        answerIndex: 2,
        explanation: "साइन बोर्ड पर तीर का निशान सीधा जाने का संकेत दे रहा है।"
      }
    ],

    intermediate: [
      {
        instruction: "Read the railway PNR status and answer",
        content: "PNR स्थिति:\nPNR: 2415890123\nट्रेन: 12424 डिब्रूगढ़ राजधानी\nप्रारंभिक स्थिति: WL 14 (वेटिंग लिस्ट)\nवर्तमान स्थिति: CNF / B4 / 21 (पुष्टि हो गई)",
        translation: "PNR Status | PNR: 2415890123 | Train: 12424 | Booking: WL 14 | Current Status: CNF / B4 / 21 (Confirmed)",
        question: "क्या यात्री की टिकट कन्फर्म (पुष्टि) हो चुकी है?",
        options: ["नहीं, अभी भी वेटिंग लिस्ट में है", "हां, कोच B4 में सीट 21 कन्फर्म हो गई है", "टिकट रद्द हो गई है", "ट्रेन रद्द हो गई है"],
        answerIndex: 1,
        explanation: "वर्तमान स्थिति CNF (Confirmed) दिखा रही है, यानी कोच B4 में 21 नंबर सीट मिल गई है।"
      },
      {
        instruction: "Read the toll plaza rate chart and answer",
        content: "टोल प्लाज़ा दरें:\nकार / जीप: ₹85 (एक तरफा) | ₹130 (24 घंटे में वापसी)\nबस / ट्रक: ₹280 (एक तरफा)",
        translation: "Toll Plaza Rates | Car/Jeep: ₹85 (Single) | ₹130 (Return 24h) | Bus/Truck: ₹280 (Single)",
        question: "यदि आप कार से जाकर 24 घंटे के भीतर वापस आते हैं, तो कुल टोल कितना लगेगा?",
        options: ["₹85", "₹170", "₹130", "₹280"],
        answerIndex: 2,
        explanation: "कार के लिए 24 घंटे में वापसी (Return) का रियायती टोल पास ₹130 है।"
      },
      {
        instruction: "Read the flight baggage rule notice and answer",
        content: "एयरलाइन सामान नियम:\nकेबिन बैग (हाथ का सामान): अधिकतम 7 किलोग्राम (1 बैग)\nचेक-इन बैग: अधिकतम 15 किलोग्राम\nअतिरिक्त वजन पर ₹500 प्रति किलोग्राम का शुल्क लगेगा।",
        translation: "Baggage Rules | Cabin Bag: Max 7 kg (1 piece) | Check-in Bag: Max 15 kg | Excess: ₹500 per kg.",
        question: "आप अपने साथ विमान के अंदर (Cabin) कितना वजन ले जा सकते हैं?",
        options: ["15 किलोग्राम", "7 किलोग्राम", "20 किलोग्राम", "कोई सीमा नहीं"],
        answerIndex: 1,
        explanation: "नियम के अनुसार केबिन बैग (हाथ का सामान) का अधिकतम वजन 7 किलोग्राम है।"
      },
      {
        instruction: "Read the interstate bus ticket rules and answer",
        content: "बस ई-टिकट:\nयात्री नाम: सुनीता देवी\nसीट: 14 (महिला आरक्षित)\nयात्रा रद्द करने का नियम: प्रस्थान से 12 घंटे पहले 80% रिफंड मिलेगा।",
        translation: "Bus E-Ticket | Name: Sunita Devi | Seat: 14 (Ladies Reserved) | Refund Policy: 80% refund 12h before departure.",
        question: "बस छूटने से 12 घंटे पहले टिकट रद्द करने पर कितना रिफंड (वापसी राशि) मिलेगा?",
        options: ["100% (पूरा पैसा)", "80% राशि", "50% राशि", "जीरो रिफंड"],
        answerIndex: 1,
        explanation: "रद्द करने के नियम में स्पष्ट लिखा है कि 12 घंटे पहले रद्द करने पर 80% रिफंड मिलेगा।"
      },
      {
        instruction: "Read the train schedule board and answer",
        content: "रेलवे डिस्प्ले बोर्ड:\nट्रेन: 12002 भोपाल शताब्दी\nनिर्धारित समय: 06:00 AM\nसंशोधित समय: 07:30 AM (विंब: 1 घंटे 30 मिनट)",
        translation: "Train Board | 12002 Bhopal Shatabdi | Scheduled: 06:00 AM | Revised: 07:30 AM (Delayed 1h 30m)",
        question: "शताब्दी एक्सप्रेस अपने निर्धारित समय से कितनी देरी (Late) से चल रही है?",
        options: ["30 मिनट", "1 घंटा", "1 घंटा 30 मिनट", "2 घंटे"],
        answerIndex: 2,
        explanation: "06:00 के स्थान पर 07:30 बजे आने के कारण ट्रेन 1 घंटा 30 मिनट विलंबित है।"
      }
    ],

    advanced: [
      {
        instruction: "Read the International Transit Visa instruction and answer",
        content: "अंतर्राष्ट्रीय ट्रांजिट नियम:\nयदि ले-ओवर (रुकने का समय) 8 घंटे से अधिक है या आपको एयरपोर्ट टर्मिनल से बाहर जाना है, तो ट्रांजिट वीज़ा अनिवार्य है। अन्यथा आप कनेक्टिंग एरिया में ही रहें।",
        translation: "Transit Rules: Transit visa required if layover exceeds 8 hours or if exiting airport terminal. Otherwise remain in connecting area.",
        question: "किन दो स्थितियों में यात्री को ट्रांजिट वीज़ा लेना अनिवार्य होगा?",
        options: ["केवल चाय पीने के लिए", "ले-ओवर 8 घंटे से अधिक होने पर या एयरपोर्ट से बाहर जाने पर", "केवल सामान जमा करने पर", "विमान में चढ़ने पर"],
        answerIndex: 1,
        explanation: "नियम में 8 घंटे से अधिक स्टे या टर्मिनल से बाहर जाने की स्थिति में वीज़ा की अनिवार्यता बताई गई है।"
      },
      {
        instruction: "Read the express highway safety and speed regulation notice",
        content: "एक्सप्रेसवे नियम:\nअधिकतम गति सीमा: कार - 120 किमी/घंटा, भारी वाहन - 80 किमी/घंटा\nलेन अनुशासन: दाहिनी लेन केवल ओवरटेकिंग के लिए है। धीमी गति के वाहन बाईं लेन में चलें।",
        translation: "Expressway Rules | Max Speed: Cars 120 km/h, Heavy Vehicles 80 km/h | Right lane for overtaking only. Slow vehicles stay left.",
        question: "एक्सप्रेसवे पर सबसे दाहिनी लेन (Rightmost Lane) का उपयोग किस कार्य के लिए आरक्षित है?",
        options: ["धीमी गाड़ी चलाने के लिए", "गाड़ी पार्क करने के लिए", "केवल ओवरटेक करने (Overtaking) के लिए", "इमरजेंसी स्टॉप के लिए"],
        answerIndex: 2,
        explanation: "लेन नियम के अनुसार दाहिनी लेन केवल ओवरटेकिंग के लिए उपयोग की जानी चाहिए।"
      },

      {
        instruction: "Read the train cancellation refund policy clause and answer",
        content: "रेलवे रिफंड नियम (IRCTC Policy):\nयदि ट्रेन रेलवे द्वारा पूरी तरह रद्द कर दी जाती है, तो e-Ticket का रिफंड स्वतः (Automatically) यात्री के खाते में जमा हो जाएगा। TDR दाखिल करने की आवश्यकता नहीं है।",
        translation: "IRCTC Rule: If train is cancelled by Railways, e-ticket refund credited automatically. No need to file TDR.",
        question: "रेलवे द्वारा ट्रेन रद्द किए जाने पर e-ticket धारक को रिफंड पाने के लिए क्या करना होगा?",
        options: ["रेलवे स्टेशन जाकर लाइन में लगना होगा", "कुछ नहीं करना होगा, रिफंड स्वतः (Automatically) खाते में आ जाएगा", "टीटीई से संपर्क करना होगा", "नया टिकट खरीदना होगा"],
        answerIndex: 1,
        explanation: "नियम के अनुसार e-ticket का रिफंड बिना किसी आवेदन के अपने आप बैंक खाते में आ जाता है।"
      },
      {
        instruction: "Read the metro Smart Card terms & conditions and answer",
        content: "मेट्रो स्मार्ट कार्ड नियम:\nन्यूनतम बैलेंस: ₹50 होना अनिवार्य है।\nयदि कार्ड 1 वर्ष तक उपयोग नहीं किया गया, तो कार्ड निष्क्रिय (Inoperative) हो जाएगा और पुनः सक्रिय करने के लिए ₹20 का शुल्क लगेगा।",
        translation: "Metro Smart Card Terms: Min balance ₹50 required. Inactive for 1 year makes card inoperative; ₹20 fee to reactivate.",
        question: "स्मार्ट कार्ड को लगातार 1 वर्ष तक इस्तेमाल न करने पर क्या होगा?",
        options: ["कार्ड में जमा पैसे गायब हो जाएंगे", "कार्ड निष्क्रिय (Inoperative) हो जाएगा और ₹20 शुल्क देकर चालू होगा", "कार्ड हमेशा के लिए ब्लॉक हो जाएगा", "मुफ्त में नया कार्ड मिलेगा"],
        answerIndex: 1,
        explanation: "शर्तों के अनुसार 1 वर्ष प्रयोग न करने पर कार्ड निष्क्रिय होता है, जिसे ₹20 देकर फिर चालू कराया जा सकता है।"
      },
      {
        instruction: "Read the compensation rules for delayed flights and answer",
        content: "डीजीसीए (DGCA) पैसेंजर अधिकार:\nयदि एयरलाइन की गलती से उड़ान 4 घंटे से अधिक विलंबित होती है, तो एयरलाइन को यात्रियों के लिए मुफ्त भोजन और पेय पदार्थ की व्यवस्था करनी होगी।",
        translation: "DGCA Rules: If flight is delayed by >4 hours due to airline fault, airline must provide free meals and refreshments.",
        question: "उड़ान में 4 घंटे से अधिक की देरी होने पर यात्री किस सुविधा के हकदार हैं?",
        options: ["निःशुल्क होटल स्टे", "निःशुल्क भोजन और पेय पदार्थ (Free Meals & Refreshments)", "पूरी टिकट का दोगुना पैसा", "टैक्सी का किराया"],
        answerIndex: 1,
        explanation: "DGCA के नियमों के अनुसार 4 घंटे से अधिक विलंब पर एयरलाइन द्वारा मुफ्त भोजन व पेय दिया जाना अनिवार्य है।"
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 3. HEALTH & MEDICINE (unit=health)
  // ═════════════════════════════════════════════════════════════════════════
  health: {
    beginner: [
      {
        instruction: "Read the medicine strip label and answer",
        content: "दवा की पट्टी (Medicine Strip):\nपैरासिटामोल 500mg\nखुराक: दिन में 2 बार, भोजन के बाद (After Food)\nएक्सपायरी तिथि: 12/2026",
        translation: "Medicine Strip | Paracetamol 500mg | Dosage: Twice daily after food | Expiry: 12/2026",
        question: "यह दवा कब लेनी चाहिए?",
        options: ["खाली पेट (Before food)", "भोजन के बाद (After food)", "सोते समय बिना पानी के", "कभी भी"],
        answerIndex: 1,
        explanation: "पट्टी पर निर्देश लिखा है कि दवा का सेवन भोजन के बाद (After Food) करना है।"
      },
      {
        instruction: "Read the doctor prescription instruction and answer",
        content: "डॉक्टर का परचा (Prescription):\nसिरप एम्ब्रोक्सोल\nमात्रा: 5ml (1 चम्मच) दिन में 3 बार\nहिलाकर पिएं (Shake well before use)",
        translation: "Prescription | Ambroxol Syrup | Dose: 5ml (1 spoon) 3 times daily | Shake well before use",
        question: "सिरप पीने से पहले क्या करना ज़रूरी है?",
        options: ["सिरप को गर्म करें", "शीशी को अच्छी तरह हिलाएं (Shake well)", "पानी मिलाएं", "फ्रीज में रखें"],
        answerIndex: 1,
        explanation: "दवा के निर्देश में स्पष्ट लिखा है कि पीने से पहले शीशी को हिलाना (Shake well) आवश्यक है।"
      },
      {
        instruction: "Read the hospital clinic timings board and answer",
        content: "ओपीडी समय सारिणी (OPD Timings):\nसुबह 09:00 बजे से दोपहर 01:00 बजे तक\nरविवार को अवकाश रहेगा।",
        translation: "OPD Timings: 09:00 AM to 01:00 PM | Sunday Closed.",
        question: "अस्पताल की ओपीडी किस दिन बंद रहती है?",
        options: ["सोमवार", "शनिवार", "रविवार", "बुधवार"],
        answerIndex: 2,
        explanation: "बोर्ड पर लिखा है कि रविवार को अस्पताल ओपीडी का अवकाश रहता है।"
      },
      {
        instruction: "Read the ointment application instruction and answer",
        content: "मलहम निर्देश:\nकेवल बाह्य उपयोग के लिए (For External Use Only)। आँखों और खुले घाव से बचाएं।",
        translation: "Ointment Instruction: For External Use Only. Keep away from eyes and open wounds.",
        question: "'केवल बाह्य उपयोग के लिए' (For External Use Only) का क्या अर्थ है?",
        options: ["इसे खाया या निगला जा सकता है", "इसे केवल त्वचा (बाहर) पर लगाना है, खाना नहीं है", "इसे पानी में घोलकर पीना है", "आँखों में डालना है"],
        answerIndex: 1,
        explanation: "बाह्य उपयोग का मतलब है कि दवा केवल शरीर की बाहरी त्वचा पर लगाने के लिए है।"
      },
      {
        instruction: "Read the medicine storage condition and answer",
        content: "भंडारण निर्देश:\nठंडी और सूखी जगह पर रखें। सीधी धूप से बचाएं। बच्चों की पहुँच से दूर रखें।",
        translation: "Storage: Keep in a cool, dry place. Protect from direct sunlight. Keep out of reach of children.",
        question: "दवा को सुरक्षित रखने के लिए कहाँ रखना चाहिए?",
        options: ["सीधी तेज धूप में", "ठंडी और सूखी जगह पर", "बच्चों के खेलने के स्थान पर", "गर्म तवे के पास"],
        answerIndex: 1,
        explanation: "दवा की गुणवत्ता बनाए रखने के लिए उसे ठंडी और सूखी जगह पर रखने की सलाह दी गई है।"
      }
    ],

    intermediate: [
      {
        instruction: "Read the lab blood test report and answer",
        content: "लैब रिपोर्ट: उपवास रक्त शर्करा (Fasting Blood Sugar)\nपरिणाम: 145 mg/dL\nसामान्य सीमा (Normal Range): 70 - 99 mg/dL\nटिप्पणी: उच्च (High Sugar Level)",
        translation: "Lab Report: Fasting Blood Sugar | Result: 145 mg/dL | Normal Range: 70-99 mg/dL | Remark: High Sugar Level",
        question: "रक्त परीक्षण के परिणाम के अनुसार शुगर का स्तर कैसा है?",
        options: ["सामान्य से कम (Low)", "सामान्य सीमा में (Normal)", "सामान्य से अधिक (High)", "शून्य"],
        answerIndex: 2,
        explanation: "सामान्य सीमा 70-99 है, जबकि परिणाम 145 आया है जो सामान्य से अधिक (High) है।"
      },
      {
        instruction: "Read the medicine allergy warning box and answer",
        content: "चेतावनी सावधानियां:\nयदि आपको पेनिसिलिन (Penicillin) से एलर्जी है, तो इस दवा का सेवन न करें। चकत्ते या सांस फूलने पर तुरंत डॉक्टर से मिलें।",
        translation: "Warning: Do not take if allergic to Penicillin. Consult doctor if rash or breathlessness occurs.",
        question: "दवा लेने के बाद त्वचा पर चकत्ते (Rash) या सांस फूलने पर क्या करना चाहिए?",
        options: ["दवा की खुराक दोगुनी कर दें", "तुरंत डॉक्टर से संपर्क करें", "सो जाएं", "व्यायाम करें"],
        answerIndex: 1,
        explanation: "एलर्जी के लक्षण दिखाई देने पर तुरंत डॉक्टर से परामर्श लेने का निर्देश दिया गया है।"
      },
      {
        instruction: "Read the Pulse Oximeter reading instruction and answer",
        content: "ऑक्सीमीटर रीडिंग गाइड:\nSpO2 (ऑक्सीजन स्तर): 96%\nपल्स रेट: 72 bpm\nनोट: SpO2 स्तर 94% से कम होने पर डॉक्टर की सलाह लें।",
        translation: "Oximeter Guide | SpO2: 96% | Pulse Rate: 72 bpm | Note: Consult doctor if SpO2 falls below 94%.",
        question: "ऑक्सीजन स्तर (SpO2) कितने प्रतिशत से कम होने पर डॉक्टर से संपर्क करना आवश्यक है?",
        options: ["99%", "98%", "94%", "90%"],
        answerIndex: 2,
        explanation: "गाइडलाइंस के अनुसार यदि ऑक्सीजन स्तर 94% से नीचे गिरता है, तो चिकित्सकीय सलाह अनिवार्य है।"
      },
      {
        instruction: "Read the vaccination appointment slip and answer",
        content: "टीकाकरण पर्ची:\nटीका: कोवैक्सीन दूसरी खुराक\nतारीख: 18 अगस्त\nस्थान: प्राथमिक स्वास्थ्य केंद्र, वार्ड 5",
        translation: "Vaccination Slip | Vaccine: Covaxin 2nd Dose | Date: 18th August | Venue: Primary Health Centre, Ward 5",
        question: "टीकाकरण के लिए किस स्थान पर जाना होगा?",
        options: ["निजी नर्सिंग होम", "प्राथमिक स्वास्थ्य केंद्र, वार्ड 5", "जिला अदालत", "नगर निगम पार्क"],
        answerIndex: 1,
        explanation: "पर्ची पर दिए गए स्थान के अनुसार प्राथमिक स्वास्थ्य केंद्र, वार्ड 5 जाना है।"
      },
      {
        instruction: "Read the health insurance cashless claim guidelines",
        content: "कैशलेस बीमा दावा:\nअस्पताल में भर्ती होने के 24 घंटे के भीतर बीमा कंपनी के TPA डेस्क पर सूचना देना अनिवार्य है।",
        translation: "Cashless Claim: Inform insurance TPA desk within 24 hours of hospital admission.",
        question: "कैशलेस इलाज की सुविधा पाने के लिए भर्ती होने के कितने समय में सूचना देनी होगी?",
        options: ["7 दिन के भीतर", "24 घंटे के भीतर", "अस्पताल से डिस्चार्ज होने के बाद", "1 महीने बाद"],
        answerIndex: 1,
        explanation: "बीमा नियम के अनुसार अस्पताल में भर्ती होने के 24 घंटे के भीतर सूचना देना अनिवार्य है।"
      }
    ],

    advanced: [
      {
        instruction: "Read the clinical drug contraindication disclosure and answer",
        content: "दवा निषेध (Contraindications):\nयह दवा उच्च रक्तचाप (Hypertension) और गुर्दे की बीमारी से पीड़ित मरीजों के लिए वर्जित है। गर्भवती महिलाएं इसका सेवन केवल विशेषज्ञ डॉक्टर की देखरेख में करें।",
        translation: "Contraindications: Contraindicated in patients with hypertension and renal disease. Pregnant women use strictly under specialist supervision.",
        question: "किन बीमारियों के मरीजों के लिए इस दवा का सेवन पूरी तरह वर्जित (Contraindicated) है?",
        options: ["कमजोरी और सिरदर्द", "उच्च रक्तचाप (Hypertension) और गुर्दे की बीमारी", "आँखों की कम रोशनी", "त्वचा का सूखापन"],
        answerIndex: 1,
        explanation: "दवा निषेध चेतावनी में स्पष्ट उल्लेख है कि उच्च रक्तचाप और गुर्दे की बीमारी वाले मरीज इसे न लें।"
      },
      {
        instruction: "Read the diagnostic MRI scan preparation protocol",
        content: "MRI स्कैन पूर्व तैयारी:\n1. स्कैन से 4 घंटे पहले निर्जला/निराहारी (Fasting) रहें।\n2. शरीर से सभी धातु की वस्तुएं (अँगूठी, बेल्ट, चेन, पेसमेकर) हटा दें।",
        translation: "MRI Protocol | 1. Fasting 4 hours prior | 2. Remove all metallic items (rings, belt, chain, pacemaker) before entering room.",
        question: "MRI स्कैन रूम में प्रवेश करने से पहले धातु की वस्तुएं क्यों हटाई जाती हैं?",
        options: ["फैशन के लिए", "MRI मशीन में शक्तिशाली चुंबक (Magnetic field) होता है जो धातु को खींचता है", "कपड़े खराब होने से बचाने के लिए", "स्कैन की फीस कम करने के लिए"],
        answerIndex: 1,
        explanation: "MRI तकनीक में मजबूत चुंबक का उपयोग होता है, इसलिए धातु की चीजें हटाना सुरक्षा के लिए जरूरी है।"
      },
      {
        instruction: "Read the medical discharge summary instructions and answer",
        content: "अस्पताल डिस्चार्ज सारांश:\n1. एंटीबायोटिक का 5-दिवसीय कोर्स पूरा करें, भले ही लक्षण ठीक हो जाएं।\n2. 7 दिन बाद टांके कटवाने के लिए ओपीडी आएं।\n3. बुखार >101°F होने पर आपातकालीन विभाग में रिपोर्ट करें।",
        translation: "Discharge Summary | 1. Complete 5-day antibiotic course even if asymptomatic | 2. Follow-up after 7 days for suture removal | 3. Report emergency if fever >101°F.",
        question: "यदि मरीज 3 दिन में पूरी तरह ठीक महसूस करने लगे, तो एंटीबायोटिक दवा का क्या करना चाहिए?",
        options: ["दवा तुरंत बंद कर देनी चाहिए", "पूरा 5-दिवसीय कोर्स समाप्त करना चाहिए", "दवा की खुराक आधी कर देनी चाहिए", "पड़ोसी को दवा दे देनी चाहिए"],
        answerIndex: 1,
        explanation: "मेडिकल निर्देश के अनुसार एंटीबायोटिक रेजिस्टेंस से बचने के लिए पूरा 5-दिवसीय कोर्स खत्म करना आवश्यक है।"
      },
      {
        instruction: "Read the patient informed consent form for surgery and answer",
        content: "शल्य चिकित्सा सहमति पत्र (Informed Consent):\nमैं यह स्वीकार करता/करती हूँ कि मुझे सर्जरी के जोखिमों व एनास्थीसिया (Anesthesia) की जटिलताओं के बारे में समझा दिया गया है और मैं स्वेच्छा से सहमति देता/देती हूँ।",
        translation: "Informed Consent: I acknowledge that surgical risks and anesthesia complications have been explained, and I voluntarily consent.",
        question: "सहमति पत्र पर हस्ताक्षर करने से पूर्व मरीज/परिजनों को किस बात की पुष्टि करनी होती है?",
        options: ["अस्पताल के खाने के मेनू की", "सर्जरी के जोखिमों व एनास्थीसिया की जटिलताओं को समझ लेने की", "डॉक्टर की डिग्री की", "अस्पताल के कमरे के किराए की"],
        answerIndex: 1,
        explanation: "सहमति पत्र का उद्देश्य यह पुष्टि करना है कि मरीज ने सर्जरी और एनास्थीसिया के जोखिम समझ लिए हैं।"
      },
      {
        instruction: "Read the Organ Donation registry declaration and answer",
        content: "अंगदान संकल्प (Organ Donation Declaration):\nमैं मृत्यु के पश्चात अपने अंगों का दान करने की स्वेच्छापूर्वक घोषणा करता हूँ। यह संकल्प किसी भी समय परिवार की सहमति से वापस लिया जा सकता है।",
        translation: "Organ Donation Pledge: I voluntarily pledge to donate organs after brain death. This pledge can be revoked anytime with family consent.",
        question: "अंगदान संकल्प के संदर्भ में कौन सा कथन सत्य है?",
        options: ["इसे कभी बदला नहीं जा सकता", "यह एक स्वेच्छिक संकल्प है जिसे आवश्यकता पड़ने पर वापस लिया जा सकता है", "इसके लिए पैसे मिलते हैं", "यह केवल जीवित रहते हुए अंगों के लिए है"],
        answerIndex: 1,
        explanation: "संकल्प पत्र में लिखा है कि यह एक स्वेच्छिक घोषणा है जिसे किसी भी समय बदला या वापस लिया जा सकता है।"
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 4. MARKET & SHOPPING (unit=market)
  // ═════════════════════════════════════════════════════════════════════════
  market: {
    beginner: [
      {
        instruction: "Read the price tag and answer",
        content: "मूल्य टैग (Price Tag):\nएमआरपी (MRP): ₹250\nछूट (Discount): ₹50\nबिक्री मूल्य (Sale Price): ₹200",
        translation: "Price Tag | MRP: ₹250 | Discount: ₹50 | Sale Price: ₹200",
        question: "छूट के बाद आपको यह सामान कितने में मिलेगा?",
        options: ["₹250", "₹200", "₹50", "₹300"],
        answerIndex: 1,
        explanation: "₹250 में से ₹50 छूट घटाने पर बिक्री मूल्य ₹200 है।"
      },
      {
        instruction: "Read the buy-one-get-one banner and answer",
        content: "ऑफ़र बैनर:\n1 खरीदें, 1 मुफ़्त पाएं! (Buy 1 Get 1 Free)",
        translation: "Offer Banner: Buy 1 Get 1 Free!",
        question: "यदि आप 2 टी-शर्ट खरीदते हैं, तो आपको कितनी टी-शर्ट का पैसा देना होगा?",
        options: ["2 टी-शर्ट का", "1 टी-शर्ट का", "3 टी-शर्ट का", "जीरो"],
        answerIndex: 1,
        explanation: "Buy 1 Get 1 Free ऑफ़र के तहत 2 वस्तुओं के लिए केवल 1 वस्तु की कीमत देनी होती है।"
      },
      {
        instruction: "Read the grocery receipt items and answer",
        content: "किराना रसीद:\nचावल (5 किग्रा): ₹300\nचीनी (2 किग्रा): ₹90\nतेल (1 लीटर): ₹150\nकुल (Total): ₹540",
        translation: "Grocery Bill | Rice (5kg): ₹300 | Sugar (2kg): ₹90 | Oil (1L): ₹150 | Total: ₹540",
        question: "खरीदारी का कुल बिल कितना बना?",
        options: ["₹300", "₹540", "₹450", "₹600"],
        answerIndex: 1,
        explanation: "रसीद के अंत में कुल बिल राशि ₹540 दर्शायी गई है।"
      },
      {
        instruction: "Read the return policy on the bill and answer",
        content: "बिल शर्त:\nबिका हुआ माल 7 दिनों के भीतर रसीद के साथ बदला जा सकता है। नकद वापसी नहीं होगी।",
        translation: "Bill Policy: Goods can be exchanged within 7 days with bill. No cash refund.",
        question: "सामान बदलने के लिए बिल के साथ कितने दिनों का समय मिलता है?",
        options: ["1 दिन", "7 दिन", "30 दिन", "कोई सीमा नहीं"],
        answerIndex: 1,
        explanation: "शर्तों में साफ़ लिखा है कि सामान बदलने की समय सीमा 7 दिन है।"
      },
      {
        instruction: "Read the weight and price label and answer",
        content: "पैकेट लेबल:\nउत्पाद: देशी घी\nशुद्ध वजन (Net Weight): 1 किलोग्राम\nपैकिंग तिथि: 01/05/2026",
        translation: "Package Label | Product: Desi Ghee | Net Weight: 1 kg | Packing Date: 01/05/2026",
        question: "पैकेट के अंदर घी का शुद्ध वजन कितना है?",
        options: ["500 ग्राम", "1 किलोग्राम", "2 किलोग्राम", "250 ग्राम"],
        answerIndex: 1,
        explanation: "पैकेट पर शुद्ध वजन (Net Weight) 1 किलोग्राम लिखा है।"
      }
    ],

    intermediate: [
      {
        instruction: "Read the vegetable market price list and answer",
        content: "सब्ज़ी दर सूची:\nआलू: ₹20 / किग्रा\nप्याज: ₹35 / किग्रा\nटमाटर: ₹40 / किग्रा\nयदि आप 2 किग्रा आलू और 1 किग्रा टमाटर खरीदते हैं, तो कुल कितना होगा?",
        translation: "Vegetable Rates | Potato: ₹20/kg | Onion: ₹35/kg | Tomato: ₹40/kg",
        question: "2 किग्रा आलू और 1 किग्रा टमाटर का कुल मूल्य क्या होगा?",
        options: ["₹60", "₹80", "₹75", "₹100"],
        answerIndex: 1,
        explanation: "गणना: 2 किग्रा आलू (2 × ₹20 = ₹40) + 1 किग्रा टमाटर (₹40) = ₹80।"
      },
      {
        instruction: "Read the supermarket cash cashback offer and answer",
        content: "सुपरमार्केट ऑफ़र:\nUPI से भुगतान करने पर 10% कैशबैक (अधिकतम ₹100)। न्यूनतम खरीदारी ₹1,000 होना आवश्यक है।",
        translation: "Supermarket Offer: 10% Cashback (Max ₹100) on UPI payment. Min purchase ₹1,000 required.",
        question: "यदि आप ₹1,500 की खरीदारी करके UPI से भुगतान करते हैं, तो कितना कैशबैक मिलेगा?",
        options: ["₹150", "₹100", "₹50", "₹1,000"],
        answerIndex: 1,
        explanation: "10% के हिसाब से ₹150 बनता है, लेकिन अधिकतम कैशबैक सीमा ₹100 तय की गई है।"
      },
      {
        instruction: "Read the electronics warranty terms and answer",
        content: "वारंटी कार्ड:\nउत्पाद: मिक्सर ग्राइंडर\nवारंटी: 2 वर्ष (केवल मोटर पर)\nनोट: टूट-फूट या पानी से नुकसान होने पर वारंटी मान्य नहीं होगी।",
        translation: "Warranty Card | Product: Mixer Grinder | Warranty: 2 Years (Motor only) | Note: Physical/Water damage excluded.",
        question: "मिक्सर ग्राइंडर के किस भाग पर 2 वर्ष की वारंटी दी गई है?",
        options: ["प्लास्टिक जार पर", "केवल मोटर (Motor) पर", "ब्लेड पर", "तार पर"],
        answerIndex: 1,
        explanation: "वारंटी कार्ड में साफ़ लिखा है कि 2 वर्ष की वारंटी केवल मोटर पर लागू है।"
      },
      {
        instruction: "Read the online delivery invoice breakdown and answer",
        content: "ई-कॉमर्स इनवॉइस:\nसामान की कीमत: ₹1,200\nडिलीवरी शुल्क: ₹40\nपैकिंग शुल्क: ₹10\nकूपन डिस्काउंट: -₹150\nअंतिम भुगतान राशि की गणना करें।",
        translation: "E-Commerce Invoice | Items: ₹1,200 | Delivery: ₹40 | Packaging: ₹10 | Coupon: -₹150",
        question: "छूट के बाद कुल कितना अंतिम भुगतान किया गया?",
        options: ["₹1,250", "₹1,100", "₹1,150", "₹1,200"],
        answerIndex: 1,
        explanation: "गणना: (₹1,200 + ₹40 + ₹10) = ₹1,250 माइनस ₹150 डिस्काउंट = ₹1,100।"
      },
      {
        instruction: "Read the FSSAI food safety quality mark and answer",
        content: "खाद्य पैकेज लेबल:\nFSSAI लाइसेंस नंबर: 10019011000123\nहरा बिंदु (Green Dot): 100% शाकाहारी (Vegetarian)\nलाल बिंदु (Red Dot): मांसाहारी (Non-Vegetarian)",
        translation: "Food Label | FSSAI Lic No: 10019011000123 | Green Dot: 100% Vegetarian | Red Dot: Non-Vegetarian",
        question: "पैकेट पर हरा बिंदु (Green Dot) किसका प्रतीक है?",
        options: ["मांसाहारी भोजन", "100% शाकाहारी भोजन (Vegetarian)", "प्लास्टिक रीसायकल", "ऑर्गेनिक फल"],
        answerIndex: 1,
        explanation: "खाद्य मानकों के अनुसार हरा बिंदु 100% शाकाहारी उत्पाद का प्रतीक है।"
      }
    ],

    advanced: [
      {
        instruction: "Read the Consumer Protection Rights clause and answer",
        content: "उपभोक्ता अधिकार अधिनियम:\nयदि कोई दुकानदार एमआरपी (MRP) से अधिक कीमत वसूलता है या एक्सपायरी सामान बेचता है, तो ग्राहक राष्ट्रीय उपभोक्ता हेल्पलाइन 1915 पर निःशुल्क शिकायत दर्ज करा सकता है।",
        translation: "Consumer Rights Act: Charging above MRP or selling expired goods is illegal. File free complaint at National Consumer Helpline 1915.",
        question: "दुकानदार द्वारा MRP से अधिक मूल्य मांगने पर उपभोक्ता हेल्पलाइन नंबर क्या है?",
        options: ["100", "108", "1915", "1800"],
        answerIndex: 2,
        explanation: "उपभोक्ता अधिकारों के तहत शिकायत के लिए राष्ट्रीय हेल्पलाइन नंबर 1915 है।"
      },
      {
        instruction: "Read the GST tax invoice breakup and answer",
        content: "GST टैक्स इनवॉइस:\nमूल्य (Base Price): ₹10,000\nCGST (9%): ₹900\nSGST (9%): ₹900\nकुल देय राशि (Total Invoice Value): ₹11,800",
        translation: "GST Invoice | Base Price: ₹10,000 | CGST (9%): ₹900 | SGST (9%): ₹900 | Total Invoice Value: ₹11,800",
        question: "इस बिल में कुल कितने प्रतिशत टैक्स (GST) जोड़ा गया है?",
        options: ["9%", "18% (9% CGST + 9% SGST)", "12%", "5%"],
        answerIndex: 1,
        explanation: "कुल GST दर = 9% CGST + 9% SGST = 18% (कुल ₹1,800 टैक्स)।"
      },
      {
        instruction: "Read the commercial lease agreement clause for a shop and answer",
        content: "दुकान लीज अनुबंध:\nमासिक किराया: ₹25,000\nसिक्योरिटी डिपॉजिट: 3 महीने का किराया (₹75,000)\nवार्षिक वृद्धि: प्रत्येक वर्ष किराए में 5% की वृद्धि होगी।",
        translation: "Lease Agreement | Monthly Rent: ₹25,000 | Security Deposit: 3 Months (₹75,000) | Escalation: 5% annual increase.",
        question: "1 वर्ष पूरा होने के बाद दूसरे वर्ष दुकान का मासिक किराया कितना होगा?",
        options: ["₹25,000", "₹26,250", "₹27,500", "₹30,000"],
        answerIndex: 1,
        explanation: "गणना: ₹25,000 का 5% = ₹1,250; नया किराया = ₹25,000 + ₹1,250 = ₹26,250।"
      },
      {
        instruction: "Read the franchise agreement royalty fee clause and answer",
        content: "फ्रेंचाइजी अनुबंध:\nफ्रेंचाइजी को अपनी कुल मासिक बिक्री (Gross Sales) का 4% रॉयल्टी शुल्क के रूप में कंपनी को देना होगा। न्यूनतम रॉयल्टी ₹10,000 प्रति माह तय है।",
        translation: "Franchise Agreement: Franchisee must pay 4% royalty of Gross Sales to parent company. Minimum royalty ₹10,000/month.",
        question: "यदि किसी महीने बिक्री ₹2,00000 हुई, तो रॉयल्टी शुल्क कितना होगा?",
        options: ["₹8,000", "₹10,000 (क्योंकि न्यूनतम सीमा ₹10,000 है)", "₹20,000", "₹4,000"],
        answerIndex: 1,
        explanation: "₹2,00,000 का 4% = ₹8,000 होता है, परन्तु न्यूनतम रॉयल्टी शर्त ₹10,000 है।"
      },
      {
        instruction: "Read the import duty and customs clearance policy and answer",
        content: "कस्टम्स आयात नियम:\nविदेश से व्यक्तिगत उपयोग के लिए मंगाए गए ₹50,000 से अधिक के इलेक्ट्रॉनिक्स सामान पर 35% कस्टम ड्यूटी और 28% GST लागू होगा।",
        translation: "Customs Import Rule: Personal electronics imported from abroad above ₹50,000 attract 35% Customs Duty + 28% GST.",
        question: "विदेश से मंगाए गए किस मूल्य के इलेक्ट्रॉनिक्स सामान पर कस्टम ड्यूटी लागू होगी?",
        options: ["₹10,000 से अधिक", "₹50,000 से अधिक", "किसी भी मूल्य पर नहीं", "₹5,000 से अधिक"],
        answerIndex: 1,
        explanation: "नियम में स्पष्ट लिखा है कि ₹50,000 से अधिक मूल्य के सामान पर आयात शुल्क लगेगा।"
      }
    ]
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 5. UTILITIES & BILLS (unit=bills)
  // ═════════════════════════════════════════════════════════════════════════
  bills: {
    beginner: [
      {
        instruction: "Read the electricity bill and answer",
        content: "बिजली बिल (Electricity Bill):\nउपभोक्ता: विजय शर्मा\nकुल खपत (Units): 140 यूनिट\nकुल देय राशि: ₹840\nअंतिम तिथि: 20 जून",
        translation: "Electricity Bill | Consumer: Vijay Sharma | Units: 140 | Total Due: ₹840 | Due Date: June 20",
        question: "बिल का समय पर भुगतान करने की अंतिम तिथि (Due Date) क्या है?",
        options: ["10 जून", "20 जून", "30 जून", "5 जुलाई"],
        answerIndex: 1,
        explanation: "बिजली बिल में भुगतान की अंतिम तिथि 20 जून अंकित है।"
      },
      {
        instruction: "Read the mobile recharge confirmation SMS and answer",
        content: "रीचार्ज पुष्टि:\n₹299 का रीचार्ज सफल रहा!\nवैधता (Validity): 28 दिन\nडेटा: 1.5 GB प्रति दिन",
        translation: "Recharge Successful! Plan: ₹299 | Validity: 28 Days | Data: 1.5 GB/day",
        question: "इस रीचार्ज की समय सीमा (Validity) कितने दिनों की है?",
        options: ["14 दिन", "28 दिन", "56 दिन", "84 दिन"],
        answerIndex: 1,
        explanation: "मैसेज में स्पष्ट लिखा है कि रीचार्ज प्लान की वैधता 28 दिन है।"
      },
      {
        instruction: "Read the LPG gas cylinder booking slip and answer",
        content: "गैस बुकिंग रसीद:\nउपभोक्ता संख्या: 609214\nसिलेंडर की कीमत: ₹803\nसब्सिडी राशि: ₹200 (बैंक खाते में आएगी)",
        translation: "Gas Booking Receipt | Consumer No: 609214 | Cylinder Price: ₹803 | Subsidy: ₹200 (Credited to bank)",
        question: "सिलेंडर लेते समय डिलीवरी बॉय को कुल कितना नकद देना होगा?",
        options: ["₹603", "₹803", "₹200", "₹1,003"],
        answerIndex: 1,
        explanation: "सिलेंडर का कुल मूल्य ₹803 है; सब्सिडी ₹200 बाद में बैंक खाते में वापस आएगी।"
      },
      {
        instruction: "Read the water bill notice and answer",
        content: "जल बिल:\nबिल अवधि: अप्रैल - मई\nदेय राशि: ₹320\nअंतिम तिथि के बाद देर शुल्क: ₹50",
        translation: "Water Bill | Period: April - May | Amount Due: ₹320 | Late Fee: ₹50 after due date.",
        question: "अंतिम तिथि के बाद भुगतान करने पर कितना विलंब शुल्क (Late Fee) लगेगा?",
        options: ["₹10", "₹50", "₹100", "₹320"],
        answerIndex: 1,
        explanation: "बिल पर स्पष्ट लिखा है कि देर से भुगतान करने पर ₹50 अतिरिक्त शुल्क लगेगा।"
      },
      {
        instruction: "Read the DTH TV recharge message and answer",
        content: "DTH टीवी अलर्ट:\nआपका DTH कनेक्शन 15 जुलाई को समाप्त हो रहा है। निरंतर सेवा के लिए ₹350 का रीचार्ज करें।",
        translation: "DTH Alert: Your connection expires on July 15. Recharge ₹350 for uninterrupted service.",
        question: "सेवा बंद होने से पहले रीचार्ज की राशि कितनी है?",
        options: ["₹150", "₹350", "₹500", "₹200"],
        answerIndex: 1,
        explanation: "अलर्ट मैसेज के अनुसार रीचार्ज राशि ₹350 है।"
      }
    ],

    intermediate: [
      {
        instruction: "Read the electricity bill slab calculation and answer",
        content: "बिजली दर स्लैब:\n0-100 यूनिट: निःशुल्क\n101-200 यूनिट: ₹4.50 प्रति यूनिट\nयदि आपकी खपत 160 यूनिट है, तो देय राशि की गणना करें।",
        translation: "Electricity Slab: 0-100 Units: Free | 101-200 Units: ₹4.50/unit. Calculate bill for 160 units.",
        question: "160 यूनिट खपत होने पर कुल कितना बिजली बिल बनेगा?",
        options: ["₹720", "₹270 (60 यूनिट × ₹4.50)", "₹450", "₹0"],
        answerIndex: 1,
        explanation: "प्रथम 100 यूनिट फ्री हैं। शेष 60 यूनिट पर ₹4.50 की दर से: 60 × ₹4.50 = ₹270।"
      },
      {
        instruction: "Read the Broadband Fiber Bill statement and answer",
        content: "ब्रॉडबैंड बिल:\nप्लांस शुल्क (100 Mbps): ₹799\nGST (18%): ₹143.82\nकुल देय राशि: ₹942.82\nदेय तिथि: 10 तारीख",
        translation: "Broadband Bill | Plan (100 Mbps): ₹799 | GST (18%): ₹143.82 | Total Due: ₹942.82 | Due Date: 10th",
        question: "मूल प्लान की कीमत पर कितना प्रतिशत GST टैक्स जोड़ा गया है?",
        options: ["5%", "12%", "18%", "28%"],
        answerIndex: 2,
        explanation: "बिल में स्पष्ट लिखा है कि मूल प्लान ₹799 पर 18% GST टैक्स जोड़ा गया है।"
      },
      {
        instruction: "Read the PNG Piped Gas meter reading slip and answer",
        content: "पीएनजी पाइप गैस बिल:\nपिछली रीडिंग: 1450\nवर्तमान रीडिंग: 1485\nकुल खपत: 35 SCM\nदर: ₹48 / SCM\nकुल राशि: ₹1,680",
        translation: "PNG Gas Bill | Previous Reading: 1450 | Present Reading: 1485 | Consumption: 35 SCM | Rate: ₹48/SCM",
        question: "इस बिल चक्र में कुल कितनी गैस (SCM) की खपत हुई?",
        options: ["1485 SCM", "35 SCM", "48 SCM", "1450 SCM"],
        answerIndex: 1,
        explanation: "वर्तमान (1485) माइनस पिछली (1450) रीडिंग = 35 SCM कुल खपत हुई।"
      },
      {
        instruction: "Read the property tax bill receipt and answer",
        content: "संपत्ति कर (Property Tax):\nवार्षिक कर: ₹3,600\nयदि 30 जून से पहले भुगतान किया जाए तो 10% की छूट मिलेगी।",
        translation: "Property Tax | Annual Tax: ₹3,600 | 10% rebate if paid before June 30.",
        question: "30 जून से पहले भुगतान करने पर कितनी छूट (Rebate) मिलेगी?",
        options: ["₹360", "₹100", "₹500", "₹3,600"],
        answerIndex: 0,
        explanation: "₹3,600 का 10% = ₹360 की छूट प्राप्त होगी।"
      },
      {
        instruction: "Read the municipal garbage collection fee receipt and answer",
        content: "डोर-टू-डोर कचरा शुल्क:\nमासिक शुल्क: ₹100\nयदि 1 वर्ष का शुल्क एक साथ जमा किया जाए, तो 2 महीने का शुल्क माफ रहेगा।",
        translation: "Garbage Fee | Monthly: ₹100 | Annual lump sum: 2 months fee waived.",
        question: "वार्षिक एकमुश्त भुगतान करने पर 1 वर्ष के लिए कुल कितना देना होगा?",
        options: ["₹1,200", "₹1,000 (10 महीने का शुल्क)", "₹800", "₹500"],
        answerIndex: 1,
        explanation: "12 महीने में से 2 महीने का ₹200 माफ़ होने पर कुल ₹1,000 देना होगा।"
      }
    ],

    advanced: [
      {
        instruction: "Read the solar net-metering electricity bill and answer",
        content: "सोलर नेट-मीटरींग बिल:\nग्रिड से ली गई बिजली (Import): 450 यूनिट\nसोलर द्वारा ग्रिड को दी गई (Export): 320 यूनिट\nशुद्ध देय यूनिट (Net Billed Units): 130 यूनिट\nदर: ₹7 / यूनिट",
        translation: "Solar Net Metering | Import: 450 Units | Export: 320 Units | Net Billed Units: 130 Units | Rate: ₹7/Unit",
        question: "सोलर जनरेशन के बाद उपभोक्ता को कितनी यूनिट बिजली का भुगतान करना होगा?",
        options: ["450 यूनिट", "320 यूनिट", "130 यूनिट (450 - 320)", "770 यूनिट"],
        answerIndex: 2,
        explanation: "नेट मीटरींग नियम: आयातित (450) माइनस निर्यातित (320) = केवल 130 यूनिट का बिल बनेगा।"
      },
      {
        instruction: "Read the commercial electricity power factor penalty notice",
        content: "व्यावसायिक बिजली बिल सूचना:\nआपका पॉवर फैक्टर (Power Factor) 0.82 है जो 0.90 के मानक से कम है।\nकम पॉवर फैक्टर के कारण बिल पर 5% का अर्थदंड (Penalty) लगाया गया है।",
        translation: "Commercial Electricity Notice: Power Factor is 0.82 (below standard 0.90). 5% penalty applied on total bill.",
        question: "बिजली बिल में 5% पेनल्टी लगने का क्या कारण था?",
        options: ["मीटर खराब होना", "पॉवर फैक्टर मानक (0.90) से कम होना", "देर से बिल देना", "अत्यधिक खपत करना"],
        answerIndex: 1,
        explanation: "सूचना में स्पष्ट है कि पॉवर फैक्टर 0.90 से कम होकर 0.82 रहने पर पेनल्टी लगी।"
      },
      {
        instruction: "Read the housing society maintenance dispute resolution clause",
        content: "सोसाइटी मेंटेनेंस नियम:\nमासिक मेंटेनेंस ₹4,000।\nयदि लिफ्ट या जनरेटर 48 घंटे से अधिक बंद रहता है, तो निवासी उस अवधि का 25% मेंटेनेंस शुल्क रोक सकते हैं।",
        translation: "Society Maintenance: ₹4,000/mo. If lift/generator down for >48h, residents can withhold 25% maintenance fee.",
        question: "सोसाइटी के निवासी कब 25% मेंटेनेंस शुल्क रोकने के विधिक रूप से हकदार हैं?",
        options: ["जब गार्ड ना मिले", "जब लिफ्ट या जनरेटर 48 घंटे से अधिक समय तक खराब रहे", "कभी नहीं", "हर महीने"],
        answerIndex: 1,
        explanation: "नियम के अनुसार 48 घंटे से अधिक लिफ्ट या जनरेटर बाधित रहने पर निवासी 25% शुल्क रोक सकते हैं।"
      },
      {
        instruction: "Read the fastag automatic toll deduction dispute process",
        content: "FASTag टोल शिकायत नियम:\nयदि गलत टोल डिडक्शन हुआ है, तो 45 दिनों के भीतर NETC पोर्टल पर विवाद दर्ज करें। जांच के बाद 7 कार्य दिवसों में रिफंड मिल जाएगा।",
        translation: "FASTag Dispute: Raise dispute on NETC portal within 45 days for wrong deduction. Refund in 7 working days post verification.",
        question: "गलत टोल कटने पर शिकायत दर्ज करने की अधिकतम समय सीमा क्या है?",
        options: ["7 दिन", "15 दिन", "45 दिन", "90 दिन"],
        answerIndex: 2,
        explanation: "नियम में लिखा है कि गलत कटौती की शिकायत 45 दिनों के भीतर दर्ज की जानी चाहिए।"
      },
      {
        instruction: "Read the commercial water effluent discharge charge notice",
        content: "औद्योगिक जल उपयोग बिल:\nजल खपत: 500 KL\nईफ्लुएंट ट्रीटमेंट प्लांट (ETP) सरचार्ज: ₹15 / KL\nपर्यावरण क्षतिपूर्ति शुल्क: ₹2,500",
        translation: "Industrial Water Bill | Consumption: 500 KL | ETP Surcharge: ₹15/KL | Environmental Compensation Fee: ₹2,500",
        question: "500 KL पानी की खपत पर कुल ETP सरचार्ज कितना लगेगा?",
        options: ["₹2,500", "₹7,500 (500 × ₹15)", "₹5,000", "₹15,000"],
        answerIndex: 1,
        explanation: "गणना: 500 KL × ₹15 प्रति KL = ₹7,500 ETP सरचार्ज।"
      }
    ]
  }

};

/**
 * Fallback helper if a specific unit key is requested but missing
 */
function getPracticalLifeSkillFallback(unit, level) {
  const fallbackUnit = LIFE_SKILLS_CONTENT[unit] || LIFE_SKILLS_CONTENT['banking'];
  return fallbackUnit[level] || fallbackUnit['beginner'] || [];
}
