const movements = require('./movements')
const AStar = require('./astar')
const { PlayerState } = require('prismarine-physics')
const { distanceFromLine } = require('./pointtoline')
const { Vec3 } = require('vec3')
const { performance } = require('perf_hooks')

function inject (bot) {
	bot.pathfinder = {}

	bot.pathfinder.timeout = 1000
	bot.pathfinder.straightLine = true
	bot.pathfinder.complexPathOptions = {}


	let targetEntity = null
	let straightPathOptions = null
	let complexPathTarget = null
	let complexPathPoints = []
	let headLockedUntilGround = false
	let walkingUntilGround = false
	let calculating = false
	let lastFollowed = performance.now()
	let currentPathNumber = 0
	let currentCalculatedPathNumber = 0

	function isPlayerOnBlock(playerPosition, blockPosition, onGround=false) {
		// returns true if you can stand on the block
		
		if (!blockPosition) return false // theres no target position lmao
		
		blockPosition = blockPosition.offset(.5, 0, .5)
		const xDistance = Math.abs(playerPosition.x - blockPosition.x)
		const zDistance = Math.abs(playerPosition.z - blockPosition.z)
		const yDistance = Math.abs(playerPosition.y - blockPosition.y)

		const onBlock = (xDistance < .7 && zDistance < .7 && yDistance < 2) || (onGround && xDistance < .8 && zDistance < .8 && yDistance == 0)
		return onBlock
	}

	function willBeOnGround(ticks=1) {
		return !!simulateUntil((state) => state.onGround, ticks)
	}	

	function isPointOnPath(point, { max=null }={}) {
		// returns true if a point is on the current path
		if (!complexPathPoints)
			return false

		if (complexPathPoints.length == 1)
			return isPlayerOnBlock(point, complexPathPoints[0])
		let pathIndex
		for (pathIndex = 1; pathIndex < Math.min(complexPathPoints.length, max ?? 100); ++pathIndex) {
			let segmentStart = complexPathPoints[pathIndex - 1]
			let segmentEnd = complexPathPoints[pathIndex]

			if (isPlayerOnBlock(point, segmentStart) || isPlayerOnBlock(point, segmentEnd)) {
				return true
			}

			let calculatedDistance = distanceFromLine(segmentStart, segmentEnd, point.offset(-.5, 0, -.5))
			if (calculatedDistance < .7 && (bot.entity.onGround || willBeOnGround())) {
				console.log('pog champ', segmentEnd)
				return true
			}
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

	function simulateUntil(func, ticks=1, controlstate={}, returnState=false, returnInitial=true, extraState) {
		// simulate the physics for the bot until func returns true for a number of ticks
		const originalControl = getControlState()
		const simulationControl = originalControl
		Object.assign(simulationControl, controlstate)
		const state = new PlayerState(bot, simulationControl)
		Object.assign(state, extraState)
		if (func(state) && returnInitial) return state
		const world = { getBlock: (pos) => { return bot.blockAt(pos, false) } }

		let airTicks = 0

		for (let i = 0; i < ticks; i++) {
			state.control = simulationControl
			bot.physics.simulatePlayer(state, world)

			// this is used by tryStraightPath to make sure it doesnt take fall damage
			if (!state.onGround) airTicks++
			else airTicks = 0
			state.airTicks = airTicks

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
		console.log('landing on', returnState.pos, 'from', bot.entity.position)
		return true
	}

	function canWalkJump() {
		// checks if the bot should walk jump. sprint jumps are used most of the time, but in case a sprint jump is too much itll do this instead
		const isStateGood = (state) => {
			if (!state) return false
			const jumpDistance = bot.entity.position.distanceTo(state.pos)
			let fallDistance = bot.entity.position.y - state.pos.y
			if (jumpDistance <= 1 || fallDistance > 2) return false
			const isOnPath = isPointOnPath(state.pos, {max: 5})
			if (!isOnPath) return false
			return true
		}
		
		const returnState = simulateUntil(state => state.onGround, 20, {jump: true, sprint: false, forward: true}, true, false)
		const returnStateWithoutJump = simulateUntil(isStateGood, 20, {jump: false, sprint: true, forward: true}, true, false)
		if (!returnState) return false // never landed on ground
		
		if (!isStateGood(returnState)) return false
		
		// if it can do just as good just from sprinting, then theres no point in jumping
		if (isStateGood(returnStateWithoutJump)) return false
		
		console.log('hopping to', returnState.pos, 'from', bot.entity.position)
		return true
	}
	

	function shouldAutoJump() {
		// checks if there's a block in front of the bot
		const scaledVelocity = bot.entity.velocity.scaled(10).floored()
		let velocity = scaledVelocity.min(new Vec3(1, 0, 1)).max(new Vec3(-1, 0, -1))
		let blockInFrontPos = bot.entity.position.offset(0, 1, 0).plus(velocity)
		let blockInFront = bot.blockAt(blockInFrontPos, false)
		if (blockInFront === null) return

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
		const target = straightPathOptions.target
		const allowSkippingPath = straightPathOptions.skip
		if (!headLockedUntilGround) {
			await bot.lookAt(target.offset(.5, 1.625, .5), true)
		}
		if (!isPlayerOnBlock(bot.entity.position, target, bot.entity.onGround) && !(allowSkippingPath && isPointOnPath(bot.entity.position))) {
			let blockBelow = bot.world.getBlock(bot.entity.position.offset(0, -1.5, 0).floored())
			if (blockBelow && blockBelow.name == 'water') {
				// in water
				bot.setControlState('jump', true)
				bot.setControlState('sprint', false)
			} else if (bot.entity.onGround && shouldAutoJump()) {
				bot.setControlState('jump', true)
				console.log('autojump!')
				// autojump!
			} else if (bot.entity.onGround && canSprintJump()) {
				headLockedUntilGround = true
				bot.setControlState('jump', true)
				console.log('sprint jump!')
			} else if (bot.entity.onGround && canWalkJump()) {
				bot.setControlState('sprint', false)
				headLockedUntilGround = true
				walkingUntilGround = true
				bot.setControlState('jump', true)
				console.log('hop!')
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
			bot.setControlState('jump', false)
			if (straightPathOptions)
				straightPathOptions.resolve()
			straightPathOptions = null
			headLockedUntilGround = false
			walkingUntilGround = false
		}
	}

	function straightPath({ target, skip }) {
		straightPathOptions = { target, skip: skip ?? true }
		return new Promise((resolve, reject) => {
			if (straightPathOptions)
				straightPathOptions.resolve = resolve
			else
				resolve()
		})
	}

	function followTick() {
		// updates the target position every followedAgo milliseconds
		let entity = bot.entities[targetEntity.id]
		if (!entity) return
		if (!entity.onGround) return

		const distance = bot.entity.position.distanceTo(entity.position)
		if (bot.pathfinder.complexPathOptions.maxDistance && distance > bot.pathfinder.complexPathOptions.maxDistance) {}
		else if (bot.pathfinder.complexPathOptions.minDistance && distance < bot.pathfinder.complexPathOptions.minDistance) {}
		else if (bot.pathfinder.complexPathOptions.maxDistance || bot.pathfinder.complexPathOptions.minDistance) return

		let entityMoved = complexPathTarget === null || !entity.position.equals(complexPathTarget)
		let followedAgo = performance.now() - lastFollowed
		if (!calculating && entityMoved && followedAgo > 100) {
			lastFollowed = performance.now()
			complexPath(entity.position.clone(), bot.pathfinder.complexPathOptions)
		}
	}

	async function follow(entity, options={}) {
		targetEntity = entity
		bot.pathfinder.complexPathOptions = options
	}

	function convertPointToDirection(point) {
		const delta = point.minus(bot.entity.position.offset(0, bot.entity.height, 0))
		const yaw = Math.atan2(-delta.x, -delta.z)
		const groundDistance = Math.sqrt(delta.x * delta.x + delta.z * delta.z)
		const pitch = Math.atan2(delta.y, groundDistance)
		return {
			pitch, yaw
		}
	}

	function tryStraightPath(target) {
		const isStateGood = (state) => {
			if (!state) return false
			if (state.airTicks > 15) return false // if youre falling for more than 15 ticks, then its probably too dangerous
			if (state.isCollidedHorizontally) return false
			let targetYFloored = new Vec3(target.x, Math.floor(target.y), target.z)
			if (isPlayerOnBlock(state.pos, targetYFloored)) return true
			return null
		}

		const shouldStop = (state) => {
			return isStateGood(state) !== null
		}
		
		// try sprint jumping towards the player for 10 seconds
		const returnState = simulateUntil(shouldStop, 200, {jump: true, sprint: true, forward: true}, true, false, convertPointToDirection(target))
		if (!isStateGood(returnState)) return false
		return true
	}

	async function complexPath(pathPosition, options={}) {
		const position = pathPosition.clone()
		let pathNumber = ++currentPathNumber
		bot.pathfinder.complexPathOptions = options
		complexPathTarget = position.clone()
		calculating = true
		continuousPath = true
		const start = bot.entity.position.floored()

		if (bot.pathfinder.straightLine && tryStraightPath(position)) {
			bot.lookAt(position, true)
			calculating = false
			goingToPathTarget = position.clone()
			complexPathPoints = [start, position]
			await straightPath({target: position, skip: false})
		} else {
			const timeout = bot.pathfinder.timeout
			const result = await AStar({
				start: start,
				isEnd: (node) => {
					let distance = node.distanceTo(position)
					if (bot.pathfinder.complexPathOptions.maxDistance && distance > bot.pathfinder.complexPathOptions.maxDistance) return false
					else if (bot.pathfinder.complexPathOptions.minDistance && distance < bot.pathfinder.complexPathOptions.minDistance) return false
					else if (bot.pathfinder.complexPathOptions.maxDistance || bot.pathfinder.complexPathOptions.minDistance) return true
					return isPlayerOnBlock(node, position)
				},
				neighbor: (node) => {
					return movements.getNeighbors(bot.world, node)
				},
				heuristic: (node) => {
					return node.distanceTo(position)
				},
				timeout
			})
			if (currentCalculatedPathNumber > pathNumber) return
			else currentCalculatedPathNumber = pathNumber
			goingToPathTarget = position.clone()
			calculating = false
			complexPathPoints = result.path
			while (complexPathPoints.length > 0) {
				const movement = complexPathPoints[0]
				await straightPath({target: movement})
				if (currentCalculatedPathNumber > pathNumber || complexPathPoints === null) return
				complexPathPoints.shift()
				console.log(movement)
			}
		}
		complexPathPoints = null
		bot.clearControlStates()
	}


	bot.pathfinder.goto = async (position, options={}) => {
		await complexPath(position, options)
	}

	bot.pathfinder.follow = async (entity, options={}) => {
		/*
		Options:
		- maxDistance
		- minDistance
		*/
		await follow(entity, options)
	}

	bot.pathfinder.stop = () => {
		targetEntity = null
		complexPathPoints = null
		straightPathOptions = null
	}

	function moveTick() {
		if (targetEntity) followTick()
		if (straightPathOptions !== null) straightPathTick()
	}

	bot.on('physicTick', moveTick)
}

module.exports = {
	pathfinder: inject
}