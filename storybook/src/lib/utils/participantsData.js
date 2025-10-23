function buildGrouping(participants = [], extractor = () => '', fallback = 'Não informado') {
	const grouped = new Map();

	for (const participant of participants) {
		const raw = extractor(participant);
		const category =
			(raw === undefined || raw === null ? fallback : String(raw)).trim() || fallback;
		if (!grouped.has(category)) {
			grouped.set(category, {
				name: category,
				participants: [],
				value: 0
			});
		}
		const bucket = grouped.get(category);
		bucket.participants.push(participant);
		bucket.value += 1;
	}

	return {
		name: 'root',
		children: Array.from(grouped.values()).sort((a, b) => b.value - a.value)
	};
}

export function buildEmergencyFocusTree(participants = []) {
	return buildGrouping(participants, (participant) => participant?.emergencyFocus);
}

export function buildEmergencyFocusTotals(participants = []) {
	const tree = buildEmergencyFocusTree(participants);
	return tree.children.map(({ name, value }) => ({ category: name, value }));
}

export function buildChallengeTree(participants = []) {
	return buildGrouping(participants, (participant) => participant?.challenge2050);
}

export function buildChallengeTotals(participants = []) {
	const tree = buildChallengeTree(participants);
	return tree.children.map(({ name, value }) => ({ category: name, value }));
}

export function buildStillTimeTree(participants = []) {
	return buildGrouping(participants, (participant) => participant?.stillTime);
}

export function buildStillTimeTotals(participants = []) {
	const tree = buildStillTimeTree(participants);
	return tree.children.map(({ name, value }) => ({ category: name, value }));
}

export function buildOptimismHistogram(participants = [], min = 0, max = 10) {
	const bins = Array.from({ length: max - min + 1 }, (_, index) => ({
		scale: min + index,
		count: 0
	}));

	for (const participant of participants) {
		const raw = participant?.optimismScore;
		const numeric = Number(raw);
		if (!Number.isFinite(numeric)) continue;
		if (numeric < min || numeric > max) continue;
		const bucket = bins[numeric - min];
		if (bucket) {
			bucket.count += 1;
		}
	}

	return bins;
}
