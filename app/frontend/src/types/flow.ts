export interface Flow {
  id: number;
  name: string;
  description?: string;
  nodes: any;
  edges: any;
  viewport?: any;
  is_template: boolean;
  tags?: string[];
  created_at: string;
  updated_at?: string;
} 