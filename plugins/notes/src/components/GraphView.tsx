import { useCallback, useEffect, useRef, useState } from "react";

interface GraphViewProps {
  graphData: { nodes: { id: string; label: string }[]; edges: { source: string; target: string }[] };
}

interface SimNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SimEdge {
  source: SimNode;
  target: SimNode;
}

const NODE_COLORS: Record<string, { bg: string; border: string }> = {
  default: { bg: "#1b3a4b", border: "#55b3ff" },
};

export default function GraphView({ graphData }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [edges, setEdges] = useState<SimEdge[]>([]);
  const [dragNode, setDragNode] = useState<SimNode | null>(null);
  const animationRef = useRef<number>(null);

  const nodeMap = useRef(new Map<string, SimNode>());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: width || 800, height: height || 600 });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = dimensions;
    const initialNodes: SimNode[] = graphData.nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / graphData.nodes.length;
      const radius = Math.min(width, height) * 0.3;
      return {
        id: n.id,
        label: n.label,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    const nodeMapNew = new Map(initialNodes.map((n) => [n.id, n]));
    const initialEdges: SimEdge[] = graphData.edges
      .map((e) => {
        const source = nodeMapNew.get(e.source);
        const target = nodeMapNew.get(e.target);
        if (source && target) {
          return { source, target };
        }
        return null;
      })
      .filter((e): e is SimEdge => e !== null);

    setNodes(initialNodes);
    setEdges(initialEdges);
    nodeMap.current = nodeMapNew;
  }, [graphData, dimensions.width, dimensions.height]);

  const simulationLoop = useCallback(
    (_now: number) => {
      const { width, height } = dimensions;

      const currentNodes = nodes;
      const currentEdges = edges;

      if (currentNodes.length === 0) {
        animationRef.current = requestAnimationFrame(simulationLoop);
        return;
      }

      const alpha = 0.3;

      for (const node of currentNodes) {
        if (node === dragNode) continue;
        node.vx *= 0.85;
        node.vy *= 0.85;
      }

      for (const edge of currentEdges) {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 80) * 0.005;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (edge.source !== dragNode) {
          edge.source.vx += fx;
          edge.source.vy += fy;
        }
        if (edge.target !== dragNode) {
          edge.target.vx -= fx;
          edge.target.vy -= fy;
        }
      }

      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const a = currentNodes[i];
          const b = currentNodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 120 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (a !== dragNode) {
            a.vx -= fx;
            a.vy -= fy;
          }
          if (b !== dragNode) {
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      const cx = width / 2;
      const cy = height / 2;
      for (const node of currentNodes) {
        if (node === dragNode) continue;
        node.vx += (cx - node.x) * 0.0005;
        node.vy += (cy - node.y) * 0.0005;
        node.x += node.vx * alpha;
        node.y += node.vy * alpha;
        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      }

      setNodes([...currentNodes]);
      animationRef.current = requestAnimationFrame(simulationLoop);
    },
    [dimensions, dragNode, nodes, edges],
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(simulationLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulationLoop]);

  const handlePointerDown = (node: SimNode) => {
    setDragNode(node);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragNode || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      dragNode.x = (e.clientX - rect.left) * (dimensions.width / rect.width);
      dragNode.y = (e.clientY - rect.top) * (dimensions.height / rect.height);
      setNodes([...nodes]);
    },
    [dragNode, dimensions, nodes],
  );

  const handlePointerUp = useCallback(() => {
    setDragNode(null);
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#040506",
        touchAction: "none",
      }}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: "block" }}
      >
        <g>
          {edges.map((edge, i) => (
            <line
              key={i}
              x1={edge.source.x}
              y1={edge.source.y}
              x2={edge.target.x}
              y2={edge.target.y}
              stroke="#2e2f32"
              strokeWidth={1.5}
            />
          ))}
        </g>

        <g>
          {nodes.map((node) => (
            <g
              key={node.id}
              onPointerDown={() => handlePointerDown(node)}
              style={{ cursor: "grab" }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={18}
                fill={NODE_COLORS.default.bg}
                stroke={NODE_COLORS.default.border}
                strokeWidth={2}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill="#f0f0f0"
                fontSize={10}
                fontWeight={500}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {node.label.length > 8 ? node.label.slice(0, 7) + "…" : node.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
