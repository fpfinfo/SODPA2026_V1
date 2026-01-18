/**
 * SISUP Features Index
 * Feature-based module organization for the SISUP/SCS application
 * 
 * Structure:
 * - suprido/   : Suprido user dashboards and forms
 * - gestor/    : Gestor/Manager dashboards (AJSEFIN, SGP)
 * - sosfu/     : SOSFU operations (concession, audit, execution)
 * - sefin/     : SEFIN signature and approval workflows
 * - budget/    : Budget management and distribution
 * - shared/    : Shared UI components
 * - auth/      : Authentication components
 * - admin/     : System administration
 */

// Feature Modules
export * from './suprido';
export * from './gestor';
export * from './sosfu';
export * from './sefin';
export * from './budget';
export * from './shared';
export * from './auth';
export * from './admin';
