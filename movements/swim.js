const { Move, registerMoves } = require('./')

class MoveForwardSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let landingNode = this.forward(1)
		if (this.isWater(landingNode))
			neighbors.push(this.makeMovement(landingNode, 2.02))
		return neighbors
	}
}


class MoveForwardUpSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let upNode = this.up(1)
		let landingNode = this.up(1, this.forward(1))
		if (this.isWalkable(upNode) && this.isStandable(landingNode))
			neighbors.push(this.makeMovement(landingNode, 2.01))
		return neighbors
	}
}


class MoveDiagonalSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let landingNode = this.forward(1, this.right(1))

		let isRightWalkable = this.isWater(this.right(1))
		let isForwardWalkable = this.isWater(this.forward(1))
		if (!isRightWalkable && !isForwardWalkable) return []

		if (this.isWater(landingNode))
			neighbors.push(this.makeMovement(landingNode, 2.82))
		return neighbors
	}
}

class MoveUpSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let position = this.up(0)
		let landingNode = this.up(1)

		if (this.isWater(position) && this.isWater(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1.501))
		return neighbors
	}
}


class MoveDownSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let position = this.up(0)
		let landingNode = this.down(1)

		if (this.isWater(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1.502))
		return neighbors
	}
}

registerMoves([ MoveForwardSwim, MoveDiagonalSwim, MoveUpSwim, MoveDownSwim, MoveForwardUpSwim ])