const movements = require('./movements')
const AStar = require('./astar')
const { PlayerState } = require('prismarine-physics')
const { distanceFromLine } = require('./pointtoline')
const { Vec3 } = require('vec3')
const { performance } = require('perf_hooks')
const { isPlayerOnBlock } = require('./utils')
const goals = require('./goals')

function inject (bot) {
	bot.pathfinder = {}

	bot.pathfinder.timeout = 1000
	bot.pathfinder.straightLine = true
	bot.pathfinder.complexPathOptions = {}
	bot.pathfinder.debug = true


	let targetEntity = null
	let straightPathOptions = null
	let complexPathGoal = null
	let complexPathPoints = []
	let headLockedUntilGround = false
	let walkingUntilGround = false
	let calculating = false
	let lastFollowed = performance.now()
	let currentPathNumber = 0
	let currentCalculatedPathNumber = 0

	function willBeOnGround(ticks=1) {
		return simulateUntil((state) => state.onGround, ticks, {}, false, true)
	}	

	function isPointOnPath(point, { max=null, onGround=false }={}) {
		// returns true if a point is on the current path
		if (!complexPathPoints)
			return false

		if (complexPathPoints.length === 1)
			return isPlayerOnBlock(point, complexPathPoints[0], onGround)
		let pathIndex
		for (pathIndex = 1; pathIndex < Math.min(complexPathPoints.length, max ?? 100); ++pathIndex) {
			let segmentStart = complexPathPoints[pathIndex - 1]
			let segmentEnd = complexPathPoints[pathIndex]

			if (isPlayerOnBlock(point, segmentStart, onGround) || isPlayerOnBlock(point, segmentEnd, onGround)) {
				return true
			}

			let calculatedDistance = distanceFromLine(segmentStart, segmentEnd, point.offset(.5, 0, .5))
			if (calculatedDistance < .7 && (bot.entity.onGround || willBeOnGround())) {
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
		const returnState = simulateUntil(state => state.onGround, 40, {jump: true, sprint: true, forward: true}, true, false)
		if (!returnState) return false // never landed on ground
		
		const jumpDistance = bot.entity.position.distanceTo(returnState.pos)
		let fallDistance = bot.entity.position.y - returnState.pos.y
		if (jumpDistance <= 1 || fallDistance > 2) return false
		
		const isOnPath = isPointOnPath(returnState.pos, { onGround: true })
		if (bot.pathfinder.debug)
			console.log('isOnPath', isOnPath, returnState.pos)
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
			const isOnPath = isPointOnPath(state.pos, { max: 10 })
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
		// if it's moving slowly and its touching a block, it should probably jump
		const { x: velX, y: velY, z: velZ } = bot.entity.velocity
		return (
			bot.entity.isCollidedHorizontally
			&& Math.abs(velX) < 0.01
			&& Math.abs(velZ) < 0.01
			&& (Math.abs(velY) < .1)
		)
	}


	async function straightPathTick() {
		// straight line towards the current target, and jump if necessary
		if (!straightPathOptions) return false
		bot.setControlState('sprint', !walkingUntilGround)
		bot.setControlState('forward', true)
		const target = straightPathOptions.target
		const allowSkippingPath = straightPathOptions.skip
		if (!headLockedUntilGround) {
			await bot.lookAt(target.offset(.5, 1.625, .5), true)
		}
		if (!isPlayerOnBlock(bot.entity.position, target, bot.entity.onGround) && !(allowSkippingPath && isPointOnPath(bot.entity.position))) {
			let blockInside = bot.world.getBlock(bot.entity.position.offset(0, 0, 0).floored())
			let blockInside2 = bot.world.getBlock(bot.entity.position.offset(0, 0, 0).floored())
			if (blockInside && (blockInside.name === 'water' || blockInside2.name === 'water') && target.y >= bot.entity.position.y - .5) {
				// in water
				bot.setControlState('jump', true)
				bot.setControlState('sprint', false)
			} else if (bot.entity.onGround && shouldAutoJump()) {
				bot.setControlState('jump', true)
				// autojump!
				if (bot.pathfinder.debug)
					console.log('auto jump!')
			} else if (bot.entity.onGround && canSprintJump()) {
				headLockedUntilGround = true
				bot.setControlState('jump', true)
				if (bot.pathfinder.debug)
					console.log('sprint jump!')
			} else if (bot.entity.onGround && canWalkJump()) {
				bot.setControlState('sprint', false)
				headLockedUntilGround = true
				walkingUntilGround = true
				bot.setControlState('jump', true)
				if (bot.pathfinder.debug)
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
			return true
		}
		return false
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
		if (bot.pathfinder.debug)
			console.log(entity.onGround)
		if (!entity) return
		if (!entity.onGround) return
		if (!bot.entity.onGround) return

		const distance = bot.entity.position.distanceTo(entity.position)
		if (bot.pathfinder.complexPathOptions.maxDistance && distance > bot.pathfinder.complexPathOptions.maxDistance) {}
		else if (bot.pathfinder.complexPathOptions.minDistance && distance < bot.pathfinder.complexPathOptions.minDistance) {}
		else if (bot.pathfinder.complexPathOptions.maxDistance || bot.pathfinder.complexPathOptions.minDistance) return

		let entityMoved = complexPathGoal === null || !entity.position.equals(complexPathGoal)
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

	function tryStraightPath(goal) {
		const isStateGood = (state) => {
			if (!state) return false
			if (state.airTicks > 15) return false // if youre falling for more than 15 ticks, then its probably too dangerous
			if (state.isCollidedHorizontally) return false
			if (goal.isEnd(state.pos)) return true
			return null
		}

		const shouldStop = (state) => {
			return isStateGood(state) !== null
		}
		
		// try sprint jumping towards the player for 10 seconds
		const returnState = simulateUntil(shouldStop, 200, {jump: false, sprint: true, forward: true}, true, false, convertPointToDirection(goal.pos))
		if (!isStateGood(returnState)) return false
		return true
	}

	async function complexPath(pathGoal, options={}) {
		if(!(pathGoal instanceof goals.Goal))
			pathGoal = new goals.GoalBlock(pathGoal.x, pathGoal.y, pathGoal.z)

		let pathNumber

		if (options.incPath === false)
			pathNumber = currentPathNumber
		else
			pathNumber = ++currentPathNumber
		bot.pathfinder.complexPathOptions = options
		complexPathGoal = pathGoal
		calculating = true
		continuousPath = true
		const start = bot.entity.position.floored()

		if (bot.pathfinder.straightLine && pathGoal.pos && tryStraightPath(pathGoal)) {
			bot.lookAt(pathGoal.pos, true)
			calculating = false
			goingToPathTarget = pathGoal.pos.clone()
			complexPathPoints = [start, pathGoal.pos]
			await straightPath({target: pathGoal.pos, skip: false})
		} else {
			const timeout = bot.pathfinder.timeout


			// let summedTimes = 0
			// for (let i = 0;i<100;i++) {
				let calculateStart = performance.now()
				const result = await AStar({
					start,
					goal: pathGoal,
					neighbor: (node) => {
						return movements.getNeighbors(bot.world, node)
					},
					timeout
				})
				let calculateEnd = performance.now()
				// summedTimes += calculateEnd - calculateStart
				if (bot.pathfinder.debug) {
					console.log(calculateEnd - calculateStart)
					if (calculateEnd - calculateStart > 900)
						console.log(pathGoal.pos)
					}
			// }
			// console.log(summedTimes/100, 'average')
			// return
			if (bot.pathfinder.debug)
				console.log(result)
			if (currentCalculatedPathNumber > pathNumber) return
			else currentCalculatedPathNumber = pathNumber
			calculating = false
			complexPathPoints = result.path
			while (complexPathPoints.length > 0) {
				const movement = complexPathPoints[0]
				await straightPath({target: movement})
				if (bot.pathfinder.debug)
					console.log('now at', movement)
				if (currentCalculatedPathNumber > pathNumber || complexPathPoints === null) return
				complexPathPoints.shift()
			}
			if (result.status === 'timeout' && pathNumber === currentPathNumber) {
				// if it times out, recalculate once we reach the end
				complexPathPoints = null
				bot.clearControlStates()
				options.incPath = false
				if (bot.pathfinder.debug)
					console.log('timeout, continuing', pathGoal.pos)
				return await complexPath(pathGoal, options)
			} else {
				if (options.correctEnd) {
					if (bot.pathfinder.debug)
						console.log('pathGoal.pos', pathGoal.pos)
					await straightPath({target: pathGoal.pos})
				}
			}
		}
		complexPathPoints = null
		bot.clearControlStates()
	}


	bot.pathfinder.goto = async (position, options={correctEnd: true}) => {
		bot.clearControlStates()
		await complexPath(position, options)
	}

	bot.pathfinder.follow = async (entity, options={}) => {
		/*
		Options:
		- maxDistance
		- minDistance
		- mustReach
		*/
		await follow(entity, options)
	}

	bot.pathfinder.stop = () => {
		targetEntity = null
		complexPathPoints = null
		straightPathOptions = null
		bot.clearControlStates()
	}

	async function moveTick() {
		if (targetEntity) followTick()
		if (straightPathOptions !== null) if (await straightPathTick()) straightPathTick()
	}

	bot.on('physicTick', moveTick)
}

module.exports = {
	pathfinder: inject,
	goals
}