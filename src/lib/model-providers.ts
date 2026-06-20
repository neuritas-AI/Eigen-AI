import type { ModelKey } from '@/types';

export interface ModelProviderDefinition {
  key: ModelKey;
  label: string;
  displayName: string;
  description: string;
  creditsPerMessage: number;
  active: boolean;
  priority: number;
}

export const MODEL_PROVIDERS: ModelProviderDefinition[] = [
  {
    key: 'brainz_local',
    label: 'Brainz Local',
    displayName: 'Brainz Local',
    description: 'Llama 3 locally hosted model for fast responses.',
    creditsPerMessage: 1,
    active: true,
    priority: 1,
  },
  {
    key: 'gpt5',
    label: 'GPT-5',
    displayName: 'GPT-5',
    description: 'OpenAI GPT-5 for advanced reasoning and generative workflows.',
    creditsPerMessage: 5,
    active: true,
    priority: 2,
  },
  {
    key: 'claude',
    label: 'Claude',
    displayName: 'Claude',
    description: 'Anthropic Claude for safer and conversational AI output.',
    creditsPerMessage: 5,
    active: true,
    priority: 3,
  },
  {
    key: 'gemini',
    label: 'Gemini',
    displayName: 'Gemini',
    description: 'Google Gemini for advanced multimodal workflows.',
    creditsPerMessage: 3,
    active: true,
    priority: 4,
  },
];

export function getModelProvider(key: ModelKey) {
  return MODEL_PROVIDERS.find((provider) => provider.key === key) ?? MODEL_PROVIDERS[0];
}
