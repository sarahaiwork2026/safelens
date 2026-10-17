import type { IncidentType, ClaimKey, Severity, Family } from "./schema";
export const TYPE_RULES: [IncidentType, string[]][] = [
  ["firing",     ["firing", "gunshot", "gun shot", "shots fired", "shot fired", "goli", "fire kiye", "fire kiya", "fire kar", "فائرنگ", "گولی"]],
  ["kidnapping", ["kidnap", "abduct", "aghwa", "agwa", "اغوا"]],
  ["robbery",    ["robber", "robbed", "dacoit", "loot", "daketi", "dakaiti", "dakait", "ڈکیتی", "ڈاکو", "لوٹ"]],
  ["fire",       ["=fire", "blaze", "=aag", "dhuan", "dhuwan", "jal raha", "jal rahi", "jal gaya", "jal gayi", "=آگ", "دھواں"]],
  ["assault",    ["assault", "attack", "beaten", "=beat", "=fight", "=fighting", "maar peet", "marpeet", "maarpeet", "ladai", "larai", "jhagra", "jhagda", "مار پیٹ", "لڑائی", "جھگڑا"]],
  ["snatching",  ["snatch", "cheen", "chheen", "chhin", "chhina", "jhapat", "چھین"]],
  ["theft",      ["theft", "thief", "stole", "steal", "broke into", "burglar", "chori", "chura", "چوری"]],
  ["accident",   ["accident", "crash", "collision", "hadsa", "haadsa", "ulat", "takkar", "takar", "حادثہ", "ٹکر"]],
  ["harassment", ["harass", "eve teas", "pareshan kar", "tang kar", "chhed", "ہراس", "تنگ کر", "چھیڑ"]],
  ["hazard",     ["gas leak", "leak", "=gas", "=wire", "=wires", "flood", "short circuit", "manhole", "=gutter", "=taar", "current lag", "گیس", "=تار", "کرنٹ", "گٹر", "سیلاب"]],
  ["suspicious", ["suspicious", "strange", "unattended", "circling", "loiter", "mashkook", "lawaris", "ajeeb", "مشکوک", "لاوارث", "عجیب"]],
];
export const CLAIM_NEG: Partial<Record<ClaimKey, string[]>> = {
  no_weapon: ["=unarmed", "no weapon", "without weapon", "bina asla", "bina hathiyar", "بغیر اسلحہ", "بغیر ہتھیار"],
  no_injury: ["no injur", "no one hurt", "no one was hurt", "nobody hurt", "nobody was hurt", "no one injured", "nobody injured", "=unhurt", "koi zakhmi nahi", "koi zakhmi nahin", "کوئی زخمی نہیں"],
};
export const CLAIM_POS: Partial<Record<ClaimKey, string[]>> = {
  weapon: ["=gun", "=guns", "=pistol", "=pistols", "=knife", "=knives", "=armed", "=weapon", "=weapons", "=lathi", "=danda", "=asla", "=chaku", "=chhuri", "=bandook", "=tamancha", "پستول", "اسلحہ", "ہتھیار", "بندوق", "چاقو"],
  injury: ["injur", "=hurt", "wound", "bleed", "=killed", "=dead", "zakhmi", "zakhmee", "khoon", "ghayal", "jaan bahaq", "زخمی", "جاں بحق", "ہلاک", "خون"],
  ongoing: ["=still", "ongoing", "happening now", "abhi bhi", "ab bhi", "abhi tak", "=jari", "جاری", "ہو رہی", "ہو رہا", "اب بھی"],
  resolved: ["under control", "control mein", "resolved", "khatam", "chale gaye", "=fled", "=saved", "=rescued", "bach gaya", "bach gayi", "ختم", "قابو پا", "بچ گیا", "بچ گئی"],
  motorbike: ["=bike", "=bikes", "motorbike", "motorcycle", "motor cycle", "موٹر سائیکل", "بائیک"],
};
export const MULTI_NUM = ["2", "3", "4", "5", "two", "three", "four", "five", "do", "teen", "char", "chaar", "paanch", "دو", "تین", "چار", "پانچ"];
export const MULTI_NOUN = ["men", "people", "persons", "log", "guys", "boys", "youths", "armed", "bike", "bikes", "suspects", "larke", "larkay", "larkon", "admi", "aadmi", "afraad", "bande", "banday", "لوگ", "لڑکے", "آدمی", "افراد"];
export const MULTI_WORD = ["=group", "گروہ"];
export const MINOR = ["minor", "small", "=chota", "=choti", "=chhota", "=chhoti", "halka", "halki", "معمولی", "چھوٹی", "چھوٹا", "چھوٹے"];
export const BASE_SEV: Record<IncidentType, Severity> = { suspicious: 1, harassment: 2, theft: 2, snatching: 2, accident: 2, hazard: 2, robbery: 3, assault: 3, firing: 3, kidnapping: 3, fire: 3, unclear: 2 };
export const FAMILY: Record<Exclude<IncidentType, "unclear">, [Family, number]> = { suspicious: ["property", 1], theft: ["property", 2], snatching: ["property", 2], robbery: ["property", 3], harassment: ["violence", 1], assault: ["violence", 2], firing: ["violence", 3], kidnapping: ["violence", 3], fire: ["fire", 1], accident: ["accident", 1], hazard: ["hazard", 1] };
export const RU_MARKERS = new Set("hai hain mein ne ki ko se pe par abhi aur ka ke wala wale log nahi nahin tha thi gaya gayi raha rahe rahi kar ho hua hui bohat madad chahiye kuch ek teen kya koi aaj bhi yeh woh hum mujhe".split(" "));
export const EN_FUNC = new Set("the and near at is in of was with on for".split(" "));
export const ACCUSATION = ["is a thief", "is the thief", "is a robber", "is a criminal", "is a terrorist", "are thieves", "are criminals", "chor hai", "chor tha", "chor hain", "dakait hai", "daku hai", "criminal hai", "dehshatgard", "چور ہے", "چور تھا", "ڈاکو ہے", "دہشت گرد ہے"];

