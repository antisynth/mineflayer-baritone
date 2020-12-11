const { isPlayerOnBlock } = require('./utils')
const { Vec3 } = require('vec3')

class Goal {
	heuristic(node) {
		return 0
	}

	isEnd(node) {
		return true
	}

	equals(node) {
		return true
	}
}

class GoalBlock extends Goal {
	constructor(x, y, z) {
		super()
		if (x && !y && !z)
			this.pos = x
		else
			this.pos = new Vec3(x, y, z)
	}
	
	heuristic(node) {
		return node.distanceTo(this.pos)
	}
	
	isEnd(node) {
		return isPlayerOnBlock(node, this.pos, true)
	}

	equals(node) {
		return node.equals(this.pos)
	}
}

module.exports = { Goal, GoalBlock }