const { Move, registerMoves } = require('./')

class MoveForwardSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let landingNode = this.down(1, this.forward(1))
		if (this.isWater(landingNode))
			neighbors.push(this.makeMovement(this.up(1, landingNode), 2))
		return neighbors
	}
}

class MoveDiagonalSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let landingNode = this.down(1, this.forward(1, this.right(1)))

		let isRightWalkable = this.isWater(this.up(1, this.right(1)))
		let isForwardWalkable = this.isWater(this.up(1, this.forward(1)))
		if (!isRightWalkable && !isForwardWalkable) return []

		if (this.isWater(landingNode))
			neighbors.push(this.makeMovement(this.up(1, landingNode), 2.82))
		return neighbors
	}
}

class MoveUpSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let position = this.up(0)
		let landingNode = this.up(1)

		if (this.isWater(position) && !this.isSolid(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1.5))
		return neighbors
	}
}


class MoveDownSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let position = this.up(0)
		let landingNode = this.down(1)

		if (this.isWater(position) && !this.isSolid(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1.5))
		return neighbors
	}
}

registerMoves([ MoveForwardSwim, MoveDiagonalSwim, MoveUpSwim, MoveDownSwim ])