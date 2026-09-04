import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import * as XLSX from 'xlsx';

dotenv.config();

const PORT = Number(process.env.PORT) || 5173;

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return geminiClient;
}

/* =========================================================
   MULTER
========================================================= */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
});

/* =========================================================
   HELPERS
========================================================= */

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

function normalizeMimeType(mimeType: string, filename: string) {
  const ext = path.extname(filename).toLowerCase();

  if (mimeType) return mimeType;

  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
  };

  return map[ext] || 'application/octet-stream';
}

/* =========================================================
   FILE READER
========================================================= */

async function extractFileContent(file: Express.Multer.File) {
  const filename = file.originalname;
  const mimeType = normalizeMimeType(file.mimetype, filename);
  const ext = path.extname(filename).toLowerCase();

  /* PDF */
  if (ext === '.pdf') {
    try {
      const parser = new PDFParse({
        data: file.buffer,
      });

      try {
        const parsed = await parser.getText();

        return {
          type: 'text',
          filename,
          mimeType,
          content: parsed.text,
        };
      } finally {
        await parser.destroy();
      }
    } catch (error) {
      console.error(`PDF parsing failed for ${filename}`, error);

      return {
        type: 'error',
        filename,
        mimeType,
        content: 'Unable to extract text from this PDF.',
      };
    }
  }

  /* Excel */
  if (ext === '.xlsx' || ext === '.xls') {
    try {
      const workbook = XLSX.read(file.buffer, {
        type: 'buffer',
        cellDates: true,
      });

      const sheets = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        });

        return {
          sheetName,
          rows,
        };
      });

      return {
        type: 'spreadsheet',
        filename,
        mimeType,
        content: sheets,
      };
    } catch (error) {
      console.error(`Excel parsing failed for ${filename}`, error);

      return {
        type: 'error',
        filename,
        mimeType,
        content: 'Unable to read this spreadsheet.',
      };
    }
  }

  /* CSV */
  if (ext === '.csv') {
    return {
      type: 'text',
      filename,
      mimeType,
      content: file.buffer.toString('utf-8'),
    };
  }

  /* TXT */
  if (ext === '.txt') {
    return {
      type: 'text',
      filename,
      mimeType,
      content: file.buffer.toString('utf-8'),
    };
  }

  /* IMAGE */
  if (
    ext === '.png' ||
    ext === '.jpg' ||
    ext === '.jpeg' ||
    ext === '.webp'
  ) {
    return {
      type: 'image',
      filename,
      mimeType,
      base64: file.buffer.toString('base64'),
    };
  }

  return {
    type: 'unsupported',
    filename,
    mimeType,
    content: `Unsupported file type: ${ext}`,
  };
}


/* =========================================================
   GEMINI RESILIENT CALLER
   Retries temporary 429/503/capacity errors and falls back
   across currently supported stable Flash models.
========================================================= */

const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

function isRetryableGeminiError(error: any) {
  const status = Number(
    error?.status ??
    error?.code ??
    error?.response?.status ??
    error?.error?.code ??
    0
  );

  const message = String(
    error?.message ??
    error?.error?.message ??
    error?.response?.data?.error?.message ??
    error ??
    ''
  ).toLowerCase();

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes('503') ||
    message.includes('429') ||
    message.includes('unavailable') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('temporarily') ||
    message.includes('rate limit') ||
    message.includes('resource exhausted')
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateGeminiWithFallback(
  ai: GoogleGenAI,
  request: {
    contents: any;
    systemInstruction?: string;
    temperature?: number;
  }
) {
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    const maxAttempts = 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `[Gemini] Trying ${model} (attempt ${attempt}/${maxAttempts})`
        );

        const response = await ai.models.generateContent({
          model,
          contents: request.contents,
          config: {
            ...(request.systemInstruction
              ? { systemInstruction: request.systemInstruction }
              : {}),
            // Gemini 3.8 Flash does not accept legacy sampling parameters.
            ...(model === 'gemini-3.8-flash'
              ? {}
              : request.temperature !== undefined
                ? { temperature: request.temperature }
                : {}),
          },
        });

        console.log(`[Gemini] Success with ${model}`);
        return response;
      } catch (error: any) {
        lastError = error;

        console.error(
          `[Gemini] ${model} attempt ${attempt} failed:`,
          error?.message || error
        );

        if (!isRetryableGeminiError(error)) {
          throw error;
        }

        if (attempt < maxAttempts) {
          await sleep(1000);
        }
      }
    }

    console.warn(`[Gemini] Moving to fallback model after ${model} failed.`);
  }

  throw lastError || new Error('All Gemini fallback models failed.');
}


/* =========================================================
   DETERMINISTIC TIMELINE EXTRACTION
   Guarantees that explicit date/time references in supplied
   source material are preserved even if the LLM omits them.
========================================================= */

function extractExplicitTimeline(extractedFiles: any[]) {
  const results: any[] = [];
  const seen = new Set<string>();

  const add = (date: string, time: string, fileName: string, context: string) => {
    const cleanDate = String(date || '').trim();
    const cleanTime = String(time || '').trim();
    const key = `${cleanDate}|${cleanTime}|${fileName}`;
    if (!cleanDate || seen.has(key)) return;
    seen.add(key);

    const compactContext = context
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240);

    results.push({
      id: `EXPLICIT-EVENT-${results.length + 1}`,
      date: cleanDate,
      time: cleanTime,
      title: 'SOURCE DATE REFERENCE',
      description: compactContext
        ? `Explicit date/time reference found in ${fileName}: ${compactContext}`
        : `Explicit date/time reference found in ${fileName}.`,
      entityId: '',
      evidenceReference: fileName,
      sourceReference: fileName,
      confidence: 0.95,
    });
  };

  const monthNames =
    'January|February|March|April|May|June|July|August|September|October|November|December';

  for (const file of extractedFiles) {
    const text = file.type === 'spreadsheet'
      ? JSON.stringify(file.content)
      : String(file.content || '');

    if (!text.trim()) continue;

    // ISO dates: 2026-08-15 / 2026/08/15
    for (const m of text.matchAll(/\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2})(?:[T\s]+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?))?/gi)) {
      const context = text.slice(Math.max(0, (m.index ?? 0) - 70), (m.index ?? 0) + m[0].length + 130);
      add(m[1], m[2] || '', file.filename, context);
    }

    // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    for (const m of text.matchAll(/\b(\d{1,2}[\/.-]\d{1,2}[\/.-]20\d{2})(?:[,\s]+(\d{1,2}:\d{2}(?:\s?[AP]M)?))?/gi)) {
      const context = text.slice(Math.max(0, (m.index ?? 0) - 70), (m.index ?? 0) + m[0].length + 130);
      add(m[1], m[2] || '', file.filename, context);
    }

    // Month-name dates: 15 August 2026 / August 15, 2026
    for (const m of text.matchAll(new RegExp(
      String.raw`\b(\d{1,2}\s+(?:${monthNames})\s+20\d{2}|(?:${monthNames})\s+\d{1,2},?\s+20\d{2})(?:[,\s]+(\d{1,2}:\d{2}(?:\s?[AP]M)?))?\b`,
      'gi'
    ))) {
      const context = text.slice(Math.max(0, (m.index ?? 0) - 70), (m.index ?? 0) + m[0].length + 130);
      add(m[1], m[2] || '', file.filename, context);
    }
  }

  return results;
}

function mergeTimelineEvidence(analysis: any, extractedFiles: any[]) {
  const explicit = extractExplicitTimeline(extractedFiles);
  const aiTimeline = Array.isArray(analysis?.timeline) ? analysis.timeline : [];

  // Preserve the AI timeline first, then add only explicit source dates
  // that the AI did not already represent.
  const merged = [...aiTimeline];

  for (const item of explicit) {
    const duplicate = merged.some((existing: any) => {
      const a = String(existing?.date || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const b = String(item.date || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return a && b && (a === b || a.includes(b) || b.includes(a));
    });

    if (!duplicate) merged.push(item);
  }

  merged.sort((a: any, b: any) =>
    String(a?.date || '').localeCompare(String(b?.date || ''))
  );

  // Keep events synchronized with timeline so the dashboard counts
  // do not disagree.
  const aiEvents = Array.isArray(analysis?.events) ? analysis.events : [];
  const events = [...aiEvents];

  for (const item of merged) {
    const exists = events.some((event: any) =>
      String(event?.date || '') === String(item?.date || '') &&
      String(event?.evidenceReference || '') === String(item?.evidenceReference || '')
    );

    if (!exists) {
      events.push({
        ...item,
        eventType: item.title || 'SOURCE DATE REFERENCE',
      });
    }
  }

  return {
    ...analysis,
    timeline: merged,
    events,
  };
}

/* =========================================================
   LOCAL FALLBACK ENGINE
   Runs without any external AI service. It only extracts
   identifiers and source references explicitly present in
   supplied files, so the judge demo can still complete.
========================================================= */
function localAnalysisFallback(
  caseInfo: {
    title: string;
    summary: string;
    priority: string;
    status: string;
    leadInvestigator: string;
  },
  extractedFiles: any[],
) {
  const entities: any[] = [];
  const seen = new Set<string>();
  const add = (type: string, value: string, source: string) => {
    const clean = String(value || '').trim().replace(/[.,;:)]+$/g, '');
    const key = `${type}:${clean.toLowerCase()}`;
    if (!clean || clean.length < 3 || seen.has(key)) return;
    seen.add(key);
    entities.push({
      id: `LOCAL-${entities.length + 1}`,
      type,
      name: clean,
      identifier: clean,
      location: '',
      role: '',
      sourceReference: source,
      confidence: 0.78,
    });
  };

  for (const file of extractedFiles) {
    const text = file.type === 'spreadsheet'
      ? JSON.stringify(file.content)
      : String(file.content || '');
    const source = file.filename;

    for (const m of text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) add('EMAIL', m[0], source);
    for (const m of text.matchAll(/\b(?:ACC|ACCT|ACCOUNT)[-_ ]?[A-Z0-9]{3,}\b/gi)) add('ACCOUNT', m[0], source);
    for (const m of text.matchAll(/\b(?:TXN|TRANSACTION|TRX)[-_ ]?[A-Z0-9]{3,}\b/gi)) add('OTHER', m[0], source);
    for (const m of text.matchAll(/\b(?:CASE|REF|ID)[-_ ]?[A-Z0-9]{3,}\b/gi)) add('OTHER', m[0], source);
    for (const m of text.matchAll(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g)) add('PHONE', m[0].replace(/\s+/g, ' ').trim(), source);
  }

  const evidence = extractedFiles.map((file: any, i: number) => ({
    id: `LOCAL-EVIDENCE-${i + 1}`,
    type: file.type,
    fileName: file.filename,
    dateCollected: '',
    source: 'Uploaded source material',
    relatedEntity: entities[0]?.id || '',
    description: `Source file supplied for ${caseInfo.title}.`,
    hashReference: '',
    verificationStatus: 'UNVERIFIED',
  }));

  const timeline = extractExplicitTimeline(extractedFiles).map((item: any) => ({
    ...item,
    entityId: entities[0]?.id || '',
    title: 'DATE REFERENCE',
  }));

  const risk = caseInfo.priority === 'HIGH' ? 'HIGH RISK' : caseInfo.priority === 'MEDIUM' ? 'ELEVATED RISK' : 'LOW RISK';
  const confidence = entities.length || evidence.length ? 0.72 : 0.35;

  return {
    case: {
      title: caseInfo.title,
      summary: caseInfo.summary,
      priority: caseInfo.priority,
      riskLevel: risk,
      assessmentSummary: 'Deterministic local extraction completed. The external AI service was unavailable, so only explicitly supplied identifiers and source files were processed. Human verification is required.',
      confidence,
      recommendedActions: [
        'Verify extracted identifiers against the original source records.',
        'Corroborate important relationships using an independent source.',
      ],
    },
    entities,
    relationships: [],
    events: timeline.map(e => ({ ...e, eventType: e.title })),
    evidence,
    alerts: [],
    keyEntities: entities.slice(0, 5).map(e => ({ id: e.id, name: e.name, type: e.type, role: '', reason: 'Explicitly extracted from supplied source material.' })),
    timeline,
    networkAnalysis: { bridgeEntities: [], clusters: [], relationshipPatterns: [], isolatedEntities: entities.map(e => e.id), networkRisk: risk, findings: [] },
    evidenceAnalysis: { correlations: [], supportingEvidence: evidence.map(e => e.id), contradictions: [], missingEvidence: [], evidenceGaps: [] },
    anomalyAnalysis: { anomalies: [], unusualPatterns: [], highRiskPatterns: [] },
    intelligence: {
      overview: 'Local deterministic analysis completed from the supplied evidence. No unsupported facts were added.',
      keyFindings: [
        `${entities.length} explicitly identifiable data item(s) were extracted.`,
        `${evidence.length} source file(s) were registered for review.`,
      ],
      riskIndicators: caseInfo.priority === 'HIGH' ? ['Case is marked HIGH priority by supplied case metadata.'] : [],
      unknowns: ['External AI analysis was unavailable at processing time.', 'Relationships and conclusions require human verification.'],
      verificationSteps: ['Review extracted identifiers in the original files.', 'Verify any relationship before treating it as established.'],
    },
  };
}


/* =========================================================
   GROQ PRIMARY AI + GEMINI BACKUP
   Groq OpenAI-compatible REST API.
========================================================= */

// Production model currently listed by Groq.
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
];

function getGroqKey() {
  return process.env.GROQ_API_KEY?.trim() || '';
}

function isRetryableRemoteError(status: number, message: string) {
  const text = String(message || '').toLowerCase();
  return (
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    text.includes('rate limit') ||
    text.includes('temporarily') ||
    text.includes('overloaded') ||
    text.includes('timeout') ||
    text.includes('capacity')
  );
}

async function callGroq(request: {
  systemInstruction?: string;
  prompt: string;
  images?: Array<{ mimeType: string; base64: string }>;
  jsonMode?: boolean;
}) {
  const apiKey = getGroqKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  // The current primary Groq production models are text models.
  // PDF/image files are already extracted by the backend where possible.
  const lastErrors: string[] = [];

  for (const model of GROQ_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Groq] Trying ${model} (attempt ${attempt}/2)`);

        const body: any = {
          model,
          messages: [
            ...(request.systemInstruction
              ? [{ role: 'system', content: request.systemInstruction }]
              : []),
            { role: 'user', content: request.prompt },
          ],
          stream: false,
          temperature: request.jsonMode ? 0.1 : 0.2,
        };

        if (request.jsonMode) {
          body.response_format = { type: 'json_object' };
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);

        let response: Response;
        try {
          response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
              signal: controller.signal,
            },
          );
        } finally {
          clearTimeout(timeout);
        }

        const raw = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(raw);
        } catch {
          data = null;
        }

        if (!response.ok) {
          const message =
            data?.error?.message ||
            raw ||
            `HTTP ${response.status}`;
          const error: any = new Error(message);
          error.status = response.status;
          throw error;
        }

        const text = data?.choices?.[0]?.message?.content || '';
        if (!text) {
          throw new Error('Groq returned an empty response.');
        }

        console.log(`[Groq] Success with ${model}`);
        return text;
      } catch (error: any) {
        const status = Number(error?.status || error?.code || 0);
        const message = String(error?.message || error);
        lastErrors.push(`${model}: ${message}`);

        console.error(
          `[Groq] ${model} attempt ${attempt} failed:`,
          message,
        );

        if (attempt < 2 && isRetryableRemoteError(status, message)) {
          await sleep(1000);
          continue;
        }

        break;
      }
    }
  }

  throw new Error(
    `All Groq models failed. ${lastErrors.slice(-3).join(' | ')}`,
  );
}

async function generateAIResponse(request: {
  prompt: string;
  systemInstruction?: string;
  images?: Array<{ mimeType: string; base64: string }>;
  jsonMode?: boolean;
}) {
  // PRIMARY: GROQ
  if (getGroqKey()) {
    try {
      const text = await callGroq(request);
      return { text, provider: 'GROQ' };
    } catch (error: any) {
      console.warn(
        '[AI] Groq failed; trying Gemini backup.',
        error?.message || error,
      );
    }
  } else {
    console.warn(
      '[AI] GROQ_API_KEY is not configured; trying Gemini backup.',
    );
  }

  // BACKUP: GEMINI
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await generateGeminiWithFallback(gemini, {
        contents: request.prompt,
        systemInstruction: request.systemInstruction,
        temperature: request.jsonMode ? 0.1 : 0.2,
      });
      return { text: response.text || '', provider: 'GEMINI' };
    } catch (error: any) {
      console.warn('[AI] Gemini backup failed.', error?.message || error);
    }
  }

  // LAST RESORT: deterministic local extraction.
  throw new Error('All external AI providers are unavailable.');
}

/* =========================================================
   CASE ANALYSIS ENGINE
========================================================= */

async function analyzeCaseFiles(
  caseInfo: {
    title: string;
    summary: string;
    priority: string;
    status: string;
    leadInvestigator: string;
  },
  extractedFiles: any[],
) {
  const textFiles = extractedFiles.filter(
    (file) =>
      file.type === 'text' ||
      file.type === 'spreadsheet',
  );

  const imageFiles = extractedFiles.filter(
    (file) => file.type === 'image',
  );

  const sourceText = textFiles
    .map((file) => {
      return `
===== SOURCE FILE: ${file.filename} =====

${file.type === 'spreadsheet'
          ? JSON.stringify(file.content, null, 2)
          : file.content
        }
`;
    })
    .join('\n\n');

  const imageParts = imageFiles.map((file) => ({
    inlineData: {
      data: file.base64,
      mimeType: file.mimeType,
    },
  }));

  /* =======================================================
     INVESTIGATION INTELLIGENCE SCHEMA
  ======================================================= */

  const systemInstruction = `
You are an investigation intelligence analysis engine.

The application is a SYNTHETIC criminal-network investigation
demonstration.

Analyze ONLY the case information and uploaded evidence supplied
to you.

Your job is to help an investigator organize evidence and identify
relationships, patterns, timelines, anomalies and investigative leads.

DO NOT invent facts.

DO NOT create fictional:
- people
- organizations
- phone numbers
- accounts
- transactions
- addresses
- vehicles
- dates
- locations
- communications
- evidence

If information is unavailable, return an empty value.

Never state that someone is guilty.

Use phrases such as:
- "indicates"
- "suggests"
- "possible relationship"
- "requires verification"
- "investigative lead"

Every important finding should contain a source reference when possible.

Return VALID JSON ONLY.

==========================================================
REQUIRED OUTPUT
==========================================================

{
  "case": {
    "title": "",
    "summary": "",
    "priority": "LOW | MEDIUM | HIGH",
    "riskLevel": "LOW RISK | ELEVATED RISK | HIGH RISK DETECTED",
    "assessmentSummary": "",
    "confidence": 0,
    "recommendedActions": []
  },

  "entities": [
    {
      "id": "",
      "type": "PERSON | ORGANIZATION | PHONE | EMAIL | ACCOUNT | VEHICLE | LOCATION | DEVICE | OTHER",
      "name": "",
      "identifier": "",
      "location": "",
      "role": "",
      "sourceReference": "",
      "confidence": 0
    }
  ],

  "relationships": [
    {
      "source": "",
      "relationship": "",
      "target": "",
      "date": "",
      "time": "",
      "sourceReference": "",
      "confidence": 0,
      "verificationStatus": "UNVERIFIED | REVIEWED | VERIFIED"
    }
  ],

  "events": [
    {
      "id": "",
      "date": "",
      "time": "",
      "entityId": "",
      "eventType": "",
      "description": "",
      "location": "",
      "evidenceReference": "",
      "confidence": 0
    }
  ],

  "evidence": [
    {
      "id": "",
      "type": "",
      "fileName": "",
      "dateCollected": "",
      "source": "",
      "relatedEntity": "",
      "description": "",
      "hashReference": "",
      "verificationStatus": "UNVERIFIED | REVIEWED | VERIFIED"
    }
  ],

  "alerts": [
    {
      "id": "",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "title": "",
      "description": "",
      "relatedEntities": [],
      "sourceReference": "",
      "confidence": 0
    }
  ],

  "keyEntities": [
    {
      "id": "",
      "name": "",
      "type": "",
      "role": "",
      "reason": ""
    }
  ],

  "timeline": [
    {
      "id": "",
      "date": "",
      "time": "",
      "title": "",
      "description": "",
      "entityId": "",
      "evidenceReference": ""
    }
  ],

  "networkAnalysis": {
    "bridgeEntities": [],
    "clusters": [],
    "relationshipPatterns": [],
    "isolatedEntities": [],
    "networkRisk": "",
    "findings": []
  },

  "evidenceAnalysis": {
    "correlations": [],
    "supportingEvidence": [],
    "contradictions": [],
    "missingEvidence": [],
    "evidenceGaps": []
  },

  "anomalyAnalysis": {
    "anomalies": [],
    "unusualPatterns": [],
    "highRiskPatterns": []
  },

  "intelligence": {
    "overview": "",
    "keyFindings": [],
    "riskIndicators": [],
    "unknowns": [],
    "verificationSteps": []
  }
}

==========================================================
ANALYSIS REQUIREMENTS
==========================================================

1. ENTITY EXTRACTION
Identify every explicitly supported person, organization,
account, phone, email, vehicle, device and location.

2. RELATIONSHIP MAPPING
Identify relationships supported by the evidence.

Examples:
- owns
- communicates_with
- associated_with
- transferred_to
- registered_to
- located_at
- works_for
- connected_to

3. TIMELINE
Build a chronological sequence of supported events.
IMPORTANT: Extract every explicit date and time that appears in the
source material. Preserve the original date wording where practical.
Do not leave timeline empty when explicit date/time references exist.
Each timeline item must reference the source filename.

4. EVIDENCE CORRELATION
Determine whether different evidence sources support the same
entity, relationship or event.

5. NETWORK ANALYSIS
Find:
- bridge entities
- highly connected entities
- clusters
- isolated entities
- unusual relationship patterns

Only report these if supported by supplied evidence.

6. ANOMALY DETECTION
Identify unusual patterns such as:
- repeated connections
- unusual timing
- unexpected shared identifiers
- inconsistent records
- unusual relationship concentration

Do NOT call something suspicious merely because it is unusual.
Explain why it requires review.

7. ALERT GENERATION
Generate alerts only when supported by evidence.

8. INVESTIGATIVE LEADS
Provide useful next verification steps.

Examples:
- verify account ownership
- validate registration record
- corroborate timestamp
- compare independent evidence
- verify relationship through another source

These are recommendations, NOT instructions to commit wrongdoing.

9. CONFIDENCE
Confidence must reflect evidence quality.
Do not automatically assign high confidence.

10. SOURCE TRACEABILITY
Keep filename/evidence references attached to findings.
`;

  const prompt = `
CASE INFORMATION:

${JSON.stringify(caseInfo, null, 2)}

==========================================================
UPLOADED SOURCE MATERIAL
==========================================================

${sourceText || 'No text-based files were supplied.'}

==========================================================

Analyze the supplied case and evidence.

Build:
- entity registry
- relationship map
- event timeline
- evidence correlation
- alerts
- network analysis
- anomaly analysis
- key findings
- unknowns
- verification steps

Return JSON only.
`;

  const contents: any[] = [
    {
      text: prompt,
    },
    ...imageParts,
  ];

  let aiResponse: any;
  try {
    aiResponse = await generateAIResponse({
      prompt,
      systemInstruction,
      images: imageFiles.map((file) => ({
        mimeType: file.mimeType,
        base64: file.base64,
      })),
      jsonMode: true,
    });
  } catch (error: any) {
    console.warn('[AI] All external AI providers failed. Using LOCAL FALLBACK ENGINE.');
    console.warn('[AI] Final error:', error?.message || error);
    return localAnalysisFallback(caseInfo, extractedFiles);
  }

  const rawText = aiResponse.text || '';

  const parsed = safeJsonParse(rawText);

  if (!parsed) {
    console.error(
      'AI returned invalid JSON:',
      rawText,
    );

    throw new Error(
      `${aiResponse.provider} returned an invalid analysis response.`,
    );
  }

  // Important for the demo: preserve explicit dates/times from the
  // uploaded source even when the LLM returns an empty timeline.
  const enrichedAnalysis = mergeTimelineEvidence(parsed, extractedFiles);

  console.log(
    `[Timeline] AI events: ${Array.isArray(parsed.events) ? parsed.events.length : 0}, ` +
    `AI timeline: ${Array.isArray(parsed.timeline) ? parsed.timeline.length : 0}, ` +
    `final timeline: ${enrichedAnalysis.timeline.length}`,
  );

  return enrichedAnalysis;
}

/* =========================================================
   SERVER
========================================================= */

async function startServer() {
  const app = express();

  app.use(
    express.json({
      limit: '10mb',
    }),
  );

  /* =======================================================
     CORS
  ======================================================= */

  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Origin',
      '*',
    );

    res.header(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );

    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  /* =======================================================
     HEALTH
  ======================================================= */

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      system: 'Criminal Network Investigation Backend',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      groqConfigured: !!process.env.GROQ_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  /* =======================================================
     CASE INGESTION
  ======================================================= */

  app.post(
    '/api/cases/analyze',
    upload.array('files', 10),
    async (req, res) => {
      try {
        const files =
          (req.files as Express.Multer.File[]) || [];

        const caseInfo = {
          title: String(
            req.body.title ||
            'Untitled Investigation',
          ),

          summary: String(
            req.body.summary || '',
          ),

          priority: String(
            req.body.priority || 'MEDIUM',
          ),

          status: String(
            req.body.status || 'ACTIVE',
          ),

          leadInvestigator: String(
            req.body.leadInvestigator ||
            'Unassigned',
          ),
        };

        console.log(
          '\n======================================',
        );

        console.log(
          'CASE INGESTION STARTED',
        );

        console.log(
          '======================================',
        );

        console.log(
          'Case:',
          caseInfo.title,
        );

        console.log(
          'Files:',
          files.length,
        );

        if (!files.length) {
          return res.status(400).json({
            error:
              'At least one file is required.',
          });
        }

        /* -----------------------------------------------
           EXTRACT ALL FILES
        ----------------------------------------------- */

        const extractedFiles = [];

        for (const file of files) {
          console.log(
            `Reading: ${file.originalname}`,
          );

          const extracted =
            await extractFileContent(file);

          extractedFiles.push(extracted);
        }

        /* -----------------------------------------------
           AI ANALYSIS
        ----------------------------------------------- */

        const analysis =
          await analyzeCaseFiles(
            caseInfo,
            extractedFiles,
          );

        const analysisId =
          `ANALYSIS-${Date.now()
            .toString(36)
            .toUpperCase()}`;

        const entityCount =
          analysis.entities?.length || 0;

        const relationshipCount =
          analysis.relationships?.length || 0;

        const evidenceCount =
          analysis.evidence?.length || 0;

        const eventCount =
          analysis.events?.length || 0;

        const alertCount =
          analysis.alerts?.length || 0;

        const timelineCount =
          analysis.timeline?.length || 0;

        console.log(
          '\nCASE ANALYSIS COMPLETE',
        );

        console.log(
          'Entities:',
          entityCount,
        );

        console.log(
          'Relationships:',
          relationshipCount,
        );

        console.log(
          'Evidence:',
          evidenceCount,
        );

        console.log(
          'Events:',
          eventCount,
        );

        console.log(
          'Alerts:',
          alertCount,
        );

        console.log(
          '======================================\n',
        );

        return res.json({
          success: true,

          analysisId,

          caseInfo,

          files:
            extractedFiles.map(
              (file) => ({
                filename:
                  file.filename,

                mimeType:
                  file.mimeType,

                type:
                  file.type,
              }),
            ),

          analysis,

          stats: {
            entities:
              entityCount,

            relationships:
              relationshipCount,

            evidence:
              evidenceCount,

            events:
              eventCount,

            alerts:
              alertCount,

            timeline:
              timelineCount,

            bridgeEntities:
              analysis
                .networkAnalysis
                ?.bridgeEntities
                ?.length || 0,

            anomalies:
              analysis
                .anomalyAnalysis
                ?.anomalies
                ?.length || 0,

            evidenceCorrelations:
              analysis
                .evidenceAnalysis
                ?.correlations
                ?.length || 0,
          },
        });
      } catch (err: any) {
        console.error(
          'Case ingestion error:',
          err,
        );

        return res.status(500).json({
          success: false,

          error:
            'Case ingestion failed',

          details:
            err?.message ||
            String(err),
        });
      }
    },
  );

  /* =======================================================
     DEEP INVESTIGATION SCAN
  ======================================================= */

  app.post(
    '/api/intelligence/deep-scan',
    async (req, res) => {
      try {
        const {
          caseId,
          caseData,
        } = req.body;

        if (!caseData) {
          return res.status(400).json({
            error:
              'Case investigation data is required for deep scan.',
          });
        }

        /*
         * IMPORTANT:
         * Deep scan now receives the ACTUAL investigation
         * data instead of only the case ID.
         */

        const deepScanPrompt = `
CASE ID:
${caseId || 'UNKNOWN'}

CURRENT INVESTIGATION DATA:

${JSON.stringify(
          caseData,
          null,
          2,
        )}

========================================================

Perform a deeper analytical review of the supplied
investigation data.

Analyze ONLY the supplied information.

Focus on these 8 investigation areas:

1. ENTITY CONNECTIONS
Identify important entities and their supported connections.

2. NETWORK BRIDGES
Identify entities that connect otherwise separate groups.

3. RELATIONSHIP PATTERNS
Identify repeated, unusual or concentrated relationships.

4. TIMELINE PATTERNS
Look for meaningful chronological relationships,
co-occurrences or gaps.

5. EVIDENCE CORRELATION
Determine which evidence items support the same finding.

6. ANOMALIES
Identify unusual or inconsistent patterns that require
human review.

7. RISK INDICATORS
Identify evidence-supported indicators of elevated
investigative risk.

8. INVESTIGATIVE GAPS
Identify what information is still missing and what
should be verified.

Do NOT invent facts.

Do NOT declare anyone guilty.

Return VALID JSON ONLY using:

{
  "scanId": "",
  "caseId": "",
  "summary": "",
  "networkBridges": [],
  "relationshipPatterns": [],
  "timelinePatterns": [],
  "evidenceCorrelations": [],
  "anomalies": [],
  "riskIndicators": [],
  "investigativeGaps": [],
  "priorityFindings": [],
  "verificationSteps": [],
  "confidence": 0
}
`;

        let aiResponse: any;
        try {
          aiResponse = await generateAIResponse({
            prompt: deepScanPrompt,
            systemInstruction: `
You are a synthetic criminal-network investigation
analysis engine.

Your role is analytical organization of supplied
investigation data.

Never invent information.

Every finding must be grounded in supplied data.

Distinguish facts from analytical inference.

AI findings require human verification.

Return JSON only.
            `,
            jsonMode: true,
          });
        } catch (error: any) {
          const scanId = `SCAN-LOCAL-${Date.now().toString(36).toUpperCase()}`;
          console.warn('[AI] Deep scan unavailable. Returning local scan.');
          return res.json({ success: true, scanId, caseId, scan: { scanId, caseId, summary: 'Deterministic local deep scan completed because the external AI service was unavailable.', networkBridges: [], relationshipPatterns: [], timelinePatterns: [], evidenceCorrelations: [], anomalies: [], riskIndicators: [], investigativeGaps: ['External AI analysis unavailable; verify findings manually.'], priorityFindings: [], verificationSteps: ['Review the stored evidence and verify key relationships.'], confidence: 0.5 }, scannedAt: new Date().toISOString() });
        }

        const rawText =
          aiResponse.text || '';

        const scan =
          safeJsonParse(rawText);

        if (!scan) {
          console.error(
            'Invalid deep scan JSON:',
            rawText,
          );

          throw new Error(
            'Deep scan returned invalid JSON.',
          );
        }

        const scanId =
          `SCAN-${Date.now()
            .toString(36)
            .toUpperCase()}`;

        return res.json({
          success: true,

          scanId,

          caseId,

          scan: {
            ...scan,

            scanId,

            caseId,
          },

          scannedAt:
            new Date().toISOString(),
        });
      } catch (err: any) {
        console.error(
          'Deep scan error:',
          err,
        );

        return res.status(500).json({
          success: false,

          error:
            'Deep scan failed',

          details:
            err?.message ||
            String(err),
        });
      }
    },
  );

  /* =======================================================
     COPILOT
  ======================================================= */

  app.post(
    '/api/copilot/chat',
    async (req, res) => {
      try {
        const {
          message,
          contextCaseId,
          entityId,
          alertId,
          context,
        } = req.body;

        const systemPrompt = `
You are an investigative intelligence copilot.

The dataset is synthetic and used for software demonstration.

CASE CONTEXT:
${JSON.stringify(
          context?.case ?? {},
          null,
          2,
        )}

SELECTED ALERT:
${JSON.stringify(
          context?.selectedAlert ?? null,
          null,
          2,
        )}

AVAILABLE ALERTS:
${JSON.stringify(
          context?.availableAlerts ?? [],
          null,
          2,
        )}

RULES:

1. Use only supplied context.
2. Never invent evidence.
3. Never invent entities or relationships.
4. Clearly separate evidence from inference.
5. Never declare anyone guilty.
6. Mention limitations when information is missing.
7. Give concise analyst-oriented responses.
8. Reference supplied identifiers.
9. AI output requires human verification.

Return:

Assessment
Evidence / Supporting Records
Confidence
Unknowns / Limitations
Recommended Verification Steps
`;

        let aiResponse: any;
        try {
          aiResponse = await generateAIResponse({
            prompt: `
ANALYST QUERY:

${message}

CASE ID:

${contextCaseId || 'UNKNOWN'}

SELECTED ENTITY:

${entityId || 'NONE'}

SELECTED ALERT:

${alertId || 'NONE'}
            `,
            systemInstruction: systemPrompt,
            jsonMode: false,
          });
        } catch (error: any) {
          return res.json({ reply: 'The external AI service is temporarily unavailable. The supplied investigation context remains available for manual review. Verify evidence and relationships before drawing conclusions.', citations: [], confidence: 0.5, source: 'LOCAL_FALLBACK' });
        }

        res.json({
          reply: aiResponse.text || 'No analytical response was generated.',
          citations: [],
          confidence: 0.8,
          source: `${aiResponse.provider}_INTELLIGENCE_ENGINE`,
        });
      } catch (err: any) {
        console.error(
          'Copilot API error:',
          err,
        );

        res.status(500).json({
          error:
            'Failed to process copilot query',

          details:
            err?.message ||
            String(err),
        });
      }
    },
  );

  /* =======================================================
     VITE
  ======================================================= */

  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true,
        },

        appType: 'spa',
      });

    app.use(
      vite.middlewares,
    );
  } else {
    const distPath =
      path.join(
        process.cwd(),
        'dist',
      );

    app.use(
      express.static(
        distPath,
      ),
    );

    app.get(
      '*',
      (req, res) => {
        res.sendFile(
          path.join(
            distPath,
            'index.html',
          ),
        );
      },
    );
  }

  /* =======================================================
     START SERVER
  ======================================================= */

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `Criminal Network Investigation Server running on http://localhost:${PORT}`,
      );
    },
  );

}

startServer();