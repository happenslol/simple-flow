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

const Node = (props: { id: string }) => (
	<div className="flex h-14 w-32 items-center justify-center rounded-2xl bg-neutral-600 text-sm font-bold uppercase">
		{props.id}
	</div>
)

const Flow = (props: { branch: Branch }) => (
	<div className="flex items-center justify-start gap-6 [&>*]:shrink-0">
		{props.branch.map((s, idx) =>
			Array.isArray(s) ? (
				<div className="flex flex-col gap-4" key={idx}>
					{s.map((s2, idx2) => (
						<Flow key={idx2} branch={s2} />
					))}
				</div>
			) : (
				<Node key={idx} id={s} />
			),
		)}
	</div>
)

export const App = () => (
	<div className="flex min-h-screen min-w-full flex-col gap-20 overflow-x-auto p-8">
		<Flow branch={transform(nodes)} />
		<Flow branch={transform(nodes2)} />
	</div>
)
