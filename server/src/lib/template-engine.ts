/**
 * Template Engine
 * Replaces variables in response templates
 */

interface TemplateVariables {
  username: string;
  videoTitle?: string;
  customLink?: string;
  commentText?: string;
  platform?: string;
  [key: string]: string | undefined;
}

/**
 * Replace template variables in text
 * Supports: {{username}}, {{videoTitle}}, {{customLink}}, etc.
 */
export const replaceTemplateVariables = (template: string, variables: TemplateVariables): string => {
  let result = template;

  // Replace all {{variable}} patterns
  const regex = /\{\{(\w+)\}\}/g;
  result = result.replace(regex, (match, variable) => {
    const value = variables[variable as keyof TemplateVariables];
    return value !== undefined ? value : match; // Keep original if variable not found
  });

  return result;
};

/**
 * Extract all variables used in a template
 */
export const extractTemplateVariables = (template: string): string[] => {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1]);
  }

  return [...new Set(variables)]; // Remove duplicates
};

/**
 * Validate that all required variables are provided
 */
export const validateTemplate = (template: string, variables: TemplateVariables): { valid: boolean; missing: string[] } => {
  const usedVariables = extractTemplateVariables(template);
  const missing = usedVariables.filter((variable) => variables[variable as keyof TemplateVariables] === undefined);

  return {
    valid: missing.length === 0,
    missing,
  };
};
