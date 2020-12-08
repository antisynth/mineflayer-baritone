const { Move, registerMoves } = require('./')

class MoveForward extends Move {
	getNeighbors() {
		let neighbors = []
		let forwardNode = this.forward(1)
		if (this.isStandable(forwardNode))
			neighbors.push(this.makeMovement(forwardNode, 1))
		return neighbors
	}
}


class MoveDiagonal extends Move {
	getNeighbors() {
		let neighbors = []
		let diagonalRight = this.forward(1, this.right(1))
		let diagonalLeft = this.forward(1, this.left(1))
		if (this.isStandable(diagonalRight))
			neighbors.push(this.makeMovement(diagonalRight, 1.1))
		if (this.isStandable(diagonalLeft))
			neighbors.push(this.makeMovement(diagonalLeft, 1.1))
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
			neighbors.push(this.makeMovement(landingNode, 1))
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
			neighbors.push(this.makeMovement(landingNode, 1))
		return neighbors
	}
}

registerMoves([MoveForward, MoveDiagonal, MoveForwardUp, MoveForwardDown])