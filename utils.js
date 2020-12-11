function isPlayerOnBlock(playerPosition, blockPosition, onGround=false) {
	// returns true if you can stand on the block
	
	if (!blockPosition) return false // theres no target position lmao
	
	blockPosition = blockPosition.offset(.5, 0, .5)
	const xDistance = Math.abs(playerPosition.x - blockPosition.x)
	const zDistance = Math.abs(playerPosition.z - blockPosition.z)
	const yDistance = Math.abs(playerPosition.y - blockPosition.y)

	const onBlock = (xDistance < .7 && zDistance < .7 && yDistance < 1) || (onGround && xDistance < .8 && zDistance < .8 && yDistance == 0)
	return onBlock
}

// (node) => {
// 	let distance = node.distanceTo(position)
// 	if (bot.pathfinder.complexPathOptions.maxDistance && distance > bot.pathfinder.complexPathOptions.maxDistance) return false
// 	else if (bot.pathfinder.complexPathOptions.minDistance && distance < bot.pathfinder.complexPathOptions.minDistance) return false
// 	else if (bot.pathfinder.complexPathOptions.maxDistance || bot.pathfinder.complexPathOptions.minDistance) return true
// 	return isPlayerOnBlock(node, position, true)
// }

module.exports = { isPlayerOnBlock }