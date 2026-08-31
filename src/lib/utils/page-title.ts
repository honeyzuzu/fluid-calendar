export const getTitleFromPathname = (pathname: string) => {
  switch (pathname) {
    case "/calendar":
      return "Calendar | Sunnie Planner";
    case "/tasks":
      return "Tasks | Sunnie Planner";
    case "/focus":
      return "Focus | Sunnie Planner";
    case "/plan":
      return "Plan | Sunnie Planner";
    case "/friends":
      return "Friends | Sunnie Planner";
    case "/settings":
      return "Settings | Sunnie Planner";
    case "/setup":
      return "Setup | Sunnie Planner";
    case "/auth/signin":
      return "Sign In | Sunnie Planner";
    case "/auth/signup":
      return "Sign Up | Sunnie Planner";
    case "/auth/reset-password":
      return "Reset Password | Sunnie Planner";
    default:
      return "Sunnie Planner";
  }
};
