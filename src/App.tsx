import { useMemo, useRef } from "react"
import { type Node, nodes, nodes2 } from "./data"

type FlowData = {
	nodes: Array<Node>
	reachability: Map<string, Set<string>>
	inDegrees: Map<string, number>
	startNodes: Array<string>
}

const buildFlowData = (nodes: Node[]): FlowData => {
	const nodeMap = new Map<string, Node>()
	const reachability = new Map<string, Set<string>>()

	for (const node of nodes) {
		nodeMap.set(node.id, node)
		reachability.set(node.id, new Set<string>())
	}

	// Calculate in-degrees
	const inDegrees = nodes
		.flatMap(n => n.nextIds)
		.reduce(
			(acc, id) => acc.set(id, (acc.get(id) ?? 0) + 1),
			new Map<string, number>(),
		)

	// Topological sort using Kahn's algorithm
	const startNodes = nodes
		.filter(node => !inDegrees.has(node.id))
		.map(n => n.id)

	const topOrder: string[] = []
	const queue: string[] = [...startNodes]

	const currentDegree = new Map(inDegrees)
	while (queue.length > 0) {
		const current = queue.shift()!
		topOrder.push(current)

		const node = nodeMap.get(current)
		if (node == null) continue

		for (const nextId of node.nextIds) {
			const newDegree = currentDegree.get(nextId)! - 1
			currentDegree.set(nextId, newDegree)
			if (newDegree === 0) queue.push(nextId)
		}
	}

	// Process nodes in reverse topological order for DP
	for (let i = topOrder.length - 1; i >= 0; i--) {
		const nodeId = topOrder[i]
		const node = nodeMap.get(nodeId)
		const currentReachable = reachability.get(nodeId)!
		if (node == null) continue

		for (const nextId of node.nextIds) {
			// Add direct neighbor
			currentReachable.add(nextId)
			// Add all nodes reachable from neighbor
			reachability.get(nextId)?.forEach(id => currentReachable.add(id))
		}
	}

	return { nodes, reachability, inDegrees, startNodes }
}

type Branch = Array<string | Array<Branch>>

const transform = (nodes: Array<Node>) => {
	const data = buildFlowData(nodes)
	if (data.startNodes.length !== 1) throw new Error("invalid start nodes")

	const [branch, outgoing] = buildBranch(data)
	if (outgoing.length > 0) throw new Error("unresolved outgoing")

	return branch
}

const buildBranch = (
	data: FlowData,
	start: string = data.startNodes[0],
	seen: Set<string> = new Set(),
	stopOn: Set<string> = new Set(),
): [Branch, Array<string>] => {
	const branch = []
	let outgoing: Array<string> = []
	let current = data.nodes.find(n => n.id === start)!

	while (true) {
		if (seen.has(current.id)) throw new Error("cycle at " + current.id)
		if (stopOn.has(current.id)) {
			outgoing.push(current.id)
			break
		}

		branch.push(current.id)
		seen.add(current.id)

		if (current.nextIds.length === 0) break
		if (current.nextIds.length === 1) {
			current = data.nodes.find(n => n.id === current.nextIds[0])!
			continue
		}

		// i'm branching aaaaaaaaa
		const branches = []
		for (const nextId of current.nextIds) {
			if (stopOn.has(nextId)) {
				outgoing.push(nextId)
				continue
			}

			const otherBranches = current.nextIds.filter(id => id !== nextId)

			const otherBranchAdjs = otherBranches
				.flatMap(id => [...data.reachability.get(id)!])
				.concat(otherBranches)
				.concat([...stopOn])

			const stopSubOn = new Set(otherBranchAdjs)
			const [sub, subSkipped] = buildBranch(data, nextId, seen, stopSubOn)
			for (const id of subSkipped) outgoing.push(id)
			branches.push(sub)
		}

		branch.push(branches)

		const toResolve = [...new Set(outgoing)].filter(out => {
			const degree = data.nodes.filter(n => n.nextIds.includes(out)).length
			const count = outgoing.filter(id => id === out).length
			return degree === count
		})

		if (toResolve.length === 0) break
		if (toResolve.length > 1) throw new Error("multiple outgoing branches")

		outgoing = outgoing.filter(id => id !== toResolve[0])
		current = data.nodes.find(n => n.id === toResolve[0])!
		continue
	}

	return [branch, outgoing]
}

const Node = (props: {
	id: string
	onRef: (node: HTMLDivElement | null, id: string) => void
}) => (
	<div
		ref={r => props.onRef(r, props.id)}
		className="relative flex h-14 w-32 flex-none items-center justify-center rounded-2xl bg-neutral-600 text-sm font-bold uppercase"
	>
		{props.id}
	</div>
)

const Flow = (props: {
	branch: Branch
	onRef: (node: HTMLDivElement | null, id: string) => void
}) => (
	<div className="flex flex-none items-center justify-start gap-20">
		{props.branch.map((s, idx) =>
			Array.isArray(s) ? (
				<div className="flex flex-none flex-col gap-4" key={idx}>
					{s.map((s2, idx2) => (
						<Flow key={idx2} branch={s2} onRef={props.onRef} />
					))}
				</div>
			) : (
				<Node key={idx} onRef={props.onRef} id={s} />
			),
		)}
	</div>
)

const FlowContainer = (props: { nodes: typeof nodes }) => {
	const branch = useMemo(() => transform(props.nodes), [props.nodes])

	const nodeRefs = useRef<Map<string, HTMLDivElement> | null>(null)
	const edgeRefs = useRef<Array<SVGElement>>([])

	const onRef = (node: HTMLDivElement | null, id: string) => {
		if (nodeRefs.current == null) nodeRefs.current = new Map()

		if (node == null) {
			nodeRefs.current.delete(id)
			return
		}

		nodeRefs.current.set(id, node)
		if (nodeRefs.current.size === props.nodes.length) {
			edgeRefs.current.forEach(el => el.remove())
			edgeRefs.current = []

			for (const node of props.nodes) {
				const nodeRef = nodeRefs.current.get(node.id)
				if (nodeRef == null) continue

				const nodeBounds = nodeRef.getBoundingClientRect()

				const nextNodes = node.nextIds
					.map(id => nodeRefs.current?.get(id))
					.filter(n => n != null)
					.map(n => ({ node: n, bounds: n.getBoundingClientRect() }))
					.sort((a, b) => a.bounds.y - b.bounds.y)

				nextNodes.forEach((target, index) => {
					const edge = createEdgeEl(
						nodeBounds,
						target.bounds,
						index,
						nextNodes.length,
					)

					nodeRef.appendChild(edge)
					edgeRefs.current.push(edge)
				})
			}
		}
	}

	return (
		<div className="relative h-[30rem] w-full overflow-auto border border-neutral-400">
			<div className="absolute top-10 left-10 pr-20 pb-20">
				<Flow branch={branch} onRef={onRef} />
			</div>
		</div>
	)
}

const lineWidth = 3
const padding = 10
const joinOffset = 14
const cornerRadius = 4
const outDegreeOffset = 8

const createEdgeEl = (
	source: DOMRect,
	target: DOMRect,
	index: number,
	outDegree: number,
) => {
	const w = Math.abs(target.x - source.x - target.width)

	const sourceY = (source.height - lineWidth) / 2
	const targetY = (target.height - lineWidth) / 2

	const sourceYAbs = source.y + sourceY
	const targetYAbs = target.y + targetY

	const diff = targetYAbs - sourceYAbs
	const h = Math.abs(diff) + lineWidth

	const edge = document.createElementNS("http://www.w3.org/2000/svg", "svg")

	edge.setAttribute("viewBox", `0 0 ${w} ${h}`)
	edge.style.width = `${w}px`
	edge.style.height = `${h}px`
	edge.style.position = "absolute"
	edge.style.left = `${source.width}px`
	edge.style.zIndex = "1"

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
	path.classList.add("text-neutral-400")
	path.setAttribute("stroke", "currentcolor")
	path.setAttribute("stroke-width", `${lineWidth}`)
	path.setAttribute("stroke-linecap", "round")
	path.setAttribute("fill", "none")

	const outOffset = (index - (outDegree - 1) / 2) * outDegreeOffset
	const outOffsetX = outOffset * 1.5

	if (diff === 0) {
		edge.style.top = `${sourceY}px`
		path.setAttributeNS(
			null,
			"d",
			`
				M ${padding} ${lineWidth / 2}
				l ${w - padding * 2} 0
			`,
		)
	} else if (diff > 0) {
		// Going down
		edge.style.top = `${sourceY}px`
		path.setAttributeNS(
			null,
			"d",
			`
				M ${padding} ${lineWidth / 2 + outOffset}
				l ${w - joinOffset - outOffsetX - padding * 2 - cornerRadius} 0
				a ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} ${cornerRadius}
				l 0 ${h - lineWidth - outOffset - cornerRadius * 2}
				a ${cornerRadius} ${cornerRadius} 0 0 0 ${cornerRadius} ${cornerRadius}
				l ${joinOffset - cornerRadius + outOffsetX} 0
			`,
		)
	} else {
		// Going up
		edge.style.top = `${(h - sourceY - lineWidth) * -1}px`
		path.setAttributeNS(
			null,
			"d",
			`
				M ${padding} ${h - lineWidth / 2 + outOffset}
				l ${w - joinOffset + outOffsetX - padding * 2 - cornerRadius} 0
				a ${cornerRadius} ${cornerRadius} 0 0 0 ${cornerRadius} ${-cornerRadius}
				l 0 ${-h + lineWidth - outOffset + cornerRadius * 2}
				a ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} ${-cornerRadius}
				l ${joinOffset - cornerRadius - outOffsetX} 0
			`,
		)
	}

	edge.appendChild(path)
	return edge
}

export const App = () => (
	<div className="m-6 flex flex-col gap-10">
		<FlowContainer nodes={nodes} />
		<FlowContainer nodes={nodes2} />
	</div>
)
