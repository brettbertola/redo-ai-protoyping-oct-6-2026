// Reads and edits the `variants` block of a prototype.config.ts without
// disturbing anything else in the file.
import { readFileSync, writeFileSync } from "node:fs"
import ts from "typescript"
import { runBin, stop } from "./util.mjs"

const KINDS = {
  enumProp: "enum",
  boolProp: "bool",
  fixtureProp: "fixture",
  componentProp: "component",
}
export const HELPERS = Object.fromEntries(
  Object.entries(KINDS).map(([helper, kind]) => [kind, helper])
)

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

export function propertyKey(name) {
  return IDENTIFIER.test(name) ? name : JSON.stringify(name)
}

function nameOf(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text
  return null
}

function findProperty(object, name) {
  return object.properties.find(
    (p) => ts.isPropertyAssignment(p) && nameOf(p.name) === name
  )
}

export function loadConfig(file) {
  const text = readFileSync(file, "utf8")
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)

  let configObject = null
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "definePrototype" &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      configObject = node.arguments[0]
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  if (!configObject) {
    stop(
      `The file ${file} does not use definePrototype({ ... }). The script cannot edit it.`
    )
  }

  const variantsProperty = findProperty(configObject, "variants")
  const variantsObject =
    variantsProperty &&
    ts.isObjectLiteralExpression(variantsProperty.initializer)
      ? variantsProperty.initializer
      : null

  const axes = []
  for (const property of variantsObject?.properties ?? []) {
    if (!ts.isPropertyAssignment(property)) continue
    const call = property.initializer
    if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression))
      continue
    const kind = KINDS[call.expression.text]
    if (!kind) continue
    const [first, second] = call.arguments
    const optionsNode = kind === "bool" || kind === "component" ? first : second
    const options =
      optionsNode && ts.isObjectLiteralExpression(optionsNode)
        ? optionsNode
        : null
    const defaultProperty = options ? findProperty(options, "default") : null
    const defaultNode = defaultProperty?.initializer ?? null
    let defaultValue = null
    if (defaultNode) {
      if (defaultNode.kind === ts.SyntaxKind.TrueKeyword) defaultValue = true
      else if (defaultNode.kind === ts.SyntaxKind.FalseKeyword)
        defaultValue = false
      else if (ts.isStringLiteralLike(defaultNode))
        defaultValue = defaultNode.text
    }
    const axis = {
      name: nameOf(property.name),
      kind,
      property,
      call,
      options,
      defaultNode,
      default: defaultValue,
      valuesNode: null,
      values: [],
    }
    if (kind === "enum" && first && ts.isArrayLiteralExpression(first)) {
      axis.valuesNode = first
      axis.values = first.elements
        .filter(ts.isStringLiteralLike)
        .map((e) => e.text)
    } else if (
      kind === "fixture" &&
      first &&
      ts.isObjectLiteralExpression(first)
    ) {
      axis.valuesNode = first
      axis.values = first.properties.map((p) => nameOf(p.name)).filter(Boolean)
    } else if (kind === "bool") {
      axis.values = ["true", "false"]
    }
    axes.push(axis)
  }

  return {
    file,
    text,
    source,
    configObject,
    variantsProperty,
    variantsObject,
    axes,
  }
}

/** Applies { start, end, text } replacements, last first so offsets hold. */
export function applyEdits(config, edits) {
  let text = config.text
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end)
  }
  writeFileSync(config.file, text)
  // Tidy the layout; the edit stands even if formatting is unavailable.
  runBin("prettier", ["--write", config.file])
}

/** Removes one item from a comma-separated list, with its comma and line. */
export function removeListItem(config, list, node) {
  const items = [...list]
  const index = items.indexOf(node)
  const text = config.text
  let start = node.getFullStart()
  let end = node.getEnd()
  if (index < items.length - 1) {
    end = items[index + 1].getFullStart()
  } else {
    const comma = /^\s*,/.exec(text.slice(end))
    if (comma) end += comma[0].length
    else if (index > 0) start = items[index - 1].getEnd()
  }
  return { start, end, text: "" }
}

/** Inserts an item at the end of an object or array literal. */
export function appendListItem(config, container, items, itemText) {
  const text = config.text
  const close = container.getEnd() - 1
  const multiline = text.slice(container.getStart(), close).includes("\n")
  if (items.length === 0) {
    if (multiline) {
      // Keep the closing brace's own indentation.
      const lineStart = text.lastIndexOf("\n", close - 1) + 1
      const indent = text.slice(lineStart, close)
      return {
        start: lineStart,
        end: lineStart,
        text: `${indent}  ${itemText},\n`,
      }
    }
    return {
      start: container.getStart() + 1,
      end: close,
      text: ` ${itemText} `,
    }
  }
  const last = items[items.length - 1]
  const hasComma = /^\s*,/.test(text.slice(last.getEnd(), close))
  if (multiline) {
    const lineStart = text.lastIndexOf("\n", last.getStart()) + 1
    const indent = /^\s*/.exec(text.slice(lineStart))[0]
    const afterLast = hasComma
      ? last.getEnd() + /^\s*,/.exec(text.slice(last.getEnd()))[0].length
      : last.getEnd()
    return {
      start: afterLast,
      end: afterLast,
      text: `${hasComma ? "" : ","}\n${indent}${itemText},`,
    }
  }
  return { start: last.getEnd(), end: last.getEnd(), text: `, ${itemText}` }
}

/** Makes sure `name` is imported from "@surface". */
export function ensureImport(config, name) {
  for (const statement of config.source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "@surface"
    ) {
      continue
    }
    const named = statement.importClause?.namedBindings
    if (!named || !ts.isNamedImports(named)) continue
    if (named.elements.some((e) => e.name.text === name)) return []
    const names = [...named.elements.map((e) => e.name.text), name].sort()
    return [
      {
        start: named.getStart(),
        end: named.getEnd(),
        text: `{ ${names.join(", ")} }`,
      },
    ]
  }
  return [{ start: 0, end: 0, text: `import { ${name} } from "@surface"\n` }]
}
