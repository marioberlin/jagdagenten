import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCallback } from 'react';
import { cn } from '@/utils/cn';
import { ClientOnly } from '../utils/ClientOnly';

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Input Source' }, type: 'input', className: 'glass-flow-node' },
  { id: '2', position: { x: 0, y: 100 }, data: { label: 'Process Logic' }, className: 'glass-flow-node' },
  { id: '3', position: { x: 0, y: 200 }, data: { label: 'Output Sink' }, type: 'output', className: 'glass-flow-node' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'rgba(var(--accent-primary-rgb), 0.8)' } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: 'rgba(var(--accent-secondary-rgb), 0.8)' } },
];

interface GlassFlowProps {
  className?: string;
}

export function GlassFlow({ className }: GlassFlowProps) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#fff' } }, eds)),
    [setEdges],
  );

  return (
    <ClientOnly fallback={<div className={cn("glass-panel rounded-xl h-[500px] w-full", className)} />}>
      <div className={cn("glass-panel rounded-xl h-[500px] w-full overflow-hidden relative", className)}>
        <style>{`
          .glass-flow-node {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            padding: 10px 20px;
            font-size: 12px;
            width: 150px;
            text-align: center;
            transition: all 0.3s ease;
          }
          .glass-flow-node:hover {
            border-color: rgba(var(--accent-primary-rgb), 0.5);
            box-shadow: 0 0 15px rgba(var(--accent-primary-rgb), 0.2);
          }
          .glass-flow-node.selected {
            border-color: rgba(var(--accent-primary-rgb), 1);
            box-shadow: 0 0 20px rgba(var(--accent-primary-rgb), 0.4);
          }
          .react-flow__handle {
            background: rgba(var(--accent-primary-rgb), 1);
            width: 8px;
            height: 8px;
          }
          .react-flow__minimap {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .react-flow__controls {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 2px;
          }
          .react-flow__controls-button {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            background: transparent;
            fill: white;
          }
          .react-flow__controls-button:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          .react-flow__attribution {
            display: none;
          }
        `}</style>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background color="rgba(255, 255, 255, 0.1)" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={() => 'rgba(255, 255, 255, 0.2)'}
            maskColor="rgba(0, 0, 0, 0.4)"
          />
        </ReactFlow>
      </div>
    </ClientOnly>
  );
}
