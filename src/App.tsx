import React, { useEffect, useMemo, useState } from 'react';

import { AuthView } from './components/AuthView';
import { supabase } from './lib/supabase';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NewCaseModal } from './components/modals/NewCaseModal';

import { CommandCenterView } from './components/views/CommandCenterView';
import { IntelligenceView } from './components/views/IntelligenceView';
import { CaseInvestigationView } from './components/views/CaseInvestigationView';
import { AlertsCopilotView } from './components/views/AlertsCopilotView';
import { NetworkIntelligenceView } from './components/views/NetworkIntelligenceView';
import { EvidenceVaultView } from './components/views/EvidenceVaultView';
import { TimelineView } from './components/views/TimelineView';
import { ReportsView } from './components/views/ReportsView';

import { SubpoenaDraftModal } from './components/modals/SubpoenaDraftModal';
import { ExportDossierModal } from './components/modals/ExportDossierModal';
import { CaseSelectorModal } from './components/modals/CaseSelectorModal';
import { DeepScanProgressModal } from './components/modals/DeepScanProgressModal';
import { SystemStatusModal } from './components/modals/SystemStatusModal';

import {
  INITIAL_CASES,
  PRIMARY_TARGET_DOSSIER,
} from './data/mockData';

import { CASE_LINKED_DATA } from './data/caseData';

import {
  ActiveView,
  InvestigationCase,
  ForensicDossierEntity,
} from './types';


/* =========================================================
   AUTHENTICATED CASE DATA
   Cases and analysis are persisted in Supabase.
========================================================= */

/* =========================================================
   LIVE ENTITY REGISTRY
   IMPORTANT:
   This registry uses the current case AI entities.
========================================================= */

interface LiveEntitiesRegistryProps {
  entities: any[];
  relationships: any[];
  currentCase: InvestigationCase;
  onSelectEntity: (entity: any) => void;
  onNavigate: (view: ActiveView) => void;
}


const LiveEntitiesRegistry: React.FC<
  LiveEntitiesRegistryProps
> = ({
  entities,
  relationships,
  currentCase,
  onSelectEntity,
  onNavigate,
}) => {

    const [filterType, setFilterType] =
      useState<string>('ALL');

    const [searchQuery, setSearchQuery] =
      useState<string>('');


    /* =======================================================
       NORMALIZE ENTITY TYPE
    ======================================================= */

    const normalizeEntityType = (
      type: any
    ): string => {

      const value =
        String(type || '')
          .trim()
          .toUpperCase();

      if (
        value.includes('PERSON') ||
        value === 'INDIVIDUAL'
      ) {
        return 'PERSON';
      }

      if (
        value.includes('ORGANIZATION') ||
        value.includes('ORGANISATION') ||
        value === 'ORG' ||
        value.includes('COMPANY')
      ) {
        return 'ORGANIZATION';
      }

      if (
        value.includes('PHONE') ||
        value.includes('TELECOM') ||
        value.includes('MOBILE')
      ) {
        return 'TELECOM';
      }

      if (
        value.includes('ACCOUNT') ||
        value.includes('BANK') ||
        value.includes('FINANCIAL')
      ) {
        return 'FINANCIAL';
      }

      if (
        value.includes('VEHICLE') ||
        value.includes('CAR')
      ) {
        return 'VEHICLE';
      }

      if (
        value.includes('EMAIL')
      ) {
        return 'EMAIL';
      }

      if (
        value.includes('LOCATION') ||
        value.includes('ADDRESS')
      ) {
        return 'LOCATION';
      }

      if (
        value.includes('DEVICE')
      ) {
        return 'DEVICE';
      }

      return value || 'OTHER';
    };


    /* =======================================================
       BUILD LIVE ENTITY RECORDS
    ======================================================= */

    const registryEntities = useMemo(() => {

      return (entities || []).map(
        (
          entity: any,
          index: number
        ) => {

          const entityId =
            String(
              entity?.id ||
              entity?.identifier ||
              `ENTITY-${index + 1}`
            );


          const entityType =
            normalizeEntityType(
              entity?.type
            );


          const entityName =
            entity?.name ||
            entity?.identifier ||
            entity?.value ||
            entityId;


          const entityRelationships =
            (relationships || []).filter(
              (relationship: any) => {

                const source =
                  String(
                    relationship?.source || ''
                  );

                const target =
                  String(
                    relationship?.target || ''
                  );

                return (
                  source === entityId ||
                  target === entityId ||
                  source === entityName ||
                  target === entityName
                );
              }
            );


          const degree =
            Number(
              entity?.degree ??
              entityRelationships.length
            );


          const confidence =
            Number(
              entity?.confidence ??
              entity?.confidenceScore ??
              0
            );


          const betweenness =
            Number(
              entity?.betweenness ??
              entity?.centrality ??
              0
            );


          const isTarget =
            Boolean(
              entity?.isTarget ??
              entity?.isPrimary ??
              index === 0
            );


          return {

            ...entity,

            id: entityId,

            name: entityName,

            type: entityType,

            role:
              entity?.role ||
              entity?.description ||
              'Investigation Entity',

            degree,

            betweenness,

            cases:
              Number(
                entity?.cases ??
                entity?.caseCount ??
                1
              ),

            commLinks:
              Number(
                entity?.commLinks ??
                entity?.communicationLinks ??
                0
              ),

            financialTies:
              Number(
                entity?.financialTies ??
                entity?.financialLinks ??
                0
              ),

            confidenceScore:
              Math.max(
                0,
                Math.min(
                  100,
                  confidence
                )
              ),

            activeCasesCount:
              Number(
                entity?.activeCasesCount ??
                1
              ),

            status:
              entity?.status ||
              (
                isTarget
                  ? 'ACTIVE TARGET'
                  : 'UNDER REVIEW'
              ),

            isTarget,

            flagCriteria:
              entity?.flagCriteria ||
              [],

            tacticalAssessment:
              entity?.tacticalAssessment ||
              entity?.reason ||
              entity?.sourceReference ||
              'AI-extracted entity requiring investigator verification.',

            relationshipCount:
              entityRelationships.length,
          };
        }
      );

    }, [
      entities,
      relationships,
    ]);


    /* =======================================================
       FILTER
    ======================================================= */

    const filteredEntities =
      registryEntities.filter(
        (entity: any) => {

          const matchesType =
            filterType === 'ALL' ||
            entity.type === filterType;


          const query =
            searchQuery
              .trim()
              .toLowerCase();


          if (!query) {
            return matchesType;
          }


          const matchesQuery =
            String(
              entity.name || ''
            )
              .toLowerCase()
              .includes(query) ||

            String(
              entity.id || ''
            )
              .toLowerCase()
              .includes(query) ||

            String(
              entity.role || ''
            )
              .toLowerCase()
              .includes(query) ||

            String(
              entity.type || ''
            )
              .toLowerCase()
              .includes(query);


          return (
            matchesType &&
            matchesQuery
          );
        }
      );


    /* =======================================================
       ICON
    ======================================================= */

    const getEntityIcon = (
      type: string
    ) => {

      switch (type) {

        case 'PERSON':
          return 'person';

        case 'ORGANIZATION':
          return 'business';

        case 'TELECOM':
          return 'phone_iphone';

        case 'FINANCIAL':
          return 'account_balance';

        case 'VEHICLE':
          return 'directions_car';

        case 'EMAIL':
          return 'mail';

        case 'LOCATION':
          return 'location_on';

        case 'DEVICE':
          return 'devices';

        default:
          return 'device_hub';
      }
    };


    /* =======================================================
       AVAILABLE FILTERS
    ======================================================= */

    const filterTypes = [
      'ALL',
      'PERSON',
      'ORGANIZATION',
      'TELECOM',
      'FINANCIAL',
      'VEHICLE',
      'EMAIL',
      'LOCATION',
      'DEVICE',
    ];


    /* =======================================================
       RENDER
    ======================================================= */

    return (

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-12">

        {/* ===================================================
          HEADER
      =================================================== */}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          <div>

            <p className="font-mono text-[9px] text-[#7bd6d1] tracking-widest uppercase mb-1">
              CASE {currentCase.id}
            </p>

            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Entities & Targets Registry
            </h2>

            <p className="font-sans text-xs sm:text-sm text-[#bacac7] mt-0.5">
              AI-extracted entities from the current investigation
            </p>

          </div>


          <button
            onClick={() =>
              onNavigate('network')
            }
            className="
            px-3.5
            py-2
            rounded
            bg-[#1a2120]
            border
            border-[#66FCF1]/60
            text-[#66FCF1]
            font-mono
            text-[10px]
            font-bold
            uppercase
            tracking-wider
            hover:bg-[#66FCF1]
            hover:text-[#00201e]
            transition-all
            flex
            items-center
            gap-2
          "
          >

            <span className="material-symbols-outlined text-[16px]">
              hub
            </span>

            VIEW IN NETWORK GRAPH

          </button>

        </div>


        {/* ===================================================
          LIVE DATA STATUS
      =================================================== */}

        <div className="
        flex
        items-center
        justify-between
        bg-[#0e1514]
        border
        border-[#3c4948]/50
        rounded-lg
        px-4
        py-3
      ">

          <div className="flex items-center gap-3">

            <span className="
            w-2
            h-2
            rounded-full
            bg-[#66FCF1]
            shadow-[0_0_10px_rgba(102,252,241,0.8)]
          " />

            <div>

              <p className="font-mono text-[9px] text-[#859491] uppercase tracking-widest">
                LIVE CASE DATA
              </p>

              <p className="font-mono text-[11px] text-white">
                {registryEntities.length} entities extracted
              </p>

            </div>

          </div>


          <div className="font-mono text-[9px] text-[#859491]">
            {relationships.length} RELATIONSHIPS
          </div>

        </div>


        {/* ===================================================
          FILTERS + SEARCH
      =================================================== */}

        <div className="
        flex
        flex-col
        md:flex-row
        gap-3
        items-stretch
        md:items-center
        justify-between
        bg-[#1a2120]
        border
        border-[#3c4948]/40
        p-3
        rounded-lg
      ">

          <div className="flex gap-2 overflow-x-auto">

            {filterTypes.map(
              (type) => (

                <button
                  key={type}
                  onClick={() =>
                    setFilterType(type)
                  }
                  className={`
                  px-3
                  py-1.5
                  rounded
                  font-mono
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  transition-all
                  whitespace-nowrap
                  ${filterType === type
                      ? 'bg-[#66FCF1] text-[#00201e]'
                      : 'bg-[#0e1514] text-[#bacac7] hover:text-white border border-[#3c4948]/50'
                    }
                `}
                >

                  {type}

                </button>

              )
            )}

          </div>


          <div className="
          flex
          items-center
          bg-[#0e1514]
          border
          border-[#3c4948]/60
          px-3
          py-1.5
          rounded
          w-full
          md:w-72
        ">

            <span className="
            material-symbols-outlined
            text-[#7bd6d1]
            text-[16px]
            mr-2
          ">
              search
            </span>


            <input
              type="text"
              placeholder="Search entity by name or ID..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              className="
              bg-transparent
              border-none
              text-white
              text-xs
              font-mono
              focus:outline-none
              w-full
              placeholder:text-[#859491]/60
            "
            />

          </div>

        </div>


        {/* ===================================================
          EMPTY STATE
      =================================================== */}

        {filteredEntities.length === 0 && (

          <div className="
          flex
          flex-col
          items-center
          justify-center
          min-h-[300px]
          bg-[#1a2120]
          border
          border-[#3c4948]/40
          rounded-lg
        ">

            <span className="
            material-symbols-outlined
            text-[#859491]
            text-[42px]
            mb-3
          ">
              account_tree
            </span>

            <h3 className="text-white font-bold text-sm">
              No entities found
            </h3>

            <p className="
            text-[#859491]
            text-xs
            font-mono
            mt-2
            text-center
            max-w-md
          ">

              {registryEntities.length === 0
                ? 'No entities were returned by the case analysis. Check the backend analysis response.'
                : 'No entities match the current search or filter.'}

            </p>

            {registryEntities.length === 0 && (

              <button
                onClick={() =>
                  onNavigate('investigations')
                }
                className="
                mt-4
                px-4
                py-2
                rounded
                border
                border-[#66FCF1]/40
                text-[#66FCF1]
                font-mono
                text-[9px]
                font-bold
                uppercase
                tracking-widest
                hover:bg-[#66FCF1]/10
              "
              >
                RETURN TO INVESTIGATION
              </button>

            )}

          </div>

        )}


        {/* ===================================================
          ENTITY CARDS
      =================================================== */}

        {filteredEntities.length > 0 && (

          <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-3
          gap-4
        ">

            {filteredEntities.map(
              (entity: any) => (

                <div
                  key={entity.id}
                  onClick={() =>
                    onSelectEntity(entity)
                  }
                  className="
                  bg-[#1a2120]
                  border
                  border-[#3c4948]/40
                  hover:border-[#66FCF1]/70
                  p-4
                  rounded-lg
                  flex
                  flex-col
                  justify-between
                  transition-all
                  cursor-pointer
                  group
                  shadow-sm
                  hover:shadow-[0_0_15px_rgba(102,252,241,0.15)]
                "
                >

                  <div>

                    {/* TOP ROW */}

                    <div className="
                    flex
                    justify-between
                    items-start
                    mb-2.5
                  ">

                      <div className="
                      flex
                      items-center
                      gap-2
                    ">

                        <span className="
                        material-symbols-outlined
                        text-[#66FCF1]
                        text-[18px]
                      ">
                          {getEntityIcon(
                            entity.type
                          )}
                        </span>


                        <span className="
                        font-mono
                        text-[10px]
                        font-bold
                        text-[#66FCF1]
                        bg-[#66FCF1]/10
                        px-2
                        py-0.5
                        rounded
                        border
                        border-[#66FCF1]/20
                      ">
                          {entity.id}
                        </span>

                      </div>


                      <span className="
                      px-2
                      py-0.5
                      rounded
                      font-mono
                      text-[8px]
                      font-extrabold
                      uppercase
                      tracking-wider
                      bg-[#93000a]/20
                      text-[#ffb4ab]
                      border
                      border-[#ffb4ab]/30
                    ">
                        {entity.status}
                      </span>

                    </div>


                    {/* NAME */}

                    <h3 className="
                    font-sans
                    text-base
                    font-bold
                    text-white
                    group-hover:text-[#66FCF1]
                    transition-colors
                    mb-1
                  ">
                      {entity.name}
                    </h3>


                    {/* ROLE */}

                    <p className="
                    font-sans
                    text-xs
                    text-[#bacac7]
                    mb-3
                  ">
                      {entity.role}
                    </p>


                    {/* TYPE */}

                    <div className="
                    mb-3
                    flex
                    items-center
                    gap-2
                  ">

                      <span className="
                      font-mono
                      text-[8px]
                      text-[#859491]
                      uppercase
                    ">
                        TYPE
                      </span>

                      <span className="
                      font-mono
                      text-[9px]
                      text-[#66FCF1]
                      border
                      border-[#66FCF1]/20
                      bg-[#66FCF1]/5
                      px-2
                      py-0.5
                      rounded
                    ">
                        {entity.type}
                      </span>

                    </div>


                    {/* METRICS */}

                    <div className="
                    grid
                    grid-cols-3
                    gap-2
                    bg-[#0e1514]
                    p-2.5
                    rounded
                    border
                    border-[#3c4948]/30
                    font-mono
                    text-[10px]
                    mb-3
                  ">

                      <div className="text-center">

                        <div className="
                        text-[#859491]
                        text-[8px]
                        uppercase
                      ">
                          RELATIONS
                        </div>

                        <div className="
                        text-[#66FCF1]
                        font-bold
                        mt-0.5
                      ">
                          {entity.relationshipCount}
                        </div>

                      </div>


                      <div className="
                      text-center
                      border-x
                      border-[#3c4948]/40
                    ">

                        <div className="
                        text-[#859491]
                        text-[8px]
                        uppercase
                      ">
                          DEGREE
                        </div>

                        <div className="
                        text-white
                        font-bold
                        mt-0.5
                      ">
                          {entity.degree}
                        </div>

                      </div>


                      <div className="text-center">

                        <div className="
                        text-[#859491]
                        text-[8px]
                        uppercase
                      ">
                          CONFIDENCE
                        </div>

                        <div className="
                        text-[#66FCF1]
                        font-bold
                        mt-0.5
                      ">
                          {entity.confidenceScore}%
                        </div>

                      </div>

                    </div>


                    {/* SOURCE */}

                    {(entity.sourceReference ||
                      entity.reason ||
                      entity.location) && (

                        <div className="
                      bg-[#0e1514]
                      border
                      border-[#3c4948]/30
                      rounded
                      p-2.5
                      mb-3
                    ">

                          <p className="
                        font-mono
                        text-[8px]
                        text-[#859491]
                        uppercase
                        mb-1
                      ">
                            SOURCE / CONTEXT
                          </p>

                          <p className="
                        font-sans
                        text-[10px]
                        text-[#bacac7]
                        leading-relaxed
                      ">
                            {entity.sourceReference ||
                              entity.reason ||
                              entity.location}
                          </p>

                        </div>

                      )}

                  </div>


                  {/* BOTTOM */}

                  <div className="
                  pt-2
                  border-t
                  border-[#3c4948]/30
                  flex
                  justify-between
                  items-center
                  text-xs
                ">

                    <span className="
                    font-sans
                    text-[#859491]
                    text-[10px]
                  ">

                      CASE

                      <strong className="text-white ml-1">
                        {currentCase.id}
                      </strong>

                    </span>


                    <span className="
                    font-mono
                    text-[10px]
                    text-[#66FCF1]
                    font-bold
                    flex
                    items-center
                    gap-1
                    group-hover:translate-x-1
                    transition-transform
                  ">

                      OPEN PROFILE

                      <span className="
                      material-symbols-outlined
                      text-[12px]
                    ">
                        arrow_forward
                      </span>

                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>
    );
  };


/* =========================================================
   APP
========================================================= */

export function App() {

  /* =======================================================
     AUTHENTICATION
     Supabase email/password session gate
  ======================================================= */

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('TRACEX auth session error:', error);
      }

      if (mounted) {
        setSession(data.session);
        setAuthLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setAuthLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     LOAD REAL USER PROFILE
     Uses public.profiles so the header shows the actual
     investigator name saved for the authenticated account.
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!session?.user?.id) {
        if (mounted) setProfileName('');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name,email')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.warn('TRACEX profile lookup failed:', error.message);
      }

      if (mounted) {
        setProfileName(
          data?.full_name ||
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'INVESTIGATOR'
        );
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [session]);


  /* =======================================================
     GLOBAL STATE
  ======================================================= */

  const [activeView, setActiveView] =
    useState<ActiveView>(
      'command-center'
    );


  /* =======================================================
     CASES

     Cases are loaded only from Supabase for the authenticated
     investigator. Browser localStorage is NOT used for case ownership.
  ======================================================= */

  const EMPTY_CASE: InvestigationCase = {
    id: 'NO-CASE',
    title: 'No Case Selected',
    status: 'PENDING_REVIEW',
    priority: 'LOW',
    progress: 0,
    summary: 'No investigation cases are assigned to this account yet.',
    lastUpdated: '—',
    leadInvestigator: session?.user?.email || 'Current Investigator',
    entitiesCount: 0,
    evidenceCount: 0,
    linksCount: 0,
    keyEntities: [],
    recentActivity: [],
    assessment: {
      riskLevel: 'LOW RISK',
      assessmentId: 'NO-ASSESSMENT',
      summary: 'Create or receive a case to begin investigation.',
      confidenceInterval: 0,
      lcl: 0,
      ucl: 0,
      recommendedActions: [],
    },
  };

  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [caseLoadError, setCaseLoadError] = useState<string | null>(null);


  /* =======================================================
     CURRENT CASE
  ======================================================= */

  const [currentCase, setCurrentCase] = useState<InvestigationCase>(EMPTY_CASE);


  /* =======================================================
     DOSSIER
  ======================================================= */

  const [dossier] =
    useState<ForensicDossierEntity>(
      PRIMARY_TARGET_DOSSIER
    );


  /* =======================================================
     COMPLETE CASE DATA
  ======================================================= */

  const [caseDataOverrides, setCaseDataOverrides] =
    useState<Record<string, any>>({});


  /* =======================================================
     ALERT OVERRIDES
     Kept in memory only so acknowledgement state cannot leak
     between authenticated users on the same browser.
  ======================================================= */

  const [
    alertOverrides,
    setAlertOverrides,
  ] = useState<Record<string, { acknowledged?: boolean }>>({});


  /* =======================================================
     MODALS
  ======================================================= */

  const [isSubpoenaOpen, setIsSubpoenaOpen] =
    useState(false);

  const [isExportOpen, setIsExportOpen] =
    useState(false);

  const [isCaseSelectorOpen, setIsCaseSelectorOpen] =
    useState(false);

  const [isNewCaseOpen, setIsNewCaseOpen] =
    useState(false);

  const [isDeepScanOpen, setIsDeepScanOpen] =
    useState(false);

  const [isScanning, setIsScanning] =
    useState(false);

  const [deepScanResult, setDeepScanResult] =
    useState<any>(null);

  const [isSystemStatusOpen, setIsSystemStatusOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState('');


  /* =======================================================
     LOAD AUTHENTICATED USER'S CASES FROM SUPABASE

     Supabase RLS is the security boundary: public.cases policies
     only return rows where assigned_to = auth.uid().
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadCasesFromSupabase = async () => {
      if (!session?.user?.id) {
        setCases([]);
        setCurrentCase(EMPTY_CASE);
        setCaseDataOverrides({});
        setCasesLoading(false);
        return;
      }

      setCasesLoading(true);
      setCaseLoadError(null);

      const { data: caseRows, error: casesError } = await supabase
        .from('cases')
        .select('id,case_number,title,summary,priority,status,assigned_to,created_at,updated_at')
        .order('updated_at', { ascending: false });

      if (cancelled) return;

      if (casesError) {
        console.error('TRACEX: Failed to load cases:', casesError);
        setCaseLoadError(casesError.message);
        setCases([]);
        setCurrentCase(EMPTY_CASE);
        setCaseDataOverrides({});
        setCasesLoading(false);
        return;
      }

      const caseIds = (caseRows || []).map((row: any) => row.id);
      let analysisMap: Record<string, any> = {};

      if (caseIds.length > 0) {
        const { data: analysisRows, error: analysisError } = await supabase
          .from('case_analysis')
          .select('case_id,data,updated_at')
          .in('case_id', caseIds);

        if (cancelled) return;

        if (analysisError) {
          console.warn('TRACEX: Case analysis table unavailable or empty:', analysisError.message);
        } else {
          analysisMap = (analysisRows || []).reduce((acc: Record<string, any>, row: any) => {
            const matchingCase = (caseRows || []).find((caseRow: any) => caseRow.id === row.case_id);
            if (matchingCase?.case_number) acc[matchingCase.case_number] = row.data || {};
            return acc;
          }, {});
        }
      }

      /* ---------------------------------------------------
         BUILD CASE CARDS USING ACTUAL SAVED ANALYSIS

         The database row contains the case metadata while
         case_analysis.data contains the AI-generated entities,
         evidence, relationships, alerts and assessment.
         Use those values so the UI never falls back to 0 when
         real analysis already exists.
      --------------------------------------------------- */

      const mappedCases: InvestigationCase[] = (caseRows || []).map((row: any) => {
        const staticCase = INITIAL_CASES.find((item) => item.id === row.case_number);
        const storedAnalysis: any = analysisMap[row.case_number] || {};
        const mappedStatus = row.status === 'IN PROGRESS' ? 'ACTIVE' : 'PENDING_REVIEW';

        const analysisEntities = Array.isArray(storedAnalysis.entities)
          ? storedAnalysis.entities
          : [];
        const analysisEvidence = Array.isArray(storedAnalysis.evidence)
          ? storedAnalysis.evidence
          : [];
        const analysisRelationships = Array.isArray(storedAnalysis.relationships)
          ? storedAnalysis.relationships
          : [];
        const analysisAlerts = Array.isArray(storedAnalysis.alerts)
          ? storedAnalysis.alerts
          : [];

        const hasAnalysis =
          Boolean(storedAnalysis.analysisId) ||
          analysisEntities.length > 0 ||
          analysisEvidence.length > 0 ||
          analysisRelationships.length > 0 ||
          analysisAlerts.length > 0 ||
          Boolean(storedAnalysis.intelligence?.overview);

        const confidence =
          Number(
            storedAnalysis?.assessment?.confidenceInterval ??
            storedAnalysis?.intelligence?.confidence ??
            storedAnalysis?.intelligence?.confidenceScore ??
            0
          ) || 0;

        const severityRank: Record<string, number> = {
          LOW: 1,
          MEDIUM: 2,
          HIGH: 3,
          CRITICAL: 4,
        };
        const highestSeverity = analysisAlerts.reduce(
          (highest: string, alert: any) =>
            (severityRank[String(alert?.severity || 'LOW').toUpperCase()] || 0) >
            (severityRank[highest] || 0)
              ? String(alert?.severity || 'LOW').toUpperCase()
              : highest,
          'LOW'
        );

        const riskLevel =
          storedAnalysis?.assessment?.riskLevel ||
          storedAnalysis?.intelligence?.riskLevel ||
          (highestSeverity === 'CRITICAL'
            ? 'HIGH RISK DETECTED'
            : highestSeverity === 'HIGH'
              ? 'HIGH RISK DETECTED'
              : highestSeverity === 'MEDIUM'
                ? 'ELEVATED RISK'
                : staticCase?.assessment?.riskLevel || 'LOW RISK');

        const assessmentSummary =
          storedAnalysis?.assessment?.summary ||
          storedAnalysis?.intelligence?.overview ||
          storedAnalysis?.case?.assessmentSummary ||
          staticCase?.assessment?.summary ||
          'Create or receive a case to begin investigation.';

        const recommendedActions =
          storedAnalysis?.assessment?.recommendedActions ||
          storedAnalysis?.case?.recommendedActions ||
          staticCase?.assessment?.recommendedActions ||
          [];

        const keyEntities =
          storedAnalysis?.keyEntities ||
          analysisEntities.slice(0, 5);

        const assessment = hasAnalysis
          ? {
              riskLevel,
              assessmentId:
                storedAnalysis?.assessment?.assessmentId ||
                storedAnalysis?.analysisId ||
                `ASSESS-${row.case_number}`,
              summary: assessmentSummary,
              confidenceInterval: confidence,
              lcl: Math.max(0, confidence - 10),
              ucl: Math.min(100, confidence + 10),
              recommendedActions,
            }
          : (staticCase?.assessment || EMPTY_CASE.assessment);

        return {
          ...(staticCase || EMPTY_CASE),
          id: row.case_number,
          title: row.title || staticCase?.title || 'Untitled Case',
          summary: row.summary || staticCase?.summary || '',
          priority: row.priority || staticCase?.priority || 'MEDIUM',
          status: mappedStatus,
          progress: hasAnalysis ? 100 : (staticCase?.progress ?? 0),
          lastUpdated: row.updated_at ? new Date(row.updated_at).toLocaleString() : 'Recently',
          leadInvestigator: staticCase?.leadInvestigator || session.user.email || 'Current Investigator',
          entitiesCount: hasAnalysis ? analysisEntities.length : (staticCase?.entitiesCount ?? 0),
          evidenceCount: hasAnalysis ? analysisEvidence.length : (staticCase?.evidenceCount ?? 0),
          linksCount: hasAnalysis ? analysisRelationships.length : (staticCase?.linksCount ?? 0),
          keyEntities: keyEntities as any,
          assessment,
        };
      });

      setCases(mappedCases);
      setCaseDataOverrides(analysisMap);
      setCurrentCase((previousCase) => {
        const stillExists = mappedCases.find((item) => item.id === previousCase.id);
        return stillExists || mappedCases[0] || EMPTY_CASE;
      });
      setCasesLoading(false);
    };

    void loadCasesFromSupabase();

    return () => { cancelled = true; };
  }, [session?.user?.id]);


  /* =======================================================
     ALERT STATE
     Kept in memory only; it cannot leak between accounts.
  ======================================================= */

  /* =======================================================
     SELECTED CASE DATA
  ======================================================= */

  /* =======================================================
     SELECTED CASE DATA

     IMPORTANT FIX:
     Old localStorage can contain an empty analysis for a demo
     case. Using `override ?? staticData` makes that empty object
     hide the real CASE_LINKED_DATA.

     We now merge both sources and only let a meaningful stored
     analysis override the corresponding static data.
  ======================================================= */

  const selectedCaseData = useMemo(() => {

    const staticData: any =
      CASE_LINKED_DATA[currentCase.id] ?? {};

    const storedData: any =
      caseDataOverrides[currentCase.id] ?? {};

    const hasStoredAnalysis =
      Boolean(storedData?.analysisId) ||
      Boolean(storedData?.files?.length) ||
      Boolean(storedData?.entities?.length) ||
      Boolean(storedData?.relationships?.length) ||
      Boolean(storedData?.evidence?.length) ||
      Boolean(storedData?.events?.length) ||
      Boolean(storedData?.alerts?.length) ||
      Boolean(storedData?.timeline?.length) ||
      Boolean(storedData?.nodes?.length) ||
      Boolean(storedData?.edges?.length);

    const source = hasStoredAnalysis
      ? storedData
      : staticData;

    return {
      alerts: source.alerts ?? staticData.alerts ?? [],
      entities: source.entities ?? staticData.entities ?? [],
      relationships:
        source.relationships ??
        staticData.relationships ??
        [],
      nodes: source.nodes ?? staticData.nodes ?? [],
      edges: source.edges ?? staticData.edges ?? [],
      evidence: source.evidence ?? staticData.evidence ?? [],
      timeline: source.timeline ?? staticData.timeline ?? [],
      events: source.events ?? staticData.events ?? [],
      intelligence:
        source.intelligence ??
        staticData.intelligence ??
        {},
      anomalyAnalysis:
        source.anomalyAnalysis ??
        staticData.anomalyAnalysis ??
        {},
      evidenceAnalysis:
        source.evidenceAnalysis ??
        staticData.evidenceAnalysis ??
        {},
      networkAnalysis:
        source.networkAnalysis ??
        staticData.networkAnalysis ??
        {},
      files: source.files ?? staticData.files ?? [],
      analysisId:
        source.analysisId ??
        staticData.analysisId ??
        null,
      stats: source.stats ?? staticData.stats ?? {},
    };

  }, [
    currentCase.id,
    caseDataOverrides,
  ]);


  /* =======================================================
     DEBUG — VERY IMPORTANT
  ======================================================= */

  useEffect(() => {

    console.log(
      '========================================'
    );

    console.log(
      'TRACEX CURRENT CASE:',
      currentCase.id
    );

    console.log(
      'TRACEX SELECTED CASE DATA:',
      selectedCaseData
    );

    console.log(
      'TRACEX ENTITIES:',
      selectedCaseData.entities || []
    );

    console.log(
      'TRACEX RELATIONSHIPS:',
      selectedCaseData.relationships || []
    );

    console.log(
      '========================================'
    );

  }, [
    currentCase.id,
    selectedCaseData,
  ]);


  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const alerts =
    (
      selectedCaseData.alerts ??
      []
    ).map(
      (alert: any) => ({
        ...alert,
        ...(alertOverrides[
          alert.id
        ] || {}),
      })
    );


  const evidenceList =
    selectedCaseData.evidence ??
    [];


  const timeline =
    selectedCaseData.timeline ??
    [];


  const networkNodes =
    selectedCaseData.nodes ??
    [];


  const networkEdges =
    selectedCaseData.edges ??
    [];


  const entities =
    selectedCaseData.entities ??
    [];


  const relationships =
    selectedCaseData.relationships ??
    [];


  /* =======================================================
     CASE SELECTION
  ======================================================= */

  const handleSelectCase = (
    selectedCase: InvestigationCase
  ) => {

    setCurrentCase(
      selectedCase
    );

  };


  /* =======================================================
     DELETE CASE
  ======================================================= */

  const handleDeleteCase = async (
    caseId: string
  ) => {

    const caseToDelete =
      cases.find(
        (caseItem) =>
          caseItem.id ===
          caseId
      );


    if (!caseToDelete) {
      return;
    }


    const confirmed =
      window.confirm(
        `Delete case "${caseToDelete.title}"?\n\n` +
        `Case ID: ${caseToDelete.id}\n\n` +
        `This will permanently remove the case from your Supabase account.`
      );


    if (!confirmed) {
      return;
    }


    const { data: deletedRow, error: deleteError } = await supabase
      .from('cases')
      .delete()
      .eq('case_number', caseId)
      .select('id')
      .maybeSingle();

    if (deleteError) {
      console.error('TRACEX: Case deletion failed:', deleteError);
      alert(`Case deletion failed.

${deleteError.message}`);
      return;
    }

    if (!deletedRow) {
      alert('Case was not found or you do not have permission to delete it.');
      return;
    }

    const nextCases = cases.filter((caseItem) => caseItem.id !== caseId);
    setCases(nextCases);


    setCaseDataOverrides(
      (previousData) => {

        const updated = {
          ...previousData,
        };

        delete updated[caseId];

        return updated;
      }
    );


    setAlertOverrides(
      (previous) => {

        const updated = {
          ...previous,
        };


        const deletedCaseData =
          caseDataOverrides[
          caseId
          ];


        const caseAlerts =
          deletedCaseData?.alerts ??
          [];


        caseAlerts.forEach(
          (alert: any) => {

            delete updated[
              alert.id
            ];

          }
        );


        return updated;
      }
    );


    setCurrentCase(nextCases[0] || EMPTY_CASE);


    setIsCaseSelectorOpen(
      false
    );


    setActiveView(
      'command-center'
    );


    console.log(
      `TRACEX: Case ${caseId} deleted successfully.`
    );

  };


  /* =======================================================
     CREATE + ANALYZE CASE
  ======================================================= */

  const handleCreateCase = async (
    data: {
      title: string;
      summary: string;
      priority:
      | 'HIGH'
      | 'MEDIUM'
      | 'LOW';
      status:
      | 'ACTIVE'
      | 'PENDING_REVIEW';
      leadInvestigator: string;
      files: File[];
    }
  ) => {

    try {

      /* ---------------------------------------------------
         VALIDATION
      --------------------------------------------------- */

      if (
        !data.files ||
        data.files.length === 0
      ) {

        alert(
          'Please upload at least one case file before creating the case.'
        );

        return;
      }


      /* ---------------------------------------------------
         GENERATE UNIQUE CASE ID
      --------------------------------------------------- */

      const caseNumbers =
        cases
          .map(
            (caseItem) => {

              const match =
                caseItem.id.match(
                  /CN-\d{4}-(\d+)/
                );


              return match
                ? Number(match[1])
                : 0;
            }
          )
          .filter(
            (number) =>
              Number.isFinite(
                number
              )
          );


      const highestCaseNumber =
        caseNumbers.length > 0
          ? Math.max(
            ...caseNumbers
          )
          : 143;


      const nextCaseNumber =
        highestCaseNumber + 1;


      const caseId =
        `CN-2026-${String(
          nextCaseNumber
        ).padStart(4, '0')}`;


      /* ---------------------------------------------------
         FORM DATA
      --------------------------------------------------- */

      const formData =
        new FormData();


      formData.append(
        'title',
        data.title
      );


      formData.append(
        'summary',
        data.summary
      );


      formData.append(
        'priority',
        data.priority
      );


      formData.append(
        'status',
        data.status
      );


      formData.append(
        'leadInvestigator',
        data.leadInvestigator
      );


      data.files.forEach(
        (file) => {

          formData.append(
            'files',
            file
          );

        }
      );


      console.log(
        'TRACEX: Starting case ingestion...',
        {
          caseId,
          files:
            data.files.map(
              (file) =>
                file.name
            ),
        }
      );


      /* ---------------------------------------------------
         BACKEND
      --------------------------------------------------- */

      const response =
        await fetch(
          `${(import.meta.env.VITE_API_BASE_URL as string | undefined) || `${window.location.protocol}//${window.location.hostname}:5173`}/api/cases/analyze`,
          {
            method: 'POST',
            body: formData,
          }
        );


      if (!response.ok) {

        let errorMessage =
          `Case analysis failed with HTTP ${response.status}`;


        try {

          const errorData =
            await response.json();


          errorMessage =
            errorData?.details ||
            errorData?.error ||
            errorMessage;

        } catch {
          // Keep default error.
        }


        throw new Error(
          errorMessage
        );
      }


      const result =
        await response.json();


      console.log(
        'TRACEX: Backend analysis received:',
        result
      );


      const analysis =
        result?.analysis ??
        {};


      /* ---------------------------------------------------
         NORMALIZE NODE TYPE
      --------------------------------------------------- */

      const normalizeNodeType = (
        type: string
      ) => {

        const value =
          String(type || '')
            .toLowerCase();


        if (
          value.includes(
            'person'
          )
        ) {
          return 'person';
        }


        if (
          value.includes(
            'phone'
          ) ||
          value.includes(
            'telecom'
          )
        ) {
          return 'phone';
        }


        if (
          value.includes(
            'account'
          ) ||
          value.includes(
            'bank'
          ) ||
          value.includes(
            'financial'
          )
        ) {
          return 'bank';
        }


        if (
          value.includes(
            'vehicle'
          ) ||
          value.includes(
            'car'
          )
        ) {
          return 'vehicle';
        }


        if (
          value.includes(
            'organization'
          ) ||
          value.includes(
            'organisation'
          ) ||
          value === 'org'
        ) {
          return 'org';
        }


        return 'person';
      };


      /* ---------------------------------------------------
         ENTITIES → GRAPH NODES
      --------------------------------------------------- */

      const nodes =
        (
          analysis.entities ??
          []
        ).map(
          (
            entity: any,
            index: number
          ) => ({

            id:
              entity.id ||
              `ENTITY-${index + 1}`,

            type:
              normalizeNodeType(
                entity.type
              ),

            label:
              entity.name ||
              entity.identifier ||
              entity.id ||
              `Entity ${index + 1}`,

            sublabel:
              entity.role ||
              entity.identifier ||
              entity.location ||
              entity.type ||
              '',

            isTarget:
              Boolean(
                entity.isTarget ??
                index === 0
              ),

            confidence:
              Number(
                entity.confidence ??
                0
              ),

          })
        );


      /* ---------------------------------------------------
         RELATIONSHIPS → GRAPH EDGES
      --------------------------------------------------- */

      const edges =
        (
          analysis.relationships ??
          []
        ).map(
          (
            relationship: any,
            index: number
          ) => ({

            id:
              relationship.id ||
              `EDGE-${index + 1}`,

            source:
              relationship.source ||
              '',

            target:
              relationship.target ||
              '',

            label:
              relationship.relationship ||
              'ASSOCIATED',

            relationship:
              relationship.relationship ||
              'ASSOCIATED',

            sourceReference:
              relationship.sourceReference ||
              '',

            confidence:
              Number(
                relationship.confidence ??
                0
              ),

            verificationStatus:
              relationship.verificationStatus ||
              'UNVERIFIED',

          })
        );


      /* ---------------------------------------------------
         ALERTS
      --------------------------------------------------- */

      const generatedAlerts =
        (
          analysis.alerts ??
          []
        ).map(
          (
            alert: any,
            index: number
          ) => ({

            id:
              alert.id ||
              `ALT-${Date.now()}-${index}`,

            severity:
              alert.severity ||
              'MEDIUM',

            title:
              alert.title ||
              'AI-Generated Investigative Lead',

            description:
              alert.description ||
              '',

            targetCase:
              caseId,

            relatedEntities:
              alert.relatedEntities ||
              [],

            sourceReference:
              alert.sourceReference ||
              '',

            confidence:
              Number(
                alert.confidence ??
                0
              ),

            acknowledged:
              false,

          })
        );


      /* ---------------------------------------------------
         CASE ANALYSIS
      --------------------------------------------------- */

      const analyzedPriority =
        (
          analysis.case?.priority ||
          data.priority
        ) as
        | 'HIGH'
        | 'MEDIUM'
        | 'LOW';


      const rawRiskLevel =
        String(
          analysis.case?.riskLevel ||
          ''
        );


      const riskLevel =
        rawRiskLevel ===
          'HIGH RISK DETECTED'
          ? 'HIGH RISK DETECTED'
          : rawRiskLevel ===
            'ELEVATED RISK'
            ? 'ELEVATED RISK'
            : 'LOW RISK';


      const confidence =
        Number(
          analysis.case?.confidence ??
          0
        );


      /* ---------------------------------------------------
         FALLBACK KEY ENTITIES
         
         If Gemini doesn't provide keyEntities but DOES
         provide entities, use those entities.
      --------------------------------------------------- */

      const keyEntities =
        (
          analysis.keyEntities &&
          analysis.keyEntities.length > 0
        )
          ? analysis.keyEntities
          : (
            analysis.entities ??
            []
          ).slice(
            0,
            10
          ).map(
            (
              entity: any,
              index: number
            ) => ({

              id:
                entity.id ||
                `ENTITY-${index + 1}`,

              name:
                entity.name ||
                entity.identifier ||
                `Entity ${index + 1}`,

              type:
                normalizeNodeType(
                  entity.type
                ),

              tag:
                entity.type ||
                'ENTITY',

              role:
                entity.role ||
                'Investigation Entity',

              location:
                entity.location,

              isPrimary:
                Boolean(
                  entity.isTarget ??
                  index === 0
                ),

            })
          );


      /* ---------------------------------------------------
         NEW CASE
      --------------------------------------------------- */

      const newCase:
        InvestigationCase = {

        id:
          caseId,

        title:
          analysis.case?.title ||
          data.title,

        status:
          data.status,

        priority:
          analyzedPriority,

        progress:
          100,

        summary:
          analysis.case?.summary ||
          data.summary,

        lastUpdated:
          'Just now',

        leadInvestigator:
          data.leadInvestigator,

        entitiesCount:
          (
            analysis.entities ??
            []
          ).length,

        evidenceCount:
          (
            analysis.evidence ??
            []
          ).length,

        linksCount:
          (
            analysis.relationships ??
            []
          ).length,

        keyEntities:
          keyEntities as any,

        recentActivity:
          [],

        assessment: {

          riskLevel,

          assessmentId:
            `ASSESS-${Date.now()}`,

          summary:
            analysis.case
              ?.assessmentSummary ||
            'AI-assisted case assessment generated from the uploaded case material.',

          confidenceInterval:
            confidence,

          lcl:
            Math.max(
              0,
              confidence - 10
            ),

          ucl:
            Math.min(
              100,
              confidence + 10
            ),

          recommendedActions:
            analysis.case
              ?.recommendedActions ??
            [
              'Review extracted entities',
              'Verify relationships against source records',
              'Perform human verification',
            ],

        },
      };


      /* ---------------------------------------------------
         SAVE COMPLETE CASE DATA
      --------------------------------------------------- */

      const completeCaseData = {

        entities:
          analysis.entities ??
          [],

        relationships:
          analysis.relationships ??
          [],

        nodes,

        edges,

        alerts:
          generatedAlerts,

        evidence:
          analysis.evidence ??
          [],

        timeline:
          analysis.timeline ??
          [],

        events:
          analysis.events ??
          [],

        intelligence:
          analysis.intelligence ??
          {},

        anomalyAnalysis:
          analysis.anomalyAnalysis ??
          {},

        evidenceAnalysis:
          analysis.evidenceAnalysis ??
          {},

        networkAnalysis:
          analysis.networkAnalysis ??
          {},

        files:
          result.files ??
          data.files.map(
            (file) => ({
              name:
                file.name,
              size:
                file.size,
              type:
                file.type,
              lastModified:
                file.lastModified,
            })
          ),

        analysisId:
          result.analysisId ??
          null,

        stats:
          result.stats ??
          {
            entities:
              (
                analysis.entities ??
                []
              ).length,

            relationships:
              (
                analysis.relationships ??
                []
              ).length,

            evidence:
              (
                analysis.evidence ??
                []
              ).length,

            events:
              (
                analysis.events ??
                []
              ).length,

            alerts:
              generatedAlerts.length,

            timeline:
              (
                analysis.timeline ??
                []
              ).length,
          },

      };


      console.log(
        'TRACEX: COMPLETE CASE DATA SAVED:',
        {
          caseId,
          entities:
            completeCaseData.entities.length,
          relationships:
            completeCaseData.relationships.length,
          evidence:
            completeCaseData.evidence.length,
          alerts:
            completeCaseData.alerts.length,
          timeline:
            completeCaseData.timeline.length,
        }
      );


      /* ---------------------------------------------------
         PERSIST CASE + ANALYSIS IN SUPABASE

         assigned_to is always the authenticated user's id.
         RLS prevents another user from reading this case.
      --------------------------------------------------- */

      const dbStatus = data.status === 'ACTIVE' ? 'IN PROGRESS' : 'OPEN';

      const { data: insertedCase, error: caseInsertError } = await supabase
        .from('cases')
        .insert({
          case_number: caseId,
          title: newCase.title,
          summary: newCase.summary,
          priority: newCase.priority,
          status: dbStatus,
          assigned_to: session.user.id,
        })
        .select('id,case_number,title,summary,priority,status,assigned_to,created_at,updated_at')
        .single();

      if (caseInsertError || !insertedCase) {
        throw new Error(caseInsertError?.message || 'Unable to save the case to Supabase.');
      }

      const { error: analysisInsertError } = await supabase
        .from('case_analysis')
        .upsert({
          case_id: insertedCase.id,
          data: completeCaseData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'case_id' });

      if (analysisInsertError) {
        await supabase.from('cases').delete().eq('id', insertedCase.id);
        throw new Error(`Case metadata was saved but analysis persistence failed: ${analysisInsertError.message}`);
      }

      /* ---------------------------------------------------
         UPDATE STATE
      --------------------------------------------------- */

      setCaseDataOverrides(
        (previousData) => ({

          ...previousData,

          [caseId]:
            completeCaseData,

        })
      );


      setCases(
        (previousCases) => [
          newCase,
          ...previousCases,
        ]
      );


      setCurrentCase(
        newCase
      );


      setAlertOverrides(
        {}
      );


      /*
        IMPORTANT:
        Open COMMAND CENTER after analysis.
      */

      setActiveView(
        'command-center'
      );


      setIsNewCaseOpen(
        false
      );


      console.log(
        `TRACEX: ${caseId} successfully ingested.`
      );


    } catch (
    error: any
    ) {

      console.error(
        'TRACEX case ingestion failed:',
        error
      );


      alert(
        `Case analysis failed.\n\n${error?.message ||
        'Unknown backend error.'
        }`
      );

    }

  };


  /* =======================================================
     ACKNOWLEDGE ALERTS
  ======================================================= */

  const handleAcknowledgeAllAlerts =
    () => {

      setAlertOverrides(
        (previous) => {

          const updated = {
            ...previous,
          };


          alerts.forEach(
            (alert: any) => {

              updated[
                alert.id
              ] = {

                ...updated[
                alert.id
                ],

                acknowledged:
                  true,

              };

            }
          );


          return updated;

        }
      );

    };


  /* =======================================================
     DEEP SCAN
  ======================================================= */

  const handleTriggerDeepScan =
    async () => {

      setIsDeepScanOpen(
        true
      );

      setIsScanning(
        true
      );

      setDeepScanResult(
        null
      );


      try {

        const caseData = {

          case:
            currentCase,

          entities,

          relationships,

          nodes:
            networkNodes,

          edges:
            networkEdges,

          alerts,

          evidence:
            evidenceList,

          timeline,

          events:
            selectedCaseData.events ??
            [],

          intelligence:
            selectedCaseData.intelligence ??
            {},

          anomalyAnalysis:
            selectedCaseData.anomalyAnalysis ??
            {},

          evidenceAnalysis:
            selectedCaseData.evidenceAnalysis ??
            {},

          networkAnalysis:
            selectedCaseData.networkAnalysis ??
            {},

          files:
            selectedCaseData.files ??
            [],

          stats:
            selectedCaseData.stats ??
            {},

        };


        console.log(
          'TRACEX: Starting deep investigation scan',
          {
            caseId:
              currentCase.id,

            entities:
              entities.length,

            relationships:
              relationships.length,

            nodes:
              networkNodes.length,

            edges:
              networkEdges.length,

            alerts:
              alerts.length,

            evidence:
              evidenceList.length,

            timeline:
              timeline.length,
          }
        );


        const response =
          await fetch(
            `${(import.meta.env.VITE_API_BASE_URL as string | undefined) || `${window.location.protocol}//${window.location.hostname}:5173`}/api/intelligence/deep-scan`,
            {

              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  caseId:
                    currentCase.id,

                  caseData,
                }),

            }
          );


        if (!response.ok) {

          let errorMessage =
            `Deep scan failed with HTTP ${response.status}`;


          try {

            const errorData =
              await response.json();


            errorMessage =
              errorData?.details ||
              errorData?.error ||
              errorMessage;

          } catch {
            // Keep default error.
          }


          throw new Error(
            errorMessage
          );

        }


        const data =
          await response.json();


        console.log(
          'TRACEX: Deep scan result:',
          data
        );


        setDeepScanResult(
          data
        );


      } catch (
      error: any
      ) {

        console.error(
          'TRACEX deep scan request failed:',
          error
        );


        setDeepScanResult({

          scanId:
            `SCAN-${Date.now()
              .toString(36)
              .toUpperCase()}`,

          caseId:
            currentCase.id,

          summary:
            'Deep scan service is currently unavailable. No new investigative finding was generated.',

          networkBridges:
            [],

          relationshipPatterns:
            [],

          timelinePatterns:
            [],

          evidenceCorrelations:
            [],

          anomalies:
            [],

          riskIndicators:
            [],

          investigativeGaps:
            [
              error?.message ||
              'Unable to complete deep scan.',
            ],

          priorityFindings:
            [],

          verificationSteps:
            [],

          confidence:
            0,

          error:
            error?.message ||
            'Unknown deep scan error.',

        });

      } finally {

        setIsScanning(
          false
        );

      }

    };


  /* =======================================================
     ALERT COUNT
  ======================================================= */

  const unreadAlertsCount =
    alerts.filter(
      (alert: any) =>
        !alert.acknowledged
    ).length;


  /* =======================================================
     AUTH GATE + RENDER
  ======================================================= */

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-cyan-400 font-black text-3xl tracking-[0.2em]">
            TRACEX
          </div>
          <div className="mt-3 text-xs font-mono text-slate-500 tracking-widest">
            AUTHENTICATING...
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthView
        onAuthenticated={() => {
          // Supabase auth state listener updates the session.
        }}
      />
    );
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('TRACEX logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (

    <div className="
      flex
      h-screen
      w-screen
      bg-[#0B0C10]
      text-[#dde4e2]
      overflow-hidden
      select-none
      font-sans
    ">


      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <Sidebar

        activeView={
          activeView
        }

        onSelectView={
          (view) =>
            setActiveView(
              view
            )
        }

        onOpenSystemStatus={() =>
          setIsSystemStatusOpen(
            true
          )
        }

        unreadAlertsCount={
          unreadAlertsCount
        }

      />


      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="
        flex-1
        ml-64
        flex
        flex-col
        h-screen
        overflow-hidden
        relative
      ">

        {/* =================================================
            AUTHENTICATED USER MENU
            Only the real user's name is visible in the header.
            Clicking the name opens Profile + Sign Out.
        ================================================= */}
        <div className="fixed top-0 right-0 z-[9999] h-14 w-[250px] border-l border-[#182725] bg-[#070D0C]">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((open) => !open)}
            className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[#111B19]"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            <span className="h-2 w-2 rounded-full bg-[#66FCF1] shadow-[0_0_8px_rgba(102,252,241,0.75)]" />
            <span className="max-w-[145px] truncate text-[11px] font-bold tracking-[0.03em] text-[#EAF1EF]">
              {profileName || 'INVESTIGATOR'}
            </span>
            <span className="material-symbols-outlined text-[17px] text-[#6F8580]">
              {isUserMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isUserMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close user menu"
                onClick={() => setIsUserMenuOpen(false)}
                className="fixed inset-0 z-[-1] cursor-default"
              />

              <div
                role="menu"
                className="absolute right-4 top-[58px] w-[230px] overflow-hidden rounded-xl border border-[#29423E] bg-[#0B1211] shadow-[0_16px_45px_rgba(0,0,0,0.55)]"
              >
                <div className="border-b border-[#1C2D2A] px-4 py-3">
                  <div className="text-[8px] font-mono font-bold tracking-[0.18em] text-[#5E7772]">CURRENT USER</div>
                  <div className="mt-1 truncate text-[13px] font-bold text-white">
                    {profileName || 'INVESTIGATOR'}
                  </div>
                  <div className="mt-0.5 truncate text-[9px] font-mono text-[#66FCF1]">
                    {session?.user?.email || ''}
                  </div>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[10px] font-bold tracking-[0.12em] text-[#C7D3D0] transition-colors hover:bg-[#111D1B] hover:text-white"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#66FCF1]">person</span>
                  PROFILE
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await handleLogout();
                  }}
                  className="flex w-full items-center gap-3 border-t border-[#1C2D2A] px-4 py-3 text-left text-[10px] font-bold tracking-[0.12em] text-[#FF9B91] transition-colors hover:bg-[#241414] hover:text-[#FFB0A8]"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  SIGN OUT
                </button>
              </div>
            </>
          )}
        </div>

        {/* =================================================
            HEADER
        ================================================= */}

        <Header

          currentCase={
            currentCase
          }

          onOpenCaseSelector={() =>
            setIsCaseSelectorOpen(
              true
            )
          }

          onOpenAlerts={() =>
            setActiveView(
              'alerts'
            )
          }

          onOpenSettings={() =>
            setIsSystemStatusOpen(
              true
            )
          }

          searchQuery={
            searchQuery
          }

          onSearchChange={
            setSearchQuery
          }

          showSearch={
            activeView ===
            'network' ||
            activeView ===
            'entities'
          }

        />


        {/* =================================================
            MAIN
        ================================================= */}

        <main className="
          flex-1
          mt-14
          p-5
          overflow-hidden
          flex
          flex-col
        ">

          {casesLoading && (
            <div className="absolute inset-0 z-40 bg-[#0B0C10]/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="text-cyan-300 font-black tracking-[0.25em]">TRACEX</div>
                <div className="mt-2 text-[10px] font-mono text-slate-500 tracking-widest">LOADING ASSIGNED CASES...</div>
              </div>
            </div>
          )}

          {!casesLoading && caseLoadError && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              Unable to load your cases from Supabase: {caseLoadError}
            </div>
          )}


          {/* =================================================
              COMMAND CENTER
          ================================================= */}

          {activeView ===
            'command-center' && (

              <CommandCenterView

                cases={
                  cases
                }

                currentCase={
                  currentCase
                }

                onSelectCase={
                  (caseItem) => {

                    handleSelectCase(
                      caseItem
                    );

                    setActiveView(
                      'investigations'
                    );

                  }
                }

                onNavigate={
                  (view) =>
                    setActiveView(
                      view
                    )
                }

                onCreateCase={() =>
                  setIsNewCaseOpen(
                    true
                  )
                }

              />

            )}


          {/* =================================================
              INVESTIGATION
          ================================================= */}

          {activeView ===
            'investigations' && (

              <CaseInvestigationView

                currentCase={
                  currentCase
                }

                /* PASS THE ACTUAL CASE ANALYSIS INTO THE VIEW */
                analysis={
                  selectedCaseData
                }

                onNavigate={
                  (view) =>
                    setActiveView(
                      view
                    )
                }

                onOpenExportDossier={() =>
                  setIsExportOpen(
                    true
                  )
                }

                onOpenSubpoenaModal={() =>
                  setIsSubpoenaOpen(
                    true
                  )
                }

                onTriggerDeepScan={
                  handleTriggerDeepScan
                }

                isScanning={
                  isScanning
                }

              />

            )}


          {/* =================================================
              NETWORK
          ================================================= */}

          {activeView ===
            'network' && (

              <NetworkIntelligenceView

                dossier={
                  dossier
                }

                nodes={
                  networkNodes
                }

                edges={
                  networkEdges
                }

                onOpenCompleteDossier={() =>
                  setIsExportOpen(
                    true
                  )
                }

              />

            )}


          {/* =================================================
              ALERTS
          ================================================= */}

          {activeView ===
            'alerts' && (

              <AlertsCopilotView

                alerts={
                  alerts
                }

                currentCase={
                  currentCase
                }

                onAcknowledgeAll={
                  handleAcknowledgeAllAlerts
                }

                onSelectAlert={
                  (alert: any) => {

                    if (
                      alert.targetCase
                    ) {

                      const matchedCase =
                        cases.find(
                          (caseItem) =>
                            caseItem.id ===
                            alert.targetCase
                        );


                      if (
                        matchedCase
                      ) {

                        handleSelectCase(
                          matchedCase
                        );

                      }

                    }

                  }
                }

                onNavigate={
                  (view) =>
                    setActiveView(
                      view
                    )
                }

              />

            )}


          {/* =================================================
              EVIDENCE
          ================================================= */}

          {activeView ===
            'evidence' && (

              <EvidenceVaultView

                evidenceList={
                  evidenceList
                }

                currentCase={
                  currentCase
                }

                onSelectEvidence={() =>
                  setIsExportOpen(
                    true
                  )
                }

              />

            )}


          {/* =================================================
              LIVE ENTITIES REGISTRY
          ================================================= */}

          {activeView ===
            'entities' && (

              <LiveEntitiesRegistry

                entities={
                  entities
                }

                relationships={
                  relationships
                }

                currentCase={
                  currentCase
                }

                onSelectEntity={
                  (entity) => {

                    console.log(
                      'TRACEX: Selected entity:',
                      entity
                    );

                    setActiveView(
                      'network'
                    );

                  }
                }

                onNavigate={
                  (view) =>
                    setActiveView(
                      view
                    )
                }

              />

            )}


          {/* =================================================
              TIMELINE
          ================================================= */}

          {activeView ===
            'timeline' && (

              <TimelineView

                timeline={
                  timeline
                }

                currentCase={
                  currentCase
                }

              />

            )}


          {/* =================================================
              REPORTS
          ================================================= */}

          {activeView ===
            'reports' && (

              <ReportsView

                currentCase={
                  currentCase
                }

                onOpenExportDossier={() =>
                  setIsExportOpen(
                    true
                  )
                }

              />

            )}


          {/* =================================================
              INTELLIGENCE
          ================================================= */}

          {activeView ===
            'intelligence' && (

              <IntelligenceView

                currentCase={
                  currentCase
                }

                onNavigate={
                  (view) =>
                    setActiveView(
                      view
                    )
                }

                alerts={
                  alerts
                }

                relationships={
                  relationships
                }

                entities={
                  entities
                }

                evidence={
                  evidenceList
                }

                timeline={
                  timeline
                }

                nodes={
                  networkNodes
                }

                edges={
                  networkEdges
                }

                intelligence={
                  selectedCaseData.intelligence
                }

                networkAnalysis={
                  selectedCaseData.networkAnalysis
                }

                anomalyAnalysis={
                  selectedCaseData.anomalyAnalysis
                }

              />

            )}

        </main>

      </div>


      {/* =====================================================
          NEW CASE MODAL
      ===================================================== */}

      <NewCaseModal

        isOpen={
          isNewCaseOpen
        }

        onClose={() =>
          setIsNewCaseOpen(
            false
          )
        }

        onCreateCase={
          handleCreateCase
        }

      />


      {/* =====================================================
          SUBPOENA
      ===================================================== */}

      <SubpoenaDraftModal

        isOpen={
          isSubpoenaOpen
        }

        onClose={() =>
          setIsSubpoenaOpen(
            false
          )
        }

        currentCase={
          currentCase
        }

      />


      {/* =====================================================
          EXPORT
      ===================================================== */}

      <ExportDossierModal

        isOpen={
          isExportOpen
        }

        onClose={() =>
          setIsExportOpen(
            false
          )
        }

        currentCase={
          currentCase
        }

      />


      {/* =====================================================
          CASE SELECTOR
      ===================================================== */}

      <CaseSelectorModal

        isOpen={
          isCaseSelectorOpen
        }

        onClose={() =>
          setIsCaseSelectorOpen(
            false
          )
        }

        cases={
          cases
        }

        currentCaseId={
          currentCase.id
        }

        onSelectCase={
          handleSelectCase
        }

      />


      {/* =====================================================
          DEEP SCAN
      ===================================================== */}

      <DeepScanProgressModal

        isOpen={
          isDeepScanOpen
        }

        onClose={() =>
          setIsDeepScanOpen(
            false
          )
        }

        scanData={
          deepScanResult
        }

        isScanning={
          isScanning
        }

      />


      {/* =====================================================
          SYSTEM STATUS
      ===================================================== */}

      <SystemStatusModal

        isOpen={
          isSystemStatusOpen
        }

        onClose={() =>
          setIsSystemStatusOpen(
            false
          )
        }

      />


      {/* =====================================================
          DELETE CURRENT CASE
      ===================================================== */}

      {cases.length > 0 && (

        <button

          type="button"

          onClick={() =>
            handleDeleteCase(
              currentCase.id
            )
          }

          className="
            fixed
            bottom-5
            right-5
            z-[90]
            px-4
            py-2.5
            rounded-lg
            border
            border-[#ff6b6b]/40
            bg-[#111817]
            text-[#ff8f8f]
            hover:text-white
            hover:border-[#ff6b6b]
            hover:bg-[#2a1515]
            transition-all
            font-mono
            text-[9px]
            font-bold
            tracking-widest
          "

        >

          DELETE CURRENT CASE

        </button>

      )}

    </div>

  );
}


export default App;