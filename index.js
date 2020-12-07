const movements = require('./movements')
const AStar = require('./astar')
const { PlayerState } = require('prismarine-physics')
const { distanceFromLine } = require('./pointtoline')


function inject (bot) {
	bot.pathfinder = {}
	bot.pathfinder.activeMovementFunction = null
	bot.pathfinder.resolve = null
	let pathEnd = null
	let pathStart = null
	let complexPathPoints = []
	let headLockedUntilGround = false
	let exactPath = false

	function checkLandsOnPath(point, distance=0.8) {
		if (!complexPathPoints) return false
		let pathIndex
		for (pathIndex = 1; pathIndex < complexPathPoints.length; ++pathIndex) {
			let segmentStart = complexPathPoints[pathIndex - 1]
			let segmentEnd = complexPathPoints[pathIndex]
			let calculatedDistance = distanceFromLine(segmentStart, segmentEnd, point.offset(-.5, 0, -.5))
			if (calculatedDistance < distance) {
				return true
			}
		}
		return false
	}

	function getControlState() {
		return {
			// we have to do this instead of just returning the control state since it uses custom get() methods
			forward: bot.controlState.forward,
			back: bot.controlState.back,
			left: bot.controlState.left,
			right: bot.controlState.right,
			jump: bot.controlState.jump,
			sprint: bot.controlState.sprint,
			sneak: bot.controlState.sneak
		}
	}

	function simulateUntil(func, ticks=1, controlstate={}, returnState=false, returnInitial=true) {
		const originalState = getControlState()
		const simulationState = originalState
		Object.assign(simulationState, controlstate)
		const state = new PlayerState(bot, originalState)
		if (func(state) && returnInitial) return state
		const world = { getBlock: (pos) => { return bot.blockAt(pos, false) } }

		// simulate one tick before, without the current control state
		bot.physics.simulatePlayer(state, world)
		state.control = simulationState

		for (let i = 0; i < ticks; i++) {
			bot.physics.simulatePlayer(state, world)
			if (func(state)) return state
		}
		return returnState ? state : false
	}

	function canSprintJump() {
		const returnState = simulateUntil(state => state.onGround, 20, {jump: true, sprint: true, foward: true}, true, false)
		if (!returnState) return false // never landed on ground

		const jumpDistance = bot.entity.position.distanceTo(returnState.pos)
		if (jumpDistance <= 3) return false

		
		const isOnPath = checkLandsOnPath(returnState.pos)
		if (!isOnPath) return false
		
		return true
	}
	
	function atPosition(position, exact=false) {
		let distanceX = exact ? .1 : .8
		let distanceY = exact ? 1.5 : 1
		return (
			   bot.entity.position.xzDistanceTo(position.offset(.5, 0, .5)) < distanceX
			&& Math.abs(bot.entity.position.y - position.y) < distanceY
		)
	}

	function shouldAutoJump() {
		let blockInFrontPos
		blockInFrontPos = bot.entity.position.offset(0, 1, 0).plus(bot.entity.velocity.scaled(10))
		let blockInFront = bot.blockAt(blockInFrontPos, false)
		let blockInFront1 = bot.blockAt(blockInFrontPos.offset(0, 1, 0), false)
		let blockInFront2 = bot.blockAt(blockInFrontPos.offset(0, 2, 0), false)

		// if it's moving slowly and its touching a block, it should probably jump
		if (bot.entity.isCollidedHorizontally && bot.entity.velocity.x + bot.entity.velocity.y < .05) {
			return true
		}
		return blockInFront.boundingBox === 'block' && blockInFront1 === 'empty' && blockInFront2 === 'empty'
	}

	async function straightPathTick() {
		bot.setControlState('forward', true)
		bot.setControlState('sprint', true)
		if (!atPosition(pathEnd, exactPath) && (exactPath || !checkLandsOnPath(bot.entity.position))) {
			bot.setControlState('forward', true)
			bot.setControlState('sprint', true)
			if (bot.entity.onGround)
				headLockedUntilGround = false
			if (!headLockedUntilGround)
				await bot.lookAt(pathEnd.offset(.5, 1.625, .5), true)
			if (bot.entity.onGround && (canSprintJump() || shouldAutoJump())) {
				headLockedUntilGround = true
				bot.setControlState('jump', true)
				bot.setControlState('jump', false)
			}
		} else {
			pathEnd = null
			bot.pathfinder.activeMovementFunction = null
			bot.clearControlStates()
			bot.pathfinder.resolve()
		}
	}

	function straightPath(position, exact=false) {
		pathStart = bot.entity.position
		pathEnd = position
		exactPath = exact
		bot.pathfinder.activeMovementFunction = straightPathTick
		return new Promise((resolve, reject) => {
			bot.pathfinder.resolve = resolve
		})
	}

	async function complexPath(position) {
		const result = await AStar({
			start: bot.entity.position.floored(),
			isEnd: (node) => {
				return node.distanceTo(position) <= 1
			},
			neighbor: (node) => {
				return movements.getNeighbors(bot.world, node)
			},
			heuristic: (node) => {
				return node.distanceTo(position)
			},
			timeout: 1000
		})
		complexPathPoints = result.path
		console.log(result)
		while (complexPathPoints.length > 0) {
			const movement = complexPathPoints[0]
			await straightPath(movement)
			complexPathPoints.shift()
		}
		// if (result.status == 'success')
		// 	await straightPath(position, true) // do one more straight path just to make sure its at the exact position
		complexPathPoints = null
		console.log('arrived!')
	}


	bot.pathfinder.goto = async (position) => {
		await complexPath(position)
	}

	function moveTick() {
		if (bot.pathfinder.activeMovementFunction)
			bot.pathfinder.activeMovementFunction()
	}

	bot.on('physicTick', moveTick)
}

module.exports = {
	pathfinder: inject
}