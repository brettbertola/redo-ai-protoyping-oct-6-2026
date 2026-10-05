import { useLocation } from "react-router"
import { BrowsePanel } from "./components/BrowsePanel"
import { DesignProblems } from "./components/DesignProblems"
import { Launcher } from "./components/Launcher"
import { BrowseProvider } from "./lib/browse-state"
import { isBareMode } from "./lib/stage-state"
import { BareBridge } from "./stage/BareBridge"
import { Stage } from "./stage/Stage"

export function Shell() {
  const location = useLocation()

  // Inside a device frame: just the chrome and the prototype.
  if (isBareMode(location.search)) {
    return (
      <>
        <Stage />
        <BareBridge />
      </>
    )
  }

  return (
    <BrowseProvider>
      <div className="flex min-h-dvh">
        <div className="min-w-0 flex-1">
          <Stage />
        </div>
        <BrowsePanel />
      </div>
      <Launcher />
      <DesignProblems />
    </BrowseProvider>
  )
}
