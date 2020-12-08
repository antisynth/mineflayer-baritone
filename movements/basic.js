const { Move, registerMoves } = require('./')

class MoveForward extends Move {
	getNeighbors() {
		let neighbors = []
		let forwardNode = this.forward(1)
		if (this.isStandable(forwardNode))
			neighbors.push(this.makeMovement(forwardNode, 1.01))
		return neighbors
	}
}


class MoveDiagonal extends Move {
	getNeighbors() {
		let neighbors = []
		let diagonalRight = this.forward(1, this.right(1))

		let isRightWalkable = this.isWalkable(this.up(1, this.right(1)))
		let isForwardWalkable = this.isWalkable(this.up(1, this.forward(1)))
		if (!isRightWalkable && !isForwardWalkable) return []

		if (this.isStandable(diagonalRight)) {
			neighbors.push(this.makeMovement(diagonalRight, 1.41))
		}
		return neighbors
	}
}

class MoveForwardUp extends Move {
	getNeighbors() {
		let neighbors = []
		let upNode = this.up(1)
		let landingNode = this.forward(1, this.up(1))

		if (this.isWalkable(upNode) && this.isStandable(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1.5))
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
			neighbors.push(this.makeMovement(landingNode, 1.4))
		return neighbors
	}
}

class MoveDiagonalUp extends Move {
	getNeighbors() {
		let neighbors = []
		let upNode = this.up(1)
		let landingNode = this.right(1, this.forward(1, this.up(1)))

		let isRightWalkable = this.isWalkable(this.up(1, this.right(1)))
		let isForwardWalkable = this.isWalkable(this.up(1, this.forward(1)))
		if (!isRightWalkable && !isForwardWalkable) return []

		if (this.isWalkable(upNode) && this.isStandable(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1.5))
		return neighbors
	}
}

class MoveDiagonalDown extends Move {
	getNeighbors() {
		let neighbors = []
		let forwardNode = this.forward(1)
		let landingNode = this.right(1, forwardNode)
		for (let i = 0; i < 3; i++) {
			landingNode = this.down(1, landingNode)
			if (this.isStandable(landingNode)) break
		}

		if (this.isStandable(landingNode) && this.isWalkable(forwardNode))
			neighbors.push(this.makeMovement(landingNode, 1.4))
		return neighbors
	}
}



registerMoves([ MoveForward, MoveDiagonal, MoveForwardUp, MoveForwardDown, MoveDiagonalUp, MoveDiagonalDown ])