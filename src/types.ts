export interface HostingProvider {
  name: string;
  type: string;
  free_tier_limits: string;
  suitability_score: number;
  match_explanation_fa: string;
  pros_fa: string[];
  cons_fa: string[];
}

export interface ConfigFile {
  filename: string;
  description_fa: string;
  content: string;
}

export interface OptimizationSuggestion {
  title_fa: string;
  description_fa: string;
  code_example?: string;
}

export interface AnalysisResponse {
  overview: string;
  comparison: HostingProvider[];
  cloudflare_deep_dive: string;
  configs: ConfigFile[];
  optimizations: OptimizationSuggestion[];
}

export type ProjectType = 'frontend_spa' | 'frontend_ssg' | 'fullstack' | 'server_api' | 'realtime_cron';

export interface TechStackConfig {
  id: string;
  name: string;
  icon: string;
}
