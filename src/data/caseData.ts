import {
    IntelAlert,
    GraphNode,
    GraphEdge,
    EvidenceRecord,
    TimelineEntry,
} from '../types';

export interface CaseLinkedData {
    alerts: IntelAlert[];
    nodes: GraphNode[];
    edges: GraphEdge[];
    evidence: EvidenceRecord[];
    timeline: TimelineEntry[];
}

/*
 * Case 0142
 */
const CASE_0142: CaseLinkedData = {
    alerts: [
        {
            id: 'ALT-9041',
            severity: 'CRITICAL',
            confidence: 91.4,
            title: 'BRIDGE ENTITY DETECTED',
            description:
                'Entity P-104 is actively connecting previously isolated network clusters.',
            source: 'NETWORK_ANALYTICS_V2',
            targetCase: 'CN-2026-0142',
            targetEntityId: 'P-104',
            timeElapsed: 'T-00:02:14',
            timestamp: '2026-10-24 14:38:12',
            category: 'bridge_entity',
            acknowledged: false,
        },
        {
            id: 'ALT-8812',
            severity: 'WARNING',
            confidence: 88,
            title: 'CROSS-CASE RECURRENCE',
            description:
                'Phone identifier +91 98XXXXXX12 has surfaced across multiple investigations.',
            source: 'TELECOM_INTERCEPT_V4',
            targetCase: 'CN-2026-0142',
            targetEntityId: 'NODE-PHONE',
            timeElapsed: 'T-01:45:00',
            timestamp: '2026-10-24 12:55:28',
            category: 'pattern_match',
            acknowledged: false,
        },
        {
            id: 'ALT-7703',
            severity: 'WARNING',
            confidence: 84.5,
            title: 'CIRCULAR TRANSACTION DETECTED',
            description:
                'Potential A → B → C → A transaction pattern detected.',
            source: 'FINANCIAL_ANOMALY_ENGINE',
            targetCase: 'CN-2026-0142',
            targetEntityId: 'NODE-BANK',
            timeElapsed: 'T-04:12:33',
            timestamp: '2026-10-24 10:28:00',
            category: 'financial_anomaly',
            acknowledged: false,
        },
        {
            id: 'ALT-6640',
            severity: 'INFO',
            confidence: 76.2,
            title: 'BORDER CROSSING CORRELATION',
            description:
                'Vehicle activity correlated with a recent financial event.',
            source: 'ALPR_INTELLIGENCE_FEED',
            targetCase: 'CN-2026-0142',
            targetEntityId: 'NODE-VEHICLE',
            timeElapsed: 'T-06:30:19',
            timestamp: '2026-10-24 08:10:14',
            category: 'border_crossing',
            acknowledged: false,
        },
    ],

    nodes: [
        {
            id: 'P-104',
            label: 'P-104 (Rahul Sharma)',
            sublabel: 'Director / Target',
            type: 'person',
            icon: 'person_search',
            x: 50,
            y: 50,
            isTarget: true,
            isBridge: true,
            color: '#66FCF1',
        },
        {
            id: 'NODE-PHONE',
            label: '+91 98XXXXXX12',
            sublabel: 'Burner SIM',
            type: 'phone',
            icon: 'phone_iphone',
            x: 65,
            y: 22,
            color: '#F6B352',
        },
        {
            id: 'NODE-BANK',
            label: 'Account XXXX9821',
            sublabel: 'Falcon Interbank',
            type: 'bank',
            icon: 'account_balance',
            x: 28,
            y: 75,
            color: '#ffb4ab',
        },
        {
            id: 'NODE-VEHICLE',
            label: 'MH-04-AB-1234',
            sublabel: 'Vehicle',
            type: 'vehicle',
            icon: 'directions_car',
            x: 25,
            y: 26,
            color: '#dec74a',
        },
        {
            id: 'NODE-ORG',
            label: 'Aegis Holdings Ltd',
            sublabel: 'DMCC',
            type: 'org',
            icon: 'business',
            x: 66,
            y: 80,
            color: '#a1fcf7',
        },
        {
            id: 'U-881',
            label: 'U-881',
            sublabel: 'Unknown Contact',
            type: 'person',
            icon: 'person',
            x: 78,
            y: 35,
            color: '#F6B352',
        },
    ],

    edges: [
        {
            id: 'e-phone',
            source: 'NODE-PHONE',
            target: 'P-104',
            label: 'CALLED',
            style: 'dashed',
            color: '#859491',
        },
        {
            id: 'e-bank',
            source: 'NODE-BANK',
            target: 'P-104',
            label: 'TRANSFERRED',
            style: 'solid',
            color: '#859491',
        },
        {
            id: 'e-vehicle',
            source: 'NODE-VEHICLE',
            target: 'P-104',
            label: 'OWNED',
            style: 'solid',
            color: '#859491',
        },
        {
            id: 'e-org',
            source: 'NODE-ORG',
            target: 'P-104',
            label: 'ASSOCIATED',
            style: 'solid',
            color: '#a1fcf7',
        },
        {
            id: 'e-u881',
            source: 'P-104',
            target: 'U-881',
            label: 'ASSOCIATED',
            style: 'dashed',
            color: '#F6B352',
        },
    ],

    evidence: [
        {
            id: 'DOC-992-B',
            title: 'Falcon Interbank Statement',
            caseId: 'CN-2026-0142',
            category: 'FINANCIAL',
            classification: 'LAW ENFORCEMENT SENSITIVE',
            fileSize: '4.8 MB (PDF)',
            uploadedBy: 'Agent K. Reynolds',
            uploadedAt: '2026-10-24 09:12:00',
            sha256: '9f83a21b3e8c902d1847eab2481029c782194a20b98e721a',
            description: 'Synthetic transaction record for demonstration.',
            verified: true,
            fileType: 'pdf',
        },
        {
            id: 'INT-404-A',
            title: 'Cellular Intercept Session',
            caseId: 'CN-2026-0142',
            category: 'INTERCEPT',
            classification: 'TOP SECRET // NOFORN',
            fileSize: '12.4 MB (FLAC)',
            uploadedBy: 'SIGINT Analyst Team',
            uploadedAt: '2026-10-23 23:41:00',
            sha256: 'a12b4e870198c23d55ef091a8234bc671902488a09b32c81',
            description: 'Synthetic communication record for demonstration.',
            verified: true,
            fileType: 'audio',
        },
    ],

    timeline: [
        {
            id: 'tl-1',
            caseId: 'CN-2026-0142',
            timestamp: '2026-10-24 14:12:00',
            relativeTime: '24 mins ago',
            type: 'SYSTEM',
            title: 'Cross-Case Recurrence Flagged',
            description: 'P-104 relationship detected in another case.',
            entitiesInvolved: ['P-104'],
            severity: 'high',
        },
        {
            id: 'tl-2',
            caseId: 'CN-2026-0142',
            timestamp: '2026-10-24 12:10:00',
            relativeTime: '2 hours ago',
            type: 'TRANSACTION',
            title: 'Outbound Financial Transaction',
            description: 'Synthetic $4.2M transaction event.',
            entitiesInvolved: ['P-104', 'NODE-BANK'],
            severity: 'high',
        },
    ],
};

/*
 * Case 0138
 */
const CASE_0138: CaseLinkedData = {
    alerts: [
        {
            id: 'ALT-138-01',
            severity: 'WARNING',
            confidence: 86,
            title: 'INVOICE PATTERN ANOMALY',
            description:
                'Repeated invoice values indicate a possible structured billing pattern.',
            source: 'FRAUD_ANALYTICS_ENGINE',
            targetCase: 'CN-2026-0138',
            targetEntityId: 'P-209',
            timeElapsed: 'T-02:18:00',
            timestamp: '2026-10-24 11:20:00',
            category: 'financial_anomaly',
            acknowledged: false,
        },
        {
            id: 'ALT-138-02',
            severity: 'INFO',
            confidence: 73,
            title: 'LOGISTICS ENTITY CORRELATION',
            description:
                'Organisation ORG-88 appears repeatedly across related records.',
            source: 'ENTITY_CORRELATION_ENGINE',
            targetCase: 'CN-2026-0138',
            targetEntityId: 'ORG-88',
            timeElapsed: 'T-04:30:00',
            timestamp: '2026-10-24 09:00:00',
            category: 'pattern_match',
            acknowledged: false,
        },
    ],

    nodes: [
        {
            id: 'P-209',
            label: 'P-209 (Tariq Al-Mansoor)',
            sublabel: 'Logistics Broker',
            type: 'person',
            icon: 'person_search',
            x: 50,
            y: 50,
            isTarget: true,
            color: '#66FCF1',
        },
        {
            id: 'ORG-88',
            label: 'Vanguard Freight LLC',
            sublabel: 'Logistics Front',
            type: 'org',
            icon: 'business',
            x: 72,
            y: 30,
            color: '#a1fcf7',
        },
    ],

    edges: [
        {
            id: 'e-138-org',
            source: 'P-209',
            target: 'ORG-88',
            label: 'CONTROLS',
            style: 'solid',
            color: '#a1fcf7',
        },
    ],

    evidence: [
        {
            id: 'DOC-138-01',
            title: 'Synthetic Invoice Audit Bundle',
            caseId: 'CN-2026-0138',
            category: 'FINANCIAL',
            classification: 'LAW ENFORCEMENT SENSITIVE',
            fileSize: '3.1 MB (PDF)',
            uploadedBy: 'Fraud Analysis Unit',
            uploadedAt: '2026-10-24 08:30:00',
            sha256: '138demo123456789abcdef',
            description: 'Synthetic invoice records for demonstration.',
            verified: true,
            fileType: 'pdf',
        },
    ],

    timeline: [
        {
            id: 'tl-138-1',
            caseId: 'CN-2026-0138',
            timestamp: '2026-10-24 10:00:00',
            relativeTime: '1 hour ago',
            type: 'TRANSACTION',
            title: 'Invoice Cluster Identified',
            description: 'Multiple related invoice records detected.',
            entitiesInvolved: ['P-209', 'ORG-88'],
            severity: 'medium',
        },
    ],
};

/*
 * Case 0127
 */
const CASE_0127: CaseLinkedData = {
    alerts: [
        {
            id: 'ALT-127-01',
            severity: 'CRITICAL',
            confidence: 93,
            title: 'CROSS-CASE ENTITY LINK',
            description:
                'Entity P-104 appears in the active maritime logistics investigation.',
            source: 'CROSS_CASE_ENGINE',
            targetCase: 'CN-2026-0127',
            targetEntityId: 'P-104',
            timeElapsed: 'T-00:45:00',
            timestamp: '2026-10-23 09:30:00',
            category: 'bridge_entity',
            acknowledged: false,
        },
    ],

    nodes: [
        {
            id: 'P-104',
            label: 'P-104',
            sublabel: 'Primary Conduit',
            type: 'person',
            icon: 'person_search',
            x: 50,
            y: 50,
            isTarget: true,
            isBridge: true,
            color: '#66FCF1',
        },
        {
            id: 'U-881',
            label: 'U-881',
            sublabel: 'Suspected Handler',
            type: 'person',
            icon: 'person',
            x: 73,
            y: 35,
            color: '#F6B352',
        },
    ],

    edges: [
        {
            id: 'e-127-u881',
            source: 'P-104',
            target: 'U-881',
            label: 'ASSOCIATED',
            style: 'dashed',
            color: '#F6B352',
        },
    ],

    evidence: [
        {
            id: 'DOC-127-01',
            title: 'Synthetic Maritime Intelligence Brief',
            caseId: 'CN-2026-0127',
            category: 'FORENSIC',
            classification: 'CONFIDENTIAL',
            fileSize: '2.6 MB (PDF)',
            uploadedBy: 'Task Force Unit',
            uploadedAt: '2026-10-23 08:30:00',
            sha256: '127demo123456789abcdef',
            description: 'Synthetic maritime intelligence record.',
            verified: true,
            fileType: 'pdf',
        },
    ],

    timeline: [
        {
            id: 'tl-127-1',
            caseId: 'CN-2026-0127',
            timestamp: '2026-10-23 09:30:00',
            relativeTime: '1 day ago',
            type: 'COMMUNICATION',
            title: 'Cross-Case Entity Correlation',
            description: 'P-104 correlation identified.',
            entitiesInvolved: ['P-104', 'U-881'],
            severity: 'high',
        },
    ],
};

export const CASE_LINKED_DATA: Record<string, CaseLinkedData> = {
    'CN-2026-0142': CASE_0142,
    'CN-2026-0138': CASE_0138,
    'CN-2026-0127': CASE_0127,
};