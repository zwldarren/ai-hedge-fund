import { AppNode } from "@/nodes/types";
import { agents } from "./agents";

// Map of sidebar item names to node creation functions
export interface NodeTypeDefinition {
  createNode: (position: { x: number, y: number }) => AppNode;
}

// Define node creation functions for each type
const nodeTypeDefinitions: Record<string, NodeTypeDefinition> = {
  "Portfolio Manager": {
    createNode: (position: { x: number, y: number }): AppNode => ({
      id: `portfolio-manager-node`,
      type: "portfolio-manager-node",
      position,
      data: {
        name: "Portfolio Manager",
        description: "The Decision Maker",
        status: "Idle",
      },
    }),
  },
  "JSON Output": {
    createNode: (position: { x: number, y: number }): AppNode => ({
      id: `json-output-node`,
      type: "json-output-node",
      position,
      data: {
        name: "JSON Output",
        description: "JSON Output Node",
        status: "Idle",
      },
    }),
  },
  "Text Output": {
    createNode: (position: { x: number, y: number }): AppNode => ({
      id: `text-output-node`,
      type: "text-output-node",
      position,
      data: {
        name: "Text Output",
        description: "Output Node",
        status: "Idle",
      },
    }),
  },
  // Dynamic node creation for all agents
  ...agents.reduce((acc, agent) => {
    acc[agent.display_name] = {
      createNode: (position: { x: number, y: number }): AppNode => ({
        id: agent.key,
        type: "agent-node",
        position,
        data: {
          name: agent.display_name,
          description: agent.description || "",
          status: "Idle",
        },
      }),
    };
    return acc;
  }, {} as Record<string, NodeTypeDefinition>),
};

export function getNodeTypeDefinition(componentName: string): NodeTypeDefinition | null {
  return nodeTypeDefinitions[componentName] || null;
}

// Get the node ID that would be generated for a component
export function getNodeIdForComponent(componentName: string): string | null {
  if (componentName === "Portfolio Manager") {
    return "portfolio-manager-node";
  }
  if (componentName === "Text Output") {
    return "text-output-node";
  }
  if (componentName === "JSON Output") {
    return "json-output-node";
  }
  
  // For agents, find by display name
  const agent = agents.find(agent => agent.display_name === componentName);
  return agent ? agent.key : null;
} 