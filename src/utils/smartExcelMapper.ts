export interface SmartColumnMapping {
  nameCol?: string;
  phoneCol?: string;
  emailCol?: string;
  addressCol?: string;
  priorityCol?: string;
  statusCol?: string;
  sourceCol?: string;
  projectNameCol?: string;
  notesCol?: string;
  followUpDateCol?: string;
  assignedUserCol?: string;
}

// Arabic & English patterns for detecting column types
const PATTERNS = {
  name: [
    /^(اسم|الاسم|اسم العميل|العميل|اسماء|اسم_العميل|الاسم بالكامل|client.?name|customer.?name|full.?name|name)$/i,
    /(اسم|عميل|name|client|customer)/i,
  ],
  phone: [
    /^(رقم الهاتف|الهاتف|التليفون|الموبايل|رقم الموبايل|رقم الجوال|الجوال|تليفون|موبايل|phone|mobile|telephone|tel|phone.?number|contact)$/i,
    /(هاتف|تليفون|موبايل|جوال|phone|mobile|tel)/i,
  ],
  email: [
    /^(البريد|الايميل|البريد الالكتروني|البريد الإلكتروني|email|e-mail|mail)$/i,
    /(ايميل|بريد|email|mail)/i,
  ],
  address: [
    /^(العنوان|المحافظة|المدينة|المنطقة|السكن|address|city|location|governorate)$/i,
    /(عنوان|مدينة|منطقة|address|location)/i,
  ],
  priority: [
    /^(الأولوية|الاولوية|درجة الأهمية|الاهتمام|priority|importance)$/i,
    /(أولوية|اولوية|priority)/i,
  ],
  status: [
    /^(الحالة|حالة الاتصال|حالة العميل|النتيجة|status|call.?status|stage)$/i,
    /(حالة|status|stage)/i,
  ],
  source: [
    /^(المصدر|مصدر العميل|مصدر الداتا|الجهة|source|lead.?source|campaign)$/i,
    /(مصدر|source|campaign)/i,
  ],
  projectName: [
    /^(المشروع|اسم المشروع|الكمبوند|العقار|project|project.?name|property|compound)$/i,
    /(مشروع|كمبوند|project|property)/i,
  ],
  notes: [
    /^(الملاحظات|ملاحظات|التعليق|تفاصيل|الوصف|notes|comment|comments|description|details)$/i,
    /(ملاحظ|تعليق|وصف|تفاصيل|note|comment|desc)/i,
  ],
  followUpDate: [
    /^(تاريخ المتابعة|ميعاد المتابعة|الفولو اب|المتابعة|follow.?up|followup.?date|next.?call)$/i,
    /(متابعة|فولو|follow)/i,
  ],
  assignedUser: [
    /^(الموظف|مسؤول المبيعات|المسؤول|المعين له|assigned|agent|sales.?rep|owner)$/i,
    /(موظف|سيلز|مندوب|assigned|agent|rep)/i,
  ],
};

// Check cell values to infer type if header names are ambiguous
export function detectValueType(sampleValues: string[]): 'phone' | 'email' | 'name' | 'unknown' {
  const cleanSamples = sampleValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  if (cleanSamples.length === 0) return 'unknown';

  let phoneScore = 0;
  let emailScore = 0;
  let nameScore = 0;

  cleanSamples.forEach(sample => {
    const val = String(sample).trim();
    // Egyptian / international phone check (digits, starts with 01 or +20 or 20 or 9 digits)
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length >= 8 && digitsOnly.length <= 15 && (digitsOnly.startsWith('01') || digitsOnly.startsWith('201') || digitsOnly.startsWith('966') || digitsOnly.startsWith('971') || digitsOnly.length === 11)) {
      phoneScore++;
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      emailScore++;
    } else if (val.split(' ').length >= 2 && !/\d/.test(val) && val.length > 4) {
      nameScore++;
    }
  });

  if (phoneScore >= cleanSamples.length * 0.4) return 'phone';
  if (emailScore >= cleanSamples.length * 0.4) return 'email';
  if (nameScore >= cleanSamples.length * 0.4) return 'name';

  return 'unknown';
}

export function autoDetectColumnMapping(headers: string[], sampleRows: Record<string, any>[] = []): SmartColumnMapping {
  const mapping: SmartColumnMapping = {};
  const usedHeaders = new Set<string>();

  // Pass 1: Exact / Regex match on Header Names
  const matchCategory = (key: keyof typeof PATTERNS): string | undefined => {
    const [exactRegex, fuzzyRegex] = PATTERNS[key];
    
    // First try exact
    for (const h of headers) {
      if (usedHeaders.has(h)) continue;
      const cleanH = h.trim();
      if (exactRegex.test(cleanH)) {
        usedHeaders.add(h);
        return h;
      }
    }
    // Then try fuzzy
    for (const h of headers) {
      if (usedHeaders.has(h)) continue;
      const cleanH = h.trim();
      if (fuzzyRegex.test(cleanH)) {
        usedHeaders.add(h);
        return h;
      }
    }
    return undefined;
  };

  mapping.nameCol = matchCategory('name');
  mapping.phoneCol = matchCategory('phone');
  mapping.emailCol = matchCategory('email');
  mapping.addressCol = matchCategory('address');
  mapping.priorityCol = matchCategory('priority');
  mapping.statusCol = matchCategory('status');
  mapping.sourceCol = matchCategory('source');
  mapping.projectNameCol = matchCategory('projectName');
  mapping.notesCol = matchCategory('notes');
  mapping.followUpDateCol = matchCategory('followUpDate');
  mapping.assignedUserCol = matchCategory('assignedUser');

  // Pass 2: Content-based inspection for missing essential fields (Name, Phone, Email)
  if (!mapping.phoneCol && sampleRows.length > 0) {
    for (const h of headers) {
      if (usedHeaders.has(h)) continue;
      const samples = sampleRows.slice(0, 10).map(r => r[h]);
      if (detectValueType(samples) === 'phone') {
        mapping.phoneCol = h;
        usedHeaders.add(h);
        break;
      }
    }
  }

  if (!mapping.nameCol && sampleRows.length > 0) {
    for (const h of headers) {
      if (usedHeaders.has(h)) continue;
      const samples = sampleRows.slice(0, 10).map(r => r[h]);
      if (detectValueType(samples) === 'name') {
        mapping.nameCol = h;
        usedHeaders.add(h);
        break;
      }
    }
  }

  if (!mapping.emailCol && sampleRows.length > 0) {
    for (const h of headers) {
      if (usedHeaders.has(h)) continue;
      const samples = sampleRows.slice(0, 10).map(r => r[h]);
      if (detectValueType(samples) === 'email') {
        mapping.emailCol = h;
        usedHeaders.add(h);
        break;
      }
    }
  }

  return mapping;
}

// Clean phone numbers
export function formatPhoneNumber(rawPhone: any): string {
  if (!rawPhone) return '';
  let str = String(rawPhone).trim();
  // Remove spaces, dashes, dots, parentheses
  str = str.replace(/[\s\-\.\(\)]/g, '');
  // Normalize arabic numerals to english
  str = str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return str;
}
