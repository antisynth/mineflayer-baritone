const { Move, registerMoves } = require('./')

class MoveForwardSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let forwardNode = this.forward(1)
		if (this.isWater(forwardNode))
			neighbors.push(this.makeMovement(forwardNode, 1))
		return neighbors
	}
}

class MoveDiagonalSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let landingNode = this.forward(1, this.right(1))

		let isRightWalkable = this.isWater(this.up(1, this.right(1)))
		let isForwardWalkable = this.isWater(this.up(1, this.forward(1)))
		if (!isRightWalkable && !isForwardWalkable) return []

		if (this.isWater(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1.41))
		return neighbors
	}
}

class MoveUpSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let landingNode = this.up(1)

		if (this.isWater(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1))
		return neighbors
	}
}

registerMoves([ MoveForwardSwim, MoveDiagonalSwim, MoveUpSwim ])