import { type Node } from "./data"

export const sortTopo = (nodes: Array<Node>) => {
	const columns = []
	const edges = new Map<string, Set<string>>()
	for (const node of nodes) {
		edges.set(node.id, new Set(node.nextIds))
	}

	const st = new Set(nodes.map(n => n.id))

	while (true) {
		const targets = new Set([...edges.values()].flatMap(s => [...s]))
		const noIncoming = [...st].filter(id => !targets.has(id))
		if (noIncoming.length === 0) break

		const c = []
		for (const id of noIncoming) {
			st.delete(id)
			edges.delete(id)
			c.push(id)
		}

		columns.push(c)
	}

	if (st.size > 0) {
		console.error("Graph has cycles")
		return null
	}

	return columns
}
