/**
 * Re-export so existing admin imports keep working without churn.
 * The implementation lives in `@kindergarten-warehouse/data-access` and is
 * shared with the portal application.
 */
export { handleHttpError } from '@kindergarten-warehouse/data-access';
