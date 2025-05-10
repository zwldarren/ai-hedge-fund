import { type NodeTypes } from '@xyflow/react';

import { AgentNode } from './components/agent-node';
import { StartNode } from './components/start-node';
import { type AppNode } from './types';

// Types
export * from './types';

export const initialNodes: AppNode[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 0, y: 0 },
    data: {
      name: 'Input',
      description: 'Start Node',
      status: 'Idle',
    },
  },
  {
    id: 'warren_buffett',
    type: 'agent',
    position: { x: 450, y: -150 },
    data: {
      name: 'Warren Buffett',
      description: 'The Oracle of Omaha',
      status: 'Idle'
    },
  },
  {
    id: 'charlie_munger',
    type: 'agent',
    position: { x: 450, y: 150 },
    data: {
      name: 'Charlie Munger',
      description: 'The Abominable No-Man',
      status: 'Idle'
    },
  },
  {
    id: 'portfolio_manager',
    type: 'agent',
    position: { x: 900, y: 0 },
    data: {
      name: 'Portfolio Manager',
      description: 'Decision Maker',
      status: 'Idle'
    },
  },
];

export const nodeTypes = {
  'agent': AgentNode,
  'start': StartNode,
} satisfies NodeTypes;
