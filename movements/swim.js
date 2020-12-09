const { Move, registerMoves } = require('./')

class MoveForwardSwim extends Move {
	getNeighbors() {
		let neighbors = []
		let forwardNode = this.forward(1)
		const block = this.getBlock(forwardNode)
		if (block.name == 'water')
			neighbors.push(this.makeMovement(forwardNode, 3))
		return neighbors
	}
}



registerMoves([ MoveForwardSwim ])