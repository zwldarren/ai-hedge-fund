import { MessageItem } from '@/contexts/node-context';
import type { BuiltInNode, Node } from '@xyflow/react';

export type NodeMessage = MessageItem;

export type AgentNode = Node<{ name: string, description: string, status: string }, 'agent-node'>;
export type PortfolioManagerNode = Node<{ name: string, description: string, status: string }, 'portfolio-manager-node'>;
export type TextOutputNode = Node<{ name: string, description: string, status: string }, 'text-output-node'>;
export type JsonOutputNode = Node<{ name: string, description: string, status: string }, 'json-output-node'>;
export type AppNode = BuiltInNode | AgentNode | PortfolioManagerNode | TextOutputNode | JsonOutputNode;
