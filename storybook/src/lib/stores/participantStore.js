import { derived, get, writable } from 'svelte/store';

const participantsStore = writable([]);
const selectedParticipantIdStore = writable(null);
const selectedEmergencyStore = writable(null);
const selectedChallengeStore = writable(null);
const selectedStillTimeStore = writable(null);
const selectedOptimismStore = writable(null);
const activeGroupingStore = writable('participant');
const participantFocusLockStore = writable(null);

function normalizeValue(value) {
	if (value === undefined || value === null) return null;
	const trimmed = String(value).trim();
	return trimmed.length ? trimmed : null;
}

function normalizeNumericScore(value) {
	if (value === undefined || value === null || value === '') return null;
	const numeric = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(numeric) ? numeric : null;
}

function normalizeParticipants(list = []) {
	return list.map((participant, index) => {
		return {
			...participant,
			id: participant.id || `participant-${index}`,
			index,
			optimismScore: normalizeNumericScore(participant.optimismScore)
		};
	});
}

function filterByField(participants, value, fieldName) {
	const normalized = normalizeValue(value);
	if (!normalized) return participants;
	return participants.filter(
		(participant) => normalizeValue(participant?.[fieldName]) === normalized
	);
}

function resetGroupingState() {
	selectedEmergencyStore.set(null);
	selectedChallengeStore.set(null);
	selectedStillTimeStore.set(null);
	selectedOptimismStore.set(null);
	activeGroupingStore.set('participant');
	participantFocusLockStore.set(null);
}

function ensureConsistency(participants) {
	if (!participants.length) {
		selectedParticipantIdStore.set(null);
		selectedEmergencyStore.set(null);
		selectedChallengeStore.set(null);
		selectedStillTimeStore.set(null);
		selectedOptimismStore.set(null);
		activeGroupingStore.set('participant');
		participantFocusLockStore.set(null);
		return;
	}

	const currentId = get(selectedParticipantIdStore);
	const isCurrentValid =
		currentId && participants.some((participant) => participant.id === currentId);
	if (!isCurrentValid) {
		selectedParticipantIdStore.set(participants[0].id);
	}

	const currentEmergency = normalizeValue(get(selectedEmergencyStore));
	if (
		currentEmergency &&
		!participants.some(
			(participant) => normalizeValue(participant.emergencyFocus) === currentEmergency
		)
	) {
		selectedEmergencyStore.set(null);
	}

	const currentChallenge = normalizeValue(get(selectedChallengeStore));
	if (
		currentChallenge &&
		!participants.some(
			(participant) => normalizeValue(participant.challenge2050) === currentChallenge
		)
	) {
		selectedChallengeStore.set(null);
	}

	const currentStillTime = normalizeValue(get(selectedStillTimeStore));
	if (
		currentStillTime &&
		!participants.some((participant) => normalizeValue(participant.stillTime) === currentStillTime)
	) {
		selectedStillTimeStore.set(null);
	}

	const currentOptimism = get(selectedOptimismStore);
	if (
		Number.isFinite(currentOptimism) &&
		!participants.some(
			(participant) => normalizeNumericScore(participant?.optimismScore) === currentOptimism
		)
	) {
		selectedOptimismStore.set(null);
	}

	const currentGrouping = get(activeGroupingStore);
	if (
		![
			'participant',
			'participant-focus',
			'emergency',
			'challenge',
			'stillTime',
			'optimism'
		].includes(currentGrouping)
	) {
		activeGroupingStore.set('participant');
	}
}

export const participantsList = derived(participantsStore, ($participants) => $participants);

export const selectedParticipant = derived(
	[participantsStore, selectedParticipantIdStore],
	([$participants, $selectedId]) => {
		if (!$participants.length) return null;
		if ($selectedId) {
			const found = $participants.find((participant) => participant.id === $selectedId);
			if (found) return found;
		}
		return $participants[0];
	}
);

export const selectedEmergency = derived(selectedEmergencyStore, ($value) =>
	normalizeValue($value)
);
export const selectedChallenge = derived(selectedChallengeStore, ($value) =>
	normalizeValue($value)
);
export const selectedStillTime = derived(selectedStillTimeStore, ($value) =>
	normalizeValue($value)
);
export const selectedOptimismScore = derived(selectedOptimismStore, ($value) =>
	Number.isFinite($value) ? $value : null
);
export const activeGrouping = derived(activeGroupingStore, ($value) => $value ?? 'participant');

export const participantActions = {
	setParticipants(list = []) {
		const normalized = normalizeParticipants(list);
		participantsStore.set(normalized);
		ensureConsistency(normalized);
		const lockedId = get(participantFocusLockStore);
		if (lockedId) {
			const lockedParticipant = normalized.find((participant) => participant.id === lockedId);
			if (lockedParticipant) {
				selectedParticipantIdStore.set(lockedParticipant.id);
				selectedOptimismStore.set(normalizeNumericScore(lockedParticipant.optimismScore));
				activeGroupingStore.set('participant-focus');
				return;
			}
			participantFocusLockStore.set(null);
		}
		selectedOptimismStore.set(null);
		activeGroupingStore.set('participant');
	},
	selectById(id) {
		if (typeof id !== 'string' || !id) return;
		const participants = get(participantsStore);
		const participant = participants.find((item) => item.id === id);
		if (!participant) return;

		const currentId = get(selectedParticipantIdStore);
		const currentGrouping = get(activeGroupingStore);

		if (currentId === participant.id && currentGrouping === 'participant-focus') {
			participantFocusLockStore.set(null);
			resetGroupingState();
			return;
		}

		selectedParticipantIdStore.set(participant.id);
		selectedEmergencyStore.set(null);
		selectedChallengeStore.set(null);
		selectedStillTimeStore.set(null);
		selectedOptimismStore.set(normalizeNumericScore(participant.optimismScore));
		activeGroupingStore.set('participant-focus');
		participantFocusLockStore.set(participant.id);
	},
	selectEmergencyGroup(group) {
		const normalizedGroup = normalizeValue(group);
		if (!normalizedGroup) {
			selectedEmergencyStore.set(null);
			activeGroupingStore.set('participant');
			participantFocusLockStore.set(null);
			return;
		}

		const participants = get(participantsStore);
		const scoped = filterByField(participants, normalizedGroup, 'emergencyFocus');
		if (!scoped.length) {
			selectedEmergencyStore.set(null);
			activeGroupingStore.set('participant');
			participantFocusLockStore.set(null);
			return;
		}

		selectedEmergencyStore.set(normalizedGroup);

		const nextParticipant = scoped[0];

		if (nextParticipant) {
			selectedParticipantIdStore.set(nextParticipant.id);
			selectedChallengeStore.set(normalizeValue(nextParticipant?.challenge2050));
			selectedStillTimeStore.set(normalizeValue(nextParticipant?.stillTime));
			selectedOptimismStore.set(normalizeNumericScore(nextParticipant?.optimismScore));
		}
		participantFocusLockStore.set(null);
		activeGroupingStore.set('emergency');
	},
	selectChallengeGroup(group) {
		const normalizedGroup = normalizeValue(group);
		if (!normalizedGroup) {
			resetGroupingState();
			return;
		}

		const currentGrouping = get(activeGroupingStore);
		const currentSelected = normalizeValue(get(selectedChallengeStore));
		if (currentGrouping === 'challenge' && currentSelected && currentSelected === normalizedGroup) {
			resetGroupingState();
			return;
		}

		const participants = get(participantsStore);
		const scoped = filterByField(participants, normalizedGroup, 'challenge2050');
		if (!scoped.length) {
			resetGroupingState();
			return;
		}

		selectedChallengeStore.set(normalizedGroup);

		const nextParticipant = scoped[0];

		if (nextParticipant) {
			selectedParticipantIdStore.set(nextParticipant.id);
			selectedEmergencyStore.set(normalizeValue(nextParticipant?.emergencyFocus));
			selectedStillTimeStore.set(normalizeValue(nextParticipant?.stillTime));
			selectedOptimismStore.set(normalizeNumericScore(nextParticipant?.optimismScore));
		}
		participantFocusLockStore.set(null);
		activeGroupingStore.set('challenge');
	},
	selectStillTimeGroup(group) {
		const normalizedGroup = normalizeValue(group);
		if (!normalizedGroup) {
			selectedStillTimeStore.set(null);
			activeGroupingStore.set('participant');
			participantFocusLockStore.set(null);
			return;
		}

		const participants = get(participantsStore);
		const scoped = filterByField(participants, normalizedGroup, 'stillTime');
		if (!scoped.length) {
			selectedStillTimeStore.set(null);
			activeGroupingStore.set('participant');
			participantFocusLockStore.set(null);
			return;
		}

		const nextParticipant = scoped[0];

		if (nextParticipant) {
			selectedParticipantIdStore.set(nextParticipant.id);
			selectedEmergencyStore.set(normalizeValue(nextParticipant?.emergencyFocus));
			selectedChallengeStore.set(normalizeValue(nextParticipant?.challenge2050));
			selectedStillTimeStore.set(normalizeValue(nextParticipant?.stillTime));
			selectedOptimismStore.set(normalizeNumericScore(nextParticipant?.optimismScore));
		}
		participantFocusLockStore.set(null);
		activeGroupingStore.set('stillTime');
	},
	selectOptimismScore(score) {
		const numericScore = normalizeNumericScore(score);
		if (numericScore === null) {
			selectedOptimismStore.set(null);
			activeGroupingStore.set('participant');
			participantFocusLockStore.set(null);
			return;
		}

		const currentSelected = get(selectedOptimismStore);
		if (Number.isFinite(currentSelected) && currentSelected === numericScore) {
			selectedOptimismStore.set(null);
			activeGroupingStore.set('participant');
			participantFocusLockStore.set(null);
			return;
		}

		const participants = get(participantsStore);
		const scoped = participants.filter(
			(participant) => normalizeNumericScore(participant?.optimismScore) === numericScore
		);

		if (!scoped.length) {
			selectedOptimismStore.set(null);
			activeGroupingStore.set('participant');
			participantFocusLockStore.set(null);
			return;
		}

		selectedOptimismStore.set(numericScore);

		const nextParticipant = scoped[0];

		if (nextParticipant) {
			selectedParticipantIdStore.set(nextParticipant.id);
			selectedEmergencyStore.set(normalizeValue(nextParticipant?.emergencyFocus));
			selectedChallengeStore.set(normalizeValue(nextParticipant?.challenge2050));
			selectedStillTimeStore.set(normalizeValue(nextParticipant?.stillTime));
		}
		participantFocusLockStore.set(null);
		activeGroupingStore.set('optimism');
	},
	selectNext() {
		const participants = get(participantsStore);
		if (!participants.length) return;

		const grouping = get(activeGroupingStore);
		const emergency = normalizeValue(get(selectedEmergencyStore));
		const challenge = normalizeValue(get(selectedChallengeStore));
		const stillTime = normalizeValue(get(selectedStillTimeStore));
		const optimism = get(selectedOptimismStore);

		let scoped;
		switch (grouping) {
			case 'stillTime':
				scoped = stillTime ? filterByField(participants, stillTime, 'stillTime') : null;
				break;
			case 'challenge':
				scoped = challenge ? filterByField(participants, challenge, 'challenge2050') : null;
				break;
			case 'optimism':
				scoped = Number.isFinite(optimism)
					? participants.filter(
							(participant) => normalizeNumericScore(participant?.optimismScore) === optimism
						)
					: null;
				break;
			case 'emergency':
			default:
				scoped = emergency ? filterByField(participants, emergency, 'emergencyFocus') : null;
				break;
		}

		if (!scoped || !scoped.length) {
			if (emergency) {
				scoped = filterByField(participants, emergency, 'emergencyFocus');
			} else if (stillTime) {
				scoped = filterByField(participants, stillTime, 'stillTime');
			} else if (challenge) {
				scoped = filterByField(participants, challenge, 'challenge2050');
			} else if (Number.isFinite(optimism)) {
				scoped = participants.filter(
					(participant) => normalizeNumericScore(participant?.optimismScore) === optimism
				);
			} else {
				scoped = participants;
			}
		}

		if (!scoped.length) return;

		const currentId = get(selectedParticipantIdStore);
		const currentIndex = scoped.findIndex((participant) => participant.id === currentId);
		const baseIndex = currentIndex < 0 ? 0 : currentIndex;
		const next = scoped[(baseIndex + 1) % scoped.length];

		selectedParticipantIdStore.set(next.id);
		selectedEmergencyStore.set(normalizeValue(next.emergencyFocus));
		selectedChallengeStore.set(normalizeValue(next.challenge2050));
		selectedStillTimeStore.set(normalizeValue(next.stillTime));
		selectedOptimismStore.set(normalizeNumericScore(next.optimismScore));
		if (get(activeGroupingStore) === 'participant-focus') {
			participantFocusLockStore.set(next.id);
		}
	},
	selectPrevious() {
		const participants = get(participantsStore);
		if (!participants.length) return;

		const grouping = get(activeGroupingStore);
		const emergency = normalizeValue(get(selectedEmergencyStore));
		const challenge = normalizeValue(get(selectedChallengeStore));
		const stillTime = normalizeValue(get(selectedStillTimeStore));
		const optimism = get(selectedOptimismStore);

		let scoped;
		switch (grouping) {
			case 'stillTime':
				scoped = stillTime ? filterByField(participants, stillTime, 'stillTime') : null;
				break;
			case 'challenge':
				scoped = challenge ? filterByField(participants, challenge, 'challenge2050') : null;
				break;
			case 'optimism':
				scoped = Number.isFinite(optimism)
					? participants.filter(
							(participant) => normalizeNumericScore(participant?.optimismScore) === optimism
						)
					: null;
				break;
			case 'emergency':
			default:
				scoped = emergency ? filterByField(participants, emergency, 'emergencyFocus') : null;
				break;
		}

		if (!scoped || !scoped.length) {
			if (emergency) {
				scoped = filterByField(participants, emergency, 'emergencyFocus');
			} else if (stillTime) {
				scoped = filterByField(participants, stillTime, 'stillTime');
			} else if (challenge) {
				scoped = filterByField(participants, challenge, 'challenge2050');
			} else if (Number.isFinite(optimism)) {
				scoped = participants.filter(
					(participant) => normalizeNumericScore(participant?.optimismScore) === optimism
				);
			} else {
				scoped = participants;
			}
		}

		if (!scoped.length) return;

		const currentId = get(selectedParticipantIdStore);
		const currentIndex = scoped.findIndex((participant) => participant.id === currentId);
		const baseIndex = currentIndex < 0 ? 0 : currentIndex;
		const previous = scoped[(baseIndex - 1 + scoped.length) % scoped.length];

		selectedParticipantIdStore.set(previous.id);
		selectedEmergencyStore.set(normalizeValue(previous.emergencyFocus));
		selectedChallengeStore.set(normalizeValue(previous.challenge2050));
		selectedStillTimeStore.set(normalizeValue(previous.stillTime));
		selectedOptimismStore.set(normalizeNumericScore(previous.optimismScore));
		if (get(activeGroupingStore) === 'participant-focus') {
			participantFocusLockStore.set(previous.id);
		}
	},
	reset() {
		participantsStore.set([]);
		selectedParticipantIdStore.set(null);
		selectedEmergencyStore.set(null);
		selectedChallengeStore.set(null);
		selectedStillTimeStore.set(null);
		selectedOptimismStore.set(null);
		activeGroupingStore.set('participant');
		participantFocusLockStore.set(null);
	}
};
