const movements = require('./movements')
const AStar = require('./astar')
const { PlayerState } = require('prismarine-physics')
const { distanceFromLine } = require('./pointtoline')
const { Vec3 } = require('vec3')
const { performance } = require('perf_hooks')

function inject (bot) {
	bot.pathfinder = {}
	let straightPathResolve = null
	let targetEntity = null
	let straightPathTarget = null
	let complexPathTarget = null
	let complexPathPoints = []
	let headLockedUntilGround = false
	let walkingUntilGround = false
	let calculating = false
	let lastFollowed = performance.now()
	let currentPathNumber = 0
	let currentCalculatedPathNumber = 0

	function isPlayerOnBlock(playerPosition, blockPosition) {
		// returns true if you can stand on the block

		if (!blockPosition) return false // theres no target position lmao

		const xDistance = Math.abs(playerPosition.x - blockPosition.x)
		const zDistance = Math.abs(playerPosition.z - blockPosition.z)
		const yDistance = Math.abs(playerPosition.y - blockPosition.y)

		return (xDistance < .7 && zDistance < .7 && yDistance < 2) || (xDistance < .8 && zDistance < .8 && yDistance < .1)
	}

	function isPointOnPath(point) {
		// returns true if a point is on the current path
		if (!complexPathPoints)
			return false

		if (complexPathPoints.length == 1)
			return isPlayerOnBlock(point, complexPathPoints[0])
		let pathIndex
		for (pathIndex = 1; pathIndex < complexPathPoints.length; ++pathIndex) {
			let segmentStart = complexPathPoints[pathIndex - 1]
			let segmentEnd = complexPathPoints[pathIndex]

			if (isPlayerOnBlock(point, segmentStart) || isPlayerOnBlock(point, segmentEnd)) return true

			let calculatedDistance = distanceFromLine(segmentStart, segmentEnd, point.offset(-.5, 0, -.5))
			if (calculatedDistance < .7) return true
		}
		return false
	}

	function getControlState() {
		// we have to do this instead of just returning the control state since it uses custom get() methods
		return {
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
		// simulate the physics for the bot until func returns true for a number of ticks
		const originalState = getControlState()
		const simulationState = originalState
		Object.assign(simulationState, controlstate)
		const state = new PlayerState(bot, simulationState)
		if (func(state) && returnInitial) return state
		const world = { getBlock: (pos) => { return bot.blockAt(pos, false) } }


		for (let i = 0; i < ticks; i++) {
			state.state = simulationState
			bot.physics.simulatePlayer(state, world)
			if (func(state)) return state
		}
		return returnState ? state : false
	}


	function canSprintJump() {
		// checks if the bot should sprint jump. this is also used for parkour
		const returnState = simulateUntil(state => state.onGround, 20, {jump: true, sprint: true, forward: true}, true, false)
		if (!returnState) return false // never landed on ground
		
		const jumpDistance = bot.entity.position.distanceTo(returnState.pos)
		let fallDistance = bot.entity.position.y - returnState.pos.y
		if (jumpDistance <= 1 || fallDistance > 2) return false
		
		const isOnPath = isPointOnPath(returnState.pos)
		if (!isOnPath) return false
		
		return true
	}

	function canWalkJump() {
		// checks if the bot should walk jump. sprint jumps are used most of the time, but in case a sprint jump is too much itll do this instead
		const isStateGood = (state) => {
			if (!state) return false
			const jumpDistance = bot.entity.position.distanceTo(state.pos)
			let fallDistance = bot.entity.position.y - state.pos.y
			if (jumpDistance <= 1 || fallDistance > 2) return false
			const isOnPath = isPointOnPath(state.pos)
			if (!isOnPath) return false
			return true
		}
		
		const returnState = simulateUntil(state => state.onGround, 20, {jump: true, sprint: false, forward: true}, true, false)
		const returnStateWithoutJump = simulateUntil(isStateGood, 20, {jump: false, sprint: true, forward: true}, true, false)
		if (!returnState) return false // never landed on ground
		
		if (!isStateGood(returnState)) return false
		
		// if it can do just as good just from sprinting, then theres no point in jumping
		if (isStateGood(returnStateWithoutJump)) return false
		
		return true
	}
	

	function shouldAutoJump() {
		// checks if there's a block in front of the bot
		const scaledVelocity = bot.entity.velocity.scaled(20).floored()
		let velocity = scaledVelocity.min(new Vec3(1, 0, 1)).max(new Vec3(-1, 0, -1))
		let blockInFrontPos = bot.entity.position.offset(0, 1, 0).plus(velocity)
		let blockInFront = bot.blockAt(blockInFrontPos, false)

		if (blockInFront.boundingBox !== 'block') {
			// x
			velocity = scaledVelocity.min(new Vec3(1, 0, 0)).max(new Vec3(-1, 0, 0))
			blockInFrontPos = bot.entity.position.offset(0, 1, 0).plus(velocity)
			blockInFront = bot.blockAt(blockInFrontPos, false)	
		}
		if (blockInFront.boundingBox !== 'block') {
			// z
			velocity = scaledVelocity.min(new Vec3(0, 0, 1)).max(new Vec3(0, 0, -1))
			blockInFrontPos = bot.entity.position.offset(0, 1, 0).plus(velocity)
			blockInFront = bot.blockAt(blockInFrontPos, false)	
		}
		let blockInFront1 = bot.blockAt(blockInFrontPos.offset(0, 1, 0), false)
		let blockInFront2 = bot.blockAt(blockInFrontPos.offset(0, 2, 0), false)

		// if it's moving slowly and its touching a block, it should probably jump
		if (bot.entity.isCollidedHorizontally && bot.entity.velocity.x + bot.entity.velocity.z < 0.01) {
			return true
		}
		return blockInFront.boundingBox === 'block' && blockInFront1 === 'empty' && blockInFront2 === 'empty'
	}


	async function straightPathTick() {
		// straight line towards the current target, and jump if necessary
		bot.setControlState('sprint', !walkingUntilGround)
		bot.setControlState('forward', true)
		if (!headLockedUntilGround) {
			await bot.lookAt(straightPathTarget.offset(.5, 1.625, .5), true)
		}
		if (!isPlayerOnBlock(bot.entity.position, straightPathTarget) && !isPointOnPath(bot.entity.position)) {
			if (bot.entity.onGround && shouldAutoJump()) {
				bot.setControlState('jump', true)
				// autojump!
			} else if (bot.entity.onGround && canSprintJump()) {
				headLockedUntilGround = true
				bot.setControlState('jump', true)
			} else if (bot.entity.onGround && canWalkJump()) {
				bot.setControlState('sprint', false)
				headLockedUntilGround = true
				walkingUntilGround = true
				bot.setControlState('jump', true)
			} else {
				if (bot.entity.onGround) {
					headLockedUntilGround = false
					walkingUntilGround = false
					bot.setControlState('jump', false)
				}
			}
		} else {
			// arrived at path ending :)
			// there will be more paths if its using complex pathfinding
			straightPathTarget = null
			headLockedUntilGround = false
			walkingUntilGround = false
			straightPathResolve()
		}
	}

	function straightPath(position) {
		straightPathTarget = position
		return new Promise((resolve, reject) => {
			straightPathResolve = resolve
		})
	}

	function followTick() {
		// updates the target position every followedAgo milliseconds
		let entity = bot.entities[targetEntity.id]
		if (!entity.onGround) return
		let entityMoved = complexPathTarget === null || !entity.position.equals(complexPathTarget)
		let followedAgo = performance.now() - lastFollowed
		if (!calculating && entityMoved && followedAgo > 100) {
			lastFollowed = performance.now()
			complexPath(entity.position.clone())
		}
	}

	async function follow(entity) {
		targetEntity = entity
	}

	async function complexPath(pathPosition) {
		const position = pathPosition.clone()
		let pathNumber = ++currentPathNumber
		complexPathTarget = position.clone()
		calculating = true
		continuousPath = true
		const start = bot.entity.position.floored()
		const result = await AStar({
			start: start,
			isEnd: (node) => {
				return isPlayerOnBlock(node, position)
			},
			neighbor: (node) => {
				return movements.getNeighbors(bot.world, node)
			},
			heuristic: (node) => {
				return node.distanceTo(position)
			},
			timeout: 1000
		})
		if (currentCalculatedPathNumber > pathNumber) return
		else currentCalculatedPathNumber = pathNumber
		goingToPathTarget = position.clone()
		calculating = false
		complexPathPoints = result.path
		while (complexPathPoints.length > 0) {
			const movement = complexPathPoints[0]
			await straightPath(movement)
			if (currentCalculatedPathNumber > pathNumber) return
			complexPathPoints.shift()
		}
		complexPathPoints = null
		bot.clearControlStates()
	}


	bot.pathfinder.goto = async (position) => {
		await complexPath(position)
	}

	bot.pathfinder.follow = async (entity) => {
		await follow(entity)
	}

	function moveTick() {
		if (targetEntity) followTick()
		if (straightPathTarget) straightPathTick()
	}

	bot.on('physicTick', moveTick)
}

module.exports = {
	pathfinder: inject
}