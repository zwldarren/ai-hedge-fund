import { Handle, Position, type NodeProps } from '@xyflow/react';

import { type AgentNode } from './types';

export function AgentNode({
  data,
}: NodeProps<AgentNode>) {
  return (
    <div className="node-base">
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle"
      />
      {data.agent_name && (
        <div className="font-medium text-center">{data.agent_name}</div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="node-handle"
      />
    </div>
  );
}
