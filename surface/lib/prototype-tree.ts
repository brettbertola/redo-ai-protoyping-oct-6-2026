import { segmentLabel, type PrototypeEntry } from "./registry"

export interface TreeFolder {
  kind: "folder"
  key: string
  name: string
  segments: string[]
  children: TreeNode[]
}

export interface TreeLeaf {
  kind: "leaf"
  key: string
  name: string
  entry: PrototypeEntry
}

export type TreeNode = TreeFolder | TreeLeaf

export function buildPrototypeTree(entries: PrototypeEntry[]): TreeNode[] {
  const root: TreeFolder = {
    kind: "folder",
    key: "",
    name: "",
    segments: [],
    children: [],
  }

  const folderIndex = new Map<string, TreeFolder>()
  folderIndex.set("", root)

  for (const entry of entries) {
    const { segments } = entry
    let parent = root
    for (let i = 0; i < segments.length - 1; i++) {
      const segs = segments.slice(0, i + 1)
      const key = segs.join("/")
      let folder = folderIndex.get(key)
      if (!folder) {
        folder = {
          kind: "folder",
          key,
          name: segmentLabel(segments[i]),
          segments: segs,
          children: [],
        }
        folderIndex.set(key, folder)
        parent.children.push(folder)
      }
      parent = folder
    }
    parent.children.push({
      kind: "leaf",
      key: entry.path,
      name: entry.title,
      entry,
    })
  }

  sortNodes(root)
  return root.children
}

function sortNodes(folder: TreeFolder) {
  folder.children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  for (const child of folder.children) {
    if (child.kind === "folder") sortNodes(child)
  }
}

export function collectMatchingFolderKeys(
  nodes: TreeNode[],
  matches: Set<string>
): Set<string> {
  const expanded = new Set<string>()
  const walk = (list: TreeNode[]): boolean => {
    let hasMatch = false
    for (const node of list) {
      if (node.kind === "leaf") {
        if (matches.has(node.key)) hasMatch = true
      } else {
        const childMatch = walk(node.children)
        if (childMatch) {
          expanded.add(node.key)
          hasMatch = true
        }
      }
    }
    return hasMatch
  }
  walk(nodes)
  return expanded
}
