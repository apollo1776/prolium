"use strict";
/**
 * Template Engine
 * Replaces variables in response templates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTemplate = exports.extractTemplateVariables = exports.replaceTemplateVariables = void 0;
/**
 * Replace template variables in text
 * Supports: {{username}}, {{videoTitle}}, {{customLink}}, etc.
 */
const replaceTemplateVariables = (template, variables) => {
    let result = template;
    // Replace all {{variable}} patterns
    const regex = /\{\{(\w+)\}\}/g;
    result = result.replace(regex, (match, variable) => {
        const value = variables[variable];
        return value !== undefined ? value : match; // Keep original if variable not found
    });
    return result;
};
exports.replaceTemplateVariables = replaceTemplateVariables;
/**
 * Extract all variables used in a template
 */
const extractTemplateVariables = (template) => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
        variables.push(match[1]);
    }
    return [...new Set(variables)]; // Remove duplicates
};
exports.extractTemplateVariables = extractTemplateVariables;
/**
 * Validate that all required variables are provided
 */
const validateTemplate = (template, variables) => {
    const usedVariables = (0, exports.extractTemplateVariables)(template);
    const missing = usedVariables.filter((variable) => variables[variable] === undefined);
    return {
        valid: missing.length === 0,
        missing,
    };
};
exports.validateTemplate = validateTemplate;
//# sourceMappingURL=template-engine.js.map