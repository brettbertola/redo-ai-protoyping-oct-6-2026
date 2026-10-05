import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"
import {
  HELPERS,
  appendListItem,
  applyEdits,
  ensureImport,
  loadConfig,
  propertyKey,
  removeListItem,
} from "../lib/config-ast.mjs"
import {
  componentDir,
  componentValues,
  describeAxes,
  findMentions,
  pruneEmptyDirs,
  resolvePrototype,
} from "../lib/project.mjs"
import { assertName, pascalCase, stop, titleize } from "../lib/util.mjs"

const KINDS = ["enum", "bool", "component", "fixture"]

function variantStub(axis, value) {
  return `// The "${value}" option of the "${axis}" variant.
export default function ${pascalCase(value)}Option() {
  return (
    <section className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      ${titleize(axis)}: ${titleize(value)}
    </section>
  )
}
`
}

function findAxis(config, name, prototype) {
  const axis = config.axes.find((a) => a.name === name)
  if (!axis) {
    stop(`The prototype ${prototype.id} has no variant "${name}".`, {
      variants: config.axes.map((a) => a.name),
    })
  }
  return axis
}

function valuesOf(prototype, axis) {
  return axis.kind === "component"
    ? componentValues(prototype, axis.name)
    : axis.values
}

function url(prototype, axis, value) {
  return `${prototype.url}?${encodeURIComponent(axis)}=${encodeURIComponent(value)}`
}

function setDefaultEdits(config, axis, value) {
  const literal = axis.kind === "bool" ? String(value) : JSON.stringify(value)
  if (axis.defaultNode) {
    return [
      {
        start: axis.defaultNode.getStart(),
        end: axis.defaultNode.getEnd(),
        text: literal,
      },
    ]
  }
  if (axis.options) {
    return [
      appendListItem(
        config,
        axis.options,
        axis.options.properties,
        `default: ${literal}`
      ),
    ]
  }
  // componentProp() with no options yet.
  const close = axis.call.getEnd() - 1
  const hasArgs = axis.call.arguments.length > 0
  return [
    {
      start: close,
      end: close,
      text: `${hasArgs ? ", " : ""}{ default: ${literal} }`,
    },
  ]
}

function addAxis(prototype, config, name, args) {
  const kind = args.kind
  if (!KINDS.includes(kind)) {
    stop(`Give the kind of the variant "${name}" with --kind.`, {
      kinds: {
        component:
          "different designs of one section (one file for each option)",
        enum: "one of some named values",
        bool: "a property that is on or off",
        fixture: "different sample data",
      },
    })
  }
  if (!config.variantsObject) {
    stop(
      `The file ${prototype.id}/prototype.config.ts has no "variants: { ... }" block. Add the block first.`
    )
  }
  const first = kind === "bool" ? null : assertName(args._[3], "option name")
  const created = []
  let entry
  if (kind === "bool") {
    entry = `boolProp({ default: ${args.default === "true" || args.default === true} })`
  } else if (kind === "enum") {
    entry = `enumProp([${JSON.stringify(first)}], { default: ${JSON.stringify(first)} })`
  } else if (kind === "fixture") {
    entry = `fixtureProp({ ${propertyKey(first)}: () => ({}) }, { default: ${JSON.stringify(first)} })`
  } else {
    entry = `componentProp({ default: ${JSON.stringify(first)} })`
    const dir = componentDir(prototype, name)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, `${first}.tsx`), variantStub(name, first))
    created.push(`prototypes/${prototype.id}/variants/${name}/${first}.tsx`)
  }
  applyEdits(config, [
    appendListItem(
      config,
      config.variantsObject,
      config.variantsObject.properties,
      `${propertyKey(name)}: ${entry}`
    ),
    ...ensureImport(config, HELPERS[kind]),
  ])
  return {
    summary: `I added the variant "${name}" to ${prototype.id}.`,
    axis: name,
    kind,
    created,
    next:
      kind === "component"
        ? `Make the design in ${created[0]}. Show it in prototype.tsx with: const { ${propertyKey(name)}: ${pascalCase(name)} } = usePrototypeProps(config)`
        : `Read the value in prototype.tsx with: const { ${propertyKey(name)} } = usePrototypeProps(config)`,
  }
}

function add(prototype, args) {
  const config = loadConfig(prototype.configFile)
  const name = assertName(args._[2], "variant name")
  const axis = config.axes.find((a) => a.name === name)
  if (!axis) return addAxis(prototype, config, name, args)

  if (axis.kind === "bool") {
    stop(
      `"${name}" is an on/off variant. You cannot add an option to it. Use set-default to change the default.`
    )
  }
  const value = assertName(args._[3], "option name")
  if (valuesOf(prototype, axis).includes(value)) {
    stop(`The variant "${name}" already has the option "${value}".`)
  }
  const created = []
  if (axis.kind === "component") {
    const dir = componentDir(prototype, name)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, `${value}.tsx`), variantStub(name, value))
    created.push(`prototypes/${prototype.id}/variants/${name}/${value}.tsx`)
  } else if (!axis.valuesNode) {
    stop(
      `I cannot find the options of "${name}" in the config file. Edit the file directly.`
    )
  } else if (axis.kind === "enum") {
    applyEdits(config, [
      appendListItem(
        config,
        axis.valuesNode,
        axis.valuesNode.elements,
        JSON.stringify(value)
      ),
    ])
  } else {
    applyEdits(config, [
      appendListItem(
        config,
        axis.valuesNode,
        axis.valuesNode.properties,
        `${propertyKey(value)}: () => ({})`
      ),
    ])
  }
  return {
    summary: `I added the option "${value}" to "${name}" in ${prototype.id}.`,
    axis: name,
    value,
    created,
    url: url(prototype, name, value),
  }
}

function rename(prototype, args) {
  const config = loadConfig(prototype.configFile)
  const axis = findAxis(config, args._[2], prototype)
  const from = args._[3]
  const to = assertName(args._[4], "option name")
  const values = valuesOf(prototype, axis)
  if (axis.kind === "bool")
    stop(`"${axis.name}" is an on/off variant. You cannot rename its options.`)
  if (!values.includes(from))
    stop(`The variant "${axis.name}" has no option "${from}".`, { values })
  if (values.includes(to))
    stop(`The variant "${axis.name}" already has the option "${to}".`)

  const edits = []
  if (axis.kind === "component") {
    const dir = componentDir(prototype, axis.name)
    renameSync(join(dir, `${from}.tsx`), join(dir, `${to}.tsx`))
  } else if (axis.kind === "enum") {
    const element = axis.valuesNode.elements.find((e) => e.text === from)
    edits.push({
      start: element.getStart(),
      end: element.getEnd(),
      text: JSON.stringify(to),
    })
  } else {
    const property = axis.valuesNode.properties.find(
      (p) => p.name.text === from
    )
    edits.push({
      start: property.name.getStart(),
      end: property.name.getEnd(),
      text: propertyKey(to),
    })
  }
  if (axis.default === from) edits.push(...setDefaultEdits(config, axis, to))
  if (edits.length) applyEdits(config, edits)

  return {
    summary: `I renamed "${from}" to "${to}" in "${axis.name}" of ${prototype.id}.`,
    axis: axis.name,
    value: to,
    url: url(prototype, axis.name, to),
    // Code that compares against the old name will need a look.
    stillMentionedIn: findMentions(prototype.dir, from),
  }
}

function setDefault(prototype, args) {
  const config = loadConfig(prototype.configFile)
  const axis = findAxis(config, args._[2], prototype)
  let value = args._[3]
  if (axis.kind === "bool") {
    if (value !== "true" && value !== "false")
      stop(`Use true or false for "${axis.name}".`)
    value = value === "true"
  } else {
    const values = valuesOf(prototype, axis)
    if (!values.includes(value))
      stop(`The variant "${axis.name}" has no option "${value}".`, { values })
  }
  applyEdits(config, setDefaultEdits(config, axis, value))
  return {
    summary: `"${value}" is now the default for "${axis.name}" in ${prototype.id}.`,
    axis: axis.name,
    default: value,
  }
}

function removeValue(prototype, config, axis, value, args) {
  const values = valuesOf(prototype, axis)
  if (axis.kind === "bool")
    stop(`"${axis.name}" is an on/off variant. Delete the full variant.`)
  if (!values.includes(value))
    stop(`The variant "${axis.name}" has no option "${value}".`, { values })
  if (values.length === 1) {
    stop(
      `"${value}" is the only option of "${axis.name}". Delete the full variant.`
    )
  }
  const remaining = values.filter((v) => v !== value)
  const currentDefault = axis.default ?? values[0]
  let newDefault = null
  if (currentDefault === value) {
    newDefault = args["new-default"]
    if (!remaining.includes(newDefault)) {
      stop(
        `"${value}" is the default for "${axis.name}". Give the new default with --new-default.`,
        {
          choices: remaining,
        }
      )
    }
  }
  if (!args.yes) {
    return {
      summary: `This command deletes the option "${value}" from "${axis.name}" in ${prototype.id}. It did not delete now. Get approval from the designer. Then run it again with --yes.`,
      confirm: true,
    }
  }
  const edits = []
  const deleted = []
  if (axis.kind === "component") {
    rmSync(join(componentDir(prototype, axis.name), `${value}.tsx`))
    deleted.push(
      `prototypes/${prototype.id}/variants/${axis.name}/${value}.tsx`
    )
  } else if (axis.kind === "enum") {
    const element = axis.valuesNode.elements.find((e) => e.text === value)
    edits.push(removeListItem(config, axis.valuesNode.elements, element))
  } else {
    const property = axis.valuesNode.properties.find(
      (p) => p.name.text === value
    )
    edits.push(removeListItem(config, axis.valuesNode.properties, property))
  }
  if (newDefault) edits.push(...setDefaultEdits(config, axis, newDefault))
  if (edits.length) applyEdits(config, edits)
  return {
    summary: `I deleted the option "${value}" from "${axis.name}" in ${prototype.id}.`,
    axis: axis.name,
    deleted,
    newDefault,
    stillMentionedIn: findMentions(prototype.dir, value),
    note: "Old links that use this option now show the default.",
  }
}

function removeAxis(prototype, config, axis, args) {
  const dir = componentDir(prototype, axis.name)
  const files =
    axis.kind === "component"
      ? componentValues(prototype, axis.name).map(
          (v) => `prototypes/${prototype.id}/variants/${axis.name}/${v}.tsx`
        )
      : []
  if (!args.yes) {
    return {
      summary: `This command deletes the full variant "${axis.name}" from ${prototype.id}${files.length ? ` and ${files.length} files` : ""}. It did not delete now. Get approval from the designer. Then run it again with --yes.`,
      confirm: true,
      files,
    }
  }
  applyEdits(config, [
    removeListItem(config, config.variantsObject.properties, axis.property),
  ])
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true })
    pruneEmptyDirs(join(prototype.dir, "variants"), prototype.dir)
  }
  return {
    summary: `I deleted the variant "${axis.name}" from ${prototype.id}.`,
    axis: axis.name,
    deleted: files,
    next: `Remove "${axis.name}" from the usePrototypeProps(config) line in prototype.tsx. Remove the code that used it.`,
    stillMentionedIn: findMentions(prototype.dir, axis.name),
  }
}

function remove(prototype, args) {
  const config = loadConfig(prototype.configFile)
  const axis = findAxis(config, args._[2], prototype)
  const value = args._[3]
  return value === undefined
    ? removeAxis(prototype, config, axis, args)
    : removeValue(prototype, config, axis, value, args)
}

export async function run(args) {
  const action = args._[0]
  const prototype = resolvePrototype(args._[1])
  if (action === "list") {
    const variants = describeAxes(prototype)
    return {
      summary: `${prototype.id} has ${variants.length} variant${variants.length === 1 ? "" : "s"}.`,
      id: prototype.id,
      url: prototype.url,
      variants,
    }
  }
  if (action === "add") return add(prototype, args)
  if (action === "rename") return rename(prototype, args)
  if (action === "set-default") return setDefault(prototype, args)
  if (action === "delete") return remove(prototype, args)
  stop(
    `"${action}" is not a variant command. Use list, add, rename, set-default or delete.`
  )
}
