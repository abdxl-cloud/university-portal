/* URL shapes for the portal.

   Replaces App.jsx's readPrototypeLocation/writePrototypeLocation pair: React
   Router owns history now, so this only has to say what each path looks like. */
import type { LoginRole, PublicDest } from "./features/student/public";
import type { SignableRole } from "./data/roles-data";

export const paths = {
  home: () => "/",
  login: () => "/login",
  admissions: (route = "overview") => `/admissions/${route}`,
  portal: (route = "dashboard") => `/portal/${route}`,
  role: (role: SignableRole, route?: string) => (route ? `/role/${role}/${route}` : `/role/${role}`),
};

/** Where the public site's `go(dest)` lands. */
export function publicPath(dest: PublicDest): string {
  if (dest === "login") return paths.login();
  if (dest === "apply") return paths.admissions();
  return paths.home();
}

/** Where a successful sign-in lands, per role. */
export function loginPath(role: LoginRole): string {
  if (role === "student") return paths.portal(localStorage.getItem("futech.route") || "dashboard");
  return paths.role(role);
}
