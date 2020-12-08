function distanceFromLine(lineStart, lineEnd, point) {
	let A = lineStart.distanceTo(point)
	let B = lineEnd.distanceTo(point)
	let C = lineStart.distanceTo(lineEnd)

	if (B*B > A*A + C*C)
		return A
	else if (A*A > B*B + C*C)
		return B
	else {
		s = (A + B + C) / 2
		return 2 / C * Math.sqrt(s * (s-A) * (s-B) * (s-C))
	}
}

module.exports = { distanceFromLine }