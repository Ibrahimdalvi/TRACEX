/* =========================================================
   NAVIGATION
========================================================= */

export type ActiveView =
  | 'command-center'
  | 'investigations'
  | 'network'
  | 'intelligence'
  | 'evidence'
  | 'entities'
  | 'timeline'
  | 'alerts'
  | 'reports';


/* =========================================================
   CASE
========================================================= */

export type CasePriority =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export type CaseStatus =
  | 'ACTIVE'
  | 'PENDING_REVIEW'
  | 'CLOSED'
  | 'ARCHIVED';

export type RiskLevel =
  | 'HIGH RISK DETECTED'
  | 'ELEVATED RISK'
  | 'LOW RISK';


export interface TechnicalAssessment {
  riskLevel: RiskLevel;
  assessmentId: string;
  summary: string;
  confidenceInterval: number;
  lcl: number;
  ucl: number;
  recommendedActions: string[];
}


/* =========================================================
   CASE DASHBOARD
========================================================= */

export interface KeyEntitySummary {
  id: string;
  name: string;
  type:
    | 'person'
    | 'org'
    | 'phone'
    | 'bank'
    | 'vehicle';

  tag: string;

  role?: string;
  location?: string;
  dob?: string;
  nationality?: string;
  regDate?: string;
  status?: string;
  jurisdiction?: string;
  beneficialOwner?: string;
  isPrimary?: boolean;
}


export interface ActivityFeedItem {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  text: string;
  highlightText?: string;
  subtext: string;
  timeAgo: string;
  source: string;
}


export interface InvestigationCase {
  id: string;
  title: string;
  status: CaseStatus;
  priority: CasePriority;

  progress: number;

  summary: string;

  lastUpdated: string;

  leadInvestigator: string;

  entitiesCount: number;
  evidenceCount: number;
  linksCount: number;

  keyEntities: KeyEntitySummary[];

  recentActivity: ActivityFeedItem[];

  assessment: TechnicalAssessment;
}


/* =========================================================
   ALERTS
========================================================= */

export type AlertSeverity =
  | 'CRITICAL'
  | 'WARNING'
  | 'INFO';

export type AlertCategory =
  | 'bridge_entity'
  | 'pattern_match'
  | 'financial_anomaly'
  | 'border_crossing'
  | 'comms_intercept';


export interface IntelAlert {
  id: string;

  severity: AlertSeverity;

  confidence: number;

  title: string;

  description: string;

  source: string;

  targetCase: string;

  targetEntityId?: string;

  timeElapsed: string;

  timestamp: string;

  acknowledged?: boolean;

  category: AlertCategory;
}


/* =========================================================
   NETWORK GRAPH
========================================================= */

export type GraphNodeType =
  | 'person'
  | 'phone'
  | 'bank'
  | 'vehicle'
  | 'org';

export interface GraphNode {
  id: string;

  label: string;

  sublabel?: string;

  type: GraphNodeType;

  icon: string;

  x: number;
  y: number;

  isBridge?: boolean;
  isTarget?: boolean;

  color: string;
}


export interface GraphEdge {
  id: string;

  source: string;

  target: string;

  label: string;

  style:
    | 'solid'
    | 'dashed';

  color: string;

  weight?: number;

  relationship?: string;

  verificationStatus?: string;
}


/* =========================================================
   FORENSIC DOSSIER
========================================================= */

export interface ForensicDossierEntity {
  id: string;

  name: string;

  type: string;

  role: string;

  degree: number;

  betweenness: number;

  cases: number;

  commLinks: number;

  financialTies: number;

  flagCriteria: string[];

  tacticalAssessment: string;

  photoUrl?: string;

  status: string;

  confidenceScore: number;

  activeCasesCount: number;
}


/* =========================================================
   EVIDENCE
========================================================= */

export type EvidenceCategory =
  | 'FINANCIAL'
  | 'INTERCEPT'
  | 'SURVEILLANCE'
  | 'FORENSIC'
  | 'KYC_RECORD';

export type EvidenceClassification =
  | 'TOP SECRET // NOFORN'
  | 'SECRET'
  | 'CONFIDENTIAL'
  | 'LAW ENFORCEMENT SENSITIVE';


export interface EvidenceRecord {
  id: string;

  title: string;

  caseId: string;

  category: EvidenceCategory;

  classification: EvidenceClassification;

  fileSize: string;

  uploadedBy: string;

  uploadedAt: string;

  sha256: string;

  description: string;

  verified: boolean;

  fileType:
    | 'pdf'
    | 'audio'
    | 'image'
    | 'data';
}


/* =========================================================
   TIMELINE
========================================================= */

export type TimelineEventType =
  | 'COMMUNICATION'
  | 'TRANSACTION'
  | 'SURVEILLANCE'
  | 'SYSTEM'
  | 'BORDER';

export type TimelineSeverity =
  | 'high'
  | 'medium'
  | 'normal';


export interface TimelineEntry {
  id: string;

  caseId: string;

  timestamp: string;

  relativeTime: string;

  type: TimelineEventType;

  title: string;

  description: string;

  entitiesInvolved: string[];

  severity: TimelineSeverity;
}


/* =========================================================
   COPILOT
========================================================= */

export interface CopilotCitation {
  type: string;
  title: string;
}


export interface CopilotMessage {
  id: string;

  sender:
    | 'user'
    | 'assistant'
    | 'system';

  text: string;

  timestamp: string;

  citations?: CopilotCitation[];

  isLoading?: boolean;
}


/* =========================================================
   AI ENTITY EXTRACTION
========================================================= */

export type AIEntityType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'PHONE'
  | 'EMAIL'
  | 'ACCOUNT'
  | 'VEHICLE'
  | 'LOCATION'
  | 'DEVICE'
  | 'OTHER';


export interface AIEntity {
  id: string;

  type: AIEntityType;

  name: string;

  identifier: string;

  location: string;

  role: string;

  sourceReference: string;

  confidence: number;
}


/* =========================================================
   AI RELATIONSHIPS
========================================================= */

export type VerificationStatus =
  | 'UNVERIFIED'
  | 'REVIEWED'
  | 'VERIFIED';


export interface AIRelationship {
  source: string;

  relationship: string;

  target: string;

  date: string;

  time: string;

  sourceReference: string;

  confidence: number;

  verificationStatus: VerificationStatus;
}


/* =========================================================
   AI EVENTS
========================================================= */

export interface AIEvent {
  id: string;

  date: string;

  time: string;

  entityId: string;

  eventType: string;

  description: string;

  location: string;

  evidenceReference: string;

  confidence: number;
}


/* =========================================================
   AI EVIDENCE
========================================================= */

export interface AIEvidence {
  id: string;

  type: string;

  fileName: string;

  dateCollected: string;

  source: string;

  relatedEntity: string;

  description: string;

  hashReference: string;

  verificationStatus: VerificationStatus;
}


/* =========================================================
   AI ALERT
========================================================= */

export type AIAlertSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';


export interface AIAlert {
  id: string;

  severity: AIAlertSeverity;

  title: string;

  description: string;

  relatedEntities: string[];

  sourceReference: string;

  confidence: number;
}


/* =========================================================
   AI KEY ENTITIES
========================================================= */

export interface AIKeyEntity {
  id: string;

  name: string;

  type: string;

  role: string;

  reason: string;
}


/* =========================================================
   AI TIMELINE
========================================================= */

export interface AITimelineEntry {
  id: string;

  date: string;

  time: string;

  title: string;

  description: string;

  entityId: string;

  evidenceReference: string;
}


/* =========================================================
   NETWORK ANALYSIS
========================================================= */

export interface NetworkAnalysis {
  bridgeEntities: string[];

  clusters: string[];

  relationshipPatterns: string[];

  isolatedEntities: string[];

  networkRisk: string;

  findings: string[];
}


/* =========================================================
   EVIDENCE ANALYSIS
========================================================= */

export interface EvidenceAnalysis {
  correlations: string[];

  supportingEvidence: string[];

  contradictions: string[];

  missingEvidence: string[];

  evidenceGaps: string[];
}


/* =========================================================
   ANOMALY ANALYSIS
========================================================= */

export interface AnomalyAnalysis {
  anomalies: string[];

  unusualPatterns: string[];

  highRiskPatterns: string[];
}


/* =========================================================
   INTELLIGENCE
========================================================= */

export interface IntelligenceAnalysis {
  overview: string;

  keyFindings: string[];

  riskIndicators: string[];

  unknowns: string[];

  verificationSteps: string[];
}


/* =========================================================
   AI CASE ANALYSIS RESULT
========================================================= */

export interface AICaseAnalysis {
  case: {
    title: string;

    summary: string;

    priority:
      | 'LOW'
      | 'MEDIUM'
      | 'HIGH';

    riskLevel: RiskLevel;

    assessmentSummary: string;

    confidence: number;

    recommendedActions: string[];
  };

  entities: AIEntity[];

  relationships: AIRelationship[];

  events: AIEvent[];

  evidence: AIEvidence[];

  alerts: AIAlert[];

  keyEntities: AIKeyEntity[];

  timeline: AITimelineEntry[];

  networkAnalysis: NetworkAnalysis;

  evidenceAnalysis: EvidenceAnalysis;

  anomalyAnalysis: AnomalyAnalysis;

  intelligence: IntelligenceAnalysis;
}


/* =========================================================
   UPLOADED FILE
========================================================= */

export interface UploadedFile {
  filename: string;

  mimeType: string;

  type:
    | 'text'
    | 'spreadsheet'
    | 'image'
    | 'error'
    | 'unsupported';
}


/* =========================================================
   CASE ANALYSIS API RESPONSE
========================================================= */

export interface CaseAnalysisStats {
  entities: number;

  relationships: number;

  evidence: number;

  events: number;

  alerts: number;

  timeline: number;

  bridgeEntities: number;

  anomalies: number;

  evidenceCorrelations: number;
}


export interface CaseAnalysisResponse {
  success: boolean;

  analysisId: string;

  caseInfo: {
    title: string;

    summary: string;

    priority: string;

    status: string;

    leadInvestigator: string;
  };

  files: UploadedFile[];

  analysis: AICaseAnalysis;

  stats: CaseAnalysisStats;
}


/* =========================================================
   DEEP SCAN
========================================================= */

export interface DeepScanResult {
  scanId: string;

  caseId: string;

  summary: string;

  networkBridges: string[];

  relationshipPatterns: string[];

  timelinePatterns: string[];

  evidenceCorrelations: string[];

  anomalies: string[];

  riskIndicators: string[];

  investigativeGaps: string[];

  priorityFindings: string[];

  verificationSteps: string[];

  confidence: number;
}


export interface DeepScanResponse {
  success: boolean;

  scanId: string;

  caseId: string;

  scan: DeepScanResult;

  scannedAt: string;
}


/* =========================================================
   COPILOT API RESPONSE
========================================================= */

export interface CopilotResponse {
  reply: string;

  citations: CopilotCitation[];

  confidence: number;

  source: string;
}


/* =========================================================
   CASE LINKED DATA
   Used by existing demo/static case data
========================================================= */

export interface CaseLinkedData {
  alerts: IntelAlert[];

  nodes: GraphNode[];

  edges: GraphEdge[];

  evidence: EvidenceRecord[];

  timeline: TimelineEntry[];
}


export type CaseLinkedDataMap =
  Record<string, CaseLinkedData>;