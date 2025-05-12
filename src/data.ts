export type Node = {
	id: string
	nextIds: Array<string>
}

// Graph layout:
//       ┌─→2a──→2b───────────┐
// 1──→2─┤                    ├─→4──→5
//       └─→3┬──→3a───────────┤
//           ├──→3b──→3d──→3f─┤
//           └──→3c──→3e──────┘

export const nodes: Array<Node> = [
	{ id: "1", nextIds: ["2"] },
	{ id: "2", nextIds: ["2a", "3"] },
	{ id: "2a", nextIds: ["2b"] },
	{ id: "2b", nextIds: ["4"] },
	{ id: "3", nextIds: ["3a", "3b", "3c"] },
	{ id: "3a", nextIds: ["4"] },
	{ id: "3b", nextIds: ["3d"] },
	{ id: "3c", nextIds: ["3e"] },
	{ id: "3d", nextIds: ["3f"] },
	{ id: "3e", nextIds: ["4"] },
	{ id: "3f", nextIds: ["4"] },
	{ id: "4", nextIds: ["5"] },
	{ id: "5", nextIds: [] },
]

// Graph layout:
//                   ┌─→2c─→2e──┐     ┌─→2h─→2j──┐
//       ┌─→2a──→2b──┤          ├─→2g─┤          ├────┐    ┌─→4a─→4c──┐
// 1──→2─┤           └─→2d─→2f──┘     └─→2i─→2k──┘    ├─→4─┤          ├─→5
//       └─→3┬──→3a───────────┬→3g─┬──→3h─────────────┤    └─→4b─→4d──┘
//           ├──→3b──→3d──→3f─┤    └──→3i──→3j──→3k───┘
//           └──→3c──→3e──────┘

export const nodes2: Array<Node> = [
	{ id: "1", nextIds: ["2"] },
	{ id: "2", nextIds: ["2a", "3"] },
	{ id: "2a", nextIds: ["2b"] },
	{ id: "2b", nextIds: ["2c", "2d"] },
	{ id: "2c", nextIds: ["2e"] },
	{ id: "2d", nextIds: ["2f"] },
	{ id: "2e", nextIds: ["2g"] },
	{ id: "2f", nextIds: ["2g"] },
	{ id: "2g", nextIds: ["2h", "2i"] },
	{ id: "2h", nextIds: ["2j"] },
	{ id: "2i", nextIds: ["2k"] },
	{ id: "2j", nextIds: ["4"] },
	{ id: "2k", nextIds: ["4"] },
	{ id: "3", nextIds: ["3a", "3b", "3c"] },
	{ id: "3a", nextIds: ["3g"] },
	{ id: "3b", nextIds: ["3d"] },
	{ id: "3c", nextIds: ["3e"] },
	{ id: "3d", nextIds: ["3f"] },
	{ id: "3e", nextIds: ["3g"] },
	{ id: "3f", nextIds: ["3g"] },
	{ id: "3g", nextIds: ["3h", "3i"] },
	{ id: "3h", nextIds: ["4"] },
	{ id: "3i", nextIds: ["3j"] },
	{ id: "3j", nextIds: ["3k"] },
	{ id: "3k", nextIds: ["4"] },
	{ id: "4", nextIds: ["4a", "4b"] },
	{ id: "4a", nextIds: ["4c"] },
	{ id: "4b", nextIds: ["4d"] },
	{ id: "4c", nextIds: ["5"] },
	{ id: "4d", nextIds: ["5"] },
	{ id: "5", nextIds: [] },
]
