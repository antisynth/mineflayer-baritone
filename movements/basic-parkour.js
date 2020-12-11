const { Move, registerMoves } = require('.')

class MoveForwardParkour1 extends Move {
	// 1 block jump
	addNeighbors(neighbors) {
		let landingNode = this.forward(2)
		let spaceNode1 = this.up(1, this.forward(1))
		if (
			   this.isWalkable(spaceNode1)
			&& this.isStandable(landingNode)
		)
			neighbors.push(this.makeMovement(landingNode, 2))
	}
}

class MoveForwardParkour2 extends Move {
	// 2 block jump
	addNeighbors(neighbors) {
		let landingNode = this.forward(3)
		let spaceNode1 = this.up(1, this.forward(1))
		let spaceNode2 = this.up(1, this.forward(2))
		if (
			   this.isWalkable(spaceNode1)
			&& this.isWalkable(spaceNode2)
			&& this.isStandable(landingNode)
		)
			neighbors.push(this.makeMovement(landingNode, 3))
	}
}

class MoveForwardParkour3 extends Move {
	// 3 block jump
	addNeighbors(neighbors) {
		let landingNode = this.forward(4)
		let spaceNode1 = this.forward(1)
		let spaceNode2 = this.forward(2)
		let spaceNode3 = this.forward(3)
		if (
			   this.isJumpable(spaceNode1)
			&& this.isJumpable(spaceNode2)
			&& this.isJumpable(spaceNode3)
			&& this.isStandable(landingNode)
		)
			neighbors.push(this.makeMovement(landingNode, 4))
	}
}

class MoveForwardUpParkour1 extends Move {
	// 1 block jump going upward
	addNeighbors(neighbors) {
		let landingNode = this.up(1, this.forward(2))
		let firstGap = this.forward(1)
		let spaceNode1 = this.up(1, this.forward(1))
		if (
			   this.isWalkable(firstGap)
			&& this.isWalkable(spaceNode1)
			&& this.isStandable(landingNode)
		)
			neighbors.push(this.makeMovement(landingNode, 2))
	}
}

class MoveForwardUpParkour2 extends Move {
	// 2 block jump going upward
	addNeighbors(neighbors) {
		let landingNode = this.up(1, this.forward(3))
		let firstGap = this.forward(1)
		let spaceNode1 = this.up(1, this.forward(1))
		let spaceNode2 = this.up(1, this.forward(2))
		if (
			   this.isWalkable(firstGap)
			&& this.isWalkable(spaceNode1)
			&& this.isWalkable(spaceNode2)
			&& this.isStandable(landingNode)
		)
			neighbors.push(this.makeMovement(landingNode, 3))
	}
}

class MoveForwardUpParkour3 extends Move {
	// 2 block jump going upward
	addNeighbors(neighbors) {
		let landingNode = this.up(1, this.forward(4))
		let spaceNode1 = this.up(1, this.forward(1))
		let spaceNode2 = this.up(1, this.forward(2))
		let spaceNode3 = this.up(1, this.forward(3))
		if (
			   this.isWalkable(spaceNode1)
			&& this.isWalkable(spaceNode2)
			&& this.isWalkable(spaceNode3)
			&& this.isStandable(landingNode)
		)
			neighbors.push(this.makeMovement(landingNode, 5))
	}
}

class MoveForwardDownParkour1 extends Move {
	// 1 block jump going downward
	addNeighbors(neighbors) {
		let landingNode = this.down(1, this.forward(2))
		let spaceNode1 = this.up(0, this.forward(1))
		if (
			   this.isWalkable(spaceNode1)
			&& !this.isStandable(spaceNode1)
			&& this.isStandable(landingNode)
		) {
			neighbors.push(this.makeMovement(landingNode, 1.9))
		}
	}
}

class MoveForwardDownParkour2 extends Move {
	// 1 block jump going downward
	addNeighbors(neighbors) {
		let landingNode = this.down(1, this.forward(3))
		let spaceNode1 = this.up(1, this.forward(1))
		let spaceNode2 = this.up(1, this.forward(2))
		if (
			   this.isWalkable(spaceNode1)
			&& this.isWalkable(spaceNode2)
			&& this.isStandable(landingNode)
		)
			neighbors.push(this.makeMovement(landingNode, 2.1))
	}
}

class MoveDiagonalParkour extends Move {
	addNeighbors(neighbors) {
		let landingNode = this.forward(2, this.right(2))

		let isRightWalkable1 = this.isWalkable(this.up(1, this.right(1)))
		let isForwardWalkable1 = this.isWalkable(this.up(1, this.forward(1)))
		let isRightWalkable2 = this.isWalkable(this.up(1, this.forward(1, this.right(2))))
		let isForwardWalkable2 = this.isWalkable(this.up(1, this.forward(2, this.right(1))))
		if (
			   (!isRightWalkable1 && !isForwardWalkable1)
			|| (!isRightWalkable2 && !isForwardWalkable2)
		) return []

		if (this.isStandable(landingNode)) {
			neighbors.push(this.makeMovement(landingNode, 3))
		}
	}
}

class MoveDiagonalUpParkour extends Move {
	addNeighbors(neighbors) {
		let landingNode = this.up(1, this.forward(2, this.right(2)))

		let spaceNode1 = this.up(1, this.forward(1, this.right(1)))

		let isRightWalkable1 = this.isWalkable(this.up(1, this.right(1)))
		let isForwardWalkable1 = this.isWalkable(this.up(1, this.forward(1)))
		let isRightWalkable2 = this.isWalkable(this.up(2, this.forward(1, this.right(2))))
		let isForwardWalkable2 = this.isWalkable(this.up(2, this.forward(2, this.right(1))))
		if (
			   (this.isWalkable(spaceNode1))
			&& (isRightWalkable1 || isForwardWalkable1)
			&& (isRightWalkable2 || isForwardWalkable2)
			&& this.isStandable(landingNode)
		) {
			neighbors.push(this.makeMovement(landingNode, 3))
		}
	}
}

class MoveDiagonalDownParkour extends Move {
	addNeighbors(neighbors) {
		let landingNode = this.down(1, this.forward(2, this.right(2)))

		let spaceNode1 = this.down(1, this.forward(1, this.right(1)))

		let isRightWalkable1 = this.isWalkable(this.up(1, this.right(1)))
		let isForwardWalkable1 = this.isWalkable(this.up(1, this.forward(1)))
		let isRightWalkable2 = this.isJumpable(this.down(1, this.forward(1, this.right(2))))
		let isForwardWalkable2 = this.isJumpable(this.down(1, this.forward(2, this.right(1))))
	
		if (
			   (this.isWalkable(spaceNode1))
			&& (
				   (isRightWalkable1 && isRightWalkable2)
				|| (isForwardWalkable1 && isForwardWalkable2)
			)
			&& this.isStandable(landingNode)
		) {
			neighbors.push(this.makeMovement(landingNode, 2))
		}
	}
}


registerMoves([
	MoveForwardParkour1, MoveForwardParkour2, MoveForwardParkour3,
	MoveForwardUpParkour1, MoveForwardUpParkour2,
	MoveForwardDownParkour1, MoveForwardDownParkour2,
	MoveDiagonalParkour, MoveDiagonalUpParkour, MoveDiagonalDownParkour
])