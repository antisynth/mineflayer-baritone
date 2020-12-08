const { Move, registerMoves } = require('.')

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
			neighbors.push(this.makeMovement(landingNode, 2))
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
			neighbors.push(this.makeMovement(landingNode, 2))
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
			neighbors.push(this.makeMovement(landingNode, 2))
		return neighbors
	}
}

class MoveForwardUpParkour1 extends Move {
	// 1 block jump going upward
	getNeighbors() {
		let neighbors = []
		let landingNode = this.up(1, this.forward(2))
		let firstGap = this.forward(1)
		let spaceNode1 = this.up(1, this.forward(1))
		if (
			   this.isWalkable(firstGap)
			&& this.isWalkable(spaceNode1)
			&& this.isStandable(landingNode)
		)
			neighbors.push(this.makeMovement(landingNode, 2))
		return neighbors
	}
}

class MoveForwardUpParkour2 extends Move {
	// 2 block jump going upward
	getNeighbors() {
		let neighbors = []
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
			neighbors.push(this.makeMovement(landingNode, 2))
		return neighbors
	}
}

class MoveForwardUpParkour3 extends Move {
	// 2 block jump going upward
	getNeighbors() {
		let neighbors = []
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
		return neighbors
	}
}

class MoveForwardDownParkour1 extends Move {
	// 1 block jump going downward
	getNeighbors() {
		let neighbors = []
		let landingNode = this.down(1, this.forward(2))
		let spaceNode1 = this.up(0, this.forward(1))
		if (
			   this.isWalkable(spaceNode1)
			&& !this.isStandable(spaceNode1)
			&& this.isStandable(landingNode)
		) {
			console.log('spaceNode1', spaceNode1, this.origin)
			neighbors.push(this.makeMovement(landingNode, 1.9))
		}
		return neighbors
	}
}

class MoveForwardDownParkour2 extends Move {
	// 1 block jump going downward
	getNeighbors() {
		let neighbors = []
		let landingNode = this.down(1, this.forward(3))
		let spaceNode1 = this.up(1, this.forward(1))
		let spaceNode2 = this.up(1, this.forward(2))
		if (
			   this.isWalkable(spaceNode1)
			&& this.isWalkable(spaceNode2)
			&& this.isStandable(landingNode)
		)
			neighbors.push(this.makeMovement(landingNode, 2.1))
		return neighbors
	}
}


registerMoves([
	MoveForwardParkour1, MoveForwardParkour2, MoveForwardParkour3,
	MoveForwardUpParkour1, MoveForwardUpParkour2, //MoveForwardUpParkour3, this is way too hard to do consistently
	MoveForwardDownParkour1, MoveForwardDownParkour2
])