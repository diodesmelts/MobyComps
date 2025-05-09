/**
 * This script exports patched versions of components that might have path resolution issues
 * during the build process on Render. If the build fails due to path resolution, 
 * we can modify the imports in App.tsx to use these versions instead.
 */

import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';

// Re-export components with their original names
export { Toaster, TooltipProvider };