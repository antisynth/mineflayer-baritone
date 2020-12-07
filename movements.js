var { Vec3 } = require('vec3')

const cardinalDirections = [
	{ x: -1, z: 0 }, // north
	{ x: 1, z: 0 }, // south
	{ x: 0, z: -1 }, // east
	{ x: 0, z: 1 } // west
]

function makeMovement(position, cost) {
	position.cost = cost
	return position
}

class Move {
	constructor(world, origin, dir) {
		this.world = world
		this.origin = origin
		this.dir = dir
	}
	isAir(node) {
		const block = this.world.getBlock(node)
		if (!block) return false
		return block.boundingBox === 'empty'
	}
	
	isWalkable(node) {
		// 2 blocks of air
		return this.isAir(node) && this.isAir(node.offset(0, 1, 0))
	}
	
	isSolid(node) {
		const block = this.world.getBlock(node)
		if (!block) return false
		return block.boundingBox === 'block'
	}
	
	isStandable(node) {
		// whether you can stand on the block with ground beneath it
		return this.isSolid(node.offset(0, -1, 0)) && this.isWalkable(node)
	}
	
	forward(amount=1, node=null) {
		if (!node) node = this.origin
		return node.offset(this.dir.x * amount, 0, this.dir.z * amount)
	}
	
	right(amount=1, node=null) {
		if (!node) node = this.origin
		return node.offset(this.dir.z * -amount, 0, this.dir.x * -amount)
	}

	left(amount=1, node=null) {
		if (!node) node = this.origin
		return node.offset(this.dir.z * amount, 0, this.dir.x * amount)
	}
	
	up(amount=1, node=null) {
		if (!node) node = this.origin
		return node.offset(0, amount, 0)
	}
	
	down(amount=1, node=null) {
		if (!node) node = this.origin
		return node.offset(0, -amount, 0)
	}
}

class MoveForward extends Move {
	getNeighbors() {
		let neighbors = []
		let forwardNode = this.forward(1)
		if (this.isStandable(forwardNode))
			neighbors.push(makeMovement(forwardNode, 1))
		return neighbors
	}
}


class MoveDiagonal extends Move {
	getNeighbors() {
		let neighbors = []
		let diagonalRight = this.forward(1, this.right(1))
		let diagonalLeft = this.forward(1, this.left(1))
		if (this.isStandable(diagonalRight))
			neighbors.push(makeMovement(diagonalRight, 1.1))
		if (this.isStandable(diagonalLeft))
			neighbors.push(makeMovement(diagonalLeft, 1.1))
		return neighbors
	}
}

class MoveForwardUp extends Move {
	getNeighbors() {
		let neighbors = []
		let upNode = this.up(1)
		let landingNode = this.forward(1, this.up(1))
		let forwardNode = this.forward(1)

		if (this.isWalkable(upNode) && this.isStandable(landingNode) && this.isSolid(forwardNode))
			neighbors.push(makeMovement(landingNode, 1))
		return neighbors
	}
}

class MoveForwardDown extends Move {
	getNeighbors() {
		let neighbors = []
		let forwardNode = this.forward(1)
		let landingNode = forwardNode
		for (let i = 0; i < 3; i++) {
			landingNode = this.down(1, landingNode)
			if (this.isStandable(landingNode)) break
		}

		if (this.isStandable(landingNode) && this.isWalkable(forwardNode))
			neighbors.push(makeMovement(landingNode, 1))
		return neighbors
	}
}

class MoveForwardParkour1 extends Move {
	// 1 block jump
	getNeighbors() {
		let neighbors = []
		let landingNode = this.forward(2)
		let spaceNode1 = this.up(1, this.forward(1))
		if (
			   this.isWalkable(spaceNode1)
			&& this.isStandable(landingNode)
		)
			neighbors.push(makeMovement(landingNode, 2))
		return neighbors
	}
}

class MoveForwardParkour2 extends Move {
	// 2 block jump
	getNeighbors() {
		let neighbors = []
		let landingNode = this.forward(3)
		let spaceNode1 = this.up(1, this.forward(1))
		let spaceNode2 = this.up(1, this.forward(2))
		if (
			   this.isWalkable(spaceNode1)
			&& this.isWalkable(spaceNode2)
			&& this.isStandable(landingNode)
		)
			neighbors.push(makeMovement(landingNode, 2))
		return neighbors
	}
}

class MoveForwardParkour3 extends Move {
	// 3 block jump
	getNeighbors() {
		let neighbors = []
		let landingNode = this.forward(4)
		let spaceNode1 = this.up(1, this.forward(1))
		let spaceNode2 = this.up(1, this.forward(2))
		let spaceNode3 = this.up(1, this.forward(3))
		if (
			   this.isWalkable(spaceNode1)
			&& this.isWalkable(spaceNode2)
			&& this.isWalkable(spaceNode3)
			&& this.isStandable(landingNode)
		)
			neighbors.push(makeMovement(landingNode, 2))
		return neighbors
	}
}

function getNeighbors(world, node) {
	const moves = [
		MoveForward,
		MoveDiagonal,
		MoveForwardUp,
		MoveForwardDown,
		MoveForwardParkour1,
		MoveForwardParkour2,
		MoveForwardParkour3
	]
	let neighbors = []

	for (const moveClass of moves) {
		for (const dir of cardinalDirections) {
			const move = new moveClass(world, node, dir)
			neighbors.push(...move.getNeighbors())
		}
	}

	return neighbors
}

module.exports = { getNeighbors }