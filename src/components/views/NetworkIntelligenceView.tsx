import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ForensicDossierEntity,
  GraphNode,
  GraphEdge,
} from '../../types';

interface NetworkIntelligenceViewProps {
  dossier: ForensicDossierEntity;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onOpenCompleteDossier: () => void;
}

/* =========================================================
   NODE CONFIG
========================================================= */

const NODE_CONFIG: Record<
  string,
  {
    color: string;
    icon: string;
    label: string;
  }
> = {
  person: {
    color: '#66FCF1',
    icon: 'person_search',
    label: 'PERSON',
  },
  phone: {
    color: '#F6B352',
    icon: 'smartphone',
    label: 'TELECOM',
  },
  bank: {
    color: '#ffb4ab',
    icon: 'account_balance',
    label: 'FINANCIAL',
  },
  vehicle: {
    color: '#dec74a',
    icon: 'directions_car',
    label: 'VEHICLE',
  },
  org: {
    color: '#a1fcf7',
    icon: 'business',
    label: 'ORGANIZATION',
  },
};

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value?: string) =>
  String(value || '').trim().toUpperCase();

const getNodeConfig = (type?: string) =>
  NODE_CONFIG[String(type || '').toLowerCase()] ||
  NODE_CONFIG.person;

const getEdgeColor = (edge: GraphEdge) => {
  const relationship = normalize(
    edge.relationship || edge.label
  );

  if (
    relationship.includes('TRANSFER') ||
    relationship.includes('PAYMENT') ||
    relationship.includes('FINANC')
  ) {
    return '#ffb4ab';
  }

  if (
    relationship.includes('CALL') ||
    relationship.includes('EMAIL') ||
    relationship.includes('MESSAGE') ||
    relationship.includes('COMM') ||
    relationship.includes('CONTACT') ||
    relationship.includes('RECEIVED')
  ) {
    return '#F6B352';
  }

  if (
    relationship.includes('OWN') ||
    relationship.includes('VEHICLE')
  ) {
    return '#dec74a';
  }

  if (
    relationship.includes('ASSOCIAT') ||
    relationship.includes('LINK') ||
    relationship.includes('RESOLVE')
  ) {
    return '#66FCF1';
  }

  return edge.color || '#66FCF1';
};

const isConfirmedEdge = (edge: GraphEdge) => {
  const status = normalize(edge.verificationStatus);

  if (
    status === 'VERIFIED' ||
    status === 'REVIEWED' ||
    status === 'CONFIRMED'
  ) {
    return true;
  }

  if (
    status === 'UNVERIFIED' ||
    status === 'SUSPECTED'
  ) {
    return false;
  }

  return edge.style === 'solid';
};

const matchesFilter = (
  edge: GraphEdge,
  nodes: GraphNode[],
  filter:
    | 'ALL'
    | 'CONFIRMED'
    | 'FINANCIAL'
    | 'COMMS'
) => {
  if (filter === 'ALL') return true;

  if (filter === 'CONFIRMED') {
    return isConfirmedEdge(edge);
  }

  const source = nodes.find(
    (n) => n.id === edge.source
  );

  const target = nodes.find(
    (n) => n.id === edge.target
  );

  const relationship = normalize(
    edge.relationship || edge.label
  );

  if (filter === 'FINANCIAL') {
    return (
      source?.type === 'bank' ||
      target?.type === 'bank' ||
      relationship.includes('TRANSFER') ||
      relationship.includes('PAYMENT') ||
      relationship.includes('FINANC')
    );
  }

  if (filter === 'COMMS') {
    return (
      source?.type === 'phone' ||
      target?.type === 'phone' ||
      relationship.includes('CALL') ||
      relationship.includes('EMAIL') ||
      relationship.includes('MESSAGE') ||
      relationship.includes('COMM') ||
      relationship.includes('CONTACT') ||
      relationship.includes('RECEIVED')
    );
  }

  return true;
};

/* =========================================================
   AUTOMATIC GRAPH LAYOUT
   =========================================================
   calculateGraphLayout is the single source of truth for
   where every node is drawn on screen. It never reads x/y
   off the incoming GraphNode data (that field is ignored
   entirely) — instead it:

     1. Finds the primary target entity.
     2. Builds an adjacency map from the edges.
     3. Runs a breadth-first search from the target to assign
        every node a "degree ring" (0 = target, 1 = direct
        relationships, 2 = second-degree, etc). Nodes that
        aren't reachable from the target (disconnected
        sub-graphs) get pushed onto their own outer ring
        instead of colliding at the center.
     4. Places the target dead-center and distributes each
        ring's nodes evenly around a circle.
     5. Runs a short collision-relaxation pass so that no two
        node cards can ever end up closer than a fixed
        minimum distance apart, and clamps every non-target
        node back inside the visible canvas.

   Because everything is derived from graph structure + the
   pixel size of the canvas, this works for any number of
   nodes/edges, recalculates automatically when the window
   resizes, when the active filter hides nodes/edges, and
   when the case data changes.
========================================================= */

export interface LayoutPoint {
  x: number;
  y: number;
}

// Visual footprint of a node (icon + card together).
const CARD_WIDTH = 170;
const CARD_HEIGHT = 145;

// Minimum edge-to-edge breathing room we want between two node
// cards (requirement: 80-120px visual separation).
const NODE_GAP = 100;

// Minimum allowed distance between the centers of any two nodes.
const MIN_SEPARATION = CARD_WIDTH + NODE_GAP;

// Minimum radial distance between successive degree rings. This is
// kept >= MIN_SEPARATION so that even a ring's very first node is
// never closer to the (fixed, centered) target than the minimum
// separation distance.
const RING_GAP = MIN_SEPARATION;

// Keep clear of the on-canvas chrome (zoom controls, filter bar,
// entity counter up top; legend panel at the bottom-left).
const CANVAS_PADDING_X = 120;
const CANVAS_PADDING_TOP = 100;
const CANVAS_PADDING_BOTTOM = 170;

const clamp = (value: number, lo: number, hi: number) =>
  Math.min(Math.max(value, lo), hi);

export const calculateGraphLayout = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): Map<string, LayoutPoint> => {
  const positions = new Map<string, LayoutPoint>();

  if (!nodes.length) return positions;

  const safeWidth = Math.max(
    width,
    CARD_WIDTH * 2 + CANVAS_PADDING_X * 2
  );

  const safeHeight = Math.max(
    height,
    CARD_HEIGHT * 2 + CANVAS_PADDING_TOP + CANVAS_PADDING_BOTTOM
  );

  const nodeIds = new Set(nodes.map((n) => n.id));

  /* ---------- adjacency ---------- */

  const adjacency = new Map<string, Set<string>>();
  nodes.forEach((n) => adjacency.set(n.id, new Set()));

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return;
    }
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  /* ---------- target / root ---------- */

  const target = nodes.find((n) => n.isTarget) || nodes[0];

  /* ---------- BFS degree levels from target ---------- */

  const level = new Map<string, number>();
  level.set(target.id, 0);

  const queue: string[] = [target.id];

  while (queue.length) {
    const current = queue.shift() as string;
    const currentLevel = level.get(current) ?? 0;

    Array.from(adjacency.get(current) || []).forEach((neighborId) => {
      if (!level.has(neighborId)) {
        level.set(neighborId, currentLevel + 1);
        queue.push(neighborId);
      }
    });
  }

  // Anything unreachable from the target (a disconnected sub-graph)
  // still needs a ring so it never lands on top of another node.
  const knownLevels = Array.from(level.values());
  const maxKnownLevel = knownLevels.length ? Math.max(...knownLevels) : 0;

  nodes.forEach((n) => {
    if (!level.has(n.id)) {
      level.set(n.id, maxKnownLevel + 1);
    }
  });

  const maxLevel = Math.max(...Array.from(level.values()), 0);

  /* ---------- group nodes by ring ---------- */

  const byLevel = new Map<number, GraphNode[]>();
  nodes.forEach((n) => {
    const l = level.get(n.id) ?? 0;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l)?.push(n);
  });

  /* ---------- usable canvas geometry ---------- */

  const usableWidth = safeWidth - CANVAS_PADDING_X * 2;
  const usableHeight =
    safeHeight - CANVAS_PADDING_TOP - CANVAS_PADDING_BOTTOM;

  const centerX = CANVAS_PADDING_X + usableWidth / 2;
  const centerY = CANVAS_PADDING_TOP + usableHeight / 2;

  // The canvas is usually much wider than it is tall (a side panel
  // eats into the width, but height is capped by the viewport), so a
  // perfect circle would get clipped top/bottom. Cap the radius
  // independently per axis so the layout hugs the canvas's actual
  // aspect ratio instead — an ellipse rather than a circle.
  const maxRadiusX = Math.max(
    usableWidth / 2 - CARD_WIDTH / 2,
    MIN_SEPARATION
  );
  const maxRadiusY = Math.max(
    usableHeight / 2 - CARD_HEIGHT / 2,
    MIN_SEPARATION
  );

  /* ---------- place target dead-center ---------- */

  positions.set(target.id, { x: centerX, y: centerY });

  /* ---------- place every ring around it ---------- */

  for (let l = 1; l <= maxLevel; l++) {
    const ringNodes = byLevel.get(l) || [];
    if (!ringNodes.length) continue;

    const count = ringNodes.length;

    // Radius large enough that this ring's own cards don't
    // collide with each other, no matter how many share it.
    const circumferenceNeeded = count * MIN_SEPARATION;
    const spacingRadius = circumferenceNeeded / (2 * Math.PI);

    const desiredRadius = Math.max(RING_GAP * l, spacingRadius);

    // Scale that desired radius down per axis so it never exceeds
    // what this ring's slice of the canvas can actually hold.
    const radiusX = Math.min(
      desiredRadius,
      (maxRadiusX * l) / maxLevel
    );
    const radiusY = Math.min(
      desiredRadius,
      (maxRadiusY * l) / maxLevel
    );

    // Stagger alternating rings so second-degree nodes don't sit
    // directly behind first-degree nodes (keeps lines/labels clean).
    const staggerOffset = l % 2 === 0 ? Math.PI / count : 0;
    const startAngle = -Math.PI / 2 + staggerOffset;

    ringNodes.forEach((n, index) => {
      const angle = startAngle + (index / count) * Math.PI * 2;

      positions.set(n.id, {
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      });
    });
  }

  // Safety fallback — guarantees every node has a point even if the
  // logic above somehow missed one.
  nodes.forEach((n, index) => {
    if (!positions.has(n.id)) {
      const angle =
        -Math.PI / 2 + (index / Math.max(nodes.length, 1)) * Math.PI * 2;

      positions.set(n.id, {
        x: centerX + Math.cos(angle) * RING_GAP,
        y: centerY + Math.sin(angle) * RING_GAP,
      });
    }
  });

  /* ---------- collision relaxation + bounds clamp ---------- */

  const minX = CANVAS_PADDING_X;
  const maxX = safeWidth - CANVAS_PADDING_X;
  const minY = CANVAS_PADDING_TOP;
  const maxY = safeHeight - CANVAS_PADDING_BOTTOM;

  const ids = nodes.map((n) => n.id);

  for (let iter = 0; iter < 80; iter++) {
    let moved = false;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = positions.get(ids[i]);
        const b = positions.get(ids[j]);
        if (!a || !b) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.01) dist = 0.01;

        if (dist < MIN_SEPARATION) {
          moved = true;

          const push = (MIN_SEPARATION - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;

          // The target stays anchored at the center; only the
          // entities around it get nudged apart.
          if (ids[i] !== target.id) {
            a.x -= ux * push;
            a.y -= uy * push;
          }

          if (ids[j] !== target.id) {
            b.x += ux * push;
            b.y += uy * push;
          }
        }
      }
    }

    ids.forEach((id) => {
      if (id === target.id) return;
      const p = positions.get(id);
      if (!p) return;
      p.x = clamp(p.x, minX, maxX);
      p.y = clamp(p.y, minY, maxY);
    });

    if (!moved) break;
  }

  return positions;
};

// Trims a line so it visually terminates at the edge of each node's
// footprint instead of running straight through its icon/card.
const NODE_ANCHOR_RADIUS = 60;

const trimLineToNodes = (
  source: LayoutPoint,
  target: LayoutPoint
): { x1: number; y1: number; x2: number; y2: number } => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / distance;
  const uy = dy / distance;

  const trim = Math.min(NODE_ANCHOR_RADIUS, distance / 2 - 2);

  return {
    x1: source.x + ux * trim,
    y1: source.y + uy * trim,
    x2: target.x - ux * trim,
    y2: target.y - uy * trim,
  };
};

// Small alternating perpendicular offset so relationship labels on
// nearby/parallel edges don't stack directly on top of each other.
const getLabelOffset = (index: number) => {
  const direction = index % 2 === 0 ? 1 : -1;
  const magnitude = 14 + (Math.floor(index / 2) % 3) * 10;
  return direction * magnitude;
};

/* =========================================================
   COMPONENT
========================================================= */

export const NetworkIntelligenceView: React.FC<
  NetworkIntelligenceViewProps
> = ({
  dossier,
  nodes,
  edges,
  onOpenCompleteDossier,
}) => {
  const [selectedNodeId, setSelectedNodeId] =
    useState<string>(
      nodes.find(
        (node) => node.isTarget
      )?.id ||
        nodes[0]?.id ||
        ''
    );

  const [zoomLevel, setZoomLevel] =
    useState(1);

  const [isDossierOpen, setIsDossierOpen] =
    useState(true);

  const [activeFilter, setActiveFilter] =
    useState<
      | 'ALL'
      | 'CONFIRMED'
      | 'FINANCIAL'
      | 'COMMS'
    >('ALL');

  /* =======================================================
     GRAPH CANVAS SIZE (drives the automatic layout, and
     recalculates whenever the graph area is resized)
  ======================================================= */

  const stageRef = useRef<HTMLDivElement | null>(null);

  const [canvasSize, setCanvasSize] = useState({
    width: 1200,
    height: 760,
  });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const updateSize = () => {
      if (el.clientWidth && el.clientHeight) {
        setCanvasSize({
          width: el.clientWidth,
          height: el.clientHeight,
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  /* =======================================================
     Keep the selected node valid when the case/data changes
  ======================================================= */

  useEffect(() => {
    if (!nodes.some((n) => n.id === selectedNodeId)) {
      setSelectedNodeId(
        nodes.find((n) => n.isTarget)?.id || nodes[0]?.id || ''
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  /* =======================================================
     FILTERED EDGES
  ======================================================= */

  const visibleEdges = useMemo(() => {
    return edges.filter((edge) =>
      matchesFilter(
        edge,
        nodes,
        activeFilter
      )
    );
  }, [
    edges,
    nodes,
    activeFilter,
  ]);

  /* =======================================================
     FILTERED NODES
  ======================================================= */

  const visibleNodeIds = useMemo(() => {
    if (activeFilter === 'ALL') {
      return new Set(
        nodes.map((node) => node.id)
      );
    }

    const ids = new Set<string>();

    visibleEdges.forEach((edge) => {
      ids.add(edge.source);
      ids.add(edge.target);
    });

    /*
     * Always keep the target visible.
     */

    const target = nodes.find(
      (node) => node.isTarget
    );

    if (target) {
      ids.add(target.id);
    }

    return ids;
  }, [
    nodes,
    visibleEdges,
    activeFilter,
  ]);

  const visibleNodes = useMemo(() => {
    return nodes.filter((node) =>
      visibleNodeIds.has(node.id)
    );
  }, [
    nodes,
    visibleNodeIds,
  ]);

  /* =======================================================
     GRAPH LAYOUT (recalculated whenever the visible node/edge
     set changes, or the canvas is resized)
  ======================================================= */

  const graphLayout = useMemo(() => {
    return calculateGraphLayout(
      visibleNodes,
      visibleEdges,
      canvasSize.width,
      canvasSize.height
    );
  }, [
    visibleNodes,
    visibleEdges,
    canvasSize.width,
    canvasSize.height,
  ]);

  /* =======================================================
     SELECTED NODE
  ======================================================= */

  const selectedNode =
    nodes.find(
      (node) =>
        node.id === selectedNodeId
    ) || nodes[0];

  /* =======================================================
     CONNECTED EDGES
  ======================================================= */

  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];

    return edges.filter(
      (edge) =>
        edge.source === selectedNode.id ||
        edge.target === selectedNode.id
    );
  }, [
    edges,
    selectedNode,
  ]);

  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();

    connectedEdges.forEach((edge) => {
      ids.add(edge.source);
      ids.add(edge.target);
    });

    return ids;
  }, [connectedEdges]);

  /* =======================================================
     ZOOM
  ======================================================= */

  const zoomIn = () => {
    setZoomLevel((value) =>
      Math.min(1.6, value + 0.1)
    );
  };

  const zoomOut = () => {
    setZoomLevel((value) =>
      Math.max(0.5, value - 0.1)
    );
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  /* =======================================================
     EMPTY
  ======================================================= */

  if (!nodes.length) {
    return (
      <div
        className="
          flex-1
          flex
          items-center
          justify-center
          bg-[#07090c]
          border
          border-[#3c4948]/30
          rounded-lg
        "
        style={{
          height:
            'calc(100vh - 80px)',
        }}
      >
        <div className="text-center">
          <span
            className="
              material-symbols-outlined
              text-5xl
              text-[#596563]
            "
          >
            hub
          </span>

          <h2
            className="
              font-mono
              text-sm
              text-white
              mt-4
            "
          >
            NO NETWORK DATA
          </h2>

          <p
            className="
              font-mono
              text-[10px]
              text-[#859491]
              mt-2
            "
          >
            No entities or relationships
            were returned for this case.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <div
      className="
        flex-1
        flex
        relative
        overflow-hidden
        bg-[#0a0d10]
        border
        border-[#3c4948]/30
        rounded-lg
        shadow-2xl
      "
      style={{
        height:
          'calc(100vh - 80px)',
      }}
    >

      {/* =================================================
          GRAPH AREA
      ================================================= */}

      <section
        ref={stageRef}
        className="
          flex-1
          h-full
          relative
          overflow-hidden
          bg-[#07090c]
          hud-grid
        "
      >

        {/* =================================================
            ZOOM CONTROLS
        ================================================= */}

        <div
          className="
            absolute
            top-3
            left-3
            z-[200]
            flex
            flex-col
            bg-[#1a2120]
            border
            border-[#3c4948]/70
            rounded-lg
            p-1
            shadow-xl
          "
        >

          <button
            onClick={zoomIn}
            className="
              w-9
              h-9
              flex
              items-center
              justify-center
              rounded
              text-[#66FCF1]
              hover:bg-[#242b2a]
              hover:text-white
            "
          >
            <span className="material-symbols-outlined">
              add
            </span>
          </button>

          <button
            onClick={zoomOut}
            className="
              w-9
              h-9
              flex
              items-center
              justify-center
              rounded
              text-[#66FCF1]
              hover:bg-[#242b2a]
              hover:text-white
            "
          >
            <span className="material-symbols-outlined">
              remove
            </span>
          </button>

          <div className="h-px bg-[#3c4948]/50 mx-1" />

          <button
            onClick={resetZoom}
            className="
              w-9
              h-9
              flex
              items-center
              justify-center
              rounded
              text-[#66FCF1]
              hover:bg-[#242b2a]
              hover:text-white
            "
          >
            <span className="material-symbols-outlined">
              fit_screen
            </span>
          </button>

        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div
          className="
            absolute
            top-3
            left-1/2
            -translate-x-1/2
            z-[200]
            flex
            items-center
            gap-1
            bg-[#1a2120]/95
            border
            border-[#3c4948]/70
            rounded-lg
            p-1
            shadow-xl
          "
        >

          {[
            'ALL',
            'CONFIRMED',
            'FINANCIAL',
            'COMMS',
          ].map((filter) => (
            <button
              key={filter}
              onClick={() =>
                setActiveFilter(
                  filter as
                    | 'ALL'
                    | 'CONFIRMED'
                    | 'FINANCIAL'
                    | 'COMMS'
                )
              }
              className={`
                px-4
                py-2
                rounded
                font-mono
                text-[8px]
                font-bold
                tracking-wider
                whitespace-nowrap
                transition-all
                ${
                  activeFilter === filter
                    ? 'bg-[#66FCF1] text-[#00201e]'
                    : 'text-[#859491] hover:text-white hover:bg-[#242b2a]'
                }
              `}
            >
              {filter}
            </button>
          ))}

        </div>

        {/* =================================================
            GRAPH COUNTER
        ================================================= */}

        <div
          className="
            absolute
            top-3
            right-3
            z-[200]
            bg-[#1a2120]/95
            border
            border-[#3c4948]/70
            rounded-lg
            px-4
            py-2
            flex
            items-center
            gap-5
          "
        >

          <div>
            <div className="
              font-mono
              text-[7px]
              text-[#859491]
            ">
              ENTITIES
            </div>

            <div className="
              font-mono
              text-sm
              font-bold
              text-[#66FCF1]
            ">
              {visibleNodes.length}
            </div>
          </div>

          <div className="
            w-px
            h-7
            bg-[#3c4948]/60
          " />

          <div>
            <div className="
              font-mono
              text-[7px]
              text-[#859491]
            ">
              LINKS
            </div>

            <div className="
              font-mono
              text-sm
              font-bold
              text-[#66FCF1]
            ">
              {visibleEdges.length}
            </div>
          </div>

        </div>

        {/* =================================================
            GRAPH STAGE
        ================================================= */}

        <div
          className="
            absolute
            inset-0
            transition-transform
            duration-300
          "
          style={{
            transform:
              `scale(${zoomLevel})`,
            transformOrigin:
              'center center',
          }}
        >

          {/* =================================================
              CONNECTION LINES  (z-index layer: below nodes)
          ================================================= */}

          <svg
            className="
              absolute
              inset-0
              w-full
              h-full
              pointer-events-none
            "
            viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              zIndex: 1,
              overflow: 'visible',
            }}
          >

            <defs>

              <filter
                id="soft-glow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur
                  stdDeviation="4"
                  result="blur"
                />

                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <marker
                id="arrow-cyan"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="5"
                orient="auto"
              >
                <path
                  d="M0,0 L10,5 L0,10 Z"
                  fill="#66FCF1"
                />
              </marker>

              <marker
                id="arrow-orange"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="5"
                orient="auto"
              >
                <path
                  d="M0,0 L10,5 L0,10 Z"
                  fill="#F6B352"
                />
              </marker>

              <marker
                id="arrow-financial"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="5"
                orient="auto"
              >
                <path
                  d="M0,0 L10,5 L0,10 Z"
                  fill="#ffb4ab"
                />
              </marker>

              <marker
                id="arrow-yellow"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="5"
                orient="auto"
              >
                <path
                  d="M0,0 L10,5 L0,10 Z"
                  fill="#dec74a"
                />
              </marker>

            </defs>

            {visibleEdges.map((edge) => {
              const source =
                graphLayout.get(
                  edge.source
                );

              const target =
                graphLayout.get(
                  edge.target
                );

              if (!source || !target) {
                return null;
              }

              const { x1, y1, x2, y2 } =
                trimLineToNodes(source, target);

              const color =
                getEdgeColor(edge);

              const confirmed =
                isConfirmedEdge(edge);

              const selectedConnection =
                Boolean(
                  selectedNode &&
                  (
                    edge.source ===
                      selectedNode.id ||
                    edge.target ===
                      selectedNode.id
                  )
                );

              let marker =
                'url(#arrow-cyan)';

              if (color === '#F6B352') {
                marker =
                  'url(#arrow-orange)';
              }

              if (color === '#ffb4ab') {
                marker =
                  'url(#arrow-financial)';
              }

              if (color === '#dec74a') {
                marker =
                  'url(#arrow-yellow)';
              }

              return (
                <g key={edge.id}>

                  {/* glow */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={
                      selectedConnection
                        ? 8
                        : 5
                    }
                    opacity={
                      selectedConnection
                        ? 0.16
                        : 0.06
                    }
                    filter="url(#soft-glow)"
                  />

                  {/* actual line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={
                      selectedConnection
                        ? 2.4
                        : 1.6
                    }
                    strokeDasharray={
                      confirmed
                        ? undefined
                        : '7 5'
                    }
                    opacity={
                      selectedNode &&
                      !selectedConnection
                        ? 0.28
                        : 0.88
                    }
                    markerEnd={marker}
                    vectorEffect="non-scaling-stroke"
                  />

                </g>
              );
            })}

          </svg>

          {/* =================================================
              RELATIONSHIP LABELS  (z-index layer: above edges,
              below node icons/cards)
          ================================================= */}

          {visibleEdges.map((edge, edgeIndex) => {
            const source =
              graphLayout.get(
                edge.source
              );

            const target =
              graphLayout.get(
                edge.target
              );

            if (!source || !target) {
              return null;
            }

            const color =
              getEdgeColor(edge);

            const connected =
              Boolean(
                selectedNode &&
                (
                  edge.source ===
                    selectedNode.id ||
                  edge.target ===
                    selectedNode.id
                )
              );

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const length =
              Math.sqrt(dx * dx + dy * dy) || 1;

            // perpendicular unit vector, used to nudge the label
            // off the line itself and away from other labels
            const nx = -dy / length;
            const ny = dx / length;

            const offset = getLabelOffset(edgeIndex);

            const midpointX =
              (source.x + target.x) / 2 + nx * offset;

            const midpointY =
              (source.y + target.y) / 2 + ny * offset;

            return (
              <div
                key={`label-${edge.id}`}
                className="
                  absolute
                  pointer-events-none
                  z-[10]
                "
                style={{
                  left:
                    `${midpointX}px`,
                  top:
                    `${midpointY}px`,
                  transform:
                    'translate(-50%, -50%)',
                }}
              >

                <div
                  className="
                    px-2
                    py-1
                    rounded
                    bg-[#070b0b]/95
                    border
                    font-mono
                    text-[6px]
                    font-bold
                    uppercase
                    tracking-wider
                    whitespace-nowrap
                  "
                  style={{
                    color,
                    borderColor:
                      `${color}55`,
                    opacity:
                      connected ? 1 : 0.65,
                  }}
                >
                  {edge.label ||
                    edge.relationship ||
                    'CONNECTED'}
                </div>

              </div>
            );
          })}

          {/* =================================================
              NODES  (z-index layer: icons above edges/labels,
              cards above icons, selected/target node highest)
          ================================================= */}

          {visibleNodes.map((node) => {
            const point =
              graphLayout.get(node.id);

            if (!point) return null;

            const config =
              getNodeConfig(node.type);

            const selected =
              selectedNode?.id ===
              node.id;

            const connected =
              connectedNodeIds.has(
                node.id
              );

            const isTarget =
              Boolean(node.isTarget);

            const nodeLinks =
              edges.filter(
                (edge) =>
                  edge.source ===
                    node.id ||
                  edge.target ===
                    node.id
              ).length;

            return (
              <div
                key={node.id}
                className="
                  absolute
                  cursor-pointer
                  group
                "
                style={{
                  left:
                    `${point.x}px`,
                  top:
                    `${point.y}px`,
                  width: '170px',
                  height: '145px',
                  transform:
                    'translate(-50%, -50%)',
                  zIndex:
                    selected ||
                    isTarget
                      ? 50
                      : connected
                      ? 30
                      : 20,
                }}
                onClick={() =>
                  setSelectedNodeId(
                    node.id
                  )
                }
              >

                {/* =================================================
                    NODE GLOW
                ================================================= */}

                {(selected ||
                  isTarget) && (
                  <>
                    <div
                      className="
                        absolute
                        rounded-full
                        pointer-events-none
                      "
                      style={{
                        width:
                          isTarget
                            ? 82
                            : 70,
                        height:
                          isTarget
                            ? 82
                            : 70,
                        left: '50%',
                        top: '30px',
                        transform:
                          'translate(-50%, -50%)',
                        border:
                          `1px solid ${config.color}55`,
                        boxShadow:
                          `0 0 25px ${config.color}22`,
                      }}
                    />

                    {isTarget && (
                      <div
                        className="
                          absolute
                          rounded-full
                          pointer-events-none
                        "
                        style={{
                          width: 96,
                          height: 96,
                          left: '50%',
                          top: '30px',
                          transform:
                            'translate(-50%, -50%)',
                          border:
                            `1px dashed ${config.color}35`,
                        }}
                      />
                    )}
                  </>
                )}

                {/* =================================================
                    ICON
                ================================================= */}

                <div
                  className="
                    absolute
                    left-1/2
                    top-0
                    -translate-x-1/2
                    rounded-full
                    flex
                    items-center
                    justify-center
                    bg-[#0b1110]
                  "
                  style={{
                    width:
                      isTarget
                        ? 60
                        : 50,
                    height:
                      isTarget
                        ? 60
                        : 50,
                    border:
                      `2px solid ${
                        selected
                          ? config.color
                          : `${config.color}85`
                      }`,
                    boxShadow:
                      selected
                        ? `0 0 25px ${config.color}35`
                        : `0 0 12px ${config.color}12`,
                    zIndex: 40,
                  }}
                >

                  <span
                    className="
                      material-symbols-outlined
                    "
                    style={{
                      color:
                        config.color,
                      fontSize:
                        isTarget
                          ? 26
                          : 21,
                    }}
                  >
                    {node.icon ||
                      config.icon}
                  </span>

                </div>

                {/* =================================================
                    NODE CARD
                ================================================= */}

                <div
                  className="
                    absolute
                    left-1/2
                    top-[66px]
                    -translate-x-1/2
                    w-[170px]
                    min-h-[72px]
                    bg-[#101716]
                    rounded-md
                    px-3
                    py-2
                    text-center
                  "
                  style={{
                    border:
                      `1px solid ${
                        selected
                          ? `${config.color}90`
                          : '#3c4948b8'
                      }`,
                    boxShadow:
                      selected
                        ? `0 0 20px ${config.color}12`
                        : '0 8px 25px rgba(0,0,0,0.35)',
                    zIndex: 41,
                  }}
                >

                  {/* ID */}

                  <div
                    className="
                      font-mono
                      text-[7px]
                      font-bold
                      tracking-widest
                    "
                    style={{
                      color:
                        config.color,
                    }}
                  >
                    {node.id}
                  </div>

                  {/* LABEL */}

                  <div
                    className="
                      font-sans
                      text-[10px]
                      font-bold
                      text-white
                      leading-tight
                      mt-1
                      break-words
                    "
                  >
                    {node.label}
                  </div>

                  {/* SUBLABEL */}

                  {node.sublabel && (
                    <div
                      className="
                        font-mono
                        text-[7px]
                        text-[#859491]
                        mt-1
                        leading-tight
                        break-words
                      "
                    >
                      {node.sublabel}
                    </div>
                  )}

                  {/* LINKS */}

                  <div
                    className="
                      mt-1.5
                      pt-1.5
                      border-t
                      border-[#3c4948]/40
                      font-mono
                      text-[6px]
                      text-[#596563]
                      uppercase
                    "
                  >
                    LINKS: {nodeLinks}
                  </div>

                </div>

                {/* =================================================
                    HOVER TYPE
                ================================================= */}

                <div
                  className="
                    absolute
                    -top-8
                    left-1/2
                    -translate-x-1/2
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity
                    pointer-events-none
                    z-[100]
                  "
                >

                  <div
                    className="
                      px-2
                      py-1
                      rounded
                      font-mono
                      text-[7px]
                      font-bold
                      whitespace-nowrap
                      bg-[#070b0b]
                    "
                    style={{
                      color:
                        config.color,
                      border:
                        `1px solid ${config.color}45`,
                    }}
                  >
                    {config.label}
                  </div>

                </div>

              </div>
            );
          })}

        </div>

        {/* =================================================
            LEGEND
        ================================================= */}

        <div
          className="
            absolute
            bottom-3
            left-3
            z-[200]
            bg-[#1a2120]/96
            border
            border-[#3c4948]/70
            rounded-lg
            p-3
            shadow-xl
          "
        >

          <div
            className="
              font-mono
              text-[8px]
              font-bold
              text-[#859491]
              uppercase
              tracking-widest
              mb-2
            "
          >
            ENTITY TYPES
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-x-5
              gap-y-1.5
            "
          >

            {Object.entries(
              NODE_CONFIG
            ).map(
              ([type, config]) => (
                <div
                  key={type}
                  className="
                    flex
                    items-center
                    gap-1.5
                  "
                >

                  <span
                    className="
                      material-symbols-outlined
                      text-[13px]
                    "
                    style={{
                      color:
                        config.color,
                    }}
                  >
                    {config.icon}
                  </span>

                  <span
                    className="
                      font-mono
                      text-[7px]
                      text-[#bacac7]
                    "
                  >
                    {config.label}
                  </span>

                </div>
              )
            )}

          </div>

          <div
            className="
              border-t
              border-[#3c4948]/40
              mt-2
              pt-2
              space-y-1
            "
          >

            <div className="
              flex
              items-center
              gap-2
            ">
              <span
                className="w-5 h-px"
                style={{
                  background:
                    '#66FCF1',
                }}
              />

              <span className="
                font-mono
                text-[7px]
                text-[#bacac7]
              ">
                VERIFIED / REVIEWED
              </span>
            </div>

            <div className="
              flex
              items-center
              gap-2
            ">
              <span
                className="w-5"
                style={{
                  borderTop:
                    '1px dashed #F6B352',
                }}
              />

              <span className="
                font-mono
                text-[7px]
                text-[#bacac7]
              ">
                SUSPECTED / UNVERIFIED
              </span>
            </div>

          </div>

          <div
            className="
              border-t
              border-[#3c4948]/40
              mt-2
              pt-2
              flex
              gap-4
            "
          >

            <span className="
              font-mono
              text-[8px]
              font-bold
              text-[#66FCF1]
            ">
              N: {visibleNodes.length}
            </span>

            <span className="
              font-mono
              text-[8px]
              font-bold
              text-[#66FCF1]
            ">
              E: {visibleEdges.length}
            </span>

          </div>

        </div>

        {/* =================================================
            OPEN DOSSIER BUTTON
        ================================================= */}

        {!isDossierOpen && (
          <button
            onClick={() =>
              setIsDossierOpen(true)
            }
            className="
              absolute
              top-16
              right-3
              z-[200]
              bg-[#1a2120]
              border
              border-[#66FCF1]/50
              text-[#66FCF1]
              px-3
              py-2
              rounded
              font-mono
              text-[8px]
              font-bold
            "
          >
            OPEN DOSSIER
          </button>
        )}

      </section>

      {/* =====================================================
          RIGHT DOSSIER
      ===================================================== */}

      {isDossierOpen && (
        <aside
          className="
            w-[370px]
            shrink-0
            h-full
            bg-[#101615]
            border-l
            border-[#3c4948]/60
            flex
            flex-col
            overflow-hidden
          "
        >

          {/* =================================================
              DOSSIER HEADER
          ================================================= */}

          <div
            className="
              px-4
              py-4
              border-b
              border-[#3c4948]/50
              shrink-0
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    w-11
                    h-11
                    rounded-full
                    flex
                    items-center
                    justify-center
                    bg-[#0b1110]
                  "
                  style={{
                    border:
                      `2px solid ${
                        selectedNode
                          ? getNodeConfig(
                              selectedNode.type
                            ).color
                          : '#66FCF1'
                      }`,
                  }}
                >

                  <span
                    className="
                      material-symbols-outlined
                    "
                    style={{
                      color:
                        selectedNode
                          ? getNodeConfig(
                              selectedNode.type
                            ).color
                          : '#66FCF1',
                    }}
                  >
                    {selectedNode?.icon ||
                      'person_search'}
                  </span>

                </div>

                <div>

                  <div
                    className="
                      font-mono
                      text-[8px]
                      font-bold
                      text-[#66FCF1]
                      tracking-widest
                    "
                  >
                    LIVE NETWORK DOSSIER
                  </div>

                  <div
                    className="
                      font-sans
                      text-sm
                      font-bold
                      text-white
                      mt-1
                    "
                  >
                    {selectedNode?.label ||
                      'UNKNOWN ENTITY'}
                  </div>

                  <div
                    className="
                      font-mono
                      text-[8px]
                      text-[#859491]
                      mt-0.5
                    "
                  >
                    {selectedNode?.sublabel ||
                      selectedNode?.type ||
                      'ENTITY'}
                  </div>

                </div>

              </div>

              <button
                onClick={() =>
                  setIsDossierOpen(false)
                }
                className="
                  text-[#859491]
                  hover:text-white
                "
              >
                <span className="
                  material-symbols-outlined
                ">
                  chevron_right
                </span>
              </button>

            </div>

          </div>

          {/* =================================================
              DOSSIER CONTENT
          ================================================= */}

          <div
            className="
              flex-1
              overflow-y-auto
              p-4
              space-y-5
            "
          >

            {/* NETWORK SUMMARY */}

            <div>

              <h4
                className="
                  font-mono
                  text-[9px]
                  font-bold
                  text-[#66FCF1]
                  uppercase
                  tracking-widest
                  mb-2
                "
              >
                NETWORK SUMMARY
              </h4>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-2
                "
              >

                <div
                  className="
                    bg-[#1a2120]
                    border
                    border-[#3c4948]/50
                    rounded
                    p-3
                  "
                >
                  <div className="
                    font-mono
                    text-[7px]
                    text-[#859491]
                  ">
                    ENTITIES
                  </div>

                  <div className="
                    font-mono
                    text-xl
                    font-bold
                    text-[#66FCF1]
                    mt-1
                  ">
                    {nodes.length}
                  </div>
                </div>

                <div
                  className="
                    bg-[#1a2120]
                    border
                    border-[#3c4948]/50
                    rounded
                    p-3
                  "
                >
                  <div className="
                    font-mono
                    text-[7px]
                    text-[#859491]
                  ">
                    LINKS
                  </div>

                  <div className="
                    font-mono
                    text-xl
                    font-bold
                    text-[#66FCF1]
                    mt-1
                  ">
                    {edges.length}
                  </div>
                </div>

                <div
                  className="
                    bg-[#1a2120]
                    border
                    border-[#3c4948]/50
                    rounded
                    p-3
                  "
                >
                  <div className="
                    font-mono
                    text-[7px]
                    text-[#859491]
                  ">
                    CONFIRMED
                  </div>

                  <div className="
                    font-mono
                    text-xl
                    font-bold
                    text-[#66FCF1]
                    mt-1
                  ">
                    {
                      edges.filter(
                        isConfirmedEdge
                      ).length
                    }
                  </div>
                </div>

                <div
                  className="
                    bg-[#1a2120]
                    border
                    border-[#3c4948]/50
                    rounded
                    p-3
                  "
                >
                  <div className="
                    font-mono
                    text-[7px]
                    text-[#859491]
                  ">
                    SUSPECTED
                  </div>

                  <div className="
                    font-mono
                    text-xl
                    font-bold
                    text-[#F6B352]
                    mt-1
                  ">
                    {
                      edges.filter(
                        (edge) =>
                          !isConfirmedEdge(
                            edge
                          )
                      ).length
                    }
                  </div>
                </div>

              </div>

            </div>

            {/* SELECTED ENTITY */}

            {selectedNode && (
              <div>

                <h4
                  className="
                    font-mono
                    text-[9px]
                    font-bold
                    text-[#66FCF1]
                    uppercase
                    tracking-widest
                    mb-2
                  "
                >
                  SELECTED ENTITY
                </h4>

                <div
                  className="
                    bg-[#1a2120]
                    border
                    border-[#3c4948]/50
                    rounded
                    p-3
                    space-y-2
                  "
                >

                  <div className="
                    flex
                    justify-between
                    gap-3
                  ">
                    <span className="
                      font-mono
                      text-[8px]
                      text-[#859491]
                    ">
                      ENTITY ID
                    </span>

                    <span className="
                      font-mono
                      text-[8px]
                      text-white
                      font-bold
                    ">
                      {selectedNode.id}
                    </span>
                  </div>

                  <div className="
                    flex
                    justify-between
                    gap-3
                  ">
                    <span className="
                      font-mono
                      text-[8px]
                      text-[#859491]
                    ">
                      TYPE
                    </span>

                    <span
                      className="
                        font-mono
                        text-[8px]
                        font-bold
                      "
                      style={{
                        color:
                          getNodeConfig(
                            selectedNode.type
                          ).color,
                      }}
                    >
                      {
                        getNodeConfig(
                          selectedNode.type
                        ).label
                      }
                    </span>
                  </div>

                  <div className="
                    flex
                    justify-between
                    gap-3
                  ">
                    <span className="
                      font-mono
                      text-[8px]
                      text-[#859491]
                    ">
                      DIRECT LINKS
                    </span>

                    <span className="
                      font-mono
                      text-[9px]
                      text-white
                      font-bold
                    ">
                      {connectedEdges.length}
                    </span>
                  </div>

                  <div className="
                    flex
                    justify-between
                    gap-3
                  ">
                    <span className="
                      font-mono
                      text-[8px]
                      text-[#859491]
                    ">
                      NETWORK STATUS
                    </span>

                    <span className="
                      font-mono
                      text-[8px]
                      text-[#66FCF1]
                      font-bold
                    ">
                      {connectedEdges.length
                        ? 'CONNECTED'
                        : 'ISOLATED'}
                    </span>
                  </div>

                </div>

              </div>
            )}

            {/* CONNECTED RELATIONSHIPS */}

            <div>

              <div
                className="
                  flex
                  justify-between
                  items-center
                  mb-2
                  pb-1
                  border-b
                  border-[#3c4948]/40
                "
              >

                <h4
                  className="
                    font-mono
                    text-[9px]
                    font-bold
                    text-[#66FCF1]
                    uppercase
                    tracking-widest
                  "
                >
                  CONNECTED RELATIONSHIPS
                </h4>

                <span className="
                  font-mono
                  text-[8px]
                  text-[#859491]
                ">
                  {connectedEdges.length}
                </span>

              </div>

              {connectedEdges.length === 0 ? (
                <div
                  className="
                    bg-[#1a2120]
                    border
                    border-dashed
                    border-[#3c4948]/50
                    rounded
                    p-5
                    text-center
                  "
                >
                  <span
                    className="
                      material-symbols-outlined
                      text-2xl
                      text-[#596563]
                    "
                  >
                    link_off
                  </span>

                  <p className="
                    font-mono
                    text-[9px]
                    text-[#859491]
                    mt-2
                  ">
                    NO DIRECT RELATIONSHIPS
                  </p>
                </div>
              ) : (
                <div className="space-y-2">

                  {connectedEdges.map(
                    (edge) => {
                      const isSource =
                        edge.source ===
                        selectedNode?.id;

                      const otherId =
                        isSource
                          ? edge.target
                          : edge.source;

                      const otherNode =
                        nodes.find(
                          (node) =>
                            node.id ===
                            otherId
                        );

                      const color =
                        getEdgeColor(edge);

                      const confirmed =
                        isConfirmedEdge(edge);

                      return (
                        <div
                          key={edge.id}
                          className="
                            bg-[#1a2120]
                            border
                            border-[#3c4948]/50
                            rounded
                            p-3
                          "
                        >

                          <div className="
                            flex
                            items-center
                            justify-between
                            gap-2
                          ">

                            <span
                              className="
                                font-mono
                                text-[8px]
                                font-bold
                                uppercase
                                tracking-wider
                              "
                              style={{
                                color,
                              }}
                            >
                              {edge.label ||
                                edge.relationship ||
                                'CONNECTED'}
                            </span>

                            <span
                              className="
                                font-mono
                                text-[7px]
                                uppercase
                                px-1.5
                                py-0.5
                                rounded
                              "
                              style={{
                                color:
                                  confirmed
                                    ? '#66FCF1'
                                    : '#F6B352',
                                background:
                                  confirmed
                                    ? '#66FCF112'
                                    : '#F6B35212',
                                border:
                                  `1px solid ${
                                    confirmed
                                      ? '#66FCF1'
                                      : '#F6B352'
                                  }35`,
                              }}
                            >
                              {confirmed
                                ? 'CONFIRMED'
                                : 'SUSPECTED'}
                            </span>

                          </div>

                          <div className="
                            flex
                            items-center
                            gap-2
                            mt-2
                          ">

                            <span className="
                              font-mono
                              text-[8px]
                              text-[#859491]
                            ">
                              {isSource
                                ? 'TO'
                                : 'FROM'}
                            </span>

                            <span className="
                              font-mono
                              text-[9px]
                              font-bold
                              text-white
                            ">
                              {otherNode?.label ||
                                otherId}
                            </span>

                          </div>

                          <div className="
                            flex
                            items-center
                            gap-2
                            mt-1
                          ">

                            <span className="
                              font-mono
                              text-[7px]
                              text-[#596563]
                            ">
                              {edge.source}
                            </span>

                            <span
                              className="
                                material-symbols-outlined
                                text-[10px]
                              "
                              style={{
                                color,
                              }}
                            >
                              arrow_forward
                            </span>

                            <span className="
                              font-mono
                              text-[7px]
                              text-[#596563]
                            ">
                              {edge.target}
                            </span>

                          </div>

                          {edge.verificationStatus && (
                            <div className="
                              mt-2
                              pt-2
                              border-t
                              border-[#3c4948]/30
                              font-mono
                              text-[7px]
                              text-[#859491]
                            ">
                              VERIFICATION:{' '}

                              <span
                                className="font-bold"
                                style={{
                                  color,
                                }}
                              >
                                {
                                  edge.verificationStatus
                                }
                              </span>
                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

            {/* TARGET ANALYTICS */}

            {selectedNode?.isTarget && (
              <div>

                <h4
                  className="
                    font-mono
                    text-[9px]
                    font-bold
                    text-[#7bd6d1]
                    uppercase
                    tracking-widest
                    mb-2
                    pb-1
                    border-b
                    border-[#3c4948]/40
                  "
                >
                  TARGET ANALYTICS
                </h4>

                <div className="
                  grid
                  grid-cols-2
                  gap-2
                ">

                  <div className="
                    bg-[#1a2120]
                    border
                    border-[#3c4948]/40
                    p-3
                    rounded
                  ">
                    <div className="
                      font-mono
                      text-[7px]
                      text-[#859491]
                    ">
                      BETWEENNESS
                    </div>

                    <div className="
                      font-mono
                      text-sm
                      font-bold
                      text-[#66FCF1]
                      mt-1
                    ">
                      {dossier.betweenness}
                    </div>
                  </div>

                  <div className="
                    bg-[#1a2120]
                    border
                    border-[#3c4948]/40
                    p-3
                    rounded
                  ">
                    <div className="
                      font-mono
                      text-[7px]
                      text-[#859491]
                    ">
                      CONFIDENCE
                    </div>

                    <div className="
                      font-mono
                      text-sm
                      font-bold
                      text-[#66FCF1]
                      mt-1
                    ">
                      {dossier.confidenceScore}%
                    </div>
                  </div>

                </div>

                {dossier.flagCriteria?.length >
                  0 && (
                  <div className="
                    mt-3
                    bg-[#1a2120]
                    border
                    border-[#F6B352]/20
                    rounded
                    p-3
                  ">

                    <div className="
                      font-mono
                      text-[8px]
                      font-bold
                      text-[#F6B352]
                      uppercase
                      tracking-wider
                      mb-2
                    ">
                      FLAG CRITERIA
                    </div>

                    <div className="space-y-2">

                      {dossier.flagCriteria.map(
                        (flag, index) => (
                          <div
                            key={index}
                            className="
                              flex
                              items-start
                              gap-2
                            "
                          >

                            <span className="
                              material-symbols-outlined
                              text-[11px]
                              text-[#F6B352]
                            ">
                              chevron_right
                            </span>

                            <span className="
                              font-sans
                              text-[10px]
                              text-[#bacac7]
                              leading-relaxed
                            ">
                              {flag}
                            </span>

                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

              </div>
            )}

            {/* ASSESSMENT */}

            <div
              className="
                bg-[#1a2120]
                border
                border-[#66FCF1]/20
                rounded
                p-3
              "
            >

              <div className="
                flex
                items-center
                gap-2
                mb-2
              ">

                <span className="
                  material-symbols-outlined
                  text-[14px]
                  text-[#66FCF1]
                ">
                  psychology
                </span>

                <span className="
                  font-mono
                  text-[9px]
                  font-bold
                  text-[#66FCF1]
                  uppercase
                  tracking-wider
                ">
                  INVESTIGATIVE ASSESSMENT
                </span>

              </div>

              <p className="
                font-sans
                text-[10px]
                text-[#bacac7]
                leading-relaxed
              ">
                {selectedNode?.isTarget
                  ? dossier.tacticalAssessment
                  : `Entity ${
                      selectedNode?.id ||
                      'UNKNOWN'
                    } is connected to ${
                      connectedEdges.length
                    } relationship${
                      connectedEdges.length ===
                      1
                        ? ''
                        : 's'
                    } in the active network.`}
              </p>

            </div>

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            className="
              p-3
              border-t
              border-[#3c4948]/40
              bg-[#1a2120]
              shrink-0
            "
          >

            <p className="
              font-mono
              text-[7px]
              text-[#859491]
              leading-relaxed
              uppercase
              tracking-wider
              mb-3
            ">
              AI-generated findings are
              investigative leads and require
              human verification before
              operational deployment.
            </p>

            <button
              onClick={
                onOpenCompleteDossier
              }
              className="
                w-full
                py-2.5
                font-mono
                text-[9px]
                font-bold
                uppercase
                tracking-widest
                border
                border-[#66FCF1]/50
                text-[#66FCF1]
                hover:bg-[#66FCF1]
                hover:text-[#00201e]
                transition-all
                rounded
              "
            >
              EXPORT COMPLETE DOSSIER
            </button>

          </div>

        </aside>
      )}

    </div>
  );
};
