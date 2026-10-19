// Reviewed response language is selected by the model; all factual cards come from D1.
export const CHAT_COPY = {
  English: {
    found:
      'Here are the matching reports in SafeLens. Community reports are unverified; demo incidents are simulated and are not current emergency information.',
    empty:
      'No matching reports are available in SafeLens. This does not mean the area or route is safe. Check current official updates before travelling.',
    ask: 'Which Karachi area or route do you mean? Include a starting area and destination for a route check.',
    guidance:
      'Move to a safer place if you can. Use the steps below and contact official emergency services when needed.',
    offtopic:
      'I can help with Karachi incident updates, travel concerns and practical safety guidance. Tell me the area or what is happening.',
    general:
      'Keep a safe distance from the incident. Do not confront anyone or investigate a dangerous scene.',
    travel:
      'Check current official updates, tell someone you trust your plans, and choose well-lit, busy places where possible.',
    road: 'Slow down, leave space and avoid damaged or blocked roads. Do not stop in moving traffic to inspect an incident.',
    fire: 'Leave the building using a safe exit, avoid lifts, stay low in smoke and do not go back inside.',
    gas: 'Leave the affected area. Do not light a flame or operate electrical switches. Call for help from outside.',
    violence:
      'Move away from the threat toward a staffed or busy place if safe. Do not confront anyone; contact police when you can.',
    medical:
      'Move only if there is immediate danger. Request medical help. For heavy bleeding, apply firm pressure with clean cloth if you can do so safely.',
  },
  Urdu: {
    found:
      'سیف لینس میں متعلقہ اطلاعات یہ ہیں۔ عوامی رپورٹس غیر مصدقہ ہیں۔ ڈیمو واقعات فرضی ہیں، موجودہ ہنگامی معلومات نہیں۔',
    empty:
      'سیف لینس میں متعلقہ رپورٹ دستیاب نہیں۔ اس کا مطلب یہ نہیں کہ علاقہ یا راستہ محفوظ ہے۔ سفر سے پہلے تازہ سرکاری معلومات دیکھیں۔',
    ask: 'کراچی کا کون سا علاقہ یا راستہ؟ راستے کے لیے روانگی کا علاقہ اور منزل بتائیں۔',
    guidance:
      'اگر ممکن ہو تو محفوظ جگہ کی طرف جائیں۔ نیچے دی گئی ہدایات پر عمل کریں اور ضرورت ہو تو سرکاری ہنگامی خدمات سے رابطہ کریں۔',
    offtopic:
      'میں کراچی کے واقعات، سفر سے متعلق خدشات اور حفاظتی رہنمائی میں مدد کر سکتا ہوں۔ علاقہ یا صورتحال بتائیں۔',
    general:
      'واقعے سے مناسب فاصلہ رکھیں۔ کسی سے مقابلہ نہ کریں اور خطرناک جگہ کی تفتیش خود نہ کریں۔',
    travel:
      'تازہ سرکاری معلومات دیکھیں، کسی قابل اعتماد شخص کو اپنے سفر کا بتائیں اور روشن، مصروف جگہوں کو ترجیح دیں۔',
    road: 'رفتار کم کریں، فاصلہ رکھیں اور بند یا خراب سڑک سے بچیں۔ چلتی ٹریفک میں واقعہ دیکھنے کے لیے نہ رکیں۔',
    fire: 'محفوظ راستے سے عمارت سے نکلیں، لفٹ استعمال نہ کریں، دھوئیں میں نیچے رہیں اور واپس اندر نہ جائیں۔',
    gas: 'متاثرہ جگہ سے نکل جائیں۔ آگ نہ جلائیں اور بجلی کے سوئچ استعمال نہ کریں۔ باہر جا کر مدد طلب کریں۔',
    violence:
      'اگر محفوظ ہو تو خطرے سے دور کسی مصروف جگہ یا عملے والی عمارت میں جائیں۔ مقابلہ نہ کریں اور ممکن ہو تو پولیس سے رابطہ کریں۔',
    medical:
      'صرف فوری خطرے کی صورت میں جگہ بدلیں۔ طبی مدد طلب کریں۔ زیادہ خون بہنے پر، اگر محفوظ ہو، صاف کپڑے سے مسلسل دباؤ دیں۔',
  },
  'Roman Urdu': {
    found:
      'SafeLens mein mutaliqa reports yeh hain. Awami reports ghair tasdeeq shuda hain. Demo waqiat farzi hain, mojooda emergency ki maloomat nahi.',
    empty:
      'SafeLens mein mutaliqa report mojood nahi. Is ka matlab yeh nahi ke ilaqa ya rasta mehfooz hai. Safar se pehle taza sarkari updates dekhein.',
    ask: 'Karachi ka kaunsa ilaqa ya rasta? Raste ke liye shuru ka ilaqa aur manzil batayein.',
    guidance:
      'Agar mumkin ho to mehfooz jagah ki taraf jayein. Neeche di gayi hidayat par amal karein aur zaroorat par emergency services se rabta karein.',
    offtopic:
      'Main Karachi ke waqiat, safar ke khadshat aur hifazati rehnumai mein madad kar sakta hoon. Ilaqay ya surat-e-haal ke bare mein batayein.',
    general:
      'Waqay se munasib fasla rakhein. Kisi ka muqabla na karein aur khatarnak jagah ki tehqeeq khud na karein.',
    travel:
      'Taza sarkari updates dekhein, kisi bharosemand shakhs ko safar ka batayein aur roshan, masroof jaghon ko tarjeeh dein.',
    road: 'Raftar kam karein, fasla rakhein aur band ya kharab sarak se bachein. Chalti traffic mein waqia dekhne ke liye na rukein.',
    fire: 'Mehfooz raste se imarat se niklein, lift istemal na karein, dhuein mein neeche rahein aur wapas andar na jayein.',
    gas: 'Mutasira jagah se nikal jayein. Aag na jalayein aur bijli ke switch istemal na karein. Bahar ja kar madad bulayein.',
    violence:
      'Agar mehfooz ho to khatre se door kisi masroof ya staff wali jagah jayein. Muqabla na karein aur mumkin ho to police se rabta karein.',
    medical:
      'Sirf foran khatre ki surat mein jagah badlein. Tibbi madad bulayein. Zyada khoon behne par saaf kapre se dabao dein agar aap mehfooz tareeqe se kar sakein.',
  },
};
