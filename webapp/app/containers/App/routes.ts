export interface AppRoute {
  name: string; // The name displayed in any Nav links
  path: string; // The route path
  component: React.ComponentType<any>; //The component to render
  roleRequirement: number; // The minimum role required to access the route
  isNavRequired: boolean; // Should a Nav link for the route be added to the main navigation
  showNavForRoles: number[]; // The Roles for which the Nav link should be rendered
  requireAuth: boolean;
}

const routes: AppRoute[] = [];

export default routes;
