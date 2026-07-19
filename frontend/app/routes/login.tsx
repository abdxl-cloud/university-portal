import { useNavigate } from "react-router";
import { Login, type LoginRole } from "../features/student/public";
import { loginPath, publicPath } from "../nav";
import { useTheme } from "../theme";
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sign in · FUTECH Portal" }];
}

export default function LoginRoute() {
  const navigate = useNavigate();
  const { dark, setDark } = useTheme();

  const onLogin = (role: LoginRole) => {
    localStorage.setItem("futech.role", role);
    localStorage.setItem("futech.authed", "1");
    navigate(loginPath(role));
  };

  return <Login go={(d) => navigate(publicPath(d))} onLogin={onLogin} dark={dark} setDark={setDark} />;
}
