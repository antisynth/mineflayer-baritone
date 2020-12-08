const { Vec3 } = require('vec3')
const requireDir = require('require-dir');

const cardinalDirections = [
	{ x: -1, z: 0 }, // north
	{ x: 1, z: 0 }, // south
	{ x: 0, z: -1 }, // east
	{ x: 0, z: 1 } // west
]

class Move {
	constructor(world, origin, dir) {
		this.world = world
		this.origin = origin
		this.dir = dir
	}
	
	makeMovement(position, cost) {
		position.cost = cost
		return position
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

const moves = []


function registerMoves(move) {
	moves.push(...move)
}

function getNeighbors(world, node) {
	let neighbors = []

	for (const moveClass of moves) {
		for (const dir of cardinalDirections) {
			const move = new moveClass(world, node, dir)
			neighbors.push(...move.getNeighbors())
		}
	}

	return neighbors
}

module.exports = { getNeighbors, Move, registerMoves }

requireDir('./')
