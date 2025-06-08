import { type NodeTypes } from '@xyflow/react';

import { AgentNode } from './components/agent-node';
import { JsonOutputNode } from './components/json-output-node';
import { PortfolioManagerNode } from './components/portfolio-manager-node';
import { TextOutputNode } from './components/text-output-node';
import { type AppNode } from './types';

// Types
export * from './types';

export const initialNodes: AppNode[] = [
  {
    id: 'portfolio-manager-node',
    type: 'portfolio-manager-node',
    position: { x: 0, y: 0 },
    data: {
      name: 'Portfolio Manager',
      description: 'The Decision Maker',
      status: 'Idle',
    },
  },
];

export const nodeTypes = {
  'agent-node': AgentNode,
  'portfolio-manager-node': PortfolioManagerNode,
  'text-output-node': TextOutputNode,
  'json-output-node': JsonOutputNode,
} satisfies NodeTypes;
