const { Vec3 } = require('vec3')
const requireDir = require('require-dir');

const cardinalDirections = [
	{ x: -1, z: 0 }, // north
	{ x: 1, z: 0 }, // south
	{ x: 0, z: -1 }, // east
	{ x: 0, z: 1 } // west
]

class Move {
	constructor() {}
	setValues(world, origin, dir) {
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
		return block.boundingBox === 'empty' && block.name !== 'water'
	}

	isWater(node) {
		const block = this.world.getBlock(node)
		if (!block) return false
		return block.name == 'water'
	}
	
	isWalkable(node) {
		// 2 blocks of air
		return this.isAir(node) && this.isAir(node.offset(0, 1, 0))
	}
	
	isJumpable(node) {
		// 3 blocks of air
		return this.isAir(node) && this.isAir(node.offset(0, 1, 0)) && this.isAir(node.offset(0, 2, 0))
	}
	
	getBlock(node) {
		const block = this.world.getBlock(node)
		return block
	}
	
	isSolid(node) {
		const block = this.getBlock(node)
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
		return node.offset(this.dir.z * -amount, 0, this.dir.x * amount)
	}

	left(amount=1, node=null) {
		if (!node) node = this.origin
		return node.offset(this.dir.z * amount, 0, this.dir.x * -amount)
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

const moveClasses = []


function registerMoves(moves) {
	for (const moveClass of moves) {
		moveClasses.push(new moveClass())
	}
}

function getNeighbors(world, node) {
	let neighbors = []

	for (const move of moveClasses) {
		for (const dir of cardinalDirections) {
			move.setValues(world, node, dir)
			move.addNeighbors(neighbors)
		}
	}

	return neighbors
}

module.exports = { getNeighbors, Move, registerMoves }

requireDir('./')
