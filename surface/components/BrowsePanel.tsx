import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import surfaceConfig from "../../surface.config"
import Fuse from "fuse.js"
import {
  ChevronRight,
  Folder,
  Layers,
  PanelRightClose,
  Pin,
  PinOff,
  Search,
  X,
} from "lucide-react"
import { useBrowseState } from "../lib/browse-state"
import {
  preloadPrototype,
  prototypeKeyForPathname,
  prototypes,
} from "../lib/registry"
import {
  buildPrototypeTree,
  collectMatchingFolderKeys,
  type TreeNode,
} from "../lib/prototype-tree"

const INDENT_STEP = 18
const BASE_INDENT = 12
const ELBOW_RADIUS = 6
const GUIDE_COLOR_CLS = "bg-foreground/60"
const GUIDE_BORDER_CLS = "border-foreground/60"

function topLevelIcon(segment: string) {
  return surfaceConfig.categoryIcons?.[segment] ?? Layers
}

export function BrowsePanel() {
  const browse = useBrowseState()
  if (!browse.open) return null
  return browse.pinned ? <PinnedPanel /> : <FloatingPanel />
}

function PinnedPanel() {
  return (
    <aside className="surface-browse-panel surface-browse-panel--pinned sticky top-0 flex h-dvh w-[380px] shrink-0 flex-col border-l bg-background">
      <PanelBody />
    </aside>
  )
}

function FloatingPanel() {
  const { closePanel } = useBrowseState()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [closePanel])
  return (
    <aside className="surface-browse-panel surface-browse-panel--floating fixed top-4 right-4 bottom-4 z-40 flex w-[380px] flex-col rounded-lg border bg-popover shadow-2xl shadow-foreground/20">
      <PanelBody />
    </aside>
  )
}

function PanelBody() {
  const location = useLocation()
  const navigate = useNavigate()
  const { pinned, togglePinned, closePanel, expanded, setExpanded } =
    useBrowseState()
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const tree = useMemo(() => buildPrototypeTree(prototypes), [])

  const fuse = useMemo(
    () =>
      new Fuse(prototypes, {
        keys: [
          { name: "title", weight: 2 },
          { name: "breadcrumb", weight: 1 },
          { name: "path", weight: 0.5 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    []
  )

  const matchSet = useMemo(() => {
    if (!query.trim()) return null
    return new Set(fuse.search(query).map((r) => r.item.path))
  }, [fuse, query])

  const autoExpanded = useMemo(() => {
    if (!matchSet) return null
    return collectMatchingFolderKeys(tree, matchSet)
  }, [tree, matchSet])

  const isExpanded = (key: string) => {
    if (autoExpanded) return autoExpanded.has(key)
    return expanded[key] ?? false
  }

  const onSelect = (path: string) => {
    void navigate(path)
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          title="Surface home"
          className="cursor-pointer font-heading text-base leading-none font-normal tracking-normal text-foreground/85 transition hover:text-foreground"
        >
          {surfaceConfig.name}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={togglePinned}
            aria-label={pinned ? "Unpin panel" : "Pin panel"}
            title={pinned ? "Unpin" : "Pin to push content"}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {pinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close browse panel"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {pinned ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      <div className="border-b px-3 py-2">
        <div className="flex items-center gap-2 rounded-md border bg-background px-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter prototypes…"
            className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear filter"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex-1 overflow-auto py-3">
        {tree.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No prototypes.
          </div>
        ) : (
          <Tree
            nodes={tree}
            depth={0}
            ancestorIsLast={[]}
            currentPath={prototypeKeyForPathname(location.pathname)}
            matchSet={matchSet}
            isExpanded={isExpanded}
            onToggle={(key) => {
              if (autoExpanded) return
              setExpanded(key, !(expanded[key] ?? false))
            }}
            onSelect={onSelect}
          />
        )}
      </div>
    </>
  )
}

interface TreeProps {
  nodes: TreeNode[]
  depth: number
  ancestorIsLast: boolean[]
  currentPath: string
  matchSet: Set<string> | null
  isExpanded: (key: string) => boolean
  onToggle: (key: string) => void
  onSelect: (path: string) => void
}

function nodeIsVisible(node: TreeNode, matchSet: Set<string> | null): boolean {
  if (!matchSet) return true
  if (node.kind === "leaf") return matchSet.has(node.key)
  return node.children.some((c) => nodeIsVisible(c, matchSet))
}

function Tree({ nodes, ancestorIsLast, ...rest }: TreeProps) {
  const visible = nodes.filter((n) => nodeIsVisible(n, rest.matchSet))
  return (
    <ul className="flex flex-col">
      {visible.map((node, i) => {
        const isLast = i === visible.length - 1
        return (
          <TreeRow
            key={node.key}
            node={node}
            ancestorIsLast={[...ancestorIsLast, isLast]}
            {...rest}
          />
        )
      })}
    </ul>
  )
}

function GuideCell({ through }: { through: boolean }) {
  return (
    <span
      aria-hidden
      className="relative shrink-0 self-stretch"
      style={{ width: INDENT_STEP }}
    >
      {through ? (
        <span
          className={`pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 ${GUIDE_COLOR_CLS}`}
        />
      ) : null}
    </span>
  )
}

function ElbowCell({ isLast }: { isLast: boolean }) {
  return (
    <span
      aria-hidden
      className="relative shrink-0 self-stretch"
      style={{ width: INDENT_STEP }}
    >
      {isLast ? (
        <span
          className={`pointer-events-none absolute box-border border-b border-l ${GUIDE_BORDER_CLS}`}
          style={{
            left: "calc(50% - 0.5px)",
            top: 0,
            width: `calc(50% + 0.5px)`,
            height: "50%",
            borderBottomLeftRadius: ELBOW_RADIUS,
          }}
        />
      ) : (
        <>
          <span
            className={`pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 ${GUIDE_COLOR_CLS}`}
          />
          <span
            className={`pointer-events-none absolute h-px ${GUIDE_COLOR_CLS}`}
            style={{
              left: "50%",
              right: 0,
              top: "calc(50% - 0.5px)",
            }}
          />
        </>
      )}
    </span>
  )
}

function RowGuides({
  ancestorIsLast,
  depth,
}: {
  ancestorIsLast: boolean[]
  depth: number
}) {
  if (depth === 0) return null
  return (
    <>
      {Array.from({ length: depth - 1 }).map((_, k) => (
        <GuideCell key={k} through={!ancestorIsLast[k + 1]} />
      ))}
      <ElbowCell isLast={ancestorIsLast[depth]} />
    </>
  )
}

function TreeRow({
  node,
  depth,
  ancestorIsLast,
  currentPath,
  matchSet,
  isExpanded,
  onToggle,
  onSelect,
}: { node: TreeNode } & Omit<TreeProps, "nodes">) {
  if (node.kind === "leaf") {
    const isCurrent = currentPath === node.key
    return (
      <li className="relative">
        <button
          type="button"
          onClick={() => onSelect(node.key)}
          onMouseEnter={() => preloadPrototype(node.key)}
          className={`flex w-full items-stretch text-left text-[13px] leading-tight transition hover:bg-accent/60 ${
            isCurrent
              ? "bg-accent font-semibold text-foreground"
              : "text-foreground/85"
          }`}
        >
          <span
            aria-hidden
            className="shrink-0"
            style={{ width: BASE_INDENT }}
          />
          <RowGuides ancestorIsLast={ancestorIsLast} depth={depth} />
          <span className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-3 pl-2">
            <span className="truncate">{node.name}</span>
          </span>
        </button>
        {isCurrent ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-0 z-20 w-[3px] bg-foreground"
          />
        ) : null}
      </li>
    )
  }

  const open = isExpanded(node.key)
  const isTopLevel = depth === 0
  const Icon = isTopLevel ? topLevelIcon(node.segments[0] ?? "") : Folder

  return (
    <li className={isTopLevel ? "mt-1 first:mt-0" : ""}>
      <button
        type="button"
        onClick={() => onToggle(node.key)}
        className={`flex w-full items-stretch text-left transition hover:bg-accent/60 ${
          isTopLevel
            ? "text-[13px] font-semibold text-foreground"
            : "text-[13px] text-foreground/80"
        }`}
      >
        <span aria-hidden className="shrink-0" style={{ width: BASE_INDENT }} />
        <RowGuides ancestorIsLast={ancestorIsLast} depth={depth} />
        <span className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-3 pl-1">
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
          {/* An icon picked from config, not a component defined here. */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Icon
            className={`h-4 w-4 shrink-0 ${
              isTopLevel ? "text-foreground/80" : "text-muted-foreground"
            }`}
          />
          <span className="truncate">{node.name}</span>
        </span>
      </button>
      {open ? (
        <Tree
          nodes={node.children}
          depth={depth + 1}
          ancestorIsLast={ancestorIsLast}
          currentPath={currentPath}
          matchSet={matchSet}
          isExpanded={isExpanded}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ) : null}
    </li>
  )
}
