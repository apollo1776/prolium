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
export declare const replaceTemplateVariables: (template: string, variables: TemplateVariables) => string;
/**
 * Extract all variables used in a template
 */
export declare const extractTemplateVariables: (template: string) => string[];
/**
 * Validate that all required variables are provided
 */
export declare const validateTemplate: (template: string, variables: TemplateVariables) => {
    valid: boolean;
    missing: string[];
};
export {};
//# sourceMappingURL=template-engine.d.ts.map