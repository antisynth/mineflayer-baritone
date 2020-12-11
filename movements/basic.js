const { Move, registerMoves } = require('./')

class MoveForward extends Move {
	addNeighbors(neighbors) {
		let forwardNode = this.forward(1)
		if (this.isStandable(forwardNode))
			neighbors.push(this.makeMovement(forwardNode, 1.01))
	}
}


class MoveDiagonal extends Move {
	addNeighbors(neighbors) {
		let landingNode = this.forward(1, this.right(1))

		let isRightWalkable = this.isWalkable(this.up(1, this.right(1)))
		let isForwardWalkable = this.isWalkable(this.up(1, this.forward(1)))
		if (!isRightWalkable && !isForwardWalkable) return []

		if (this.isStandable(landingNode)) {
			neighbors.push(this.makeMovement(landingNode, 1.41))
		}
	}
}

class MoveForwardUp extends Move {
	addNeighbors(neighbors) {
		let upNode = this.up(1)
		let landingNode = this.forward(1, this.up(1))

		if (this.isWalkable(upNode) && this.isStandable(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1.5))
	}
}

class MoveForwardDown extends Move {
	addNeighbors(neighbors) {
		let forwardNode = this.forward(1)
		let landingNode = forwardNode
		for (let i = 0; i < 3; i++) {
			landingNode = this.down(1, landingNode)
			if (this.isStandable(landingNode)) break
		}

		if (this.isStandable(landingNode) && this.isWalkable(forwardNode))
			neighbors.push(this.makeMovement(landingNode, 1.4))
	}
}

class MoveDiagonalUp extends Move {
	addNeighbors(neighbors) {
		let upNode = this.up(1)
		let landingNode = this.right(1, this.forward(1, this.up(1)))

		let isRightWalkable = this.isWalkable(this.up(1, this.right(1)))
		let isForwardWalkable = this.isWalkable(this.up(1, this.forward(1)))
		if (!isRightWalkable && !isForwardWalkable) return []

		if (this.isWalkable(upNode) && this.isStandable(landingNode))
			neighbors.push(this.makeMovement(landingNode, 1.5))
	}
}

class MoveDiagonalDown extends Move {
	addNeighbors(neighbors) {
		let forwardNode = this.forward(1)
		let landingNode = this.right(1, forwardNode)
		for (let i = 0; i < 3; i++) {
			landingNode = this.down(1, landingNode)
			if (this.isStandable(landingNode)) break
		}

		if (this.isStandable(landingNode) && this.isWalkable(forwardNode))
			neighbors.push(this.makeMovement(landingNode, 1.4))
	}
}



registerMoves([
	MoveForward, MoveForwardUp, MoveForwardDown,
	MoveDiagonal, MoveDiagonalUp, MoveDiagonalDown
])