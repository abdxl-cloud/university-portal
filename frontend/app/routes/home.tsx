import { useNavigate } from "react-router";
import { PublicHome } from "../features/student/public";
import { publicPath } from "../nav";
import { useTheme } from "../theme";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "FUTECH — Federal University of Technology" },
    { name: "description", content: "Fees, course registration, results, hostel allocation and admissions in one portal." },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { dark, setDark } = useTheme();
  return <PublicHome go={(d) => navigate(publicPath(d))} dark={dark} setDark={setDark} />;
}
