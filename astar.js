const Heap = require('./heap')
const { performance } = require('perf_hooks')

module.exports = AStar;

function AStar({ start, isEnd, neighbor, heuristic, timeout, hash }) {
	if (timeout === undefined) timeout = Infinity;
	hash = hash || defaultHash

	const startNode = {
		data: start,
		g: 0,
		h: heuristic(start)
	}
	let bestNode = startNode
	startNode.f = startNode.h
	// leave .parent undefined
	const closedDataSet = new Set()
	const openHeap = new Heap()
	const openDataMap = new Map()
	openHeap.push(startNode)
	openDataMap.set(hash(startNode.data), startNode)
	var startTime = new Date();

	return new Promise(async(resolve) => {
		let lastSleep = performance.now()
		while (!openHeap.isEmpty()) {
			if (performance.now() - lastSleep >= 50) {
				// need to do this so the bot doesnt lag
				await new Promise(r => setTimeout(r, 0))
				lastSleep = performance.now()
			}

			if (new Date() - startTime > timeout)
				return resolve({
					status: 'timeout',
					cost: bestNode.g,
					path: reconstructPath(bestNode)
				})

				const node = openHeap.pop()
			openDataMap.delete(hash(node.data));
			if (isEnd(node.data)) {
				// done
				return resolve({
					status: 'success',
					cost: node.g,
					path: reconstructPath(node),
				});
			}
			// not done yet
			closedDataSet.add(hash(node.data));
			var neighbors = neighbor(node.data);
			for (var i = 0; i < neighbors.length; i++) {
				var neighborData = neighbors[i];
				if (closedDataSet.has(hash(neighborData))) {
					// skip closed neighbors
					continue;
				}
				var gFromThisNode = node.g + neighborData.cost
				var neighborNode = openDataMap.get(hash(neighborData));
				var update = false;
				if (neighborNode === undefined) {
					// add neighbor to the open set
					neighborNode = {
						data: neighborData,
					};
					// other properties will be set later
					openDataMap.set(hash(neighborData), neighborNode);
				} else {
					if (neighborNode.g < gFromThisNode) {
						// skip this one because another route is faster
						continue;
					}
					update = true;
				}
				// found a new or better route.
				// update this neighbor with this node as its new parent
				neighborNode.parent = node;
				neighborNode.g = gFromThisNode;
				neighborNode.h = heuristic(neighborData);
				neighborNode.f = gFromThisNode + neighborNode.h;
				if (neighborNode.h < bestNode.h) bestNode = neighborNode;
				if (update) {
					openHeap.update(neighborNode)
				} else {
					openHeap.push(neighborNode)
				}
			}
		}
		return resolve({
			status: 'noPath',
			cost: bestNode.g,
			path: reconstructPath(bestNode)
		})
	})

}

function reconstructPath(node) {
	if (node.parent !== undefined) {
		var pathSoFar = reconstructPath(node.parent);
		pathSoFar.push(node.data);
		return pathSoFar;
	} else {
		// this is the starting node
		return [node.data];
	}
}

function defaultHash(node) {
	return node.toString();
}
