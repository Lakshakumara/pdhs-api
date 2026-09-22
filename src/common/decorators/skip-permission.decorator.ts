import { SetMetadata } from '@nestjs/common';

export const SKIP_PERMISSION_KEY = 'skipPermissionCheck';

/**
 * Explicitly marks a route as NOT requiring any permission check —
 * still requires a valid JWT (JwtAuthGuard runs regardless), just skips
 * PermissionGuard's UserPermission lookup.
 *
 * This is intentionally a SEPARATE decorator from @RequirePermission(),
 * not "just don't add @RequirePermission()". PermissionGuard fails
 * closed on routes with no permission metadata at all — that's what
 * catches a developer who forgot to annotate a new protected endpoint.
 * @SkipPermission() is how you say "I looked at this, it's genuinely
 * fine for any authenticated user" — an explicit, reviewable decision
 * rather than a silent gap.
 *
 * Usage:
 *   @Get('/institutions')
 *   @SkipPermission()
 *   getInstitute(@Query() query) { ... }
 */
export const SkipPermission = () => SetMetadata(SKIP_PERMISSION_KEY, true);