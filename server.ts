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
  const ai = getGeminiClient();

  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

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

${
  file.type === 'spreadsheet'
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents,
    config: {
      systemInstruction,
      temperature: 0.1,
    },
  });

  const rawText = response.text || '';

  const parsed = safeJsonParse(rawText);

  if (!parsed) {
    console.error(
      'Gemini returned invalid JSON:',
      rawText,
    );

    throw new Error(
      'Gemini returned an invalid analysis response.',
    );
  }

  return parsed;
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
      geminiConfigured:
        !!process.env.GEMINI_API_KEY,
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
           GEMINI ANALYSIS
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

        const ai =
          getGeminiClient();

        if (!ai) {
          return res.status(503).json({
            error:
              'Gemini is not configured.',
          });
        }

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

        const response =
          await ai.models.generateContent({
            model:
              'gemini-3.5-flash-lite',

            contents:
              deepScanPrompt,

            config: {
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

              temperature: 0.1,
            },
          });

        const rawText =
          response.text || '';

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

        const ai =
          getGeminiClient();

        if (!ai) {
          return res.json({
            reply:
              'Gemini is not configured. Please check GEMINI_API_KEY in the backend environment.',

            citations: [],

            confidence: 0,

            source:
              'BACKEND',
          });
        }

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

        const response =
          await ai.models.generateContent({
            model:
              'gemini-3.5-flash-lite',

            contents: `
ANALYST QUERY:

${message}

CASE ID:

${contextCaseId || 'UNKNOWN'}

SELECTED ENTITY:

${entityId || 'NONE'}

SELECTED ALERT:

${alertId || 'NONE'}
            `,

            config: {
              systemInstruction:
                systemPrompt,

              temperature: 0.2,
            },
          });

        res.json({
          reply:
            response.text ||
            'No analytical response was generated.',

          citations: [],

          confidence: 0.8,

          source:
            'GEMINI_INTELLIGENCE_ENGINE',
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