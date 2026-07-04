import React from "react";
const { CandidateForm, CandidateGate, CandidateOnboarding, CandidateOverview, CandidateShell, CandidateStatus } = window;
/* Admissions — CANDIDATE view router (gate → shell → screens) */

function CandidateApp({ store, actions, dark, setDark, onExit }) {
  const a = store.admissions || {};
  const ready = a.verified && a.activated;
  const [, force] = React.useState(0);
  const [route, setRoute] = React.useState(() => localStorage.getItem("futech.admroute") || "overview");
  const go = (r) => { setRoute(r); localStorage.setItem("futech.admroute", r); window.scrollTo(0, 0); document.querySelector(".u-main") && document.querySelector(".u-main").scrollTo(0, 0); };

  if (!ready) {
    return <CandidateGate store={store} actions={actions} dark={dark} setDark={setDark} onExit={onExit} onReady={() => force((n) => n + 1)} />;
  }

  const SCREENS = { overview: CandidateOverview, form: CandidateForm, status: CandidateStatus, onboarding: CandidateOnboarding };
  const Cmp = SCREENS[route] || CandidateOverview;

  return (
    <CandidateShell store={store} actions={actions} dark={dark} setDark={setDark} onExit={onExit} route={route} go={go}>
      <Cmp store={store} actions={actions} go={go} />
    </CandidateShell>
  );
}

window.CandidateApp = CandidateApp;
